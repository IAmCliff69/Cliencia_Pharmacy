import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLowStockMedicines, getExpiringMedicines, getExpiredMedicines } from "../api/medicines";
import { getSalesSummary } from "../api/reports";
import pharmacyImage from "../assets/Pharmacy Task Automation_ Daily Operations to Patient Care.jpeg";

// -----------------------------
// Stat card
// -----------------------------
function StatCard({
  label,
  value,
  sub,
  color,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: "teal" | "yellow" | "red" | "green";
  onClick?: () => void;
}) {
  const colors = {
    teal: "border-l-primary bg-primary/5",
    yellow: "border-l-yellow-400 bg-yellow-50",
    red: "border-l-red-500 bg-red-50",
    green: "border-l-green-500 bg-green-50",
  };
  const valueColors = {
    teal: "text-primary",
    yellow: "text-yellow-700",
    red: "text-red-600",
    green: "text-green-700",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-border border-l-4 rounded-lg p-5 ${colors[color]} ${
        onClick ? "cursor-pointer hover:shadow-sm transition-shadow" : ""
      }`}
    >
      <p className="text-sm text-ink-muted mb-1">{label}</p>
      <p className={`font-display font-bold text-3xl ${valueColors[color]}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-ink-muted mt-1">{sub}</p>}
    </div>
  );
}

