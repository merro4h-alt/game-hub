import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Smartphone, Loader2, Clipboard, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useStore } from '../StoreContext';
import { useAlert } from '../contexts/AlertContext';
import { DEFAULT_STORE_WHATSAPP_LOCAL } from '../utils/whatsapp';

interface WaStatusResponse {
  configured: boolean;
  provider: string | null;
  direct?: {
    status: string;
    connected: boolean;
    connectedPhone: string | null;
    qrDataUrl: string | null;
    pairingCode: string | null;
    pairingPhone: string | null;
    pendingOrdersCount: number;
    lastError: string | null;
  };
}

export const AdminWhatsAppBanner: React.FC = () => {
  const { isAdmin } = useAuth();
  const { settings } = useStore();
  const { showAlert } = useAlert();
  const { i18n } = useTranslation();
  const location = useLocation();
  const isAr = i18n.language.startsWith('ar');

  const [statusData, setStatusData] = useState<WaStatusResponse | null>(null);
  const [isLinking, setIsLinking] = useState<'code' | 'qr' | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (!res.ok) return;
      const data: WaStatusResponse = await res.json();
      setStatusData((prev) => {
        if (prev && !prev.configured && data.configured) {
          showAlert(
            isAr
              ? '✅ تم تفعيل ربط واتساب المتجر بنجاح! ستصلك جميع الطلبات الجديدة والرسائل المحفوظة تلقائياً الآن.'
              : '✅ Store WhatsApp linked! All queued and new orders will arrive automatically.',
            'success'
          );
        }
        return data;
      });
    } catch {
      // ignore network error
    }
  }, [isAr, showAlert]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchStatus();
  }, [isAdmin, location.pathname, fetchStatus]);

  useEffect(() => {
    if (!isAdmin) return;
    const st = statusData?.direct?.status;
    if (st !== 'pairing_code_ready' && st !== 'qr_ready' && st !== 'connecting') return;
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, [isAdmin, statusData?.direct?.status, fetchStatus]);

  // Strictly visible ONLY to authenticated store admins when WhatsApp is disconnected (outside /admin which has its own panel)
  if (!isAdmin || dismissed || location.pathname.startsWith('/admin')) {
    return null;
  }

  if (!statusData || statusData.configured) {
    return null;
  }

  const handleLinkCode = async () => {
    setIsLinking('code');
    try {
      const res = await fetch('/api/whatsapp/connect-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber: settings.whatsappNumber || DEFAULT_STORE_WHATSAPP_LOCAL,
        }),
      });
      await res.json();
      await fetchStatus();
    } catch {
      showAlert(
        isAr ? 'تعذر إنشاء رمز الربط حالياً، يرجى المحاولة مجدداً.' : 'Could not generate pairing code.',
        'error'
      );
    } finally {
      setIsLinking(null);
    }
  };

  const handleLinkQr = async () => {
    setIsLinking('qr');
    try {
      await fetch('/api/whatsapp/connect-qr', { method: 'POST' });
      await fetchStatus();
    } catch {
      showAlert(
        isAr ? 'تعذر إنشاء باركود QR حالياً، يرجى المحاولة مجدداً.' : 'Could not generate QR code.',
        'error'
      );
    } finally {
      setIsLinking(null);
    }
  };

  const handleCopyCode = (code: string) => {
    const clean = code.replace(/[^A-Z0-9]/gi, '');
    navigator.clipboard?.writeText(clean);
    showAlert(isAr ? `تم نسخ الرمز: ${clean}` : `Code copied: ${clean}`, 'success');
  };

  const pendingCount = statusData.direct?.pendingOrdersCount || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-[#111614] text-white border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <MessageCircle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isAr ? 'تنبيه خاص بالمسؤول فقط' : 'Admin Only'}
                </span>
                <h4 className="text-sm font-bold text-white">
                  {isAr
                    ? 'إشعارات الطلبات على الواتساب متوقفة مؤقتاً وتحتاج إعادة ربط الجهاز'
                    : 'WhatsApp order notifications need device re-linking'}
                </h4>
              </div>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                {isAr
                  ? `انقطعت جلسة الواتساب السابقة بعد إعادة تشغيل الخادم.${pendingCount > 0 ? ` يوجد (${pendingCount}) إشعار طلب/رسالة محفوظة بالانتظار ستصلك تلقائياً فور الربط.` : ''} اربط رقمك الآن خلال ثوانٍ وسيتم حفظ الجلسة بشكل دائم.`
                  : `Your previous WhatsApp session disconnected.${pendingCount > 0 ? ` (${pendingCount}) queued notification(s) will be delivered immediately once linked.` : ''}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLinkCode}
              disabled={isLinking !== null}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isLinking === 'code' ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
              <span>{isAr ? 'ربط برمز الهاتف (8 خانات)' : 'Link via 8-Digit Code'}</span>
            </button>
            <button
              type="button"
              onClick={handleLinkQr}
              disabled={isLinking !== null}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
            >
              {isLinking === 'qr' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>{isAr ? 'مسح باركود QR' : 'Scan QR Code'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Close"
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {statusData.direct?.pairingCode && (
          <div className="bg-black/50 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-white/80 space-y-1">
              <p className="font-bold text-emerald-400">
                {isAr ? 'أدخل هذا الرمز الآن في تطبيق واتساب على هاتفك:' : 'Enter this code in WhatsApp on your phone:'}
              </p>
              <p className="text-white/70">
                {isAr
                  ? 'افتح واتساب ← الأجهزة المرتبطة ← ربط جهاز ← الربط برقم الهاتف بدلاً من ذلك.'
                  : 'Open WhatsApp -> Linked Devices -> Link a Device -> Link with phone number instead.'}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                dir="ltr"
                className="px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/50 font-mono text-2xl font-black tracking-[0.2em] text-emerald-300 select-all"
              >
                {statusData.direct.pairingCode}
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(statusData.direct!.pairingCode!)}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Clipboard size={14} />
                <span>{isAr ? 'نسخ' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {statusData.direct?.qrDataUrl && (
          <div className="bg-black/50 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5">
            <img
              src={statusData.direct.qrDataUrl}
              alt="WhatsApp QR"
              className="w-40 h-40 rounded-xl bg-white p-2 shrink-0"
            />
            <div className="text-xs text-white/80 space-y-1.5">
              <p className="font-bold text-emerald-400">
                {isAr ? 'امسح هذا الباركود من واتساب على هاتفك:' : 'Scan this QR code from WhatsApp:'}
              </p>
              <p className="text-white/70 leading-relaxed">
                {isAr
                  ? 'افتح تطبيق واتساب ← الإعدادات / القائمة ← الأجهزة المرتبطة ← ربط جهاز ← وجّه الكاميرا نحو الباركود.'
                  : 'Open WhatsApp -> Linked Devices -> Link a Device -> Scan QR code.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
