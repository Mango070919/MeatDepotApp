import express from "express";
import nodemailer from "nodemailer";
import axios from "axios";
import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";

const app = express();
app.use(express.json({ limit: '50mb' }));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Meat Depot API is running" });
});

// Vercel KV (Redis) Routes
app.get("/api/kv/state", async (req, res) => {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({ error: "Vercel KV not configured" });
  }
  try {
    const state = await kv.get("meat_depot_state");
    res.json(state || {});
  } catch (error: any) {
    console.error("KV Get Error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch state" });
  }
});

app.post("/api/kv/state", async (req, res) => {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({ error: "Vercel KV not configured" });
  }
  try {
    const data = req.body;
    await kv.set("meat_depot_state", data);
    res.json({ success: true });
  } catch (error: any) {
    console.error("KV Set Error:", error);
    res.status(500).json({ error: error.message || "Failed to save state" });
  }
});

// Vercel Blob Upload Route
app.post("/api/upload", async (req, res) => {
  const filename = req.query.filename as string;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: "Vercel Blob token not configured" });
  }

  try {
    // Use the request stream directly for upload
    const blob = await put(filename, req, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    res.json(blob);
  } catch (error: any) {
    console.error("Blob Upload Error:", error);
    res.status(500).json({ error: error.message || "Failed to upload blob" });
  }
});

// Facebook OAuth Routes
app.post("/api/auth/facebook/url", (req, res) => {
  const { appId, redirectUri } = req.body;
  
  if (!appId) {
    return res.status(400).json({ error: "Facebook App ID is required" });
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "email,public_profile",
    response_type: "code",
    auth_type: "rerequest",
    display: "popup"
  });

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  res.json({ url: authUrl });
});

app.get("/auth/facebook/callback", async (req, res) => {
  const { code, state } = req.query;
  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'FACEBOOK_AUTH_CODE', code: '${code}' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Authenticating... This window should close automatically.</p>
      </body>
    </html>
  `);
});

app.post("/api/auth/facebook/exchange", async (req, res) => {
  const { code, appId, appSecret, redirectUri } = req.body;

  try {
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code: code
      }
    });

    const accessToken = tokenResponse.data.access_token;

    const profileResponse = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken
      }
    });

    res.json({
      success: true,
      user: profileResponse.data,
      accessToken
    });
  } catch (error: any) {
    console.error("Facebook Exchange Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Failed to exchange Facebook code" });
  }
});

// Email Sending Route
app.post("/api/send-order-email", async (req, res) => {
  const { order, config } = req.body;
  
  if (!order || !order.contactEmail) {
    return res.status(400).json({ success: false, message: "Invalid order data or missing email" });
  }

  const emailUser = config.emailConfig?.user;
  const emailPass = config.emailConfig?.pass;

  if (!emailUser || !emailPass) {
    console.warn("Email credentials missing. Skipping email send.");
    return res.json({ success: true, message: "Email simulation: Credentials missing" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const itemsHtml = order.items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product.name} ${item.weight ? `(${item.weight}g)` : ''}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R${(item.product.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Meat Depot" <${emailUser}>`,
      to: order.contactEmail,
      subject: `Order Confirmation - #${order.id}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background: #f4d300; padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: #000;">Order Confirmed!</h1>
            <p style="margin: 5px 0 0; color: #000; font-weight: bold;">Order #${order.id}</p>
          </div>
          <div style="padding: 30px;">
            <p>Hi ${order.customerName},</p>
            <p>Thank you for your order! We've received it and are getting things ready.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f9f9f9;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 10px; font-weight: bold; text-align: right;">Total</td>
                  <td style="padding: 10px; font-weight: bold; text-align: right;">R${order.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin-top: 30px;">
              <h3 style="margin-top: 0;">Contact Details</h3>
              <p style="margin: 5px 0;"><strong>Address:</strong> ${config.businessDetails?.addressLine1 || '63 Clarence Road, Westering'}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${config.businessDetails?.contactNumber || '+27632148131'}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${config.socialLinks?.email || 'admin@meatdepot.co.za'}</p>
            </div>

            <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
              If you have any questions, please contact us via WhatsApp or Email.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email Send Error:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

app.post("/api/sync", (req, res) => {
  const { data } = req.body;
  console.log("Sync received at server level");
  res.json({ success: true, message: "Data received by server" });
});

export default app;
