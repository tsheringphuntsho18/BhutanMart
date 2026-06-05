import { create } from 'zustand';
import { cartAPI, guestCartAPI, productAPI } from '../api/authAPI';

// Generate or retrieve a persistent guest ID
const getGuestId = () => {
  let id = localStorage.getItem('guestId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('guestId', id);
  }
  return id;
};

const enrichItems = async (serverItems) => {
  return Promise.all(
    serverItems.map(async (item) => {
      try {
        const prod = await productAPI.getProductById(item.productId);
        const p = prod.data.product || prod.data;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: p.price || 0,
          name: p.name || '',
          image: p.imageUrl || '',
        };
      } catch {
        return { productId: item.productId, quantity: item.quantity, price: 0, name: '' };
      }
    })
  );
};

export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,
  isLoading: false,

  // Load cart from server (user or guest)
  fetchCart: async () => {
    const token = localStorage.getItem('token');
    set({ isLoading: true });
    try {
      let serverItems = [];
      if (token) {
        const res = await cartAPI.getCart();
        serverItems = res.data.items || [];
      } else {
        const guestId = getGuestId();
        const res = await guestCartAPI.getCart(guestId);
        serverItems = res.data.items || [];
      }
      const enriched = await enrichItems(serverItems);
      set({ items: enriched, isLoading: false });
      get().calculateTotal();
    } catch {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId, quantity = 1, price, name = '', image = '') => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        await cartAPI.addToCart({ productId, quantity });
      } else {
        const guestId = getGuestId();
        await guestCartAPI.addToCart(guestId, { productId, quantity });
      }
    } catch {
      // fall through — update local state anyway
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
    try {
      if (token) {
        await cartAPI.removeFromCart(productId);
      } else {
        await guestCartAPI.removeFromCart(getGuestId(), productId);
      }
    } catch {
      // ignore
    }
    set({ items: get().items.filter((i) => i.productId !== productId) });
    get().calculateTotal();
  },

  updateCartItem: async (productId, quantity) => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        await cartAPI.updateCartItem({ productId, quantity });
      } else {
        await guestCartAPI.updateCartItem(getGuestId(), { productId, quantity });
      }
    } catch {
      // ignore
    }
    if (quantity <= 0) {
      set({ items: get().items.filter((i) => i.productId !== productId) });
    } else {
      set({
        items: get().items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        ),
      });
    }
    get().calculateTotal();
  },

  clearCart: async () => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        await cartAPI.clearCart();
      } else {
        await guestCartAPI.clearCart(getGuestId());
      }
    } catch {
      // ignore
    }
    set({ items: [], total: 0 });
  },

  // Called after login: push any guest cart items into the user's cart, then clear guest cart
  mergeGuestCart: async () => {
    const guestId = getGuestId();
    try {
      const res = await guestCartAPI.getCart(guestId);
      const guestItems = res.data.items || [];
      if (guestItems.length === 0) return;

      // Add each guest item to the user cart
      await Promise.all(
        guestItems.map((item) =>
          cartAPI.addToCart({ productId: item.productId, quantity: item.quantity }).catch(() => {})
        )
      );

      // Clear guest cart from Redis
      await guestCartAPI.clearCart(guestId);
    } catch {
      // non-critical — user cart still works without merge
    }

    // Reload the user cart with merged items
    await get().fetchCart();
  },

  calculateTotal: () => {
    const total = get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    set({ total });
  },
}));
