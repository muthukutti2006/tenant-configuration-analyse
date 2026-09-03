import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ScanSearch,
  AlertTriangle,
  FileText,
  Database,
  BookOpen,
  GitCompare,
} from "lucide-react";
import { cn } from "../../lib/utils";

const links = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/analyze", label: "Analyze Config", icon: ScanSearch },
  { to: "/conflicts", label: "All Conflicts", icon: AlertTriangle },
  { to: "/configurations", label: "Test Configurations", icon: Database },
  { to: "/rules", label: "Detection Rules", icon: FileText },
  { to: "/approach", label: "Technical Approach", icon: GitCompare },
  { to: "/about", label: "Documentation", icon: BookOpen },
];

export function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-indigo-500 flex items-center justify-center">
            <ScanSearch size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">TCA</p>
            <p className="text-xs text-slate-400 leading-tight">Config Analyser</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">Review-1 Prototype</p>
        <p className="text-xs text-slate-600">v1.0.0-review1</p>
      </div>
    </aside>
  );
}
