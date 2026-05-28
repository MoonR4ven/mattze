import type { CartItem } from "./types"

type ReservableItem = Pick<CartItem, "id" | "name" | "quantity" | "startDate" | "endDate" | "selectedDate" | "endDayOffset"> & {
  productId?: string
  date?: string
}

export interface ProductDateQuantity {
  key: string
  productId: string
  date: string
  quantity: number
  productName?: string
}

function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getEndDayOffset(value: unknown): number {
  const offset = Number(value)
  return Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0
}

export function toPositiveQuantity(value: unknown): number {
  const quantity = Number(value)
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1
}

export function getReservationKey(productId: string, date: string): string {
  return `${productId}:${date}`
}

export function addDaysToDateString(dateString: string, days: number): string {
  const date = parseDateOnly(dateString)
  date.setDate(date.getDate() + days)
  return formatDateOnly(date)
}

export function getReservationProductId(item: ReservableItem): string | null {
  if (typeof item.productId === "string" && item.productId) {
    return item.productId
  }

  if (typeof item.id === "string" && item.id) {
    return item.id
  }

  return null
}

export function getReservationStartDate(item: ReservableItem): string | null {
  if (typeof item.startDate === "string" && item.startDate) {
    return item.startDate
  }

  if (typeof item.selectedDate === "string" && item.selectedDate) {
    return item.selectedDate
  }

  if (typeof item.date === "string" && item.date) {
    return item.date
  }

  return null
}

export function getReservationEndDate(item: ReservableItem): string | null {
  const startDate = getReservationStartDate(item)
  if (!startDate) {
    return null
  }

  const baseEndDate =
    (typeof item.endDate === "string" && item.endDate) ||
    (typeof item.selectedDate === "string" && item.selectedDate) ||
    (typeof item.date === "string" && item.date) ||
    startDate

  return addDaysToDateString(baseEndDate, getEndDayOffset(item.endDayOffset))
}

export function getBookedDatesForReservation(item: ReservableItem): string[] {
  const startDate = getReservationStartDate(item)
  const endDate = getReservationEndDate(item)

  if (!startDate || !endDate) {
    return []
  }

  const dates: string[] = []
  const current = parseDateOnly(startDate)
  const last = parseDateOnly(endDate)

  while (current <= last) {
    dates.push(formatDateOnly(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export function reservationIncludesDate(item: ReservableItem, date: string): boolean {
  const startDate = getReservationStartDate(item)
  const endDate = getReservationEndDate(item)

  if (!startDate || !endDate) {
    return false
  }

  const checkDate = parseDateOnly(date)
  return checkDate >= parseDateOnly(startDate) && checkDate <= parseDateOnly(endDate)
}

export function buildRequestedQuantitiesByProductDate(items: ReservableItem[]): ProductDateQuantity[] {
  const requestedQuantities = new Map<string, ProductDateQuantity>()

  for (const item of items) {
    const productId = getReservationProductId(item)
    if (!productId) {
      continue
    }

    const quantity = toPositiveQuantity(item.quantity)
    const productName = typeof item.name === "string" && item.name ? item.name : undefined

    for (const date of getBookedDatesForReservation(item)) {
      const key = getReservationKey(productId, date)
      const existing = requestedQuantities.get(key)

      if (existing) {
        existing.quantity += quantity
      } else {
        requestedQuantities.set(key, {
          key,
          productId,
          date,
          quantity,
          productName,
        })
      }
    }
  }

  return Array.from(requestedQuantities.values())
}