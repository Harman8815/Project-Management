import { Toaster, toast as hotToast, ToastOptions } from "react-hot-toast";

const toastOptions: ToastOptions = {
  position: "top-right",
  duration: 4000,
  style: {
    background: "var(--toast-bg, #ffffff)",
    color: "var(--toast-color, #1f2937)",
    border: "1px solid var(--toast-border, #e5e7eb)",
  },
  className: "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
  iconTheme: {
    primary: "#3b82f6",
    secondary: "#ffffff",
  },
};

export const toast = {
  error: (message: string, options?: ToastOptions) => hotToast.error(message, { ...toastOptions, ...options }),
  success: (message: string, options?: ToastOptions) => hotToast.success(message, { ...toastOptions, ...options }),
  loading: (message: string, options?: ToastOptions) => hotToast.loading(message, { ...toastOptions, ...options }),
  info: (message: string, options?: ToastOptions) => hotToast(message, { ...toastOptions, ...options }),
  promise: hotToast.promise,
};

export function ToasterProvider() {
  return <Toaster {...toastOptions} />;
}
