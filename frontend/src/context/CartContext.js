import { create } from 'zustand';
import { cartAPI, productAPI } from '../api/authAPI';

export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,
  isLoading: false,

  fetchCart: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    set({ isLoading: true });
    try {
      const response = await cartAPI.getCart();
      const serverItems = response.data.items || [];

      // Enrich items with product price info
      const enriched = await Promise.all(
        serverItems.map(async (item) => {
          try {
            const prod = await productAPI.getProductById(item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: prod.data.price || 0,
              name: prod.data.name || '',
              image: prod.data.imageUrl || '',
            };
          } catch {
            return { productId: item.productId, quantity: item.quantity, price: 0, name: '' };
          }
        })
      );

      set({ items: enriched, isLoading: false });
      get().calculateTotal();
    } catch {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId, quantity = 1, price, name = '', image = '') => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await cartAPI.addToCart({ productId, quantity });
      } catch {
        // continue with local state even if sync fails
      }
    }

    const state = get();
    const existing = state.items.find((i) => i.productId === productId);
    if (existing) {
      set({
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
        ),
      });
    } else {
      set({ items: [...state.items, { productId, quantity, price, name, image }] });
    }
    get().calculateTotal();
  },

  removeFromCart: async (productId) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await cartAPI.removeFromCart(productId);
      } catch {
        // ignore
      }
    }
    set({ items: get().items.filter((i) => i.productId !== productId) });
    get().calculateTotal();
  },

  updateCartItem: async (productId, quantity) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await cartAPI.updateCartItem({ productId, quantity });
      } catch {
        // ignore
      }
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    });
    get().calculateTotal();
  },

  clearCart: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await cartAPI.clearCart();
      } catch {
        // ignore
      }
    }
    set({ items: [], total: 0 });
  },

  calculateTotal: () => {
    const total = get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    set({ total });
  },
}));
