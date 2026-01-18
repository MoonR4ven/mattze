"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getBookingsForDate, type Booking } from "@/lib/bookings"
import { format } from "date-fns"
import { CalendarDays, Clock } from "lucide-react"

interface BookingCalendarProps {
  productId: string
  productName: string
}

export function BookingCalendar({ productId, productName }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadBookingsForDate()
  }, [selectedDate, productId])

  const loadBookingsForDate = async () => {
    setLoading(true)
    try {
      const dateString = format(selectedDate, "yyyy-MM-dd")
      const dayBookings = await getBookingsForDate(productId, dateString)
      setBookings(dayBookings)
    } catch (error) {
      console.error("Error loading bookings:", error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500"
      case "pending":
        return "bg-[rgb(var(--mavi-bright-blue))]"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-[rgb(var(--mavi-gray))]"
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card className="bg-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Bookings for {format(selectedDate, "MMM dd, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No bookings for this date</div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">
                      {booking.startTime} - {booking.endTime}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.customerName} ({booking.customerEmail})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`${getStatusColor(booking.status)} text-white`}>
                      {booking.status}
                    </Badge>
                    <span className="text-sm font-medium">€{booking.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
