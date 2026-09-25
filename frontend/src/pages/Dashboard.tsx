import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Pill, Clock3, BarChart3 } from "lucide-react";
import api from "../api/axios";
import type { MedicineWithStockResponse } from "../types/medicine";
import type { SalesSummaryResponse } from "../types/report";
import { SkeletonDashboard } from "../components/Skeleton";
import { getMedicines } from "../api/medicines";

const today = new Date().toISOString().split("T")[0];
const StockPieChart = lazy(() => import("../components/StockPieChart"));

const quickLinks = [
  { label: "Point of Sale", sub: "Record a sale", to: "/pos", icon: ShoppingCart },
  { label: "Medicines", sub: "Manage inventory", to: "/medicines", icon: Pill },
  { label: "Shifts", sub: "Open or review shifts", to: "/shifts", icon: Clock3 },
  { label: "Reports", sub: "Review performance", to: "/reports", icon: BarChart3 },
];

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.first_name ?? "there";
  const formattedDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const { data: summary } = useQuery<SalesSummaryResponse>({
    queryKey: ["sales-summary-today"],
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const res = await api.get("/reports/sales-summary", {
        params: { start_date: today, end_date: today },
      });
      return res.data;
    },
  });

  const { data: lowStock = [] } = useQuery<MedicineWithStockResponse[]>({
    queryKey: ["low-stock"],
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const res = await api.get("/medicines/low-stock");
      return res.data;
    },
  });

  const { data: expired = [] } = useQuery<MedicineWithStockResponse[]>({
    queryKey: ["expired"],
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const res = await api.get("/medicines/expired");
      return res.data;
    },
  });

  const { data: expiringSoon = [] } = useQuery<MedicineWithStockResponse[]>({
    queryKey: ["expiring-soon"],
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const res = await api.get("/medicines/expiring-soon", {
        params: { days: 30 },
      });
      return res.data;
    },
  });

  const {
    data: inventory = [],
    isLoading: isInventoryLoading,
    isError: isInventoryError,
  } = useQuery({
    queryKey: ["dashboard-medicines"],
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const allMedicines: MedicineWithStockResponse[] = [];
      let skip = 0;
      let page: MedicineWithStockResponse[];
      do {
        page = await getMedicines({ skip, limit: 100 });
        allMedicines.push(...page);
        skip += page.length;
      } while (page.length === 100);
      return allMedicines;
    },
  });

  const statCards = [
    {
      label: "Today's sales",
      value: summary?.total_sales ?? "—",
      sub: "transactions today",
      accent: "border-l-primary",
      to: "/sales",
    },
    {
      label: "Today's revenue",
      value: summary ? `GH₵${Number(summary.total_revenue).toFixed(2)}` : "—",
      sub: "voided sales excluded",
      accent: "border-l-success",
      valueClass: "text-success",
      to: "/reports",
    },
    {
      label: "Low stock",
        to: "/medicines?status=low-stock",
      value: lowStock.length,
      sub: "medicines",
      accent: "border-l-warning",
      valueClass: lowStock.length > 0 ? "text-warning" : undefined,
    },
    {
      label: "Expired",
        to: "/medicines?status=expired",
      value: expired.length,
      sub: "medicines expired",
      accent: "border-l-danger",
      valueClass: expired.length > 0 ? "text-danger" : undefined,
    },
  ];


  const isLoading =
  !summary && !lowStock.length && !expired.length && !expiringSoon.length;

  if (isLoading) return <SkeletonDashboard />;


  return (

    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface border border-border px-8 py-6 flex items-center justify-between min-h-[140px]">
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            {formattedDate}
          </p>
          <h1 className="font-display font-bold text-3xl text-ink mb-1">
            Welcome back, {firstName}!
          </h1>
          <p className="text-ink-muted text-sm">
            Here's what's happening in your pharmacy today.
          </p>
        </div>
        {user?.profile_image_url && (
          <img
            src={user.profile_image_url}
            alt="Your profile"
            className="h-16 w-16 rounded-full object-cover opacity-80 shrink-0"
          />
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quickLinks.map(({ label, sub, to, icon: Icon }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex items-center gap-3 rounded-lg bg-surface border border-border px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <Icon size={18} className="text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="text-xs text-ink-muted">{sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ label, value, sub, accent, valueClass, to }) => (
          <button
            key={label}
            type="button"
            onClick={() => to && navigate(to)}
            className={`rounded-lg bg-surface border border-border border-l-4 ${accent} px-5 py-4`}
          >
            <p className="text-xs text-ink-muted mb-1">{label}</p>
            <p className={`font-display font-bold text-2xl text-ink ${valueClass ?? ""}`}>
              {value}
            </p>
            <p className="text-xs text-ink-muted mt-1">{sub}</p>
          </button>
        ))}
      </div>

      {/* Alert panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Low stock alerts */}
        <div className="rounded-lg bg-surface border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-ink">Low stock alerts</h2>
            <span className="text-xs text-ink-muted">{lowStock.length} medicines</span>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ink-muted">All medicines are well stocked.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.slice(0, 6).map((m) => (
                <li key={m.medicine_id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span className="text-ink font-medium">{m.medicine_name}</span>
                  <span className="text-warning font-semibold">
                    {m.inventory?.quantity_available ?? 0} left
                  </span>
                </li>
              ))}
              {lowStock.length > 6 && (
                <li className="px-5 py-2 text-xs text-ink-muted">
                  +{lowStock.length - 6} more
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Expiry alerts */}
        <div className="rounded-lg bg-surface border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-ink">Expiry alerts</h2>
            <span className="text-xs text-ink-muted">
              {expired.length} expired · {expiringSoon.length} expiring soon
            </span>
          </div>
          {expired.length === 0 && expiringSoon.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ink-muted">No expiry issues at this time.</p>
          ) : (
            <ul className="divide-y divide-border">
              {[...expired, ...expiringSoon].slice(0, 6).map((m) => {
                const isExpired = expired.some((e) => e.medicine_id === m.medicine_id);
                return (
                  <li key={m.medicine_id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                    <span className="text-ink font-medium">{m.medicine_name}</span>
                    <span className={`font-semibold text-xs px-2 py-0.5 rounded-full border ${
                      isExpired
                        ? "text-danger bg-danger/10 border-danger/20"
                        : "text-warning bg-warning/10 border-warning/20"
                    }`}>
                      {isExpired ? "Expired" : "Expiring soon"}
                    </span>
                  </li>
                );
              })}
              {expired.length + expiringSoon.length > 6 && (
                <li className="px-5 py-2 text-xs text-ink-muted">
                  +{expired.length + expiringSoon.length - 6} more
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <Suspense fallback={<div className="h-80 animate-pulse sm:h-96" />}>
        <StockPieChart
          medicines={inventory}
          isLoading={isInventoryLoading}
          isError={isInventoryError}
          onSelectMedicine={(medicineId) => navigate(`/medicines?medicine_id=${medicineId}`)}
        />
      </Suspense>
    </div>
  );
}

export default Dashboard;