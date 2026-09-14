import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-base)",
      }}
    >
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <TopNav onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main
          style={{
            flex: 1,
            overflow: "auto",
            overflowX: "hidden",
            padding: "24px 20px",
          }}
        >
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
