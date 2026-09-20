export const colors = {
  white: "#ffffff",
  black: "#000000",
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    500: "#6b7280",
    700: "#374151",
    800: "#1f2937",
  },
  blue: {
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
  },
  green: {
    100: "#dcfce8",
    200: "#bbf7d0",
    700: "#15803d",
    800: "#166534",
  },
  red: {
    200: "#fecaca",
    700: "#b91c2c",
  },
  yellow: {
    200: "#fef3c7",
    700: "#ca8a04",
    800: "#a16227",
  },
  status: {
    urgent: "#ef4444",
    high: "#f59e0b",
    medium: "#3b82f6",
    low: "#22c55e",
    backlog: "#9ca3af",
  },
  dark: {
    bg: "#101214",
    secondary: "#1d1f21",
    tertiary: "#3b3d40",
    stroke: "#2d3135",
    text: "#a3a3a3",
  },
} as const;

export const typography = {
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
  },
  fontWeights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
} as const;

export const borderRadius = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
} as const;

export const statusColors: Record<string, { bg: string; text: string }> = {
  "To Do": { bg: "bg-blue-100", text: "text-blue-700" },
  "Work In Progress": { bg: "bg-green-100", text: "text-green-800" },
  "Under Review": { bg: "bg-yellow-100", text: "text-yellow-800" },
  Completed: { bg: "bg-gray-100", text: "text-gray-800" },
};

export const priorityColors: Record<string, { bg: string; text: string }> = {
  Urgent: { bg: "bg-red-200", text: "text-red-700" },
  High: { bg: "bg-yellow-200", text: "text-yellow-700" },
  Medium: { bg: "bg-green-200", text: "text-green-700" },
  Low: { bg: "bg-blue-200", text: "text-blue-700" },
  Backlog: { bg: "bg-gray-200", text: "text-gray-700" },
};

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type BorderRadiusToken = keyof typeof borderRadius;
