"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIntegration } from "@/components/admin/calendar-integration"
import { Calendar, Clock, User, Package } from "lucide-react"
import { format } from "date-fns"

interface Booking {
  id: string
  orderId: string
  productId: string
  productName: string
  date: string
  startTime: string
  endTime: string
  customerEmail: string
  customerName: string
  status: string
  price: number
  createdAt: string
  calendarEventId?: string
  calendarStatus?: string
  calendarError?: string
}

// Helper to safely convert Firestore timestamp to Date
const toDate = (value: any): Date => {
  if (!value) return new Date()
  try {
    // Firestore Timestamp has toDate() method
    if (value.toDate && typeof value.toDate === 'function') return value.toDate()
    // String date
    if (typeof value === 'string') return new Date(value)
    // Already a Date
    if (value instanceof Date) return value
    // Unix timestamp
    if (typeof value === 'number') return new Date(value)
  } catch (e) {
    console.error('Error converting date:', e)
  }
  return new Date()
}

// Safe format helper for dates
const safeFormat = (date: any, formatStr: string): string => {
  try {
    return format(toDate(date), formatStr)
  } catch (e) {
    console.error('Error formatting date:', e)
    return "N/A"
  }
}

// Safe format helper for start/end times
const formatTime = (time: any): string => {
  if (!time) return "00:00"
  try {
    if (typeof time === 'string') return time
    if (time.toDate && typeof time.toDate === 'function') {
      return time.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    if (time instanceof Date) return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch (e) {
    console.error('Error formatting time:', e)
  }
  return "00:00"
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const bookingsRef = collection(db, "bookings")
      const q = query(bookingsRef, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const bookingsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[]

      setBookings(bookingsData)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookingUpdate = (updatedBooking: Booking) => {
    setBookings((prev) => prev.map((booking) => (booking.id === updatedBooking.id ? updatedBooking : booking)))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading bookings...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Booking Management</h1>
        <p className="text-muted-foreground">Manage rental bookings and calendar integration</p>
      </div>

      <div className="space-y-6">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {booking.productName}
                </CardTitle>
                {getStatusBadge(booking.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Customer</label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{booking.customerName}</div>
                          <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Booking Time</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <div className="font-medium" suppressHydrationWarning>{safeFormat(booking.date, "MMM dd, yyyy")}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
                            <Clock className="h-3 w-3" />
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Price</label>
                      <div className="font-medium mt-1">€{booking.price.toFixed(2)}</div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                      <div className="font-mono text-sm mt-1">{booking.orderId}</div>
                    </div>
                  </div>
                </div>

                <CalendarIntegration booking={booking} onBookingUpdate={handleBookingUpdate} />
              </div>
            </CardContent>
          </Card>
        ))}

        {bookings.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground">Bookings will appear here after customers make reservations.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
