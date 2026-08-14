import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, X, Trophy } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'achievement' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-[#161618]/95 border-emerald-500/30 text-emerald-300 shadow-2xl',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
        };
      case 'achievement':
        return {
          bg: 'bg-[#161618]/95 border-blue-500/40 text-blue-300 shadow-2xl ring-1 ring-blue-500/20',
          icon: <Trophy className="w-5 h-5 text-blue-400 shrink-0 animate-bounce" />,
        };
      case 'error':
        return {
          bg: 'bg-[#161618]/95 border-rose-500/30 text-rose-300 shadow-2xl',
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
        };
      default:
        return {
          bg: 'bg-[#161618]/95 border-blue-500/30 text-blue-300 shadow-2xl',
          icon: <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />,
        };
    }
  };

  const style = getStyles();

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl transition-all transform animate-in slide-in-from-bottom-5 duration-300 ${style.bg}`}
    >
      <div className="mt-0.5">{style.icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-gray-100">{toast.title}</h4>
        {toast.message && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{toast.message}</p>}
      </div>
      <button
        onClick={onRemove}
        className="text-gray-500 hover:text-gray-300 p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
