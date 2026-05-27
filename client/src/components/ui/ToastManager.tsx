import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast, type Toast } from '@/store/useToast';
import { toastSlide } from '@/lib/animationVariants';

const ICONS = {
  success: <CheckCircle2 className="w-5 h-5 text-green" />,
  error: <XCircle className="w-5 h-5 text-red" />,
  info: <Info className="w-5 h-5 text-blue" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber" />,
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <motion.div
      layout
      variants={toastSlide as any}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex items-start gap-3 w-80 bg-bg-surface border border-border-primary shadow-2xl rounded-lg p-3 pointer-events-auto"
    >
      <div className="flex-shrink-0 mt-0.5">{ICONS[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-bold text-text-primary leading-tight">{toast.title}</h4>
        {toast.message && <p className="text-[12px] text-text-muted mt-1 leading-snug">{toast.message}</p>}
      </div>
      <button 
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastManager() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
