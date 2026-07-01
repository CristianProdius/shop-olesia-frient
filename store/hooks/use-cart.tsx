import { create } from "zustand";
import { Color, Product, Size } from "@/types";
import { persist, createJSONStorage } from 'zustand/middleware'
import useCartDrawer from "@/hooks/use-cart-drawer";

// A cart line carries the underlying product plus the selected variant.
// Lines are keyed by `variantId` so the same product in two sizes/colors
// becomes two distinct lines. `id` is kept as the product id because
// downstream (checkout) maps cart items -> productIds.
export interface CartLine extends Product {
    variantId: string;
    selectedSize: Size;
    selectedColor: Color;
    unitPrice: string;
    // How many of this variant are in the cart. Optional so existing callers
    // (and older persisted carts) that don't set it still type-check; addItem
    // defaults it to 1 and every reader falls back to 1 via `quantity ?? 1`.
    quantity?: number;
}

// Back-compat: older persisted carts stored bare Product objects without a
// variantId. Resolve a stable line key without crashing on those.
const lineKey = (item: { variantId?: string; id: string }) =>
    item.variantId ?? item.id;

interface CartStore {
    items: CartLine[];
    addItem: (data: CartLine) => void;
    updateQuantity: (variantId: string, quantity: number) => void;
    removeItem: (variantId: string) => void;
    removeAll: () => void;
}

const useCart = create(persist<CartStore>((set, get) =>({
    items: [],
    addItem: (data: CartLine) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(
            (item) => lineKey(item) === lineKey(data),
        );
        // Quantity to add for this call (callers may omit it; default to 1).
        const incoming = data.quantity ?? 1;

        if (existingItem) {
            // Already in the bag: bump the existing line's quantity instead of
            // silently dropping the add.
            set({
                items: currentItems.map((item) =>
                    lineKey(item) === lineKey(data)
                        ? { ...item, quantity: (item.quantity ?? 1) + incoming }
                        : item,
                ),
            });
        } else {
            set({ items: [...currentItems, { ...data, quantity: incoming }] });
        }
        // Either way, surface the slide-out cart as feedback.
        useCartDrawer.getState().onOpen();
    },
    updateQuantity: (variantId: string, quantity: number) => {
        // Clamp to a whole number >= 1; removing is done via removeItem.
        const next = Math.max(1, Math.floor(quantity));
        set({
            items: get().items.map((item) =>
                lineKey(item) === variantId ? { ...item, quantity: next } : item,
            ),
        });
    },
    removeItem: (variantId: string) => {
        set({ items: [...get().items.filter(item => lineKey(item) !== variantId)] });
    },
    removeAll: () => set({ items: [] }),
}), {
    name: "cart-storage",
    storage: createJSONStorage(() => localStorage)
}))

export default useCart;
