import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface AlertContextType {
  showAlert: (title: string, message: string, onClose?: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | undefined>();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = (newTitle: string, newMessage: string, onClose?: () => void) => {
    setTitle(newTitle);
    setMessage(newMessage);
    setOnCloseCallback(() => typeof onClose === 'function' ? onClose : undefined);
    setIsVisible(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      hideAlert(typeof onClose === 'function' ? onClose : undefined);
    }, 4000);
  };

  const hideAlert = (callback?: () => void) => {
    setIsVisible(false);
    if (typeof callback === 'function') {
      callback();
    }
  };

  const isError = title.toLowerCase().includes('error') || title.toLowerCase().includes('fail') || title.toLowerCase().includes('invalid') || title.toLowerCase().includes('missing');

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {isVisible && (
        <div className="fixed top-6 right-6 z-[9999] max-w-md w-full animate-in fade-in slide-in-from-top-5 duration-200 px-4 sm:px-0">
          <div
            onClick={() => hideAlert(onCloseCallback)}
            className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 cursor-pointer hover:border-white/20 transition-all"
          >
            <div className={`p-2 rounded-xl shrink-0 ${isError ? 'bg-red-500/15 text-red-400' : 'bg-[#38BDF8]/15 text-[#38BDF8]'}`}>
              {isError ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[#F8FAFC] font-bold text-sm capitalize">{title}</h4>
              <p className="text-[#94A3B8] text-sm mt-0.5 leading-relaxed break-words">{message}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                hideAlert(onCloseCallback);
              }}
              className="text-[#64748B] hover:text-[#F8FAFC] p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useCustomAlert must be used within an AlertProvider');
  }
  return context;
}
