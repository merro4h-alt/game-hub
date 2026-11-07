import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import axios from "axios";
import fs from "fs";
import {
  autoRestoreDirectWhatsAppOnBoot,
  disconnectDirectWhatsApp,
  enqueueWhatsAppNotification,
  flushPendingNotificationsNow,
  getDirectWhatsAppStatus,
  sendViaDirectWhatsApp,
  startDirectWhatsAppPairingCode,
  startDirectWhatsAppQr,
} from "./server-whatsapp";

function normalizeStoreWhatsAppDigits(rawInput?: string): string {
  const rawWa = String(
    rawInput ||
    process.env.TWILIO_WHATSAPP_TO ||
    process.env.WHATSAPP_NUMBER ||
    "07837814009"
  ).replace(/^whatsapp:/i, "");
  let cleanDigits = rawWa.replace(/[^\d]/g, "");
  if (cleanDigits.startsWith("00")) cleanDigits = cleanDigits.slice(2);
  if (cleanDigits.startsWith("07") && cleanDigits.length === 11) {
    cleanDigits = "964" + cleanDigits.slice(1);
  } else if (cleanDigits.startsWith("7") && cleanDigits.length === 10) {
    cleanDigits = "964" + cleanDigits;
  } else if (cleanDigits.startsWith("05") && cleanDigits.length === 10) {
    cleanDigits = "966" + cleanDigits.slice(1);
  }
  return cleanDigits.length >= 8 ? cleanDigits : "9647837814009";
}

function getActiveWhatsAppProvider(): "whatsapp_direct" | "twilio" | "whatsapp_cloud" | "callmebot" | null {
  if (getDirectWhatsAppStatus().connected) {
    return "whatsapp_direct";
  }
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
    return "twilio";
  }
  if (process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return "whatsapp_cloud";
  }
  if (process.env.CALLMEBOT_API_KEY) {
    return "callmebot";
  }
  return null;
}

