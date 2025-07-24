
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// --- Card Component ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}
export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-slate-800/40 backdrop-blur-md border border-slate-700 rounded-lg shadow-lg transition-all duration-300 ${className} ${onClick ? 'cursor-pointer hover:border-sky-500 hover:shadow-sky-500/10' : ''}`}
  >
    {children}
  </div>
);

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  isLoading?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', className = '', isLoading = false, ...props }, ref) => {
    const baseClasses = 'px-4 py-2 rounded-md font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
    
    const variantClasses = {
      primary: 'bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-500 shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30',
      secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600 focus:ring-slate-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    return (
      <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} ${className}`} disabled={isLoading} {...props}>
        {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';


// --- Input Component ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 ${className}`}
    {...props}
  />
));
Input.displayName = 'Input';


// --- Modal Component ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, className = '' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-md bg-slate-800/80 backdrop-blur-lg border border-slate-700 rounded-xl shadow-2xl shadow-sky-900/20 ${className}`}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            {title && <h3 className="font-orbitron text-lg text-sky-400">{title}</h3>}
                            <Button variant="secondary" onClick={onClose} className="!p-2 h-auto">
                                <X size={20} />
                            </Button>
                        </div>
                        <div className="p-6">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- Toast Component ---
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const colors = {
    success: 'bg-green-500/80 border-green-400',
    error: 'bg-red-500/80 border-red-400',
    info: 'bg-sky-500/80 border-sky-400',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`relative w-full max-w-sm p-4 rounded-lg shadow-lg text-white backdrop-blur-md border ${colors[toast.type]}`}
    >
      <div className="flex items-start">
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button onClick={() => onDismiss(toast.id)} className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors">
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};

// --- Toaster Container ---
interface ToasterProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}
export const Toaster: React.FC<ToasterProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-2">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
                ))}
            </AnimatePresence>
        </div>
    );
};