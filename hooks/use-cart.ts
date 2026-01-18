"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "@/lib/types"

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string, startDate?: string, endDate?: string, selectedDate?: string) => void
  updateQuantity: (id: string, quantity: number, startDate?: string, endDate?: string, selectedDate?: string) => void
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

      removeFromCart: (id, startDate, endDate, selectedDate) => {
        set((state) => ({
          items: state.items.filter((item) => {
            // Match by ID and booking dates to identify the specific item
            const idMatch = item.id === id
            const startDateMatch = startDate ? item.startDate === startDate : true
            const endDateMatch = endDate ? item.endDate === endDate : true
            const selectedDateMatch = selectedDate ? item.selectedDate === selectedDate : true
            
            // Remove only if all conditions match
            return !(idMatch && startDateMatch && endDateMatch && selectedDateMatch)
          }),
        }))
      },

      updateQuantity: (id, quantity, startDate, endDate, selectedDate) => {
        if (quantity <= 0) {
          get().removeFromCart(id, startDate, endDate, selectedDate)
          return
        }

        set((state) => ({
          items: state.items.map((item) => {
            const idMatch = item.id === id
            const startDateMatch = startDate ? item.startDate === startDate : true
            const endDateMatch = endDate ? item.endDate === endDate : true
            const selectedDateMatch = selectedDate ? item.selectedDate === selectedDate : true
            
            return idMatch && startDateMatch && endDateMatch && selectedDateMatch
              ? { ...item, quantity }
              : item
          }),
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
