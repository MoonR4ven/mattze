import { collection, getDocs, addDoc, query, where } from "firebase/firestore"
import { db } from "./firebase"

export interface Booking {
  id: string
  productId: string
  productName: string
  date: string
  startTime: string
  endTime: string
  customerEmail: string
  customerName: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  createdAt: string
  price: number
}

export interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

export async function getBookingsForDate(productId: string, date: string): Promise<Booking[]> {
  try {
    const q = query(
      collection(db, "bookings"),
      where("productId", "==", productId),
      where("date", "==", date),
      where("status", "in", ["pending", "confirmed"]),
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Booking,
    )
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

export async function getAvailableTimeSlots(productId: string, date: string): Promise<TimeSlot[]> {
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
