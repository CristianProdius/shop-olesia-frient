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
}

// Back-compat: older persisted carts stored bare Product objects without a
// variantId. Resolve a stable line key without crashing on those.
const lineKey = (item: { variantId?: string; id: string }) =>
    item.variantId ?? item.id;

interface CartStore {
    items: CartLine[];
    addItem: (data: CartLine) => void;
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

        // Add only if new; either way, surface the slide-out cart as feedback.
        if (!existingItem) {
            set({ items: [...currentItems, data] });
        }
        useCartDrawer.getState().onOpen();
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