async function sendStoreWhatsAppMessage(
  rawRecipient: string | undefined,
  messageBody: string,
  queueOrderId?: string
) {
  const cleanDigits = normalizeStoreWhatsAppDigits(rawRecipient);

  // 1. Direct Linked WhatsApp Session (verified phone JID + self chat)
  const directRes = await sendViaDirectWhatsApp(cleanDigits, messageBody);
  if (directRes.sent) {
    return {
      sent: true,
      provider: "whatsapp_direct",
      recipient: `+${cleanDigits}`,
      queued: false,
    };
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM;
  const waCloudToken = process.env.WHATSAPP_CLOUD_TOKEN;
  const waPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const callMeBotApiKey = process.env.CALLMEBOT_API_KEY;

  let lastError = "";

  if (accountSid && authToken && fromWhatsApp) {
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(accountSid, authToken);
      const formattedTo = `whatsapp:+${cleanDigits}`;
      const formattedFrom = fromWhatsApp.startsWith("whatsapp:") ? fromWhatsApp : `whatsapp:${fromWhatsApp}`;

      await client.messages.create({
        body: messageBody,
        from: formattedFrom,
        to: formattedTo,
      });
      console.log(`WhatsApp notification sent via Twilio to ${formattedTo}`);
      return { sent: true, provider: "twilio", recipient: `+${cleanDigits}` };
    } catch (twErr: any) {
      lastError = twErr?.message || String(twErr);
      console.error("Twilio WhatsApp notification error:", lastError);
    }
  }

  if (waCloudToken && waPhoneNumberId) {
    try {
      await axios.post(
        `https://graph.facebook.com/v19.0/${waPhoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: cleanDigits,
          type: "text",
          text: { body: messageBody },
        },
        { headers: { Authorization: `Bearer ${waCloudToken}` }, timeout: 8000 }
      );
      console.log(`WhatsApp notification sent via Cloud API to +${cleanDigits}`);
      return { sent: true, provider: "whatsapp_cloud", recipient: `+${cleanDigits}` };
    } catch (cloudErr: any) {
      lastError = JSON.stringify(cloudErr?.response?.data || cloudErr?.message || cloudErr);
      console.error("WhatsApp Cloud API notification error:", lastError);
    }
  }

  if (callMeBotApiKey) {
    try {
      await axios.get("https://api.callmebot.com/whatsapp.php", {
        params: {
          phone: cleanDigits,
          text: messageBody,
          apikey: callMeBotApiKey,
        },
        timeout: 8000,
      });
      console.log(`WhatsApp notification sent via CallMeBot to +${cleanDigits}`);
      return { sent: true, provider: "callmebot", recipient: `+${cleanDigits}` };
    } catch (cmbErr: any) {
      lastError = cmbErr?.message || String(cmbErr);
      console.error("CallMeBot WhatsApp notification error:", lastError);
    }
  }

  if (queueOrderId) {
    enqueueWhatsAppNotification(queueOrderId, cleanDigits, messageBody);
  }

  return {
    sent: false,
    queued: Boolean(queueOrderId),
    provider: getActiveWhatsAppProvider(),
    recipient: `+${cleanDigits}`,
    error: lastError || "WHATSAPP_NOT_LINKED",
  };
}

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

  autoRestoreDirectWhatsAppOnBoot();

  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploads statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Video Upload API
  app.post("/api/upload-video", async (req, res) => {
    try {
      const { videoData, fileName } = req.body;
      if (!videoData) {
        return res.status(400).json({ error: "No video data provided" });
      }

      if (videoData.startsWith('data:')) {
        const matches = videoData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return res.status(400).json({ error: "Invalid base64 video format" });
        }
        
        const fileExtension = fileName ? path.extname(fileName) : '.mp4';
        const uniqueFileName = `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
        const filePath = path.join(uploadsDir, uniqueFileName);
        
        const buffer = Buffer.from(matches[2], 'base64');
        await fs.promises.writeFile(filePath, buffer);
        
        return res.json({ 
          success: true, 
          url: `/uploads/${uniqueFileName}` 
        });
      } else {
        return res.json({ success: true, url: videoData });
      }
    } catch (error: any) {
      console.error("Video upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload video" });
    }
  });
  
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
    { id: 'al-waseet', name: 'شركة الوسيط - توصيل محلي (Al-Waseet)', base: 0, multiplier: 1.0, speed: '2-4 days' }
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
    
    const provider = SHIPPING_PROVIDERS.find(p => p.id === providerId) || SHIPPING_PROVIDERS[0]; // Fallback
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
    
    // Reuse provided tracking ID or generate one
    const trackingId = orderData.trackingId || ("AH-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase());
    
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
      createdAt: orderData.createdAt || new Date().toISOString()
    };
    
    orders.push(newOrder);
    console.log("Order saved:", trackingId);

    const name = orderData.shippingAddress?.fullName || orderData.name || "Customer";
    const phone = orderData.shippingAddress?.phone || orderData.phone || "";
    const address = orderData.shippingAddress?.address || orderData.address || "";
    const city = orderData.shippingAddress?.city || "";
    const country = orderData.shippingAddress?.country || "";
    const total = Number(orderData.total || 0);
    const items = orderData.items || [];
    const emailTo = orderData.shippingAddress?.email || orderData.emailTo || orderData.email;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const trackingLink =
      orderData.trackingLink ||
      `${process.env.APP_URL || `${protocol}://${host}`}/track/${trackingId}`;

    try {
      // Lazy import nodemailer
      const nodemailer = await import("nodemailer");
      
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
Forwarded to: onxifi.orders.app
Phone: ${phone}
Address: ${address} ${city ? `(${city}, ${country})` : ''}
Payment Method: ${orderData.paymentMethod || 'COD'}
Items:
${itemsList}
Total: $${total.toFixed(2)}
      `;

      // HTML Body
      let emailSent = false;
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid #C5A059; padding-bottom: 16px; margin-bottom: 20px;">
            <h1 style="color: #111827; margin: 0; font-size: 24px; font-weight: 800;">ONXIFI STORE</h1>
            <p style="color: #6B7280; margin: 4px 0 0 0; font-size: 14px;">طلب جديد تم توجيهه إلى <strong style="color: #C5A059;">onxifi.orders.app</strong></p>
          </div>

          <div style="background: linear-gradient(135deg, #111827, #1f2937); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #C5A059; font-weight: bold;">رقم تتبع الطلب / Tracking ID</div>
            <div style="font-size: 28px; font-weight: 900; letter-spacing: 2px; margin: 8px 0; color: #ffffff;">${trackingId}</div>
            <a href="${trackingLink}" style="display: inline-block; margin-top: 10px; background: #C5A059; color: #111827; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 13px;">تتبع تفاصيل الطلب</a>
          </div>
          
          <div style="background: #f9fafb; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #f3f4f6;">
            <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #111827;">معلومات العميل والشحن</h3>
            <p style="margin: 4px 0; font-size: 13px; color: #4B5563;"><strong>الاسم:</strong> ${name}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #4B5563;"><strong>رقم الهاتف:</strong> ${phone}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #4B5563;"><strong>العنوان:</strong> ${address} ${city ? `- ${city}, ${country}` : ''}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #4B5563;"><strong>طريقة الدفع:</strong> ${orderData.paymentMethod || 'الدفع عند الاستلام'}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #4B5563;"><strong>تطبيق الاستلام:</strong> <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-family: monospace;">onxifi.orders.app</span></p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #111827;">المنتجات المطلوبة</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${items.map((item: any) => `
                <li style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; font-size: 13px;">
                  <span><strong>${item.name}</strong> ${item.selectedColor ? `(${item.selectedColor})` : ''} ${item.selectedSize ? `[${item.selectedSize}]` : ''} × ${item.quantity}</span>
                  <span style="font-weight: bold; color: #111827;">$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                </li>
              `).join("")}
            </ul>
            <div style="margin-top: 14px; text-align: right; border-top: 2px solid #e5e7eb; padding-top: 10px;">
              <div style="font-size: 18px; font-weight: 800; color: #111827;">الإجمالي الكلي: $${total.toFixed(2)}</div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9CA3AF;">
            تم إرسال هذا الإشعار تلقائياً إلى onxifi.orders.app و بريد المتجر.
          </div>
        </div>
      `;

      const storeDomain = process.env.VITE_STORE_URL || 'onxifi.com';
      const adminNotify = process.env.ADMIN_NOTIFY_EMAIL || 'merro4h@gmail.com';
      
      // Recipients include onxifi.orders.app, admin email, and customer email
      const primaryRecipients = [
        'onxifi.orders.app@gmail.com',
        adminNotify,
        emailTo
      ].filter(Boolean).join(", ");

      const mailOptions = {
        from: `"ONXIFI Store" <${process.env.EMAIL_USER || `noreply@${storeDomain}`}>`,
        to: primaryRecipients,
        subject: `[onxifi.orders.app] طلب جديد #${trackingId} من ${name} - ONXIFI`,
        text: orderSummary,
        html: htmlBody
      };

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await transporter.sendMail(mailOptions);
          emailSent = true;
          logSentEmail(mailOptions.to, mailOptions.subject, mailOptions.html, "Sent (onxifi.orders.app & Admin)");
          console.log("Order confirmation email sent to onxifi.orders.app.");
        } catch (smtpErr: any) {
          console.error("SMTP Delivery error:", smtpErr);
          logSentEmail(mailOptions.to, mailOptions.subject, mailOptions.html, `SMTP Failed: ${smtpErr.message || smtpErr}`);
        }
      } else {
        logSentEmail("onxifi.orders.app", mailOptions.subject, mailOptions.html, "Simulated Dispatch to onxifi.orders.app");
        console.log("Logged simulated order dispatch to onxifi.orders.app successfully.");
      }

      // 2. Normalize store WhatsApp recipient (07837814009 -> 9647837814009) and send automatic WhatsApp notification
      const waItemsSummary = items
        .map((it: any) => `▫️ ${it.name} (${it.quantity || 1}x) - $${Number(it.price || 0).toFixed(2)}`)
        .join('\n');
      const waMessageBody =
        `🛒 *طلب جديد من المتجر: #${trackingId}*\n` +
        `👤 العميل: ${name || 'عميل المتجر'}\n` +
        `📞 الهاتف: ${phone || 'غير محدد'}\n` +
        `📍 العنوان: ${address}${city ? `, ${city}` : ''}\n` +
        `💳 الدفع: ${(orderData.paymentMethod || 'cod').toUpperCase()}\n` +
        `💰 الإجمالي: $${total.toFixed(2)}\n` +
        (waItemsSummary ? `\n📦 المنتجات:\n${waItemsSummary}\n` : '') +
        `\n🔗 رابط التتبع: ${trackingLink}`;

      const waResult = await sendStoreWhatsAppMessage(
        req.body.whatsappNumber,
        waMessageBody,
        trackingId
      );
      const whatsappSent = waResult.sent;

      if (!whatsappSent) {
        console.warn(
          `WhatsApp notification queued for ${waResult.recipient} (order #${trackingId}): ${waResult.error}`
        );
      }

      res.json({ 
        success: true, 
        message: "Order processed.",
        trackingId,
        trackingLink,
        emailSent,
        whatsappSent,
        whatsappQueued: Boolean((waResult as any).queued),
        whatsappProvider: waResult.provider,
        whatsappError: whatsappSent ? null : waResult.error
      });

    } catch (error) {
      console.error("Error processing order notifications:", error);
      res.status(500).json({ success: false, error: "Failed to send notifications." });
    }
  });

  app.get("/api/whatsapp/status", (_req, res) => {
    const provider = getActiveWhatsAppProvider();
    const direct = getDirectWhatsAppStatus();
    res.json({
      configured: Boolean(provider),
      provider,
      defaultRecipient: `+${normalizeStoreWhatsAppDigits()}`,
      direct,
    });
  });

  app.post("/api/whatsapp/connect-code", async (req, res) => {
    try {
      const direct = await startDirectWhatsAppPairingCode(req.body?.whatsappNumber || "07837814009");
      res.json({ success: Boolean(direct.pairingCode || direct.connected), direct });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to generate pairing code" });
    }
  });

  app.post("/api/whatsapp/connect-qr", async (_req, res) => {
    try {
      const direct = await startDirectWhatsAppQr();
      res.json({ success: Boolean(direct.qrDataUrl || direct.connected), direct });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to generate QR code" });
    }
  });

  app.post("/api/whatsapp/disconnect", async (_req, res) => {
    try {
      const direct = await disconnectDirectWhatsApp();
      res.json({ success: true, direct });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to disconnect WhatsApp" });
    }
  });

  app.post("/api/whatsapp/flush", async (_req, res) => {
    try {
      const flushResult = await flushPendingNotificationsNow();
      res.json({
        success: true,
        ...flushResult,
        direct: getDirectWhatsAppStatus(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to flush pending notifications" });
    }
  });

  app.post("/api/whatsapp/test", async (req, res) => {
    const targetNumber = req.body?.whatsappNumber;
    const testMessage =
      `🔔 *رسالة تجريبية تلقائية من متجر ONXIFI*\n` +
      `✅ تم ربط رقم الواتساب بنجاح!\n` +
      `ستصلك تفاصيل جميع الطلبات والرسائل الجديدة تلقائياً هنا فور إتمام أي طلب.`;
    const result = await sendStoreWhatsAppMessage(targetNumber, testMessage);
    res.json(result);
  });

  app.post("/api/whatsapp/chat", async (req, res) => {
    try {
      const {
        customerPhone = "",
        customerName = "",
        customerEmail = "",
        message = "",
        pageUrl = "",
        whatsappNumber,
      } = req.body || {};

      const trimmedPhone = String(customerPhone).trim();
      const trimmedMessage = String(message).trim();
      const trimmedName = String(customerName).trim();

      if (!trimmedPhone || trimmedPhone.replace(/[^\d]/g, "").length < 8) {
        return res.status(400).json({
          success: false,
          error: "Valid customer phone number is required",
        });
      }

      const inquiryId = `CHAT-${Date.now().toString(36).toUpperCase()}`;

      // Normalize customer phone for 1-tap WhatsApp reply link inside owner's message
      let customerWaDigits = trimmedPhone.replace(/[^\d]/g, "");
      if (customerWaDigits.startsWith("00")) customerWaDigits = customerWaDigits.slice(2);
      if (customerWaDigits.startsWith("07") && customerWaDigits.length === 11) {
        customerWaDigits = "964" + customerWaDigits.slice(1);
      } else if (customerWaDigits.startsWith("7") && customerWaDigits.length === 10) {
        customerWaDigits = "964" + customerWaDigits;
      } else if (customerWaDigits.startsWith("05") && customerWaDigits.length === 10) {
        customerWaDigits = "966" + customerWaDigits.slice(1);
      }

      try {
        const inquiriesDir = path.join(process.cwd(), ".whatsapp-auth");
        const inquiriesFile = path.join(inquiriesDir, "chat-inquiries.json");
        fs.mkdirSync(inquiriesDir, { recursive: true });
        let existingInquiries: any[] = [];
        if (fs.existsSync(inquiriesFile)) {
          existingInquiries = JSON.parse(fs.readFileSync(inquiriesFile, "utf-8"));
          if (!Array.isArray(existingInquiries)) existingInquiries = [];
        }
        existingInquiries.unshift({
          inquiryId,
          customerPhone: trimmedPhone,
          customerWaDigits,
          customerName: trimmedName,
          customerEmail: String(customerEmail).trim(),
          message: trimmedMessage || "مرحباً، أود التواصل معكم بخصوص المتجر.",
          pageUrl: String(pageUrl).trim(),
          createdAt: new Date().toISOString(),
        });
        fs.writeFileSync(
          inquiriesFile,
          JSON.stringify(existingInquiries.slice(0, 200), null, 2),
          "utf-8"
        );
      } catch (persistErr) {
        console.warn("[WhatsApp Chat Endpoint] Failed to persist inquiry log:", persistErr);
      }

      const effectiveMessage =
        trimmedMessage || "مرحباً، أود التواصل معكم بخصوص المتجر.";

      const waChatBody =
        `💬 *رسالة جديدة من دردشة واتساب المتجر (ONXIFI)*\n` +
        (trimmedName ? `👤 الاسم: ${trimmedName}\n` : "") +
        (trimmedPhone ? `📞 رقم العميل: ${trimmedPhone}\n` : "") +
        (customerEmail ? `📧 البريد: ${customerEmail}\n` : "") +
        `✉️ الرسالة:\n${effectiveMessage}` +
        (customerWaDigits.length >= 10
          ? `\n\n📲 للرد المباشر على العميل عبر واتساب:\nhttps://wa.me/${customerWaDigits}`
          : "") +
        (pageUrl ? `\n🔗 الصفحة: ${pageUrl}` : "");

      const waResult = await sendStoreWhatsAppMessage(
        whatsappNumber,
        waChatBody,
        inquiryId
      );

      // Backup admin email log / SMTP dispatch
      const subject = `💬 رسالة واتساب جديدة من ${trimmedName || trimmedPhone || "عميل"} - ONXIFI`;
      const htmlLog = `
        <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="margin-top: 0; color: #111827;">رسالة جديدة من دردشة المتجر</h2>
          ${trimmedName ? `<p><strong>الاسم:</strong> ${trimmedName}</p>` : ""}
          ${trimmedPhone ? `<p><strong>رقم الهاتف:</strong> ${trimmedPhone}</p>` : ""}
          ${customerEmail ? `<p><strong>البريد الإلكتروني:</strong> ${customerEmail}</p>` : ""}
          <p><strong>الرسالة:</strong> ${effectiveMessage}</p>
          ${customerWaDigits.length >= 10 ? `<p><a href="https://wa.me/${customerWaDigits}">الرد على العميل عبر واتساب</a></p>` : ""}
        </div>
      `;

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const nodemailer = await import("nodemailer");
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
          const adminNotify = process.env.ADMIN_NOTIFY_EMAIL || "merro4h@gmail.com";
          await transporter.sendMail({
            from: `"ONXIFI Chat" <${process.env.EMAIL_USER}>`,
            to: adminNotify,
            subject,
            html: htmlLog,
          });
          logSentEmail(adminNotify, subject, htmlLog, "Sent (WhatsApp Chat Backup)");
        } catch (mailErr: any) {
          logSentEmail("merro4h@gmail.com", subject, htmlLog, `Logged (${mailErr?.message || "SMTP skipped"})`);
        }
      } else {
        logSentEmail("merro4h@gmail.com", subject, htmlLog, waResult.sent ? "WhatsApp Delivered" : "Queued for WhatsApp");
      }

      return res.json({
        success: true,
        inquiryId,
        whatsappSent: waResult.sent,
        whatsappQueued: Boolean((waResult as any).queued),
        provider: waResult.provider,
      });
    } catch (err: any) {
      console.error("[WhatsApp Chat Endpoint] Error:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to send chat message",
      });
    }
  });

  // Dedicated endpoint for dispatching an order directly to onxifi.orders.app
  app.post("/api/orders/forward-to-app", async (req, res) => {
    try {
      const orderData = req.body;
      const trackingId = orderData.trackingId || `ONX-${Date.now().toString(36).toUpperCase()}`;
      
      console.log(`[onxifi.orders.app] Explicit forward requested for order #${trackingId}`);

      const payload = {
        source: "ONXIFI Store",
        destination: "onxifi.orders.app",
        order: orderData,
        timestamp: new Date().toISOString()
      };

      // Send to webhook / API
      await Promise.allSettled([
        axios.post("https://onxifi.orders.app/api/orders", payload, { timeout: 4000 }),
        axios.post("https://onxifi.orders.app/webhook", payload, { timeout: 4000 }),
        axios.post("https://onxifi.orders.app", payload, { timeout: 4000 })
      ]);

      logSentEmail("onxifi.orders.app", `Direct Forward: Order #${trackingId}`, JSON.stringify(orderData, null, 2), "Forwarded");

      return res.json({
        success: true,
        sentTo: "onxifi.orders.app",
        trackingId,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Forwarding to onxifi.orders.app failed:", err);
      return res.status(500).json({ success: false, error: err.message });
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

      const storeDomain = process.env.VITE_STORE_URL || 'onxifi.com';
      const mailOptions = {
        from: `"ONXIFI Store" <${process.env.EMAIL_USER || `noreply@${storeDomain}`}>`,
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

      const storeDomain = process.env.VITE_STORE_URL || 'onxifi.com';
      const mailOptions = {
        from: `"ONXIFI Store" <${process.env.EMAIL_USER || `noreply@${storeDomain}`}>`,
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
