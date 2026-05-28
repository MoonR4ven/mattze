import { collection, getDocs, addDoc, query, where } from "firebase/firestore"
import { db } from "./firebase"
import {
  getBookedDatesForReservation,
  reservationIncludesDate,
  toPositiveQuantity,
} from "./booking-availability"

export interface Booking {
  id: string
  productId: string
  productName: string
  date: string
  startTime: string
  endTime: string
  customerEmail: string
  customerName: string
  status: "pending" | "confirmed" | "completed" | "blocked" | "cancelled"
  createdAt: string
  price: number
  quantity?: number
}

export interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

export async function getBookingsForDate(productId: string, date: string): Promise<Booking[]> {
  try {
    // Query for time-slot bookings on this specific date
    const q = query(
      collection(db, "bookings"),
      where("productId", "==", productId),
      where("date", "==", date),
      where("status", "in", ["pending", "confirmed", "blocked"]),
    )

    const querySnapshot = await getDocs(q)
    const bookings = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Booking,
    )

    // Also check for date-range bookings in the orders collection
    const ordersQ = query(
      collection(db, "orders"),
      where("items.id", "==", productId),
      where("status", "==", "confirmed"),
    )
    
    const ordersSnapshot = await getDocs(ordersQ)
    
    // Check each order to see if any items contain this product with date range that includes the queried date
    for (const doc of ordersSnapshot.docs) {
      const order = doc.data()
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.id === productId && reservationIncludesDate(item, date)) {
            const bookedDates = getBookedDatesForReservation(item)
            const bookingStartDate = bookedDates[0] || date

            if (bookingStartDate) {
              // This date is booked as part of a range
              bookings.push({
                id: `order-${doc.id}-${item.id}-${date}`,
                productId: productId,
                productName: item.name,
                date: date,
                startTime: item.startTime || "00:00",
                endTime: item.endTime || "23:59",
                customerEmail: order.customerInfo?.email || "",
                customerName: `${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`,
                status: "confirmed",
                createdAt: order.createdAt,
                price: item.totalPrice ?? item.price ?? 0,
                quantity: toPositiveQuantity(item.quantity),
              })
              break
            }
          }
        }
      }
    }

    return bookings
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return []
  }
}

export async function checkTimeSlotAvailability(
  productId: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<boolean> {
  try {
    const bookings = await getBookingsForDate(productId, date)

    // Check if the requested time slot conflicts with existing bookings
    const hasConflict = bookings.some((booking) => {
      const bookingStart = booking.startTime
      const bookingEnd = booking.endTime

      // Check for time overlap
      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      )
    })

    return !hasConflict
  } catch (error) {
    console.error("Error checking availability:", error)
    return false
  }
}

export async function getAvailableTimeSlots(_productId: string, _date: string): Promise<TimeSlot[]> {
  void _productId
  void _date

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ]

  return new Promise((resolve) => {
    setTimeout(() => {
      const mockSlots = timeSlots.map((time) => ({
        time,
        available: Math.random() > 0.3, // Randomly make some slots unavailable
        reason: Math.random() > 0.3 ? undefined : "Already booked",
      }))
      resolve(mockSlots)
    }, 500)
  })
}

export async function createBooking(booking: Omit<Booking, "id" | "createdAt">): Promise<string | null> {
  try {
    // Check availability one more time before creating
    const isAvailable = await checkTimeSlotAvailability(
      booking.productId,
      booking.date,
      booking.startTime,
      booking.endTime,
    )

    if (!isAvailable) {
      throw new Error("Time slot is no longer available")
    }

    const docRef = await addDoc(collection(db, "bookings"), {
      ...booking,
      createdAt: new Date().toISOString(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating booking:", error)
    return null
  }
}

export async function getBookingsByEmail(email: string): Promise<Booking[]> {
  try {
    const q = query(collection(db, "bookings"), where("customerEmail", "==", email))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Booking,
    )
  } catch (error) {
    console.error("Error fetching user bookings:", error)
    return []
  }
}

export async function getAvailableQuantityForDate(
  productId: string,
  date: string,
  productInventory: number = 1,
): Promise<number> {
  try {
    // Get all confirmed orders that have this product
    const ordersQ = query(
      collection(db, "orders"),
      where("status", "==", "confirmed"),
    )
    
    const ordersSnapshot = await getDocs(ordersQ)
    let bookedQuantity = 0
    
    // Sum up quantities booked on this date
    for (const doc of ordersSnapshot.docs) {
      const order = doc.data()
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.id === productId && reservationIncludesDate(item, date)) {
            bookedQuantity += toPositiveQuantity(item.quantity)
          }
        }
      }
    }
    
    // Include explicit day blocks created in admin for phone/manual bookings.
    const blockedQ = query(
      collection(db, "bookings"),
      where("productId", "==", productId),
      where("date", "==", date),
      where("status", "==", "blocked"),
    )

    const blockedSnapshot = await getDocs(blockedQ)
    const blockedQuantity = blockedSnapshot.docs.reduce((sum, doc) => {
      const quantity = Number(doc.data().quantity)
      return sum + (Number.isFinite(quantity) && quantity > 0 ? quantity : 1)
    }, 0)

    const available = Math.max(0, productInventory - bookedQuantity - blockedQuantity)
    return available
  } catch (error) {
    console.error("Error calculating available quantity:", error)
    return productInventory
  }
}
