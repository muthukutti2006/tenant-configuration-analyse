import React from "react";
import { cn } from "../../lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ className, children, style }: CardProps) {
  return (
    <div
      className={cn(className)}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, style }: CardProps) {
  return (
    <div
      className={cn(className)}
      style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface-2)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children, style }: CardProps) {
  return (
    <div className={cn(className)} style={{ padding: "16px 20px", ...style }}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, style }: CardProps) {
  return (
    <h3
      className={cn(className)}
      style={{
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--text-primary)",
        margin: 0,
        ...style,
      }}
    >
      {children}
    </h3>
  );
}
