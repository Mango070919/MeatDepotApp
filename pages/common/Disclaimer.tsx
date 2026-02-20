
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

const Disclaimer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black -mx-4 px-6 pt-6 pb-20 space-y-8 animate-in slide-in-from-bottom duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <h1 className="brand-font text-3xl font-bold italic text-white">Disclaimer</h1>
            <p className="text-[#f4d300] text-[9px] font-bold tracking-[0.4em] uppercase opacity-70">Terms of Use & Liability</p>
        </div>
      </div>

      <div className="bg-[#121212] p-8 rounded-[40px] border border-white/10 shadow-2xl">
          <div className="space-y-8 text-white/80 leading-relaxed text-sm">
              <div className="flex items-center gap-3 text-[#f4d300] mb-6">
                  <ShieldAlert size={24} />
                  <span className="font-bold uppercase tracking-widest text-xs">Meat Depot Ordering App</span>
              </div>

              <p className="font-medium">
                  While Meat Depot is committed to providing accurate information, quality products, and reliable service through the Meat Depot ordering app and website, the following terms apply to all users:
              </p>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">1. Product Availability</h3>
                  <p>All products displayed on the app or website are subject to availability. Meat Depot reserves the right to substitute, limit, or cancel any order due to stock shortages, quality concerns, or operational constraints.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">2. Pricing and Errors</h3>
                  <p>Prices are subject to change without prior notice. While every effort is made to ensure accuracy, Meat Depot shall not be held liable for any pricing, description, or technical errors. Orders affected by such errors may be cancelled or adjusted.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">3. Weight Variations</h3>
                  <p>Fresh meat products are sold by approximate weight. Final pricing may vary slightly based on actual product weight at the time of preparation. Customers will be charged accordingly.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">4. Delivery and Collection</h3>
                  <p>Estimated preparation, delivery, or collection times are provided as guidelines only. Meat Depot will not be liable for delays caused by traffic, weather, technical issues, third-party delivery services, or circumstances beyond its control.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">5. Food Handling and Storage</h3>
                  <p>Once an order has been collected or delivered, the customer assumes full responsibility for proper handling, storage, and preparation of all products. Meat Depot will not be liable for any loss, spoilage, or harm resulting from improper storage or preparation after handover.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">6. App and System Availability</h3>
                  <p>Meat Depot does not guarantee uninterrupted or error-free operation of the website or ordering app. The company shall not be liable for any interruption, delay, failed transaction, or data transmission error, regardless of cause.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">7. Limitation of Liability</h3>
                  <p>To the fullest extent permitted by law, Meat Depot shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of the website, ordering app, or any products purchased through it.</p>
              </div>

              <div className="space-y-2">
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">8. User Responsibility</h3>
                  <p>By using the Meat Depot ordering app or website, the user agrees that all use is at their own risk and that they have read and accepted these terms.</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Disclaimer;
