
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, ShieldCheck } from 'lucide-react';

const FairUsagePolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black -mx-4 px-6 pt-6 pb-20 space-y-8 animate-in slide-in-from-bottom duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <h1 className="brand-font text-3xl font-bold italic text-white">Terms</h1>
            <p className="text-[#f4d300] text-[9px] font-bold tracking-[0.4em] uppercase opacity-70">Fair Usage & Service</p>
        </div>
      </div>

      <div className="bg-[#121212] p-8 rounded-[40px] border border-white/10 shadow-2xl">
          <div className="space-y-8 text-white/80 leading-relaxed text-sm">
              <div className="border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3 text-[#f4d300] mb-2">
                      <Scale size={24} />
                      <h2 className="font-bold uppercase tracking-widest text-lg text-white">Terms of Service / Fair Usage Policy</h2>
                  </div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Effective: 11/02/2026 | Last Updated: 11/02/2026</p>
                  <p className="mt-4">
                      Welcome to the Meat Depot ordering app (“the App”). By using this App, placing an order, or accessing our services, you agree to the following terms and conditions.
                  </p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">1. General Use</h3>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>The App is provided for customers to browse products and place orders with Meat Depot.</li>
                      <li>By using the App, you confirm that the information you provide is accurate and complete.</li>
                      <li>You agree not to misuse the App or attempt to interfere with its normal operation.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">2. Orders and Availability</h3>
                  <p>All orders are subject to product availability. Because we work with fresh and perishable products, weights and quantities may vary slightly from the order placed.</p>
                  <p className="mt-2 text-white/90">We reserve the right to:</p>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>Adjust quantities where necessary.</li>
                      <li>Substitute items of equal or greater value with your consent.</li>
                      <li>Cancel orders where stock is unavailable.</li>
                  </ul>
                  <p className="mt-2 text-white/70 italic">Customers will be notified of any major changes before the order is finalized.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">3. Pricing</h3>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>All prices are displayed in South African Rand (ZAR).</li>
                      <li>Prices may change without notice, but confirmed orders will be honored at the price shown at checkout.</li>
                      <li>Final pricing may vary slightly based on actual product weight.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">4. Payment</h3>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>Payment must be made using the available payment methods in the App or as provided by us on WhatsApp (+27 84 401 248 8038).</li>
                      <li>Orders will only be processed once payment is confirmed, unless otherwise agreed.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">5. Delivery and Collection</h3>
                  <p>Delivery times are estimates and may vary due to traffic, weather, or operational factors.</p>
                  <p className="mt-2 text-white/90">It is the customer’s responsibility to ensure:</p>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>The delivery address is correct.</li>
                      <li>Someone is available to receive the order.</li>
                  </ul>
                  <p className="mt-2 text-white/70">If delivery fails due to incorrect details or unavailability, additional delivery charges may apply.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">6. Product Quality and Complaints</h3>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>All products are checked for quality before dispatch.</li>
                      <li>Any issues must be reported within 24 hours of delivery.</li>
                      <li>Valid complaints may result in replacement of the product or a refund, at our discretion.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">7. Fair Usage</h3>
                  <p>To ensure fair access and service for all customers:</p>
                  
                  <div className="pl-4 border-l-2 border-red-500/30 my-2">
                      <p className="font-bold text-white/90 mb-1">Customers may not:</p>
                      <ul className="list-disc pl-4 space-y-1 text-white/70">
                          <li>Place fraudulent or prank orders.</li>
                          <li>Abuse discount codes or promotions.</li>
                          <li>Use automated systems or bots to place orders.</li>
                          <li>Harass staff or delivery personnel.</li>
                      </ul>
                  </div>

                  <p className="mt-2">We reserve the right to cancel suspicious or abusive orders and suspend or block accounts that violate this policy.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">8. Cancellations</h3>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>Orders may only be cancelled before preparation begins.</li>
                      <li>Once preparation has started, cancellations may not be possible due to the perishable nature of the products.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">9. Limitation of Liability</h3>
                  <ul className="list-disc pl-4 space-y-1 text-white/70">
                      <li>Meat Depot is not liable for indirect or consequential losses.</li>
                      <li>Meat Depot is not liable for delays caused by factors outside our control.</li>
                      <li>Our total liability is limited to the value of the order placed.</li>
                  </ul>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">10. Changes to the App or Terms</h3>
                  <p>We may update or modify the App, prices, products, or these terms at any time. Continued use of the Meat Depot App constitutes acceptance of any updated terms.</p>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/10">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">11. Contact Information</h3>
                  <p>For any questions, complaints, or support:</p>
                  <div className="mt-2 text-white/90 space-y-1 font-medium bg-white/5 p-4 rounded-xl">
                      <p className="text-[#f4d300]">Meat Depot</p>
                      <p>Phone/WhatsApp: +27 84 401 248 8038</p>
                      <p>Email: admin@meatdepot.co.za</p>
                      <p>Website: meatdepot.co.za</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default FairUsagePolicy;
