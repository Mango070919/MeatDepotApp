
import React, { useState, useMemo } from 'react';
import { useApp } from '../../store';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Package, 
  Plus, 
  Settings, 
  Newspaper, 
  Calendar, 
  BarChart3, 
  Terminal, 
  Shield,
  X,
  Laptop,
  Globe,
  Trash2,
  RefreshCcw,
  Power,
  Activity,
  Clock,
  History,
  Monitor,
  ChefHat,
  Download,
  Bell,
  Cloud,
  Loader2,
  ArrowRight,
  LayoutTemplate,
  Rocket,
  CreditCard
} from 'lucide-react';
import { OrderStatus, AdminPermission, UserRole } from '../../types';
import { generateSalesReport } from '../../services/reportService';

const AdminDashboard: React.FC = () => {
  const { orders, users, config, currentUser, updateConfig, deleteOrder, updateUser, activityLogs, products, syncToSheet, isCloudSyncing } = useApp();
  const navigate = useNavigate();
  
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const hasPermission = (perm: AdminPermission) => {
      if (currentUser?.id === 'admin' || currentUser?.email === 'admin@meatdepot.co.za') return true;
      return currentUser?.permissions?.includes(perm);
  };

  const filteredOrders = useMemo(() => {
    const baseline = config.revenueBaselineDate ? new Date(config.revenueBaselineDate) : new Date(0);
    return orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const inDateRange = orderDate >= new Date(startDate) && orderDate <= new Date(endDate + 'T23:59:59');
        const afterBaseline = orderDate >= baseline;
        return inDateRange && afterBaseline;
    });
  }, [orders, startDate, endDate, config.revenueBaselineDate]);

  const totalRevenue = filteredOrders.reduce((acc, o) => acc + o.total, 0);
  const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.MANUAL_SALE).length;
  const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  const stats = [
    { label: 'Period Revenue', value: `R${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', path: '/admin/analytics' },
    { label: 'Active Orders', value: activeOrders, icon: ShoppingBag, color: 'text-yellow-600', path: '/admin/orders' },
    { label: 'Total Customers', value: users.length, icon: Users, color: 'text-blue-600', path: '/admin/customers' },
    { label: 'Avg. Order', value: `R${averageOrderValue.toFixed(0)}`, icon: BarChart3, color: 'text-purple-600', path: '/admin/analytics' },
  ];

  const handleResetRevenue = () => {
      if (window.confirm("Reset displayed revenue stats by setting a new baseline date?")) {
          updateConfig({ ...config, revenueBaselineDate: new Date().toISOString() });
      }
  };
  
  const handleDeleteOrder = (orderId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Permanently delete this order?")) {
          deleteOrder(orderId);
      }
  };

  const handleDownloadReport = async () => {
      setIsGeneratingReport(true);
      await generateSalesReport(orders, products, startDate, endDate);
      setIsGeneratingReport(false);
  };

  const handleManualSync = async () => {
      try {
          await syncToSheet();
          alert("System Redeployed Successfully! All changes are now live.");
      } catch (e: any) {
          if (e.message === 'token_expired') {
             alert("Redeploy Failed: Token Expired. Go to App Manager to update.");
          } else {
             alert("Redeploy Failed. Please check internet connection.");
          }
      }
  };

  return (
    <div className="space-y-8 pb-20 pt-8">
      {/* Improved Responsive Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 px-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of Meat Depot performance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button 
                onClick={handleManualSync}
                disabled={isCloudSyncing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#f4d300] text-black px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-md disabled:opacity-50 shrink-0"
            >
                {isCloudSyncing ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                {isCloudSyncing ? 'Deploying...' : 'Redeploy System'}
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-full sm:w-auto">
                {/* Mobile Row 1: Reset + Start Date */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={handleResetRevenue} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                        <RefreshCcw size={14} /> <span className="sm:hidden">Reset</span>
                    </button>
                    <div className="hidden sm:block w-[1px] h-6 bg-gray-200"></div>
                    <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1.5 flex-1 sm:flex-none">
                        <Calendar size={14} className="text-gray-400 mr-2" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-bold text-gray-700 outline-none w-full sm:w-24" />
                    </div>
                </div>
                
                <span className="text-gray-300 hidden sm:block">-</span>
                
                {/* Mobile Row 2: End Date + Report */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1.5 flex-1 sm:flex-none">
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-bold text-gray-700 outline-none w-full sm:w-24" />
                    </div>
                    <button 
                        onClick={handleDownloadReport} 
                        disabled={isGeneratingReport}
                        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                        <Download size={14} /> {isGeneratingReport ? '...' : 'Report'}
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => navigate(stat.path)}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-[#f4d300] hover:scale-[1.02] transition-all text-left group cursor-pointer w-full"
          >
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-black transition-colors">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
            </div>
            <div className={`p-4 rounded-2xl ${stat.color.replace('text-', 'bg-').replace('600', '50')}`}>
                <stat.icon size={24} className={stat.color} />
            </div>
          </button>
        ))}
      </div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button onClick={() => navigate('/pos')} className="p-6 bg-[#f4d300] rounded-3xl text-black shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform text-left flex flex-col justify-between h-40 group">
              <div className="p-3 bg-white/20 w-fit rounded-2xl"><Monitor size={24} /></div>
              <div><h3 className="text-xl font-bold">Open POS</h3><p className="text-xs font-bold opacity-60 uppercase tracking-wider">Launch Cashier Interface</p></div>
          </button>
          
          <button onClick={() => navigate('/admin/production')} className="p-6 bg-red-600 rounded-3xl text-white shadow-lg shadow-red-500/20 hover:scale-105 transition-transform text-left flex flex-col justify-between h-40 group">
              <div className="p-3 bg-white/20 w-fit rounded-2xl"><ChefHat size={24} /></div>
              <div><h3 className="text-xl font-bold">Production</h3><p className="text-xs font-bold opacity-60 uppercase tracking-wider">Raw Materials & Batches</p></div>
          </button>

          <button onClick={() => navigate('/admin/payments')} className="p-6 bg-green-600 rounded-3xl text-white shadow-lg shadow-green-500/20 hover:scale-105 transition-transform text-left flex flex-col justify-between h-40 group">
              <div className="p-3 bg-white/20 w-fit rounded-2xl"><CreditCard size={24} /></div>
              <div><h3 className="text-xl font-bold">Payments</h3><p className="text-xs font-bold opacity-60 uppercase tracking-wider">Gateway & Payment Links</p></div>
          </button>

          <button onClick={() => navigate('/admin/ai')} className="p-6 bg-gray-900 rounded-3xl shadow-xl hover:scale-105 transition-transform text-left flex flex-col justify-between h-40 group border border-gray-800">
              <div className="p-3 bg-gray-800 w-fit rounded-2xl text-[#f4d300]"><Terminal size={24} /></div>
              <div><h3 className="text-xl font-bold text-white">App Manager</h3><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">AI Console & Sync</p></div>
          </button>

          {hasPermission('orders') && (
              <button onClick={() => navigate('/admin/orders')} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:border-[#f4d300] transition-colors text-left flex flex-col justify-between h-40 group">
                  <div className="p-3 bg-gray-50 w-fit rounded-2xl text-gray-600 group-hover:bg-[#f4d300] group-hover:text-black transition-colors"><ShoppingBag size={24} /></div>
                  <div><h3 className="text-xl font-bold text-gray-900">Orders</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">View Active Orders</p></div>
              </button>
          )}
          {hasPermission('products') && (
              <button onClick={() => navigate('/admin/products')} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:border-[#f4d300] transition-colors text-left flex flex-col justify-between h-40 group">
                  <div className="p-3 bg-gray-50 w-fit rounded-2xl text-gray-600 group-hover:bg-[#f4d300] group-hover:text-black transition-colors"><Package size={24} /></div>
                  <div><h3 className="text-xl font-bold text-gray-900">Products</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Manage Inventory</p></div>
              </button>
          )}
          {hasPermission('content') && (
              <button onClick={() => navigate('/admin/home-editor')} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:border-[#f4d300] transition-colors text-left flex flex-col justify-between h-40 group">
                  <div className="p-3 bg-gray-50 w-fit rounded-2xl text-gray-600 group-hover:bg-[#f4d300] group-hover:text-black transition-colors"><LayoutTemplate size={24} /></div>
                  <div><h3 className="text-xl font-bold text-gray-900">Home Editor</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Banners, Order & Content</p></div>
              </button>
          )}
          {hasPermission('content') && (
              <button onClick={() => navigate('/admin/notifications')} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:border-[#f4d300] transition-colors text-left flex flex-col justify-between h-40 group">
                  <div className="p-3 bg-gray-50 w-fit rounded-2xl text-gray-600 group-hover:bg-[#f4d300] group-hover:text-black transition-colors"><Bell size={24} /></div>
                  <div><h3 className="text-xl font-bold text-gray-900">Notifications</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Alerts & Broadcasts</p></div>
              </button>
          )}
      </div>

      {/* Analytics & Monitoring Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => navigate('/admin/live')}
            className="bg-black p-6 rounded-3xl flex items-center justify-between group hover:scale-[1.01] transition-transform"
          >
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-900/30 rounded-2xl text-green-400 animate-pulse"><Activity size={24}/></div>
                  <div>
                      <h3 className="text-xl font-bold text-white">Live Monitor</h3>
                      <p className="text-xs text-gray-500">Real-time session tracking</p>
                  </div>
              </div>
              <div className="bg-white/10 p-2 rounded-full group-hover:bg-[#f4d300] group-hover:text-black transition-colors text-white">
                  <ArrowRight size={20}/>
              </div>
          </button>

          <button 
            onClick={() => navigate('/admin/analytics')}
            className="bg-white border border-gray-100 p-6 rounded-3xl flex items-center justify-between group hover:border-[#f4d300] transition-colors"
          >
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-2xl text-purple-600"><BarChart3 size={24}/></div>
                  <div>
                      <h3 className="text-xl font-bold text-gray-900">Analytics Report</h3>
                      <p className="text-xs text-gray-500">Monthly sales & view stats</p>
                  </div>
              </div>
              <div className="bg-gray-50 p-2 rounded-full group-hover:bg-[#f4d300] group-hover:text-black transition-colors text-gray-400">
                  <ArrowRight size={20}/>
              </div>
          </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm mx-2">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <button onClick={() => navigate('/admin/orders')} className="text-xs font-bold text-[#f4d300] uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              <tr><th className="px-6 py-4 text-left">Order ID</th><th className="px-6 py-4 text-left">Customer</th><th className="px-6 py-4 text-left">Date</th><th className="px-6 py-4 text-left">Total</th><th className="px-6 py-4 text-left">Status</th><th className="px-6 py-4 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredOrders.slice(0, 10).map(order => (
                <tr 
                    key={order.id} 
                    onClick={() => navigate(`/admin/finalize/${order.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-bold text-gray-900 group-hover:text-[#f4d300]">#{order.id.substring(0,6)}</td>
                  <td className="px-6 py-4 text-gray-600">{order.customerName}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">R{order.total.toFixed(2)}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{order.status}</span></td>
                  <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/finalize/${order.id}`); }} className="text-gray-400 hover:text-black p-2"><ArrowRight size={16} /></button>
                          <button onClick={(e) => handleDeleteOrder(order.id, e)} className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full"><Trash2 size={16} /></button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
