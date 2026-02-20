
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Lock, RefreshCcw } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black -mx-4 px-6 pt-6 pb-20 space-y-8 animate-in slide-in-from-bottom duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <h1 className="brand-font text-3xl font-bold italic text-white">Policies</h1>
            <p className="text-[#f4d300] text-[9px] font-bold tracking-[0.4em] uppercase opacity-70">Privacy & Returns</p>
        </div>
      </div>

      <div className="bg-[#121212] p-8 rounded-[40px] border border-white/10 shadow-2xl space-y-12">
          
          {/* Privacy Policy Section */}
          <div className="space-y-8 text-white/80 leading-relaxed text-sm">
              <div className="border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3 text-[#f4d300] mb-2">
                      <Lock size={24} />
                      <h2 className="font-bold uppercase tracking-widest text-lg text-white">Privacy Policy</h2>
                  </div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Effective: 11/02/2026 | Last Updated: 11/02/2026</p>
                  <p className="mt-4">
                      Meat Depot (“we,” “our,” or “us”) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and protect your information when you use our ordering app.
                  </p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">1. Information We Collect</h3>
                  <p>We may collect the following information when you use our app:</p>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li><strong>Personal Information:</strong> Name, phone number, email address, delivery address.</li>
                      <li><strong>Order Information:</strong> Items ordered, order history, payment details (processed via secure third-party gateways).</li>
                      <li><strong>Usage Information:</strong> IP address, device type, operating system, app usage patterns.</li>
                      <li><strong>Cookies and Tracking:</strong> Optional data to improve your experience and app functionality.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">2. How We Use Your Information</h3>
                  <p>Your information is used to:</p>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>Process and manage your orders.</li>
                      <li>Communicate order confirmations, updates, and promotions.</li>
                      <li>Improve our services and app functionality.</li>
                      <li>Comply with legal obligations.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">3. Sharing Your Information</h3>
                  <p>We do not sell or trade your personal information. We may share your data with:</p>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>Delivery partners to fulfill your orders.</li>
                      <li>Payment processors for secure payment processing.</li>
                      <li>Legal authorities if required by law.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">4. Data Security</h3>
                  <p>We implement appropriate security measures to protect your data, including encryption and secure storage. However, no system is 100% secure, and we cannot guarantee absolute security.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">5. Your Rights</h3>
                  <p>You have the right to:</p>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>Access, update, or delete your personal information.</li>
                      <li>Opt-out of marketing communications.</li>
                      <li>Request restrictions on data processing.</li>
                  </ul>
                  <p className="mt-2">To exercise these rights, please contact us at admin@meatdepot.co.za.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">6. Children’s Privacy</h3>
                  <p>Our app is not intended for use by children under 13 years. We do not knowingly collect information from children.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">7. Changes to This Policy</h3>
                  <p>We may update this Privacy Policy periodically. Changes will be reflected in the “Last Updated” date above.</p>
              </div>
          </div>

          {/* Returns Policy Section */}
          <div className="space-y-8 text-white/80 leading-relaxed text-sm border-t border-white/10 pt-8">
              <div className="border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3 text-[#f4d300] mb-2">
                      <RefreshCcw size={24} />
                      <h2 className="font-bold uppercase tracking-widest text-lg text-white">Returns & Refunds Policy</h2>
                  </div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Effective: 11/02/2026 | Last Updated: 11/02/2026</p>
                  <p className="mt-4">
                      At Meat Depot, we strive to ensure that you are satisfied with your orders. This policy outlines our approach to returns and refunds for products purchased via our ordering app.
                  </p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">1. Eligibility for Returns</h3>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>Products must be reported within 24 hours of delivery if there is an issue (wrong item, damaged, or spoiled).</li>
                      <li>Fresh or perishable products (meat, biltong, etc.) cannot be returned for reasons other than quality, life or delivery errors.</li>
                      <li>You must provide proof of purchase.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">2. Refund Process</h3>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>Once your request is reviewed and approved, we will issue a refund to the original payment method.</li>
                      <li>Refunds may take 3–5 business days to process, depending on your bank.</li>
                      <li>If a replacement is preferred and available, we may offer to resend or replace the product instead of a refund.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">3. Non-Returnable Items</h3>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>Items that have been partially consumed or altered after delivery.</li>
                      <li>Items returned outside the 24-hour reporting window.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">4. How to Request a Refund or Replacement</h3>
                  <p>Contact our support team at 063 214 8131 or admin@meatdepot.co.za within 24 hours of delivery.</p>
                  <p className="mt-1">Provide your order number, product details, and evidence of the issue.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">5. Delivery Errors</h3>
                  <p>If the wrong item is delivered, we will circumstancially arrange for a replacement at no additional cost.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">6. Changes to This Policy</h3>
                  <p>We reserve the right to update this Returns & Refunds Policy at any time. Changes will be reflected in the “Last Updated” date above.</p>
              </div>
          </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
