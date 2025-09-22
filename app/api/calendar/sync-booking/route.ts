import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { GoogleCalendarAPI } from "@/lib/google-calendar"

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    // Get booking from Firebase
    const bookingDoc = await getDoc(doc(db, "bookings", bookingId))

    if (!bookingDoc.exists()) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const bookingData = bookingDoc.data()

    if (!bookingData.calendarEventId) {
      return NextResponse.json({ error: "Booking not linked to calendar event" }, { status: 400 })
    }

    // Sync with Google Calendar
    const calendarAPI = new GoogleCalendarAPI()
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary"

    try {
      const calendarEvent = await calendarAPI.getEvent(calendarId, bookingData.calendarEventId)

      // Update local booking with calendar data
      const updates: any = {
        calendarStatus: "synced",
        lastSyncedAt: new Date().toISOString(),
      }

      // Check if event was cancelled or modified
      if (calendarEvent.status === "cancelled") {
        updates.status = "cancelled"
        updates.calendarStatus = "cancelled"
      }

      await updateDoc(doc(db, "bookings", bookingId), updates)

      return NextResponse.json({
        success: true,
        booking: { ...bookingData, ...updates },
        calendarEvent,
      })
    } catch (error) {
      // Event might have been deleted
      await updateDoc(doc(db, "bookings", bookingId), {
        calendarStatus: "deleted",
        lastSyncedAt: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        booking: { ...bookingData, calendarStatus: "deleted" },
      })
    }
  } catch (error) {
    console.error("Error syncing booking with calendar:", error)
    return NextResponse.json({ error: "Failed to sync booking" }, { status: 500 })
  }
}
