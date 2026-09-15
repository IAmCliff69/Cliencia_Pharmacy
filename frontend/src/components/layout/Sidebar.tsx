import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
interface NavItem {
  label: string;
  to: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Medicines", to: "/medicines" },
  { label: "Categories", to: "/categories" },
  { label: "Suppliers", to: "/suppliers" },
  { label: "Point of Sale", to: "/pos" },
  { label: "Sales History", to: "/sales" },
  { label: "Reports", to: "/reports" },
  { label: "Users", to: "/users", adminOnly: true },
];

function Sidebar() {
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  return (
    <aside className="w-60 shrink-0 bg-surface border-r border-border h-screen sticky top-0 flex flex-col">
      <div className="px-6 py-5 border-b border-border">
        <span className="font-display font-bold text-lg text-primary">
          Cliencia
        </span>
        <p className="text-xs text-ink-muted mt-0.5">Pharmacy Inventory</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium border-l-2 transition-colors ${
                isActive
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent text-ink-muted hover:bg-bg hover:text-ink"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;