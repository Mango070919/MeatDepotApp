
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Meat Depot API is running" });
  });

  // Email Sending Route
  app.post("/api/send-order-email", async (req, res) => {
    const { order, config } = req.body;
    
    if (!order || !order.contactEmail) {
      return res.status(400).json({ success: false, message: "Invalid order data or missing email" });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.warn("Email credentials missing. Skipping email send.");
      return res.json({ success: true, message: "Email simulation: Credentials missing" });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail', // or your preferred service
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
                <p style="margin: 5px 0;"><strong>Phone:</strong> ${config.businessDetails?.contactNumber || '+27 84 401 2488'}</p>
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

  // Example persistence endpoint (In a real Vercel app, you'd use a DB)
  // This is a placeholder to show where server-side persistence would go
  app.post("/api/sync", (req, res) => {
    const { data } = req.body;
    console.log("Sync received at server level");
    // On Vercel, you would save this to Vercel Postgres or KV here
    res.json({ success: true, message: "Data received by server" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
