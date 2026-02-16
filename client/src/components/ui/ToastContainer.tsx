import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToastStore, ToastType } from "@/store/useToastStore";

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-400" />,
  error: <AlertCircle className="w-5 h-5 text-red-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
  info: <Info className="w-5 h-5 text-blue-400" />,
};

const bgColors: Record<ToastType, string> = {
  success: "bg-green-500/10 border-green-500/30",
  error: "bg-red-500/10 border-red-500/30",
  warning: "bg-yellow-500/10 border-yellow-500/30",
  info: "bg-blue-500/10 border-blue-500/30",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-lg border ${bgColors[toast.type]} animate-slideIn backdrop-blur-sm`}
          role="alert"
        >
          <div className="flex-shrink-0">{icons[toast.type]}</div>
          <p className="text-sm text-white flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-dark-400 hover:text-white transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
