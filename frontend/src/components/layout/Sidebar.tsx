import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import type { ComponentType } from "react";
import {
  BarChart3,
  Clock3,
  House,
  Moon,
  Pill,
  Receipt,
  ShoppingCart,
  Sun,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/Logo.svg";
interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: House },
  { label: "Medicines", to: "/medicines", icon: Pill },
  { label: "Categories", to: "/categories", icon: Tags },
  { label: "Suppliers", to: "/suppliers", icon: Truck },
  { label: "Point of Sale", to: "/pos", icon: ShoppingCart },
  { label: "Sales History", to: "/sales", icon: Receipt },
  { label: "My Shifts", to: "/shifts", icon: Clock3 },
  { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "Users", to: "/users", icon: Users, adminOnly: true },
];

function Sidebar() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  return (
    <aside className="relative w-24 shrink-0 bg-[#123f52] text-white h-screen sticky top-0 flex flex-col">
      <div className="flex flex-col items-center gap-1 px-2 py-5 border-b border-white/15">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
          <img src={logo} alt="Cliencia Pharmacy" className="h-11 w-11 object-contain" />
        </div>
        <span className="font-display font-bold text-sm tracking-tight">Cliencia</span>
        <span className="text-[9px] text-[#bceefa] text-center leading-tight">Pharmacy Inventory</span>
      </div>

      <nav aria-label="Main navigation" className="flex-1 px-2 py-4 pb-16 space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              `flex items-center justify-center h-11 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#da275a] text-white shadow-sm"
                  : "text-[#bceefa] hover:bg-[#2fc9f4]/20 hover:text-white"
              }`
            }
          >
            <item.icon size={25} strokeWidth={1.8} aria-hidden="true" />
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 flex justify-center border-t border-white/15 bg-[#123f52] px-2 py-3">
        <button
          type="button"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={isDark}
          onClick={() => setIsDark((current) => !current)}
          className={`grid h-9 w-9 place-items-center rounded-lg text-[#bceefa] ring-1 ring-white/20 transition-colors hover:bg-white/10 hover:text-white ${
            isDark ? "bg-[#da275a]/25" : "bg-white/5"
          }`}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;