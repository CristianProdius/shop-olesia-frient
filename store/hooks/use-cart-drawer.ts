import { create } from "zustand";

// Controls the slide-out cart drawer. Kept separate from the cart store so any
// component (add-to-cart actions, the navbar cart icon) can open it.
interface CartDrawerStore {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}

const useCartDrawer = create<CartDrawerStore>((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
}));

export default useCartDrawer;
