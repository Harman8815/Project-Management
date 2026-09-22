import React from "react";
import { BorderRadiusToken, SpacingToken } from "@/styles/tokens";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  secondary:
    "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
  outline:
    "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
  ghost:
    "text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
  success:
    "bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2 py-1 text-sm",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:text-gray-200 ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ""}`}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
