
import React, { useState, useMemo } from 'react';
import { useApp } from '../../store';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft, Calendar, Eye, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';

const AnalyticsReport: React.FC = () => {
  const { orders, products, config } = useApp();
  const navigate = useNavigate();
  
  // Default to current month
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const analyticsData = useMemo(() => {
      const [year, month] = selectedMonth.split('-');
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      // Filter orders for month
      const monthOrders = orders.filter(o => {
          const d = new Date(o.createdAt);
          return d >= start && d <= end && o.status !== 'Quote Requested';
      });

      // Aggregate Product Sales
      const productStats: Record<string, { name: string, sold: number, revenue: number, views: number }> = {};

      // Initialize with all products (for views even if 0 sales)
      products.forEach(p => {
          productStats[p.id] = {
              name: p.name,
              sold: 0,
              revenue: 0,
              views: p.viewCount || 0 // View count is cumulative (lifetime), but still useful for relative popularity
          };
      });

      monthOrders.forEach(order => {
          order.items.forEach(item => {
              if (productStats[item.productId]) {
                  productStats[item.productId].sold += item.quantity;
                  // Handle KG vs Unit revenue logic approx
                  const itemTotal = item.product.unit === 'kg' && item.weight 
                    ? (item.product.price / 1000) * item.weight * item.quantity
                    : item.product.price * item.quantity;
                  productStats[item.productId].revenue += itemTotal;
              }
          });
      });

      const statsArray = Object.values(productStats);
      
      const topSellers = [...statsArray].sort((a, b) => b.sold - a.sold).slice(0, 10);
      const mostViewed = [...statsArray].sort((a, b) => b.views - a.views).slice(0, 10);
      
      const totalRevenue = statsArray.reduce((acc, curr) => acc + curr.revenue, 0);
      const totalUnits = statsArray.reduce((acc, curr) => acc + curr.sold, 0);

      return { topSellers, mostViewed, totalRevenue, totalUnits };
  }, [selectedMonth, orders, products]);

  return (
    <div className="min-h-screen bg-gray-50 -mx-4 px-4 pb-20 space-y-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin')} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors"><ArrowLeft size={20}/></button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Product Analytics</h1>
                    <p className="text-gray-500 text-sm">Monthly performance report</p>
                </div>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                <Calendar size={20} className="text-gray-400 ml-2" />
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="outline-none text-gray-700 font-bold bg-transparent"
                />
            </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-black text-[#f4d300] p-6 rounded-3xl shadow-lg">
                <div className="flex items-center gap-3 mb-2 opacity-80">
                    <DollarSign size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest text-white">Est. Revenue</span>
                </div>
                <p className="text-3xl font-bold">R{analyticsData.totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
            </div>
            <div className="bg-white text-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2 text-gray-400">
                    <ShoppingCart size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Units Sold</span>
                </div>
                <p className="text-3xl font-bold">{analyticsData.totalUnits}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Sellers */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="text-[#f4d300]" /> Top Selling Products</h2>
                <div className="space-y-6">
                    {analyticsData.topSellers.map((item, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-gray-700">{index + 1}. {item.name}</span>
                                <span className="text-gray-900">{item.sold} sold</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#f4d300] rounded-full" 
                                    style={{ width: `${(item.sold / (analyticsData.topSellers[0]?.sold || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {analyticsData.topSellers.length === 0 && <p className="text-gray-400 text-center py-10">No sales data for this month.</p>}
                </div>
            </div>

            {/* Most Viewed */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Eye className="text-blue-500" /> Most Viewed Items</h2>
                <div className="space-y-6">
                    {analyticsData.mostViewed.map((item, index) => {
                        const conversionRate = item.views > 0 ? ((item.sold / item.views) * 100).toFixed(1) : '0.0';
                        return (
                            <div key={index} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-gray-700">{index + 1}. {item.name}</span>
                                    <span className="text-blue-600">{item.views} views</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 rounded-full" 
                                        style={{ width: `${(item.views / (analyticsData.mostViewed[0]?.views || 1)) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="text-[10px] text-right text-gray-400 font-bold uppercase tracking-wider">
                                    Conv. Rate: {conversionRate}%
                                </div>
                            </div>
                        );
                    })}
                    {analyticsData.mostViewed.length === 0 && <p className="text-gray-400 text-center py-10">No view data available.</p>}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AnalyticsReport;
