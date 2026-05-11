import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { Order } from '../types';
import { Package, ChevronRight, Clock, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrdersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id
        };
      }) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      import('../lib/firebase').then(({ handleFirestoreError, OperationType }) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }).catch(() => {
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="text-amber-500" size={18} />;
      case 'processing': return <Clock className="text-blue-500" size={18} />;
      case 'shipped': return <Truck className="text-indigo-500" size={18} />;
      case 'delivered': return <CheckCircle className="text-green-500" size={18} />;
      case 'cancelled': return <XCircle className="text-red-500" size={18} />;
      default: return <Package size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'shipped': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'delivered': return 'bg-green-50 text-green-600 border-green-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand-cream border-t-brand-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto bg-[#0A0A0B] text-white min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          {t('orders.history')}
        </h1>
        <p className="text-white/60">
          {t('orders.historySubtitle')}
        </p>
      </motion.div>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-white/5 rounded-3xl border border-white/10"
        >
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Package className="text-white/20" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {t('orders.noOrdersTitle')}
          </h2>
          <p className="text-white/60 mb-8">
            {t('orders.noOrdersDesc')}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-brand-gold text-white px-8 py-3 rounded-xl font-bold hover:bg-white hover:text-black transition-all"
          >
            {t('orders.startShopping')}
            <ChevronRight className={i18n.language === 'ar' ? 'rotate-180' : ''} size={18} />
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#1A1A1A] rounded-2xl border border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div 
                className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${getStatusColor(order.status).split(' ')[0]}`}>
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                        {t(`order.status.${order.status}`)}
                      </span>
                    </div>
                    <p className="font-bold text-white">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-white">
                  <div className="text-right rtl:text-left hidden sm:block">
                    <p className="text-xs text-white/40 mb-1">
                      {t('common.total')}
                    </p>
                    <p className="font-bold text-brand-gold">${order.total.toFixed(2)}</p>
                  </div>
                  {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="px-5 pb-5 pt-2 border-t border-white/10">
                  <div className="space-y-4 mb-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-white/5" />
                        <div className="flex-grow">
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          <p className="text-xs text-white/60 mb-1">
                            {item.selectedSize} | {item.selectedColor}
                          </p>
                          <div className="flex justify-between items-center text-white">
                            <span className="text-xs font-medium">{item.quantity} x ${item.price}</span>
                            <span className="font-bold text-sm">${(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded-xl">
                    <div>
                      <h5 className="text-xs font-bold text-white/40 uppercase mb-2">
                        {t('checkout.shippingInfo')}
                      </h5>
                      <p className="text-sm font-medium text-white">{order.shippingAddress.fullName}</p>
                      <p className="text-xs text-white/70 leading-relaxed">
                        {order.shippingAddress.address}<br />
                        {order.shippingAddress.city}, {order.shippingAddress.country}<br />
                        {order.shippingAddress.zipCode}
                      </p>
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white/40 uppercase mb-2">
                          {t('orders.tracking')}
                        </h5>
                        {order.trackingId ? (
                          <Link 
                            to={`/track/${order.trackingId}`}
                            className="text-brand-gold text-sm font-bold hover:underline"
                          >
                            {order.trackingId}
                          </Link>
                        ) : (
                          <p className="text-xs text-white/60">
                            {t('orders.notProvided')}
                          </p>
                        ) }
                      </div>
                      <div className="pt-4 border-t border-white/10 sm:hidden">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-white/40">{t('common.total')}</span>
                          <span className="font-bold text-brand-gold">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
