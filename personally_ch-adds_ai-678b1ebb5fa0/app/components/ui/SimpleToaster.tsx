"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from "react";

type ToastType = {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  color?: "success" | "error" | "info" | "warning" | string;
  duration?: number; // in seconds
  autoClose?: boolean;
};

const ToastContext = createContext<(toast: ToastType) => void>(() => {});

// Helper function to get toast color based on type
function getToastColor(toast: ToastType): string {
  if (toast.color) {
    // If a custom color is provided, use it
    if (typeof toast.color === "string" && toast.color.startsWith("bg-")) {
      return toast.color;
    }

    // Map color names to Tailwind classes
    switch (toast.color) {
      case "success":
        return "bg-emerald-700";
      case "error":
        return "bg-red-700";
      case "warning":
        return "bg-yellow-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  }

  // Fall back to type if color is not specified
  switch (toast.type) {
    case "success":
      return "bg-emerald-700";
    case "error":
      return "bg-red-700";
    case "warning":
      return "bg-yellow-500";
    case "info":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
}

// Main hook (unified naming)
export function useToast() {
  return useContext(ToastContext);
}

// Legacy hook for backward compatibility
export function useSimpleToast() {
  return useContext(ToastContext);
}

export function SimpleToasterProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastType | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((toast: ToastType) => {
    try {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToast(toast);
      timeoutRef.current = setTimeout(
        () => {
          setToast(null);
          timeoutRef.current = null;
        },
        toast.duration ? toast.duration * 1000 : 4000
      );
    } catch (error) {
      console.error("Error showing toast:", error);
    }
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white transition-all ${getToastColor(
            toast
          )}`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
