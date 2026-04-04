import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const iconStyles = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value: ToastContextValue = {
    toast: addToast,
    success: (title, desc) => addToast('success', title, desc),
    error: (title, desc) => addToast('error', title, desc),
    warning: (title, desc) => addToast('warning', title, desc),
    info: (title, desc) => addToast('info', title, desc),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[100] flex flex-col gap-2 sm:max-w-xs pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.97 }}
                className={cn(
                  'pointer-events-auto rounded-lg border px-3 py-2.5 shadow-soft-lg flex items-center gap-2.5',
                  styles[t.type],
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', iconStyles[t.type])} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-tight">{t.title}</p>
                  {t.description && <p className="text-[10px] mt-0.5 opacity-70 leading-tight">{t.description}</p>}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
