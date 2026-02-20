
import React from 'react';
import { useApp } from '../../store';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, CheckCircle, Star, Shield, 
  Truck, ShoppingCart, Monitor, Search, MapPin, 
  MessageSquare, FileText, Settings, Zap, DollarSign 
} from 'lucide-react';
import { UserRole } from '../../types';

const Tutorial: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const role = currentUser.role;

  // --- Content Definitions ---

  const CONTENT = {
    [UserRole.CUSTOMER]: {
      title: "Customer Guide",
      subtitle: "Ordering premium cuts made simple.",
      color: "text-[#f4d300]",
      bgColor: "bg-[#f4d300]",
      capabilities: [
        { icon: ShoppingCart, title: "Browse & Order", desc: "Shop our full catalog of steaks, biltong, and braai packs." },
        { icon: Star, title: "Butcher's Picks", desc: "View our top-rated and premium featured items." },
        { icon: FileText, title: "Request Quotes", desc: "Need a bulk order or spit braai? Request a custom quote." },
        { icon: MessageSquare, title: "Track & Chat", desc: "Track order status and chat with support or drivers." },
        { icon: DollarSign, title: "Earn Points", desc: "Earn loyalty points on every purchase (R500 = 1 Point)." },
      ],
      steps: [
        "Navigate to the 'Shop' tab to view products. Use categories to filter.",
        "Add items to your basket. For KG items, select your preferred weight.",
        "Go to 'Basket', select Delivery or Collection, and choose a date.",
        "Click 'Order via WhatsApp'. This sends the order to our team to confirm stock.",
        "Wait for confirmation. You can track status in the 'Orders' tab."
      ]
    },
    [UserRole.ADMIN]: {
      title: "Admin Console",
      subtitle: "Full system control and management.",
      color: "text-blue-400",
      bgColor: "bg-blue-500",
      capabilities: [
        { icon: Settings, title: "App Configuration", desc: "Change banners, colors, and fees instantly." },
        { icon: Zap, title: "AI Manager", desc: "Use the AI Console to update prices or logic via chat." },
        { icon: Monitor, title: "Order Management", desc: "Update status, assign drivers, and message customers." },
        { icon: FileText, title: "Reporting", desc: "Generate sales reports and export data to PDF/Excel." },
        { icon: Settings, title: "Inventory", desc: "Manage stock levels, costs, and product details." },
      ],
      steps: [
        "Use the Dashboard for a quick overview of revenue and active orders.",
        "Go to 'Orders' to process incoming requests. Change status to update the customer.",
        "Use 'Products' to add new items or update stock.",
        "Visit 'Settings' to configure store hours, delivery fees, or backup data.",
        "Use 'Production' to manage raw material stock and calculate yields."
      ]
    },
    [UserRole.DRIVER]: {
      title: "Driver Portal",
      subtitle: "Logistics and delivery management.",
      color: "text-green-400",
      bgColor: "bg-green-500",
      capabilities: [
        { icon: Truck, title: "Job Pool", desc: "View available deliveries in the 'Pool' tab." },
        { icon: CheckCircle, title: "Accept Jobs", desc: "Claim orders to move them to your 'Active' list." },
        { icon: MapPin, title: "Navigation", desc: "One-tap Google Maps integration for delivery addresses." },
        { icon: MessageSquare, title: "Customer Chat", desc: "Send pre-set updates like '5 mins away'." },
      ],
      steps: [
        "Log in and check the 'Pool' tab for 'Ready for Delivery' orders.",
        "Click 'Accept Delivery' to assign the order to yourself.",
        "Switch to 'Active' tab. Click 'Map' to navigate to the customer.",
        "Use 'Chat' to notify the customer upon arrival.",
        "Click 'Delivered' once the package is handed over."
      ]
    },
    [UserRole.CASHIER]: {
      title: "POS Terminal",
      subtitle: "In-store sales and checkout.",
      color: "text-purple-400",
      bgColor: "bg-purple-500",
      capabilities: [
        { icon: Search, title: "Quick Search", desc: "Search by name or PLU/Barcode." },
        { icon: ShoppingCart, title: "Build Cart", desc: "Add items rapidly for walk-in customers." },
        { icon: Monitor, title: "Hardware Support", desc: "Connects to Thermal Printers and Digital Scales." },
        { icon: FileText, title: "Receipts", desc: "Print physical slips or generate QR digital invoices." },
      ],
      steps: [
        "Scan a barcode or type to search for a product.",
        "For weighted items, enter the grams (or read from connected scale).",
        "Select Payment Method (Cash/Card/EFT).",
        "Enter Amount Tendered for change calculation.",
        "Click 'Complete Sale' to print the receipt."
      ]
    }
  };

  const content = CONTENT[role] || CONTENT[UserRole.CUSTOMER];

  return (
    <div className="min-h-screen bg-black -mx-4 px-6 pt-6 pb-20 space-y-8 animate-in slide-in-from-bottom duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <h1 className="brand-font text-4xl font-bold italic text-white">App Guide</h1>
            <p className={`${content.color} text-[9px] font-bold tracking-[0.4em] uppercase opacity-90`}>{content.title}</p>
        </div>
      </div>

      {/* Intro Card */}
      <div className="bg-[#121212] p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 ${content.bgColor} blur-[80px] opacity-20 rounded-full`}></div>
          <div className="relative z-10 space-y-4">
              <BookOpen size={40} className={content.color} />
              <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome, {currentUser.name.split(' ')[0]}!</h2>
                  <p className="text-white/60 text-sm leading-relaxed">{content.subtitle}</p>
              </div>
          </div>
      </div>

      {/* Capabilities */}
      <div className="space-y-4">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest px-2 flex items-center gap-2">
              <Star size={14} className="text-[#f4d300]"/> Your Capabilities
          </h3>
          <div className="grid grid-cols-1 gap-4">
              {content.capabilities.map((cap, idx) => (
                  <div key={idx} className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-start gap-4">
                      <div className={`p-3 rounded-2xl bg-black/40 ${content.color}`}>
                          <cap.icon size={20} />
                      </div>
                      <div>
                          <h4 className="font-bold text-white text-sm">{cap.title}</h4>
                          <p className="text-white/40 text-xs mt-1 leading-relaxed">{cap.desc}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-6 pt-4 border-t border-white/10">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest px-2 flex items-center gap-2">
              <CheckCircle size={14} className="text-[#f4d300]"/> How to use
          </h3>
          <div className="space-y-8 pl-4 border-l-2 border-white/10 ml-4">
              {content.steps.map((step, idx) => (
                  <div key={idx} className="relative pl-6">
                      <div className={`absolute -left-[29px] top-0 w-6 h-6 rounded-full border-2 border-[#121212] ${content.bgColor} flex items-center justify-center text-black font-bold text-[10px]`}>
                          {idx + 1}
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed">{step}</p>
                  </div>
              ))}
          </div>
      </div>

      {/* Footer Help */}
      <div className="bg-[#f4d300]/10 p-6 rounded-3xl border border-[#f4d300]/20 text-center space-y-3">
          <p className="text-[#f4d300] font-bold text-sm">Still need help?</p>
          <p className="text-white/50 text-xs">Contact the system administrator or check the settings tab for support info.</p>
          {role === UserRole.CUSTOMER && (
              <button 
                onClick={() => window.open('https://wa.me/844012488038318', '_blank')}
                className="text-white text-xs font-bold underline decoration-[#f4d300] decoration-2 underline-offset-4"
              >
                  Chat on WhatsApp
              </button>
          )}
      </div>

    </div>
  );
};

export default Tutorial;
