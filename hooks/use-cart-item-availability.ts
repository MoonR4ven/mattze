"use client"

import { useEffect, useState } from "react"
import { getAvailableQuantityForDate } from "@/lib/bookings"
import {
  buildRequestedQuantitiesByProductDate,
  getReservationKey,
} from "@/lib/booking-availability"
import type { CartItem } from "@/lib/types"

export function getCartLineKey(item: CartItem, index: number): string {
  return `${item.id}-${item.startDate || ""}-${item.endDate || ""}-${item.selectedDate || ""}-${item.selectedTime || ""}-${index}`
}

interface CartItemAvailabilityResult {
  maxQuantityByLineKey: Record<string, number>
  isLoading: boolean
}

export function useCartItemAvailability(items: CartItem[]): CartItemAvailabilityResult {
  const [maxQuantityByLineKey, setMaxQuantityByLineKey] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadAvailability = async () => {
      if (items.length === 0) {
        setMaxQuantityByLineKey({})
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const requestedQuantities = buildRequestedQuantitiesByProductDate(items)
        const requestedQuantityByKey = new Map(
          requestedQuantities.map((entry) => [entry.key, entry.quantity] as const),
        )

        const availabilityEntries = await Promise.all(
          requestedQuantities.map(async (entry) => {
            const inventory = items.find((item) => item.id === entry.productId)?.inventory || 1
            const available = await getAvailableQuantityForDate(entry.productId, entry.date, inventory)
            return [entry.key, available] as const
          }),
        )

        const externalAvailableByKey = new Map(availabilityEntries)

        const nextMaxQuantityByLineKey = Object.fromEntries(
          items.map((item, index) => {
            const lineKey = getCartLineKey(item, index)
            const inventory = item.inventory || 1
            const bookedDates = requestedQuantities
              .filter((entry) => entry.productId === item.id)
              .map((entry) => entry.date)
              .filter((date, dateIndex, dates) => dates.indexOf(date) === dateIndex)
              .filter((date) => {
                const key = getReservationKey(item.id, date)
                return requestedQuantityByKey.has(key)
              })

            const itemDates = bookedDates.filter((date) => {
              const requestKey = getReservationKey(item.id, date)
              return requestedQuantityByKey.has(requestKey)
            })

            if (itemDates.length === 0) {
              return [lineKey, inventory]
            }

            let maxQuantity = inventory

            for (const date of itemDates) {
              const requestKey = getReservationKey(item.id, date)
              const externalAvailable = externalAvailableByKey.get(requestKey) ?? inventory
              const requestedForDate = requestedQuantityByKey.get(requestKey) ?? 0
              const otherCartQuantity = Math.max(0, requestedForDate - item.quantity)
              const allowedForLine = Math.max(0, externalAvailable - otherCartQuantity)
              maxQuantity = Math.min(maxQuantity, allowedForLine)
            }

            return [lineKey, maxQuantity]
          }),
        )

        if (!cancelled) {
          setMaxQuantityByLineKey(nextMaxQuantityByLineKey)
        }
      } catch (error) {
        console.error("Error loading cart item availability:", error)
        if (!cancelled) {
          setMaxQuantityByLineKey({})
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadAvailability()

    return () => {
      cancelled = true
    }
  }, [items])

  return { maxQuantityByLineKey, isLoading }
}