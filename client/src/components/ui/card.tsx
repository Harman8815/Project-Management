import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  className,
  title,
  action,
  children,
  ...props
}) => {
  return (
    <div
      className={`rounded-lg bg-white p-4 shadow dark:bg-dark-secondary ${className ?? ""}`}
      {...props}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && (
            <h3 className="text-lg font-semibold dark:text-white">{title}</h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
};
