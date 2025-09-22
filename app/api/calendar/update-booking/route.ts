import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { GoogleCalendarAPI } from "@/lib/google-calendar"

export async function POST(request: NextRequest) {
  try {
    const { bookingId, updates } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    // Get booking from Firebase
    const bookingDoc = await getDoc(doc(db, "bookings", bookingId))

    if (!bookingDoc.exists()) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const bookingData = bookingDoc.data()
    const calendarAPI = new GoogleCalendarAPI()
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary"

    // Update Firebase booking
    await updateDoc(doc(db, "bookings", bookingId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    })

    // Update Google Calendar event if it exists
    if (bookingData.calendarEventId) {
      try {
        const calendarUpdates: any = {}

        if (updates.status === "cancelled") {
          // Cancel the calendar event
          await calendarAPI.deleteEvent(calendarId, bookingData.calendarEventId)

          await updateDoc(doc(db, "bookings", bookingId), {
            calendarStatus: "cancelled",
          })
        } else {
          // Update event details if needed
          if (updates.date || updates.startTime || updates.endTime) {
            const newDate = updates.date || bookingData.date
            const newStartTime = updates.startTime || bookingData.startTime
            const newEndTime = updates.endTime || bookingData.endTime

            const startDateTime = new Date(`${newDate}T${newStartTime}:00`)
            const endDateTime = new Date(`${newDate}T${newEndTime}:00`)

            calendarUpdates.start = {
              dateTime: startDateTime.toISOString(),
              timeZone: "Europe/Amsterdam",
            }
            calendarUpdates.end = {
              dateTime: endDateTime.toISOString(),
              timeZone: "Europe/Amsterdam",
            }
          }

          if (Object.keys(calendarUpdates).length > 0) {
            const result = await calendarAPI.updateEvent(calendarId, bookingData.calendarEventId, calendarUpdates)

            if (result.success) {
              await updateDoc(doc(db, "bookings", bookingId), {
                calendarStatus: "updated",
              })
            }
          }
        }
      } catch (calendarError) {
        console.error("Error updating calendar event:", calendarError)
        await updateDoc(doc(db, "bookings", bookingId), {
          calendarStatus: "sync_failed",
          calendarError: calendarError instanceof Error ? calendarError.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}
