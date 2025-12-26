"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = {
  message: string;
  color?: "success" | "error" | "info" | "warning" | string;
  duration?: number; // in seconds
};

type ToastContextType = {
  showToast: (toast: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastType | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((toast: ToastType) => {
    setToast(toast);
    setVisible(true);
    setTimeout(() => setVisible(false), (toast.duration ?? 5) * 1000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && visible && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white transition-all
            ${toast.color === "success" ? "bg-emerald-600"
              : toast.color === "error" ? "bg-red-700"
              : toast.color === "warning" ? "bg-yellow-600"
              : toast.color === "info" ? "bg-blue-600"
              : toast.color ? toast.color
              : "bg-gray-800"
            }`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};
