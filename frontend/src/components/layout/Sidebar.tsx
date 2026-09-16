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
    <aside className={`fixed inset-y-0 left-0 z-40 w-[clamp(6rem,8vw,7.5rem)] bg-bg text-ink transition-transform md:relative md:z-auto md:translate-x-0 md:sticky ${isOpen ? "translate-x-0" : "-translate-x-full"} flex h-screen shrink-0 flex-col`}>
      <div className="flex flex-col items-center gap-0.5 px-2 py-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15">
          <img src={logo} alt="Cliencia Pharmacy" className="h-10 w-10 object-contain" />
        </div>
        <span className="font-display font-bold text-sm tracking-tight">Cliencia</span>
        <span className="text-[9px] text-ink-muted text-center leading-tight">Pharmacy Inventory</span>
      </div>

      <nav aria-label="Main navigation" className="flex flex-1 flex-col justify-start gap-1 px-2 py-2 pb-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              `flex h-11 shrink-0 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
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