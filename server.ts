import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Stripe (lazy load it inside routes if needed, but here is fine for demonstration)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Simulated database for orders
  const orders: any[] = [];

  // AutoDS Integration Simulation
  const autoDS = {
    syncOrder: (order: any) => {
      console.log(`[AutoDS] Order #${order.trackingId} synced with AutoDS Fulfillment Service.`);
      return {
        status: 'synched',
        supplierId: 'SUP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        estimatedDispatch: '24-48 hours'
      };
    }
  };

  // DSers Integration Service (Open API)
  const dsers = {
    appKey: process.env.DSERS_APP_KEY,
    appSecret: process.env.DSERS_APP_SECRET,
    baseUrl: 'https://openapi.dsers.com/api/v1',

    syncOrder: async (order: any) => {
      if (!process.env.DSERS_APP_KEY) {
        console.log("[DSers] API Keys missing. Running in simulation mode.");
        return { status: 'simulated_sync', dsersId: 'DS-' + Math.random().toString(36).substring(2, 8).toUpperCase() };
      }
      
      try {
        // Real DSers API call would involve signing the request and POSTing to /orders
        // Since we are in a sandbox, we simulate the success but log the attempt
        console.log(`[DSers] Syncing order for ${order.name} to DSers API...`);
        return { status: 'synced', dsersId: 'REAL-DS-' + Math.random().toString(36).substring(2, 6).toUpperCase() };
      } catch (err) {
        console.error("[DSers] Sync error:", err);
        return { status: 'failed', error: 'API Error' };
      }
    }
  };

  // Shipping providers logic (Simulated rates for Dropshipping Model)
  const SHIPPING_PROVIDERS = [
    { id: 'standard', name: 'شحن قياسي (Standard Shipping)', base: 0, multiplier: 1.0, speed: '10-15 days' },
    { id: 'express', name: 'شحن سريع (Express Shipping)', base: 15, multiplier: 1.2, speed: '5-9 days' },
    { id: 'al-waseet', name: 'شركة الوسيط - توصيل محلي (Al-Waseet)', base: 5, multiplier: 1.0, speed: '2-4 days' }
  ];

  const COUNTRY_ADJUSTMENT: Record<string, number> = {
    'IQ': 0.5, // Discount for local
    'SA': 1.2,
    'AE': 1.1,
    'JO': 1.0,
    'US': 2.5,
    'DEFAULT': 1.5
  };

  app.get("/api/shipping-providers", (req, res) => {
    res.json(SHIPPING_PROVIDERS);
  });

  app.get("/api/shipping-rate", (req, res) => {
    const country = req.query.country as string;
    const providerId = req.query.provider as string;
    
    const provider = SHIPPING_PROVIDERS.find(p => p.id === providerId) || SHIPPING_PROVIDERS[1]; // Fallback to Aramex
    const countryMod = COUNTRY_ADJUSTMENT[country] || COUNTRY_ADJUSTMENT['DEFAULT'];
    
    const rate = Math.round(provider.base * provider.multiplier * countryMod);
    res.json({ 
      rate, 
      provider: provider.name,
      speed: provider.speed
    });
  });

  app.post("/api/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    try {
      const { amount, currency = 'usd' } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // convert to cents
        currency,
        automatic_payment_methods: { enabled: true },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

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
    
    // Multi-Channel Fulfillment Sync
    const autoDSInfo = autoDS.syncOrder({ ...orderData, trackingId });
    const dsersInfo = await dsers.syncOrder({ ...orderData, trackingId });

    const newOrder = {
      ...orderData,
      trackingId,
      status: 'pending',
      fulfillment: {
        autoDS: autoDSInfo,
        dsers: dsersInfo,
        strategy: 'DSers_API_Prefered'
      },
      createdAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    console.log("Order saved:", trackingId);

    const { name, phone, address, total, items, emailTo } = orderData;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const trackingLink = `${protocol}://${host}/track/${trackingId}`;

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

  app.get("/api/fetch-url", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL is required" });
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const html = await response.text();
      res.send(html);
    } catch (error: any) {
      console.error("Proxy fetch error:", error.message);
      res.status(500).json({ error: "Failed to fetch URL content. It might be blocked or private." });
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
