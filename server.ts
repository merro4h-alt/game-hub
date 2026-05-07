import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Simulated database for orders
  const orders: any[] = [];

  app.get("/api/track/:id", (req, res) => {
    const order = orders.find(o => o.trackingId === req.params.id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  app.post("/api/confirm-order", async (req, res) => {
    const orderData = req.body;
    
    // Generate tracking ID
    const trackingId = "AH-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const newOrder = {
      ...orderData,
      trackingId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    console.log("Order saved:", trackingId);

    const { name, phone, address, total, items, emailTo } = orderData;
    const trackingLink = `https://ais-dev-6ft3dpnmbas5ey35iluk4k-816940702897.europe-west2.run.app/track/${trackingId}`;

    try {
      // Lazy import nodemailer and twilio
      const nodemailer = await import("nodemailer");
      const twilio = (await import("twilio")).default;
      
      // Email transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });

      const itemsList = items.map((item: any) => `${item.name} (${item.quantity}x) - $${(item.price * item.quantity).toFixed(2)}`).join("\n");
      const orderSummary = `
New Order from ${name}
Tracking ID: ${trackingId}
Tracking Link: ${trackingLink}
Phone: ${phone}
Address: ${address}
Items:
${itemsList}
Total: $${total.toFixed(2)}
      `;

      // 1. Try sending Email
      let emailSent = false;
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const mailOptions = {
          from: `"AH Store" <${process.env.EMAIL_USER || 'noreply@ahstore.shop'}>`,
          to: emailTo || 'merro4h@gmail.com',
          subject: `New Order #${trackingId} from ${name} - AH Store`,
          text: orderSummary,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
              <h1 style="color: #c5a059;">Order Confirmed!</h1>
              <p>You have a new "Cash on Delivery" order.</p>
              <div style="background: #c5a059; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h2 style="margin: 0; font-size: 14px; text-transform: uppercase;">Tracking Number</h2>
                <div style="font-size: 32px; font-weight: bold; border: 2px dashed rgba(255,255,255,0.3); margin-top: 10px; padding: 10px;">${trackingId}</div>
                <a href="${trackingLink}" style="display: inline-block; margin-top: 15px; background: white; color: #c5a059; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">Track Your Order</a>
              </div>
              
              <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Customer Details</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Address:</strong> ${address}</p>
              </div>

              <div style="margin: 20px 0;">
                <h2>Order Summary</h2>
                <ul>
                  ${items.map((item: any) => `<li><strong>${item.name}</strong> - ${item.quantity} x $${item.price.toFixed(2)}</li>`).join("")}
                </ul>
                <h3 style="border-top: 1px solid #eee; padding-top: 10px;">Total: $${total.toFixed(2)}</h3>
              </div>
            </div>
          `
        };
        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log("Order confirmation email sent.");
      }

      // 2. Try sending WhatsApp via Twilio
      let whatsappSent = false;
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM;
      const toWhatsApp = process.env.TWILIO_WHATSAPP_TO || 'whatsapp:+9647837814009';

      if (accountSid && authToken && fromWhatsApp) {
        const client = twilio(accountSid, authToken);
        await client.messages.create({
          body: `*AH Store - New Order #${trackingId}*\n\nTrack here: ${trackingLink}\n\n${orderSummary}`,
          from: fromWhatsApp,
          to: toWhatsApp
        });
        whatsappSent = true;
        console.log("WhatsApp notification sent to:", toWhatsApp);
      }

      res.json({ 
        success: true, 
        message: "Order processed.",
        trackingId,
        trackingLink,
        emailSent,
        whatsappSent
      });

    } catch (error) {
      console.error("Error processing order notifications:", error);
      res.status(500).json({ success: false, error: "Failed to send notifications." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
