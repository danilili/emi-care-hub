import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, CalendarDays } from "lucide-react";

const tabs = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/asistencias", label: "Asistencias", icon: ClipboardList },
];

export function NavTabs() {
  const location = useLocation();
  return (
    <nav className="flex gap-1">
      {tabs.map(({ to, label, icon: Icon }) => {
        const active = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "gradient-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
