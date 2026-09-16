import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getMedicines } from "../api/medicines";
import { createSale } from "../api/sales";
import type { MedicineWithStockResponse } from "../types/medicine";
import type { SaleCreate, SaleResponse } from "../types/sale";
import { getActiveShift } from "../api/shift";
// -----------------------------
// Types
// -----------------------------
interface CartItem {
  medicine: MedicineWithStockResponse;
  quantity: number;
}

// -----------------------------
// POS Page
// -----------------------------
function POS() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { data: medicines = [] } = useQuery({
    queryKey: ["medicines", search],
    queryFn: () =>
      getMedicines({ name: search || undefined, limit: 10 }),
    enabled: search.length > 0,
  });

  const checkoutMutation = useMutation({
    mutationFn: (data: SaleCreate) => createSale(data),
    onSuccess: (sale) => {
      setCompletedSale(sale);
      setCart([]);
      setCustomerName("");
      setSearch("");
      setCheckoutError(null);
    },
    onError: (err: any) => {
      setCheckoutError(
        err?.response?.data?.detail ?? "Checkout failed. Please try again."
      );
    },
  });

  const addToCart = (medicine: MedicineWithStockResponse) => {
    const available = medicine.inventory?.quantity_available ?? 0;
    if (available === 0) return;

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.medicine.medicine_id === medicine.medicine_id
      );
      if (existing) {
        return prev.map((item) =>
          item.medicine.medicine_id === medicine.medicine_id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, available),
              }
            : item
        );
      }
      return [...prev, { medicine, quantity: 1 }];
    });
    setSearch("");
  };

  const updateQuantity = (medicineId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.medicine.medicine_id !== medicineId) return item;
        const max = item.medicine.inventory?.quantity_available ?? 1;
        return { ...item, quantity: Math.min(quantity, max) };
      })
    );
  };

  const removeFromCart = (medicineId: number) => {
    setCart((prev) =>
      prev.filter((item) => item.medicine.medicine_id !== medicineId)
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.medicine.unit_price * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutError(null);

    const saleData: SaleCreate = {
      customer_name: customerName.trim() || undefined,
      items: cart.map((item) => ({
        medicine_id: item.medicine.medicine_id,
        quantity: item.quantity,
      })),
    };

    checkoutMutation.mutate(saleData);
  };

    const { data: activeShift, isLoading: shiftLoading } = useQuery({
    queryKey: ["active-shift"],
    queryFn: async () => {
      try {
        return await getActiveShift();
      } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    retry: false,
  });

  if (shiftLoading) return null;

  if (!activeShift) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow-600 text-2xl">⚠</span>
          </div>
          <h2 className="font-display font-bold text-xl text-ink mb-2">No active shift</h2>
          <p className="text-ink-muted text-sm">
            You need to open a shift before making sales. Use the bar at the top of the page.
          </p>
        </div>
      </div>
    );
  }
  
  // Receipt view after successful sale
  if (completedSale) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-2xl">✓</span>
          </div>
          <h2 className="font-display font-bold text-xl text-ink mb-1">
            Sale complete
          </h2>
          <p className="text-ink-muted text-sm mb-6">
            Sale #{completedSale.sale_id}
            {completedSale.customer_name
              ? ` — ${completedSale.customer_name}`
              : ""}
          </p>

          <div className="bg-bg rounded-lg p-4 text-left mb-6 space-y-2">
            {completedSale.items.map((item) => (
              <div
                key={item.sale_item_id}
                className="flex justify-between text-sm"
              >
                <span className="text-ink-muted">
                  Medicine #{item.medicine_id} × {item.quantity}
                </span>
                <span className="text-ink font-medium">
                  GH₵{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-ink">
              <span>Total</span>
              <span>GH₵{completedSale.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => setCompletedSale(null)}
            className="bg-primary text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            New sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Medicine search */}
      <div>
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-ink">
            Point of Sale
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            Search for medicines to add to the cart.
          </p>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search medicine by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
        </div>

        {/* Search results */}
        {search.length > 0 && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {medicines.length === 0 ? (
              <div className="p-4 text-center text-ink-muted text-sm">
                No medicines found for "{search}"
              </div>
            ) : (
              <ul>
                {medicines.map((med) => {
                  const available =
                    med.inventory?.quantity_available ?? 0;
                  const outOfStock = available === 0;
                  const alreadyInCart = cart.some(
                    (item) => item.medicine.medicine_id === med.medicine_id
                  );

                  return (
                    <li
                      key={med.medicine_id}
                      className={`flex items-center justify-between px-4 py-3 border-b border-border last:border-0 ${
                        outOfStock
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-bg cursor-pointer"
                      }`}
                      onClick={() => !outOfStock && addToCart(med)}
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {med.medicine_name}
                        </p>
                        <p className="text-xs text-ink-muted">
                          GH₵{med.unit_price.toFixed(2)} · Stock:{" "}
                          {available}
                        </p>
                      </div>
                      <div className="text-right">
                        {outOfStock ? (
                          <span className="text-xs text-red-500">
                            Out of stock
                          </span>
                        ) : alreadyInCart ? (
                          <span className="text-xs text-primary">
                            + Add more
                          </span>
                        ) : (
                          <span className="text-xs text-primary">
                            + Add
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {search.length === 0 && cart.length === 0 && (
          <div className="bg-surface border border-dashed border-border rounded-lg p-8 text-center text-ink-muted text-sm">
            Start typing to search for medicines
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div>
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-display font-semibold text-ink">
              Cart{" "}
              {cart.length > 0 && (
                <span className="text-ink-muted font-normal text-sm">
                  ({cart.length} item{cart.length !== 1 ? "s" : ""})
                </span>
              )}
            </h2>
          </div>

          {cart.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-sm">
              Cart is empty — search and add medicines on the left
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {cart.map((item) => (
                  <li
                    key={item.medicine.medicine_id}
                    className="px-6 py-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {item.medicine.medicine_name}
                      </p>
                      <p className="text-xs text-ink-muted">
                        GH₵{item.medicine.unit_price.toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.medicine.medicine_id,
                            item.quantity - 1
                          )
                        }
                        className="w-7 h-7 rounded border border-border text-ink-muted hover:border-primary hover:text-primary transition-colors text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.medicine.medicine_id,
                            item.quantity + 1
                          )
                        }
                        disabled={
                          item.quantity >=
                          (item.medicine.inventory?.quantity_available ?? 0)
                        }
                        className="w-7 h-7 rounded border border-border text-ink-muted hover:border-primary hover:text-primary disabled:opacity-40 transition-colors text-sm font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right w-20">
                      <p className="text-sm font-medium text-ink">
                        GH₵
                        {(
                          item.medicine.unit_price * item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        removeFromCart(item.medicine.medicine_id)
                      }
                      className="text-ink-muted hover:text-red-500 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>

              <div className="px-6 py-4 border-t border-border space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Customer name{" "}
                    <span className="text-ink-muted font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in customer"
                    className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-muted">
                    Total
                  </span>
                  <span className="font-display font-bold text-xl text-ink">
                    GH₵{cartTotal.toFixed(2)}
                  </span>
                </div>

                {checkoutError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {checkoutError}
                  </p>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={
                    cart.length === 0 || checkoutMutation.isPending
                  }
                  className="w-full bg-primary text-white font-medium py-3 rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  {checkoutMutation.isPending
                    ? "Processing..."
                    : `Checkout — GH₵${cartTotal.toFixed(2)}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default POS;