// -----------------------------
// Medicine alert row
// -----------------------------
function MedicineAlertRow({
  name,
  detail,
  badge,
  badgeColor,
}: {
  name: string;
  detail: string;
  badge: string;
  badgeColor: "yellow" | "red";
}) {
  const badgeStyles = {
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    red: "bg-red-100 text-red-600 border-red-200",
  };
  return (
    <li className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-bg transition-colors">
      <div>
        <p className="text-sm font-medium text-ink">{name}</p>
        <p className="text-xs text-ink-muted">{detail}</p>
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeStyles[badgeColor]}`}
      >
        {badge}
      </span>
    </li>
  );
}

// -----------------------------
// Dashboard
// -----------------------------
function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const userInitials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "CP";
  const welcomeDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const { data: lowStock = [], isLoading: loadingLow } = useQuery({
    queryKey: ["medicines-low-stock"],
    queryFn: getLowStockMedicines,
  });

  const { data: expiring = [], isLoading: loadingExpiring } = useQuery({
    queryKey: ["medicines-expiring"],
    queryFn: () => getExpiringMedicines(30),
  });

  const { data: expired = [], isLoading: loadingExpired } = useQuery({
    queryKey: ["medicines-expired"],
    queryFn: getExpiredMedicines,
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["reports", today, today],
    queryFn: () =>
      getSalesSummary({ start_date: today, end_date: today }),
  });

  const isLoading =
    loadingLow || loadingExpiring || loadingExpired || loadingSummary;

  return (
    <div>
      {/* Welcome hero */}
      <div className="relative mb-6 min-h-[178px] overflow-hidden rounded-2xl bg-[#123f52] shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${user?.profile_image_url ?? pharmacyImage}")`,
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#123f52] via-[#123f52]/90 to-[#123f52]/20" />
        <div className="relative z-10 flex min-h-[178px] items-center justify-between px-7 py-6">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8ae4fa]">
              {welcomeDate}
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              Welcome back{user ? `, ${user.first_name}` : ""}!
            </h1>
            <p className="mt-2 text-sm text-[#c6e2dc]">
              Here&apos;s what&apos;s happening in your pharmacy today.
            </p>
          </div>
          <div className="hidden h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-white/40 bg-[#da275a] text-lg font-bold text-white shadow-lg sm:grid">
            {user?.profile_image_url ? (
              <img src={user.profile_image_url} alt="Your profile" className="h-full w-full rounded-full object-cover" />
            ) : (
              userInitials
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-ink-muted text-sm">
          Loading dashboard...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Today's sales"
              value={summary?.total_sales ?? 0}
              sub="transactions today"
              color="teal"
              onClick={() => navigate("/sales")}
            />
            <StatCard
              label="Today's revenue"
              value={`GH₵${(summary?.total_revenue ?? 0).toFixed(2)}`}
              sub="voided sales excluded"
              color="green"
              onClick={() => navigate("/reports")}
            />
            <StatCard
              label="Low stock"
              value={lowStock.length}
              sub={lowStock.length === 1 ? "medicine" : "medicines"}
              color="yellow"
              onClick={() => navigate("/medicines")}
            />
            <StatCard
              label="Expired"
              value={expired.length}
              sub={expired.length === 1 ? "medicine expired" : "medicines expired"}
              color="red"
              onClick={() => navigate("/medicines")}
            />
          </div>

          {/* Alerts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low stock alerts */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-semibold text-ink text-sm">
                  Low stock alerts
                </h2>
                <span className="text-xs text-ink-muted">
                  {lowStock.length} medicine{lowStock.length !== 1 ? "s" : ""}
                </span>
              </div>
              {lowStock.length === 0 ? (
                <div className="p-6 text-center text-ink-muted text-sm">
                  All medicines are well stocked ✓
                </div>
              ) : (
                <ul>
                  {lowStock.slice(0, 6).map((med) => (
                    <MedicineAlertRow
                      key={med.medicine_id}
                      name={med.medicine_name}
                      detail={`Stock: ${med.inventory?.quantity_available ?? 0} / Min: ${med.inventory?.minimum_stock_level ?? 10}`}
                      badge="Low stock"
                      badgeColor="yellow"
                    />
                  ))}
                  {lowStock.length > 6 && (
                    <li
                      className="px-4 py-3 text-xs text-primary hover:underline cursor-pointer"
                      onClick={() => navigate("/medicines")}
                    >
                      +{lowStock.length - 6} more — view all in Medicines
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Expiring / Expired alerts */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-semibold text-ink text-sm">
                  Expiry alerts
                </h2>
                <span className="text-xs text-ink-muted">
                  {expired.length} expired · {expiring.length} expiring soon
                </span>
              </div>
              {expired.length === 0 && expiring.length === 0 ? (
                <div className="p-6 text-center text-ink-muted text-sm">
                  No expiry issues found ✓
                </div>
              ) : (
                <ul>
                  {expired.slice(0, 3).map((med) => (
                    <MedicineAlertRow
                      key={med.medicine_id}
                      name={med.medicine_name}
                      detail={`Expired: ${med.expiry_date}`}
                      badge="Expired"
                      badgeColor="red"
                    />
                  ))}
                  {expiring.slice(0, 3).map((med) => (
                    <MedicineAlertRow
                      key={med.medicine_id}
                      name={med.medicine_name}
                      detail={`Expires: ${med.expiry_date}`}
                      badge="Expiring soon"
                      badgeColor="yellow"
                    />
                  ))}
                  {(expired.length + expiring.length) > 6 && (
                    <li
                      className="px-4 py-3 text-xs text-primary hover:underline cursor-pointer"
                      onClick={() => navigate("/medicines")}
                    >
                      +{(expired.length + expiring.length) - 6} more — view all in Medicines
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Today's top medicines */}
          {summary && summary.top_medicines.length > 0 && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-semibold text-ink text-sm">
                  Today's top medicines
                </h2>
                <button
                  onClick={() => navigate("/reports")}
                  className="text-xs text-primary hover:underline"
                >
                  Full report →
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg text-left">
                    <th className="px-4 py-2 font-medium text-ink-muted">#</th>
                    <th className="px-4 py-2 font-medium text-ink-muted">Medicine</th>
                    <th className="px-4 py-2 font-medium text-ink-muted text-right">
                      Qty sold
                    </th>
                    <th className="px-4 py-2 font-medium text-ink-muted text-right">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.top_medicines.slice(0, 5).map((med, index) => (
                    <tr
                      key={med.medicine_id}
                      className="border-b border-border last:border-0 hover:bg-bg transition-colors"
                    >
                      <td className="px-4 py-2 text-ink-muted">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 font-medium text-ink">
                        {med.medicine_name}
                      </td>
                      <td className="px-4 py-2 text-ink-muted text-right">
                        {med.total_quantity_sold}
                      </td>
                      <td className="px-4 py-2 font-medium text-ink text-right">
                        GH₵{med.total_revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No sales today message */}
          {summary && summary.total_sales === 0 && (
            <div className="bg-surface border border-dashed border-border rounded-lg p-6 text-center text-ink-muted text-sm">
              No sales recorded today yet.{" "}
              <span
                onClick={() => navigate("/pos")}
                className="text-primary hover:underline cursor-pointer"
              >
                Go to Point of Sale →
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;