import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, getDocs } from 'firebase/firestore';
import { Order, Product } from '../types';
import { useStore } from '../StoreContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, Package, 
  Clock, CheckCircle, Truck, AlertCircle, ArrowUpRight 
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const { products } = useStore();
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setRecentOrders(ordersData.slice(0, 5));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
      </div>
    );
  }

  // Calculate Stats
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  
  // Data for Charts
  const ordersByStatus = [
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#f59e0b' },
    { name: 'Processing', value: orders.filter(o => o.status === 'processing').length, color: '#3b82f6' },
    { name: 'Shipped', value: orders.filter(o => o.status === 'shipped').length, color: '#6366f1' },
    { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: '#22c55e' },
  ];

  // Group revenue by date (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const revenueData = last7Days.map(date => {
    const dayTotal = orders
      .filter(o => {
        const orderDate = (o.createdAt as any)?.toDate?.() || new Date(o.createdAt);
        return orderDate.toISOString().split('T')[0] === date;
      })
      .reduce((acc, o) => acc + o.total, 0);
    
    return {
      date: date.split('-').slice(1).join('/'),
      revenue: dayTotal
    };
  });

  return (
    <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 bg-[#0A0A0B] text-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-white">
            {i18n.language === 'ar' ? 'لوحة التحكم' : 'Sales Dashboard'}
          </h1>
          <p className="text-white/50 font-medium">
            Welcome back, {user?.displayName || 'Admin'}
          </p>
        </div>
        <div className="bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-brand-gold/20">
          <TrendingUp size={14} />
          {i18n.language === 'ar' ? 'البث المباشر نشط' : 'Live Analytics'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: <DollarSign />, color: 'bg-green-500' },
          { label: 'Total Orders', value: totalOrders, icon: <ShoppingBag />, color: 'bg-[#4F46E5]' },
          { label: 'Products', value: products.length, icon: <Package />, color: 'bg-brand-gold' },
          { label: 'Pending', value: pendingOrders, icon: <Clock />, color: 'bg-amber-500' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#1A1A1A] p-6 rounded-[2.5rem] border border-white/10 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg`}>
                {stat.icon}
              </div>
              <ArrowUpRight className="text-white/20 group-hover:text-brand-gold transition-colors" size={20} />
            </div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-white mt-1 tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-[#1A1A1A] p-8 rounded-[3rem] border border-white/10 shadow-sm"
        >
          <h3 className="text-xl font-bold mb-8 text-white">Revenue (Last 7 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={4} dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-[#1A1A1A] p-8 rounded-[3rem] border border-white/10 shadow-sm"
        >
          <h3 className="text-xl font-bold mb-8 text-white">Orders Status</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {ordersByStatus.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#1A1A1A] rounded-[3rem] border border-white/10 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Recent Orders</h3>
          <button className="text-xs font-black uppercase tracking-widest text-brand-gold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white/40">Order ID</th>
                <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white/40">Customer</th>
                <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white/40">Total</th>
                <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white/40">Status</th>
                <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white/40">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors border-b border-white/10 last:border-0 text-white">
                  <td className="px-8 py-4">
                    <span className="text-xs font-bold text-white/40">#{order.id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm font-bold text-white">{order.shippingAddress.fullName}</p>
                    <p className="text-[10px] text-white/40">{order.shippingAddress.city}</p>
                  </td>
                  <td className="px-8 py-4 font-mono font-bold text-brand-gold">${order.total.toFixed(2)}</td>
                  <td className="px-8 py-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      order.status === 'delivered' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      order.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-xs font-medium text-white/60">
                    {new Date((order.createdAt as any)?.seconds * 1000 || order.createdAt).toLocaleDateString()}
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
