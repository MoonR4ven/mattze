import { google } from "googleapis"

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
  private calendar: any
  private auth: any

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
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event,
        sendUpdates: "all", // Send email notifications to attendees
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

  async getEvent(calendarId: string, eventId: string): Promise<any> {
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
  ): Promise<{ success: boolean; events?: any[]; error?: string }> {
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
    date: string
    startTime: string
    endTime: string
    price: number
    orderId: string
    notes?: string
  }): CalendarEvent {
    const startDateTime = new Date(`${booking.date}T${booking.startTime}:00`)
    const endDateTime = new Date(`${booking.date}T${booking.endTime}:00`)

    return {
      summary: `${booking.productName} - ${booking.customerName}`,
      description: `
Rental Booking Details:
• Product: ${booking.productName}
• Customer: ${booking.customerName}
• Email: ${booking.customerEmail}
• Price: €${booking.price.toFixed(2)}
• Order ID: ${booking.orderId}
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
      location: "Delivery/Pickup Location (TBD)",
    }
  }
}
