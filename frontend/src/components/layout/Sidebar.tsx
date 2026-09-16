import { NavLink } from "react-router-dom";
import type { ComponentType } from "react";
import {
  BarChart3,
  Clock3,
  House,
  Pill,
  Receipt,
  ShoppingCart,
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

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role.trim().toLowerCase() === "admin"
  );

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-24 bg-bg text-ink transition-transform md:relative md:z-auto md:translate-x-0 md:sticky ${isOpen ? "translate-x-0" : "-translate-x-full"} h-screen shrink-0 flex flex-col`}>
      <div className="flex flex-col items-center gap-1 px-2 py-5">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15">
          <img src={logo} alt="Cliencia Pharmacy" className="h-11 w-11 object-contain" />
        </div>
        <span className="font-display font-bold text-sm tracking-tight">Cliencia</span>
        <span className="text-[9px] text-ink-muted text-center leading-tight">Pharmacy Inventory</span>
      </div>

      <nav aria-label="Main navigation" className="flex-1 px-2 py-4 pb-16 space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              `flex items-center justify-center h-11 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-[var(--color-brand)] shadow-sm"
                  : "text-ink-muted hover:bg-primary/15 hover:text-primary"
              }`
            }
          >
            <item.icon size={25} strokeWidth={1.8} aria-hidden="true" />
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}

export default Sidebar;