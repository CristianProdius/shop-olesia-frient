import { create } from "zustand";
import { Product } from "@/types";
import { persist, createJSONStorage } from 'zustand/middleware'
import useCartDrawer from "@/hooks/use-cart-drawer";

interface CartStore {
    items: Product[];
    addItem: (data: Product) => void;
    removeItem: (id: string) => void;
    removeAll: () => void;
}

const useCart = create(persist<CartStore>((set, get) =>({
    items: [],
    addItem: (data: Product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item.id === data.id);

        // Add only if new; either way, surface the slide-out cart as feedback.
        if (!existingItem) {
            set({ items: [...currentItems, data] });
        }
        useCartDrawer.getState().onOpen();
    },
    removeItem: (id: string) => {
        set({ items: [...get().items.filter(item => item.id !== id)] });
    },
    removeAll: () => set({ items: [] }),
}), {
    name: "cart-storage",
    storage: createJSONStorage(() => localStorage)
}))

export default useCart;