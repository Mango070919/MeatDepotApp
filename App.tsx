
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import StartupNotice from './components/common/StartupNotice';
import PreviewBanner from './components/common/PreviewBanner';
import { CheckCircle, XCircle } from 'lucide-react';

// Customer Pages
import Home from './pages/customer/Home';
import Shop from './pages/customer/Shop';
import Cart from './pages/customer/Cart';
import Orders from './pages/customer/Orders';
import Messages from './pages/customer/Messages';
import Login from './pages/customer/Login';
import Signup from './pages/customer/Signup';
import Account from './pages/customer/Account';
import ForgotPassword from './pages/customer/ForgotPassword';
import CompleteProfile from './pages/customer/CompleteProfile';
import RequestQuote from './pages/customer/RequestQuote';

// Common Pages
import Tutorial from './pages/common/Tutorial';
import Disclaimer from './pages/common/Disclaimer';
import PrivacyPolicy from './pages/common/PrivacyPolicy';
import FairUsagePolicy from './pages/common/FairUsagePolicy';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManager from './pages/admin/ProductManager';
import OrderManager from './pages/admin/OrderManager';
import CustomerManager from './pages/admin/CustomerManager';
import Settings from './pages/admin/Settings';
import AIAssistant from './pages/admin/AIAssistant';
import PostManager from './pages/admin/PostManager';
import PromoManager from './pages/admin/PromoManager';
import ManualSale from './pages/admin/ManualSale';
import OrderFinalizer from './pages/admin/OrderFinalizer';
import ProductionManager from './pages/admin/ProductionManager';
import NotificationCenter from './pages/admin/NotificationCenter';
import LiveMonitor from './pages/admin/LiveMonitor';
import AnalyticsReport from './pages/admin/AnalyticsReport';
import HomeEditor from './pages/admin/HomeEditor';
import PaymentManager from './pages/admin/PaymentManager';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';

// POS Pages
import POSInterface from './pages/pos/POSInterface';

import { UserRole } from './types';

// --- Payment Feedback Pages ---
const PaymentSuccess: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
            <CheckCircle size={80} className="text-green-500" />
            <h2 className="text-3xl font-bold text-white">Payment Successful!</h2>
            <p className="text-white/60">Your order has been processed. Thank you for shopping with Meat Depot.</p>
            <button onClick={() => navigate('/orders')} className="bg-[#f4d300] text-black px-8 py-3 rounded-full font-bold uppercase text-sm">View Orders</button>
        </div>
    );
};

const PaymentCancel: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
            <XCircle size={80} className="text-red-500" />
            <h2 className="text-3xl font-bold text-white">Payment Cancelled</h2>
            <p className="text-white/60">The payment was cancelled or failed. Your cart is still saved.</p>
            <button onClick={() => navigate('/cart')} className="bg-white/10 text-white px-8 py-3 rounded-full font-bold uppercase text-sm border border-white/20">Return to Cart</button>
        </div>
    );
};

const PrivateRoute: React.FC<{ children: React.ReactNode; role?: UserRole }> = ({ children, role }) => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" />;
  
  // Admin can access everything
  if (currentUser.role === UserRole.ADMIN) return <>{children}</>;

  // Strict role check
  if (role && currentUser.role !== role) {
      // Redirect logic if role mismatch
      if (currentUser.role === UserRole.CASHIER) return <Navigate to="/pos" />;
      if (currentUser.role === UserRole.DRIVER) return <Navigate to="/driver" />;
      return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

const ThemeInjector: React.FC = () => {
    const { config } = useApp();
    useEffect(() => {
        if (config.brandColor) {
            document.documentElement.style.setProperty('--brand-yellow', config.brandColor);
        }
    }, [config.brandColor]);
    return null;
}

const ActivityHeartbeat: React.FC = () => {
    const { currentUser, updateUser, logout } = useApp();
    const location = useLocation();

    useEffect(() => {
        if (!currentUser) return;
        if (currentUser.forceLogout) {
            alert("Your session has been terminated by an administrator.");
            updateUser({ ...currentUser, forceLogout: false });
            logout();
            return;
        }
        
        const updateActivity = () => {
            const now = new Date().toISOString();
            
            // Attempt to get location if allowed
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        updateUser({ 
                            ...currentUser, 
                            lastActive: now,
                            lastLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude }
                        });
                    },
                    (err) => {
                        // If blocked or error, just update time
                        updateUser({ ...currentUser, lastActive: now });
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            } else {
                updateUser({ ...currentUser, lastActive: now });
            }
        };
        
        updateActivity();
        const interval = setInterval(updateActivity, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [location.pathname, currentUser]);

    return null;
}

const LayoutManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isDriverRoute = location.pathname.startsWith('/driver');
    const isPOSRoute = location.pathname.startsWith('/pos');

    // Navbar should appear for Customer AND Admin
    // Navbar component internally handles switching between Customer/Admin views
    const showNavbar = !isDriverRoute && !isPOSRoute;
    
    // Footer only for Customer
    const showFooter = !isAdminRoute && !isDriverRoute && !isPOSRoute;

    // Admin dashboard looks better with the container constraint as well, 
    // unless it specifically needs full width (currently it fits well within max-w-6xl)
    // LiveMonitor uses full screen black background
    const useContainer = !isDriverRoute && !isPOSRoute && location.pathname !== '/admin/live';

    return (
        <div className={`min-h-screen flex flex-col ${isAdminRoute || isDriverRoute || isPOSRoute ? 'bg-gray-50' : 'bg-black'}`}>
            <ThemeInjector />
            <ActivityHeartbeat />
            <StartupNotice />
            <PreviewBanner />
            {showNavbar && location.pathname !== '/admin/live' && <Navbar />}
            <main className={`flex-grow w-full ${useContainer ? 'max-w-6xl mx-auto px-4 py-6' : 'w-full'}`}>
                {children}
            </main>
            {showFooter && <Footer />}
        </div>
    );
};

