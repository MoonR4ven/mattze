import { google, calendar_v3 } from "googleapis"

export interface CalendarEvent {
  id?: string
  summary: string
  description: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  location?: string
}

export class GoogleCalendarAPI {
  private calendar: calendar_v3.Calendar
  private auth: InstanceType<typeof google.auth.GoogleAuth>

  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
      },
      scopes: ["https://www.googleapis.com/auth/calendar"],
    })

    this.calendar = google.calendar({ version: "v3", auth: this.auth })
  }

  async createEvent(
    calendarId: string,
    event: CalendarEvent,
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Remove attendees - service account cannot invite external attendees without Domain-Wide Delegation
      const eventData = { ...event }
      delete eventData.attendees

      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: eventData,
        // Don't send updates since we're not inviting external attendees
      })

      return {
        success: true,
        eventId: response.data.id,
      }
    } catch (error) {
      console.error("Error creating Google Calendar event:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<CalendarEvent>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: event,
        sendUpdates: "all",
      })

      return { success: true }
    } catch (error) {
      console.error("Error updating Google Calendar event:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: "all",
      })

      return { success: true }
    } catch (error) {
      console.error("Error deleting Google Calendar event:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getEvent(calendarId: string, eventId: string): Promise<calendar_v3.Schema$Event | undefined> {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId,
      })

      return response.data
    } catch (error) {
      console.error("Error fetching Google Calendar event:", error)
      throw error
    }
  }

  async listEvents(
    calendarId: string,
    timeMin?: string,
    timeMax?: string,
  ): Promise<{ success: boolean; events?: calendar_v3.Schema$Event[]; error?: string }> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
      })

      return {
        success: true,
        events: response.data.items || [],
      }
    } catch (error) {
      console.error("Error listing Google Calendar events:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  createBookingEvent(booking: {
    productName: string
    customerName: string
    customerEmail: string
    date?: string
    startDate?: string
    endDate?: string
    startTime: string
    endTime: string
    endDayOffset?: number
    price: number
    orderId: string
    notes?: string
    location?: string
    fulfillmentOption?: string
  }): CalendarEvent {
    const addDaysToDateString = (dateString: string, days: number): string => {
      const [year, month, day] = dateString.split("-").map(Number)
      const date = new Date(year, month - 1, day)
      date.setDate(date.getDate() + days)
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, "0")
      const dd = String(date.getDate()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}`
    }

    const startDate = booking.startDate || booking.date
    if (!startDate) {
      throw new Error("Missing booking start date")
    }

    const baseEndDate = booking.endDate || booking.date || startDate
    const endDate = addDaysToDateString(baseEndDate, booking.endDayOffset ?? 0)

    const startDateTime = new Date(`${startDate}T${booking.startTime}:00`)
    let endDateTime = new Date(`${endDate}T${booking.endTime}:00`)

    if (endDateTime <= startDateTime) {
      endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)
    }

    const fulfillmentLabel = booking.fulfillmentOption
      ? ({
          "self-collection": "Self-collection",
          "delivery-collection": "Delivery + collection",
          "delivery-assembly": "Delivery + setup + collection",
        }[booking.fulfillmentOption] || booking.fulfillmentOption)
      : ""
    const fulfillmentLine = fulfillmentLabel ? `• Fulfillment: ${fulfillmentLabel}` : ""
    const locationLine = booking.location ? `• Location: ${booking.location}` : ""

    return {
      summary: `${booking.productName} - ${booking.customerName}`,
      description: `
Rental Booking Details:
• Product: ${booking.productName}
• Customer: ${booking.customerName}
• Email: ${booking.customerEmail}
• Price: €${booking.price.toFixed(2)}
• Order ID: ${booking.orderId}
${fulfillmentLine}
${locationLine}
${booking.notes ? `• Notes: ${booking.notes}` : ""}

This is an automated booking from the rental system.
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "Europe/Amsterdam",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "Europe/Amsterdam",
      },
      attendees: [
        {
          email: booking.customerEmail,
          displayName: booking.customerName,
        },
      ],
      location: booking.location || "",
    }
  }

  generateGoogleCalendarLink(event: CalendarEvent): string {
    const startTime = event.start.dateTime
    const endTime = event.end.dateTime
    
    // Format: YYYYMMDDTHHMMSSZ
    const startFormatted = startTime.replace(/[-:]/g, '').split('.')[0] + 'Z'
    const endFormatted = endTime.replace(/[-:]/g, '').split('.')[0] + 'Z'
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.summary,
      details: event.description,
      location: event.location || '',
      starttime: startFormatted,
      endtime: endFormatted,
    })
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }
}
