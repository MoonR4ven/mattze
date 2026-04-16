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

    const addDaysToDateString = (dateString: string, days: number): string => {
      const [year, month, day] = dateString.split("-").map(Number)
      const date = new Date(year, month - 1, day)
      date.setDate(date.getDate() + days)
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, "0")
      const dd = String(date.getDate()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}`
    }

    // Update Firebase booking
    await updateDoc(doc(db, "bookings", bookingId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    })

    // Update Google Calendar event if it exists
    if (bookingData.calendarEventId) {
      try {
        const calendarUpdates: {
          start?: { dateTime: string; timeZone: string }
          end?: { dateTime: string; timeZone: string }
          location?: string
        } = {}

        if (updates.status === "cancelled") {
          // Cancel the calendar event
          await calendarAPI.deleteEvent(calendarId, bookingData.calendarEventId)

          await updateDoc(doc(db, "bookings", bookingId), {
            calendarStatus: "cancelled",
          })
        } else {
          // Update event details if needed
          if (updates.date || updates.startDate || updates.endDate || updates.startTime || updates.endTime || updates.endDayOffset != null) {
            const newStartDate = updates.startDate || updates.date || bookingData.startDate || bookingData.date
            const baseEndDate = updates.endDate || bookingData.endDate || bookingData.date || newStartDate
            const endDayOffset = updates.endDayOffset != null ? Number(updates.endDayOffset) : (bookingData.endDayOffset || 0)
            const resolvedEndDate = addDaysToDateString(baseEndDate, Number.isFinite(endDayOffset) ? endDayOffset : 0)
            const newStartTime = updates.startTime || bookingData.startTime
            const newEndTime = updates.endTime || bookingData.endTime

            const startDateTime = new Date(`${newStartDate}T${newStartTime}:00`)
            const endDateTime = new Date(`${resolvedEndDate}T${newEndTime}:00`)

            calendarUpdates.start = {
              dateTime: startDateTime.toISOString(),
              timeZone: "Europe/Amsterdam",
            }
            calendarUpdates.end = {
              dateTime: endDateTime.toISOString(),
              timeZone: "Europe/Amsterdam",
            }
          }

          if (updates.location) {
            calendarUpdates.location = updates.location
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
