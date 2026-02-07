"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "@/lib/types"

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  fulfillmentOption: "delivery-collection" | "delivery-assembly" | "self-collection"
  deliveryDistanceKm?: number
  deliveryFee?: number
  pickupLocations: Array<{ id: string; name: string; address: string }>
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string, startDate?: string, endDate?: string, selectedDate?: string) => void
  updateQuantity: (id: string, quantity: number, startDate?: string, endDate?: string, selectedDate?: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  setFulfillmentOption: (option: "delivery-collection" | "delivery-assembly" | "self-collection") => void
  setDeliveryDetails: (details: { distanceKm?: number; fee?: number }) => void
  setPickupLocations: (locations: Array<{ id: string; name: string; address: string }>) => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      fulfillmentOption: "self-collection",
      deliveryDistanceKm: undefined,
      deliveryFee: undefined,
      pickupLocations: [],

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
            const newQuantity = existingItem.quantity + item.quantity
            return {
              items: state.items.map((i) =>
                i.id === item.id &&
                i.startDate === item.startDate &&
                i.endDate === item.endDate &&
                i.selectedDate === item.selectedDate &&
                i.selectedTime === item.selectedTime
                  ? {
                      ...i,
                      quantity: newQuantity,
                      totalPrice: (i.price * (i.numberOfDays || 1) * newQuantity),
                    }
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
              ? {
                  ...item,
                  quantity,
                  totalPrice: item.price * (item.numberOfDays || 1) * quantity,
                }
              : item
          }),
        }))
      },

      clearCart: () => set({ items: [], fulfillmentOption: "self-collection", deliveryDistanceKm: undefined, deliveryFee: undefined, pickupLocations: [] }),

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const itemPrice = item.totalPrice || item.price * item.quantity
          return total + itemPrice
        }, 0)
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      setFulfillmentOption: (option) => {
        set({ fulfillmentOption: option })
      },

      setDeliveryDetails: (details) => {
        set({ deliveryDistanceKm: details.distanceKm, deliveryFee: details.fee })
      },

      setPickupLocations: (locations) => {
        set({ pickupLocations: locations })
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