const AppRoutes: React.FC = () => {
  return (
    <LayoutManager>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<PrivateRoute><Shop /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/request-quote" element={<PrivateRoute><RequestQuote /></PrivateRoute>} />
          
          {/* Common Routes */}
          <Route path="/tutorial" element={<PrivateRoute><Tutorial /></PrivateRoute>} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<FairUsagePolicy />} />
          
          <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
          
          <Route path="/payment/success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />
          <Route path="/payment/cancel" element={<PrivateRoute><PaymentCancel /></PrivateRoute>} />

          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<PrivateRoute role={UserRole.ADMIN}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/products" element={<PrivateRoute role={UserRole.ADMIN}><ProductManager /></PrivateRoute>} />
          <Route path="/admin/orders" element={<PrivateRoute role={UserRole.ADMIN}><OrderManager /></PrivateRoute>} />
          <Route path="/admin/customers" element={<PrivateRoute role={UserRole.ADMIN}><CustomerManager /></PrivateRoute>} />
          <Route path="/admin/settings" element={<PrivateRoute role={UserRole.ADMIN}><Settings /></PrivateRoute>} />
          <Route path="/admin/payments" element={<PrivateRoute role={UserRole.ADMIN}><PaymentManager /></PrivateRoute>} />
          <Route path="/admin/ai" element={<PrivateRoute role={UserRole.ADMIN}><AIAssistant /></PrivateRoute>} />
          <Route path="/admin/posts" element={<PrivateRoute role={UserRole.ADMIN}><PostManager /></PrivateRoute>} />
          <Route path="/admin/codes" element={<PrivateRoute role={UserRole.ADMIN}><PromoManager /></PrivateRoute>} />
          <Route path="/admin/sale" element={<PrivateRoute role={UserRole.ADMIN}><ManualSale /></PrivateRoute>} />
          <Route path="/admin/production" element={<PrivateRoute role={UserRole.ADMIN}><ProductionManager /></PrivateRoute>} />
          <Route path="/admin/notifications" element={<PrivateRoute role={UserRole.ADMIN}><NotificationCenter /></PrivateRoute>} />
          <Route path="/admin/live" element={<PrivateRoute role={UserRole.ADMIN}><LiveMonitor /></PrivateRoute>} />
          <Route path="/admin/analytics" element={<PrivateRoute role={UserRole.ADMIN}><AnalyticsReport /></PrivateRoute>} />
          <Route path="/admin/home-editor" element={<PrivateRoute role={UserRole.ADMIN}><HomeEditor /></PrivateRoute>} />
          <Route path="/admin/finalize/:orderId" element={<PrivateRoute role={UserRole.ADMIN}><OrderFinalizer /></PrivateRoute>} />
          
          <Route path="/driver" element={<PrivateRoute role={UserRole.DRIVER}><DriverDashboard /></PrivateRoute>} />
          
          {/* POS Route */}
          <Route path="/pos" element={<PrivateRoute role={UserRole.CASHIER}><POSInterface /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </LayoutManager>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
};

export default App;
