import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Truck, RotateCcw, Lock, CreditCard, Heart, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const PoliciesPage = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const policies = [
    {
      icon: <ShieldCheck className="text-brand-gold" size={32} />,
      title: isArabic ? 'ضمان حقوق العميل' : 'Customer Rights Guarantee',
      description: isArabic 
        ? 'نحن نلتزم بحماية حقوقك كاملة كمتسوق. نوفر لك بيئة تسوق آمنة وشفافة تضمن لك وصول المنتج كما هو موصوف تماماً.'
        : 'We are committed to protecting your full rights as a shopper. We provide a secure and transparent shopping environment that guarantees your product arrives exactly as described.',
      points: isArabic 
        ? ['حق الحصول على منتج مطابق للوصف', 'حق المعرفة الكاملة بتفاصيل الشحن', 'حق الخصوصية التامة لبياناتك']
        : ['Right to receive product matching description', 'Right to full shipping details info', 'Right to total data privacy']
    },
    {
      icon: <RotateCcw className="text-brand-gold" size={32} />,
      title: isArabic ? 'سياسة الاسترجاع السهلة' : 'Easy Return Policy',
      description: isArabic
        ? 'رضاك هو أولويتنا. إذا لم يكن المنتج مناسباً، يمكنك إعادته بكل سهولة ضمن الشروط الميسرة.'
        : 'Your satisfaction is our priority. If the product isn\'t right, you can return it easily under our simple conditions.',
      points: isArabic
        ? ['فترة استرجاع تصل إلى 14 يوماً', 'استرداد كامل المبلغ في حال العيوب المصنعية', 'فحص المنتج عند الاستلام (للدفع عند الاستلام)']
        : ['Return period up to 14 days', 'Full refund for manufacturing defects', 'Product inspection upon delivery (for COD)']
    },
    {
      icon: <Lock className="text-brand-gold" size={32} />,
      title: isArabic ? 'الخصوصية والأمان' : 'Privacy & Security',
      description: isArabic
        ? 'نستخدم أحدث تقنيات التشفير لحماية بياناتك. معلوماتك الشخصية والدفع مشفرة ولا يتم مشاركتها مع أي طرف ثالث.'
        : 'We use the latest encryption technologies to protect your data. Your personal and payment info is encrypted and never shared with third parties.',
      points: isArabic
        ? ['تشفير عالي المستوى (SSL)', 'عدم تخزين بيانات البطاقات الائتمانية', 'حماية بيانات التواصل الخاصة بك']
        : ['High-level encryption (SSL)', 'No storage of credit card data', 'Protection of your contact information']
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 sm:px-12 bg-white dark:bg-brand-charcoal overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[120px] -ml-64 -mb-64" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-6"
          >
            <ShieldCheck size={14} />
            {isArabic ? 'حقوقك مكفولة' : 'YOUR RIGHTS ARE SECURED'}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-brand-charcoal dark:text-white leading-[1.1] mb-6"
          >
            {isArabic ? 'سياسات المتجر' : 'Store Policies'}
            <span className="text-brand-gold block mt-2">
              {isArabic ? '& ضمان العميل' : '& Customer Guarantee'}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-brand-charcoal/60 dark:text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            {isArabic 
              ? 'نهدف في Trendifi إلى بناء علاقة ثقة طويلة الأمد مع عملائنا من خلال سياسات واضحة تضع مصلحة العميل أولاً.'
              : 'At Trendifi, we aim to build a long-term trust relationship with our customers through clear policies that put the customer first.'}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {policies.map((policy, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-10 rounded-[2.5rem] bg-gray-50/50 dark:bg-white/5 border border-brand-charcoal/5 dark:border-white/10 hover:border-brand-gold/30 transition-all hover:bg-white dark:hover:bg-white/10 shadow-sm hover:shadow-2xl hover:shadow-brand-gold/5"
            >
              <div className="w-16 h-16 rounded-3xl bg-brand-gold/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                {policy.icon}
              </div>
              <h3 className="text-2xl font-black text-brand-charcoal dark:text-white mb-4 group-hover:text-brand-gold transition-colors">
                {policy.title}
              </h3>
              <p className="text-brand-charcoal/60 dark:text-white/60 text-sm leading-relaxed mb-8">
                {policy.description}
              </p>
              <ul className="space-y-4">
                {policy.points.map((point, pIndex) => (
                  <li key={pIndex} className="flex items-start gap-3 text-[11px] font-bold text-brand-charcoal/80 dark:text-white/80 uppercase tracking-wider">
                    <CheckCircle2 size={14} className="text-brand-gold shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Detailed Terms Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-brand-charcoal text-white p-12 sm:p-20 rounded-[3rem] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 opacity-5">
            <Heart size={200} />
          </div>
          
          <div className="max-w-3xl relative z-10">
            <h2 className="text-3xl font-black mb-12 flex items-center gap-4">
              <span className="w-12 h-1 bg-brand-gold rounded-full" />
              {isArabic ? 'شروط الخدمة التفصيلية' : 'Detailed Terms of Service'}
            </h2>
            
            <div className="space-y-12">
              <section>
                <h4 className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                  <AlertCircle size={14} /> 01. {isArabic ? 'الأهلية والطلب' : 'ELIGIBILITY & ORDERING'}
                </h4>
                <p className="text-white/70 leading-relaxed text-sm">
                  {isArabic 
                    ? 'بإتمامك للطلب، أنت توافق على أن المعلومات المقدمة صحيحة تماماً. نحن نلتزم بتجهيز طلبك خلال 24 ساعة من تأكيده.'
                    : 'By completing an order, you agree that the information provided is entirely accurate. We commit to processing your order within 24 hours of confirmation.'}
                </p>
              </section>

              <section>
                <h4 className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                  <Truck size={14} /> 02. {isArabic ? 'الشحن والتوصيل' : 'SHIPPING & DELIVERY'}
                </h4>
                <p className="text-white/70 leading-relaxed text-sm">
                  {isArabic
                    ? 'سوف نحدثك برقم التتبع فور خروج الشحنة. يتحمل المتجر كامل المسؤولية في حال ضياع الشحنة أو تلفها أثناء النقل.'
                    : 'We will update you with a tracking number as soon as the shipment leaves. The store bears full responsibility if the shipment is lost or damaged during transit.'}
                </p>
              </section>

              <section>
                <h4 className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                  <CreditCard size={14} /> 03. {isArabic ? 'الدفاع عن المدفوعات' : 'PAYMENT PROTECTION'}
                </h4>
                <p className="text-white/70 leading-relaxed text-sm">
                  {isArabic
                    ? 'جميع عمليات الدفع الإلكترونية مؤمنة ولسنا مسؤولين عن أي رسوم بنكية إضافية قد يفرضها مصرفك. في حال فشل العملية، يتم استرداد المبلغ آلياً.'
                    : 'All electronic payments are secured, and we are not responsible for any additional bank fees your bank may charge. If a transaction fails, the amount is automatically refunded.'}
                </p>
              </section>
            </div>

            <div className="mt-16 pt-16 border-t border-white/10 text-center">
              <p className="text-white/40 text-xs italic">
                {isArabic 
                  ? 'آخر تحديث: مايو 2026 • جميع الحقوق محفوظة لـ Trendifi' 
                  : 'Last Updated: May 2026 • All rights reserved to Trendifi'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-brand-charcoal/40 dark:text-white/40 text-sm mb-6">
            {isArabic ? 'هل لديك أي استفسارات حول سياساتنا؟ نحن هنا للمساعدة.' : 'Do you have any questions about our policies? We are here to help.'}
          </p>
          <Link 
            to="/contact"
            className="inline-flex items-center gap-3 px-8 py-4 bg-brand-gold text-brand-charcoal font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-gold/20 tracking-widest uppercase text-xs"
          >
            {isArabic ? 'تواصل معنا الآن' : 'Contact Us Now'}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default PoliciesPage;
