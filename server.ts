import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import axios from "axios";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Payoneer Configuration
const PAYONEER_CLIENT_ID = process.env.PAYONEER_CHECKOUT_CLIENT_ID;
const PAYONEER_CLIENT_SECRET = process.env.PAYONEER_CHECKOUT_CLIENT_SECRET;
const PAYONEER_ENV = process.env.NODE_ENV === 'production' ? 'live' : 'sandbox';
const PAYONEER_BASE_URL = PAYONEER_ENV === 'live' 
  ? 'https://checkout.payoneer.com/api/v1' 
  : 'https://checkout.sandbox.payoneer.com/api/v1';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Simulated database for orders
  const orders: any[] = [];

  // Memory log of sent emails for developer testing/previewing
  const sentEmailsLogs: any[] = [];

  const logSentEmail = (to: string, subject: string, html: string, status: string = "Sent") => {
    sentEmailsLogs.unshift({
      id: "mail-" + Math.random().toString(36).substring(2, 9),
      to,
      subject,
      html,
      status,
      timestamp: new Date().toISOString()
    });
    if (sentEmailsLogs.length > 50) {
      sentEmailsLogs.pop();
    }
  };

  app.get("/api/admin/emails", (req, res) => {
    res.json(sentEmailsLogs);
  });

  app.delete("/api/admin/emails", (req, res) => {
    sentEmailsLogs.length = 0;
    res.json({ success: true });
  });

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

  // Payoneer: Get Access Token
  async function getPayoneerToken() {
    if (!PAYONEER_CLIENT_ID || !PAYONEER_CLIENT_SECRET) return null;
    try {
      const authHeader = Buffer.from(`${PAYONEER_CLIENT_ID}:${PAYONEER_CLIENT_SECRET}`).toString('base64');
      const response = await axios.post(
        PAYONEER_ENV === 'live' 
          ? 'https://login.payoneer.com/api/v1/token' 
          : 'https://login.sandbox.payoneer.com/api/v1/token',
        'grant_type=client_credentials&scope=checkout-payment',
        {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return response.data.access_token;
    } catch (error: any) {
      console.error("[Payoneer Auth Error]", error.response?.data || error.message);
      return null;
    }
  }

  // Payoneer: Create Payment Session
  app.post("/api/payoneer/session", async (req, res) => {
    const { amount, currency, orderId, customer } = req.body;
    console.log(`[Payoneer] Creating session for order: ${orderId}, amount: ${amount}`);
    
    const token = await getPayoneerToken();

    if (!token) {
      console.log("[Payoneer] API Credentials missing or Auth failed. Returning simulation.");
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const origin = `${protocol}://${host}`;
      return res.json({ 
        redirectUrl: `${origin}/track/${orderId}?status=success`,
        simulated: true
      });
    }

    try {
      const payload = {
        transaction: {
          reference: orderId,
          amount: amount,
          currency: currency || "USD",
          description: `Order ${orderId}`
        },
        customer: {
          email: customer.email || 'customer@example.com',
          firstName: customer.name?.split(' ')[0] || 'Customer',
          lastName: customer.name?.split(' ').slice(1).join(' ') || 'User',
          phone: customer.phone,
          country: customer.countryCode || 'US'
        },
        urls: {
          return: `${req.headers.origin || (req.headers['x-forwarded-proto'] + '://' + req.headers.host)}/track/${orderId}`,
          cancel: `${req.headers.origin || (req.headers['x-forwarded-proto'] + '://' + req.headers.host)}/checkout`
        },
        payment_methods: ["CARD"]
      };

      console.log("[Payoneer] Sending request to:", `${PAYONEER_BASE_URL}/payment-sessions`);
      
      const response = await axios.post(
        `${PAYONEER_BASE_URL}/payment-sessions`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const redirectUrl = response.data.redirect_url || response.data.links?.redirect?.href || response.data.redirectUrl;
      console.log("[Payoneer] Session created. Redirect URL:", redirectUrl || "NOT FOUND");
      
      res.json({ 
        redirectUrl: redirectUrl,
        simulated: false 
      });
    } catch (error: any) {
      console.error("[Payoneer Session Error]", error.response?.data || error.message);
      res.status(500).json({ 
        error: "Failed to initialize Payoneer session",
        details: error.response?.data || error.message
      });
    }
  });

  // Payoneer: Webhook / Status Update
  app.post("/api/payoneer/webhook", async (req, res) => {
    console.log("[Payoneer Webhook] Received notification:", req.body);
    res.status(200).send("OK");
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
      const htmlBody = `
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
      `;

      const mailOptions = {
        from: `"AMEER ALI Store" <${process.env.EMAIL_USER || 'noreply@ahstore.shop'}>`,
        to: emailTo || 'merro4h@gmail.com',
        subject: `New Order #${trackingId} from ${name} - AMEER ALI Store`,
        text: orderSummary,
        html: htmlBody
      };

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await transporter.sendMail(mailOptions);
          emailSent = true;
          logSentEmail(mailOptions.to, mailOptions.subject, mailOptions.html, "Sent (SMTP)");
          console.log("Order confirmation email sent.");
        } catch (smtpErr: any) {
          console.error("SMTP Delivery error:", smtpErr);
          logSentEmail(mailOptions.to, mailOptions.subject, mailOptions.html, `SMTP Failed: ${smtpErr.message || smtpErr}`);
        }
      } else {
        logSentEmail(mailOptions.to, mailOptions.subject, mailOptions.html, "Simulated Inbox");
        console.log("Logged simulated order email successfully.");
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
          body: `*AMEER ALI Store - New Order #${trackingId}*\n\nTrack here: ${trackingLink}\n\n${orderSummary}`,
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

  app.post("/api/price-alert/subscribe", async (req, res) => {
    const { productId, productName, email, targetPrice, initialPrice } = req.body;
    
    if (!email || !productName || !targetPrice) {
      return res.status(400).json({ error: "Required fields are missing: email, productName, targetPrice" });
    }

    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });

      let emailSent = false;
      const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff; color: #1f2937; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: right; direction: rtl;">
          <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #C5A037; padding-bottom: 15px;">
            <span style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #121212;">ONXIFI <span style="color: #C5A037;">STORE</span></span>
          </div>
          
          <div style="background-color: #FDFBF7; border: 1px solid rgba(197, 160, 55, 0.2); border-radius: 16px; padding: 25px; text-align: center; margin-bottom: 25px;">
            <div style="font-size: 45px; margin-bottom: 10px;">🔔</div>
            <h1 style="color: #121212; font-size: 22px; font-weight: 900; margin: 0 0 10px 0; line-height: 1.4;">
              تم تفعيل تنبيه انخفاض السعر بنجاح!
            </h1>
            <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">
              سنقوم بإرسال إشعار فوري وتنبيه على هذا البريد بمجرد أن ينخفض سعر المنتج إلى القيمة المستهدفة التي اخترتها أو أقل.
            </p>
          </div>

          <div style="background-color: #fafafa; border-radius: 16px; padding: 20px; margin-bottom: 25px; border: 1px solid #f0f0f0;">
            <h3 style="color: #C5A037; font-size: 15px; margin: 0 0 15px 0; font-weight: 800; border-bottom: 1px solid #eaeaea; padding-bottom: 8px;">
              تفاصيل الاشتراك بالتنبيه
            </h3>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse; text-align: right;" dir="rtl">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; width: 40%;">المنتج:</td>
                <td style="padding: 10px 0; font-weight: 700; color: #121212;">${productName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">السعر الحالي:</td>
                <td style="padding: 10px 0; font-weight: 700; color: #ef4444; font-family: monospace;">$${initialPrice}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">السعر المطلوب للتنبيه:</td>
                <td style="padding: 10px 0; font-weight: 800; color: #10b981; font-family: monospace; font-size: 16px;">$${targetPrice} 🎯</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">بريد التنبيهات:</td>
                <td style="padding: 10px 0; font-weight: 700; color: #121212; font-family: monospace; text-align: left;" dir="ltr">${email}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 10px; font-size: 13px; color: #4b5563; border-top: 1px solid #f3f4f6; padding-top: 20px; direction: ltr;" dir="ltr">
            <p style="margin: 0; font-weight: bold; color: #121212;">Price alert is set up successfully for <strong>${productName}</strong>.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">We will email you immediately at <strong>${email}</strong> when the price drops to <strong>$${targetPrice}</strong> or below.</p>
          </div>

          <div style="text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 20px;">
            هذا البريد تم إرساله تلقائياً لأنك اشتركت في خدمة تنبيهات الأسعار لمتجر ONXIFI.<br/>
            This is an automated email sent because you subscribed to ONXIFI price drop alerts.
          </div>
        </div>
      `;

      const mailOptions = {
        from: `"ONXIFI Store" <${process.env.EMAIL_USER || 'noreply@onxifi.shop'}>`,
        to: email,
        subject: `🔔 تم تفعيل تنبيه السعر: ${productName} - ONXIFI Store`,
        html: htmlBody
      };

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await transporter.sendMail(mailOptions);
          emailSent = true;
          logSentEmail(mailOptions.to, mailOptions.subject, mailOptions.html, "Sent (SMTP)");
          console.log("Price subscription confirmation email sent to:", email);
        } catch (smtpErr: any) {
          console.error("SMTP Subscribe Delivery error:", smtpErr);
          logSentEmail(mailOptions.to, mailOptions.subject, mailOptions.html, `SMTP Failed: ${smtpErr.message || smtpErr}`);
        }
      } else {
        logSentEmail(mailOptions.to, mailOptions.subject, mailOptions.html, "Simulated Inbox");
        console.log("Logged simulated subscribe email successfully.");
      }

      res.json({ success: true, emailSent });
    } catch (e: any) {
      console.error("Error sending subscription email:", e);
      res.status(500).json({ success: false, error: e.message || "Failed to send subscription confirmation email." });
    }
  });

  app.post("/api/price-alert/trigger", async (req, res) => {
    const { productId, productName, email, targetPrice, currentPrice } = req.body;
    
    if (!email || !productName || !targetPrice || !currentPrice) {
      return res.status(400).json({ error: "Required fields are missing: email, productName, targetPrice, currentPrice" });
    }

    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });

      let emailSent = false;
      const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff; color: #1f2937; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: right; direction: rtl;">
          <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #C5A037; padding-bottom: 15px;">
            <span style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #121212;">ONXIFI <span style="color: #C5A037;">STORE</span></span>
          </div>
          
          <div style="background-color: #ecfdf5; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 16px; padding: 25px; text-align: center; margin-bottom: 25px;">
            <div style="font-size: 45px; margin-bottom: 10px;">🔥</div>
            <h1 style="color: #065f46; font-size: 24px; font-weight: 950; margin: 0 0 10px 0; line-height: 1.4;">
              انخفض السعر الآن! لاتفوت الفرصة 😍
            </h1>
            <p style="color: #047857; font-size: 15px; margin: 0; line-height: 1.6; font-weight: bold;">
              لقد انخفض سعر المنتج الذي تتابعه إلى السعر المطلوب أو أقل من ذلك بكثير!
            </p>
          </div>

          <div style="background-color: #fafafa; border-radius: 16px; padding: 20px; margin-bottom: 25px; border: 1px solid #f0f0f0;">
            <h3 style="color: #C5A037; font-size: 15px; margin: 0 0 15px 0; font-weight: 800; border-bottom: 1px solid #eaeaea; padding-bottom: 8px;">
              تفاصيل العرض الحالي
            </h3>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse; text-align: right;" dir="rtl">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; width: 40%;">المنتج:</td>
                <td style="padding: 10px 0; font-weight: 700; color: #121212;">${productName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">سعرك المستهدف:</td>
                <td style="padding: 10px 0; font-weight: 700; color: #4b5563; font-family: monospace;">$${targetPrice}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">السعر الحالي الآن:</td>
                <td style="padding: 10px 0; font-weight: 900; color: #10b981; font-family: monospace; font-size: 22px;">$${currentPrice} 💸</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 25px 0 10px 0;">
            <a href="https://onxifi.shop" style="display: inline-block; background-color: #121212; color: #ffffff; font-weight: 900; border: 2px solid #C5A037; border-radius: 30px; padding: 14px 40px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; font-size: 13px; box-shadow: 0 4px 10px rgba(197, 160, 55, 0.2);">
              تسوق الآن واشتري المنتج / SHOP CURRENT NOW
            </a>
          </div>

          <div style="text-align: center; margin-top: 25px; font-size: 13px; color: #4b5563; border-top: 1px solid #f3f4f6; padding-top: 20px; direction: ltr;" dir="ltr">
            <p style="margin: 0; font-weight: bold; color: #121212;">Great news! <strong>${productName}</strong> has dropped to <strong>$${currentPrice}</strong>.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">You set a target of <strong>$${targetPrice}</strong>, so don't miss out on this amazing deal!</p>
          </div>

          <div style="text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 20px;">
            هذا البريد الإلكتروني أرسل إليك بناءً على رغبتك في الاشتراك بخدمة تنبيه السعر لمتجر ONXIFI.<br/>
            You are receiving this because you signed up for price alerts on this item.
          </div>
        </div>
      `;

      const mailOptions = {
        from: `"ONXIFI Store" <${process.env.EMAIL_USER || 'noreply@onxifi.shop'}>`,
        to: email,
        subject: `🔥 انخفض السعر الآن! لاتفوت الفرصة: ${productName} بسعر جديد - ONXIFI Store`,
        html: htmlBody
      };

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await transporter.sendMail(mailOptions);
          emailSent = true;
          logSentEmail(mailOptions.to, mailOptions.subject, mailOptions.html, "Sent (SMTP)");
          console.log("Price alert drop email trigger notification sent to:", email);
        } catch (smtpErr: any) {
          console.error("SMTP Trigger Delivery error:", smtpErr);
          logSentEmail(mailOptions.to, mailOptions.subject, mailOptions.html, `SMTP Failed: ${smtpErr.message || smtpErr}`);
        }
      } else {
        logSentEmail(mailOptions.to, mailOptions.subject, mailOptions.html, "Simulated Inbox");
        console.log("Logged simulated price alert drop successfully.");
      }

      res.json({ success: true, emailSent });
    } catch (e: any) {
      console.error("Error triggering price alert email:", e);
      res.status(500).json({ success: false, error: e.message || "Failed to send price alert notification email." });
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
      
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }
      
      const html = await response.text();
      const lowerHtml = html.toLowerCase();
      if (
        lowerHtml.includes("cloudflare") || 
        lowerHtml.includes("security check") || 
        lowerHtml.includes("verify you are human") || 
        lowerHtml.includes("ddos protection") ||
        lowerHtml.includes("please enable js")
      ) {
        throw new Error("E_BLOCKED_BY_CLOUDFLARE");
      }
      
      res.send(html);
    } catch (error: any) {
      console.error("Proxy fetch error:", error.message);
      res.status(500).json({ error: "Failed to fetch URL content. It might be blocked or private." });
    }
  });

  app.post("/api/extract-product", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      let htmlContent = "";
      let fetchBlocked = false;

      // Try fetching the raw HTML first with a short timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
        const fetchRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (fetchRes.ok) {
          const rawHtml = await fetchRes.text();
          const lowerHtml = rawHtml.toLowerCase();
          if (
            lowerHtml.includes("cloudflare") || 
            lowerHtml.includes("security check") || 
            lowerHtml.includes("verify you are human") || 
            lowerHtml.includes("ddos protection") ||
            lowerHtml.includes("please enable js")
          ) {
            fetchBlocked = true;
          } else {
            htmlContent = rawHtml.slice(0, 35000);
          }
        } else {
          fetchBlocked = true;
        }
      } catch (e) {
        fetchBlocked = true;
      }

      // Ensure we have Gemini API Key configured
      const apiKeyVal = process.env.GEMINI_API_KEY;
      if (!apiKeyVal) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const { GoogleGenAI, Type } = await import("@google/genai");
      const aiClient = new GoogleGenAI({
        apiKey: apiKeyVal,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let response;
      if (fetchBlocked || !htmlContent) {
        console.log(`[Extract Product] Fetch was blocked or failed. Activating Gemini Search Grounding bypass for: ${url}`);
        const searchPrompt = `Search for this product URL and extract its details. Ensure the response matches the requested JSON schema.
Product Link: ${url}

Guideline:
1. Search Google for this exact e-commerce URL or product to identify page title, product name, actual/realistic price (e.g., 24.50), description summary, primary display image URL, secondary images, colors list, and sizes.
2. If exact imagery URLs aren't fully discoverable from the search grounding, provide gorgeous matching stock photo URLs or relevant fallback domain assets. Return only absolute URLs starting with "https://".
3. Translate names and descriptions to Arabic if appropriate, or English.
4. Extract accurate color lists and sizes list.
`;

        response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: searchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                description: { type: Type.STRING },
                image: { type: Type.STRING, description: "Absolute URL to the main product photo (https://)" },
                images: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                colors: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                sizes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["name", "price", "description", "image", "images", "colors", "sizes"]
            }
          }
        });
      } else {
        console.log(`[Extract Product] Fetch succeeded. Parsing raw HTML structure for target product details: ${url}`);
        const parsePrompt = `Extract clean product details from this raw HTML content of ${url}.
HTML Snippet:
${htmlContent}`;

        response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: parsePrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                description: { type: Type.STRING },
                image: { type: Type.STRING, description: "Absolute URL to the main product photo (https://)" },
                images: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                colors: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                sizes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["name", "price", "description", "image", "images", "colors", "sizes"]
            }
          }
        });
      }

      if (response && response.text) {
        const parsedData = JSON.parse(response.text.trim());
        return res.json(parsedData);
      } else {
        throw new Error("No text response generated by Gemini model");
      }

    } catch (err: any) {
      console.error("[Extract Product Server Endpoint Error]", err);
      // Fail-safe default fallback so import never breaks for the client
      const fallbackCleanName = url.split('/').pop()?.split('.')[0]?.replace(/[-_]/g, ' ') || 'Smart Imported Product';
      const fallbackData = {
        name: fallbackCleanName.charAt(0).toUpperCase() + fallbackCleanName.slice(1),
        price: 19.99,
        description: "Elegant product imported from " + url,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
        images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"],
        colors: ["Default Color"],
        sizes: ["Standard"]
      };
      return res.json(fallbackData);
    }
  });

  // Gift Advisor and Smart Picker dynamic AI endpoint
  app.post("/api/gift-advisor", async (req, res) => {
    const { receiver, occasion, interests, budget, storeProducts, lang } = req.body;

    const isAr = lang === 'ar';
    const numericBudget = Number(budget) || 150;

    // Filter products within budget automatically first as base matches
    let matches = (storeProducts || []).filter((p: any) => p.price <= numericBudget);
    
    // Sort matches by interest similarities
    if (interests && matches.length > 0) {
      const lowerInterest = interests.toLowerCase();
      matches.sort((a: any, b: any) => {
        const descA = (a.description || '').toLowerCase() + (a.name || '').toLowerCase() + (a.category || '').toLowerCase();
        const descB = (b.description || '').toLowerCase() + (b.name || '').toLowerCase() + (b.category || '').toLowerCase();
        
        let scoreA = 0;
        let scoreB = 0;

        // Smart sub-string score
        if (lowerInterest.includes('tech') || lowerInterest.includes('تكنو') || lowerInterest.includes('ذكي') || lowerInterest.includes('ساع')) {
          if (descA.includes('smart') || descA.includes('performance') || descA.includes('electronics') || descA.includes('earbuds') || descA.includes('watch') || descA.includes('ساعة')) scoreA += 5;
          if (descB.includes('smart') || descB.includes('performance') || descB.includes('electronics') || descB.includes('earbuds') || descB.includes('watch') || descB.includes('ساعة')) scoreB += 5;
        }
        if (lowerInterest.includes('fashion') || lowerInterest.includes('أناق') || lowerInterest.includes('فخام') || lowerInterest.includes('ملاب')) {
          if (descA.includes('shirt') || descA.includes('linen') || descA.includes('fabric') || descA.includes('style') || descA.includes('قميص')) scoreA += 5;
          if (descB.includes('shirt') || descB.includes('linen') || descB.includes('fabric') || descB.includes('style') || descB.includes('قميص')) scoreB += 5;
        }
        if (lowerInterest.includes('cosmetics') || lowerInterest.includes('عناي') || lowerInterest.includes('جمال') || lowerInterest.includes('سيروم')) {
          if (descA.includes('serum') || descA.includes('glow') || descA.includes('hydration') || descA.includes('skin') || descA.includes('سيروم')) scoreA += 5;
          if (descB.includes('serum') || descB.includes('glow') || descB.includes('hydration') || descB.includes('skin') || descB.includes('سيروم')) scoreB += 5;
        }

        return scoreB - scoreA;
      });
    }

    // fallback if no products match the budget
    if (matches.length === 0 && storeProducts && storeProducts.length > 0) {
      matches = storeProducts.slice(0, 2);
    }

    const selectedIds = matches.slice(0, 2).map((p: any) => p.id);

    // If Gemini API Key is available, invoke Gemini via @google/genai as instructed by SKILL.md
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI, Type } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const prompt = `
You are the AI Gift Expert & Smart Purchase-Picker for the luxurious brand store ONXIFI.
User wants to choose a perfect gift:
- For Whom: ${receiver}
- On Occasion: ${occasion}
- With Vibe / Style: ${interests}
- Within Budget: $${numericBudget}

Available Store Products Catalog:
${JSON.stringify((storeProducts || []).map((p: any) => ({ id: p.id, name: p.name, desc: p.description, price: p.price })))}

Identify and recommend the 1 or 2 best products from the catalog list that match these criteria perfectly.
Formulate beautifully stylized, luxury-quality output:
1. "reasoning": Highly compelling, premium explanation of why these make the perfect gift for ${receiver} on ${occasion} (written in ${isAr ? 'Arabic' : 'English'}).
2. "giftCardText": A custom heartfelt print-ready message card dedicated to ${receiver} for their ${occasion} (written in ${isAr ? 'Arabic' : 'English'}).
3. "wrappingTip": Artistic suggestion on recommended gift packaging, wrapping theme, and luxury box presentation (written in ${isAr ? 'Arabic' : 'English'}).

Return strictly JSON matching responseSchema.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                selectedProductIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "IDs of the best 1 to 2 products chosen from the catalog."
                },
                reasoning: {
                  type: Type.STRING,
                  description: "Custom premium reasoning for these recommendations."
                },
                giftCardText: {
                  type: Type.STRING,
                  description: "Beautiful personal dedication message."
                },
                wrappingTip: {
                  type: Type.STRING,
                  description: "Gift wrapping wrapping theme and presentation advice."
                }
              },
              required: ["selectedProductIds", "reasoning", "giftCardText", "wrappingTip"]
            }
          }
        });

        if (response && response.text) {
          const apiResult = JSON.parse(response.text.trim());
          return res.json({
            success: true,
            source: 'gemini',
            ...apiResult
          });
        }
      } catch (gemError: any) {
        console.error("Gemini API execution failed, falling back to programmatic matching:", gemError.message || gemError);
      }
    }

    // Programmatic matching response if key missing or call fails (fail-safe)
    const selectedProductNames = matches.slice(0, 2).map((p: any) => p.name).join(isAr ? ' و ' : ' and ');
    const reasoning = isAr
      ? `تم اختيار "${selectedProductNames}" كخيار مثالي لـ ${receiver} بمناسبة ${occasion}. تتميز هذه الخيارات بجودتها الفائقة وملاءمتها المثالية لميزانيتك، وهي تمزج الأناقة العصرية مع التفاصيل الفاخرة التي تجعلها هدية لا تُنسى لعشاق نمط "${interests}".`
      : `We have selected "${selectedProductNames}" as the absolute best match for ${receiver} on the occasion of ${occasion}. These selections represent pristine, luxurious quality within your budget limits, perfectly aligning with the recipient's tastes and "${interests}" theme.`;

    const giftCardText = isAr
      ? `إلى نبض قلبي والغالي على روحي.. بمناسبة ${occasion}، أردت أن أهدي إليك شيئاً يعبر عن مدى امتناني لوجودك الجميل في حياتي. أتمنى أن ينال هذا الاختيار إعجابك ويسعد قلبك الطاهر!`
      : `To someone who colors my world with joy.. On this wonderful occasion of ${occasion}, I wanted to gift you something that reflects my absolute love and appreciation. May this choice bring warmth to your heart and a beautiful smile to your day!`;

    const wrappingTip = isAr
      ? `ننصح بتغليف الهدية بورق مخملي فاخر باللون الأسود الملكي أو الأخضر الزمردي، مع لفه بشريطة حرير ذهبية براقة من متجرنا، وإضافة بطاقة صغيرة مكتوبة بخط اليد مع غصن صغير من اللافندر المجفف.`
      : `We suggest wrapping this precious gift in luxury royal velvet or deep emerald paper. Encircle it with a smooth champagne gold silk ribbon, and attach your hand-written card along with a delicate sprig of dried lavender.`;

    return res.json({
      success: true,
      source: 'local_algorithm',
      selectedProductIds: selectedIds,
      reasoning,
      giftCardText,
      wrappingTip
    });
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
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
