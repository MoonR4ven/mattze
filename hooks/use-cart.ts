"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "@/lib/types"

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addToCart: (item) => {
        set({ isOpen: true })
        set((state) => {
          const existingItem = state.items.find(
            (i) =>
              i.id === item.id &&
              i.startDate === item.startDate &&
              i.endDate === item.endDate &&
              i.selectedDate === item.selectedDate &&
              i.selectedTime === item.selectedTime,
          )

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id &&
                i.startDate === item.startDate &&
                i.endDate === item.endDate &&
                i.selectedDate === item.selectedDate &&
                i.selectedTime === item.selectedTime
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            }
          }

          return { items: [...state.items, item] }
        })
      },

      removeFromCart: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(id)
          return
        }

        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity } : item)),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const itemPrice = item.totalPrice || item.price * item.quantity
          return total + itemPrice
        }, 0)
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }))
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)
