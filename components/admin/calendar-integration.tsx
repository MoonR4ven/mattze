"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Clock, X } from "lucide-react"

// Helper to safely convert Firestore timestamp to string
const toTimeString = (value: any): string => {
  if (!value) return "00:00"
  try {
    // If it's a Firestore Timestamp, convert to Date first
    if (value.toDate && typeof value.toDate === 'function') {
      return value.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    // If it's already a string, return it
    if (typeof value === 'string') return value
    // If it's a Date, format it
    if (value instanceof Date) return value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch (e) {
    console.error('Error converting time:', e)
  }
  return "00:00"
}

interface Booking {
  id: string
  calendarEventId?: string
  calendarStatus?: string
  calendarError?: string
  productName: string
  customerName: string
  customerEmail: string
  date: string
  startTime: string
  endTime: string
  status: string
}

interface CalendarIntegrationProps {
  booking: Booking
  onBookingUpdate: (updatedBooking: Booking) => void
}

export function CalendarIntegration({ booking, onBookingUpdate }: CalendarIntegrationProps) {
  const [syncing, setSyncing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSyncBooking = async () => {
    setSyncing(true)
    setError(null)

    try {
      const response = await fetch("/api/calendar/sync-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      const result = await response.json()

      if (result.success) {
        onBookingUpdate(result.booking)
      } else {
        setError(result.error || "Failed to sync booking")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Sync error:", err)
    } finally {
      setSyncing(false)
    }
  }

  const handleCancelBooking = async () => {
    setCancelling(true)
    setError(null)

    try {
      const response = await fetch("/api/calendar/update-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          updates: { status: "cancelled" },
        }),
      })

      const result = await response.json()

      if (result.success) {
        onBookingUpdate({ ...booking, status: "cancelled", calendarStatus: "cancelled" })
      } else {
        setError("Failed to cancel booking")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Cancel error:", err)
    } finally {
      setCancelling(false)
    }
  }

  const getCalendarStatusBadge = (status?: string) => {
    switch (status) {
      case "created":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Created
          </Badge>
        )
      case "updated":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Updated
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "deleted":
        return <Badge variant="destructive">Deleted</Badge>
      case "failed":
      case "sync_failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "created":
      case "updated":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "cancelled":
      case "deleted":
      case "failed":
      case "sync_failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-[rgb(var(--mavi-bright-blue))]" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDateTime = (date: string, time: string) => {
    return new Date(`${date}T${time}:00`).toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="bg-slate-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Calendar Status</label>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(booking.calendarStatus)}
              {getCalendarStatusBadge(booking.calendarStatus)}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Event ID</label>
            <div className="mt-1">
              {booking.calendarEventId ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-mono text-muted-foreground">
                    {booking.calendarEventId.slice(0, 12)}...
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              ) : (
                <span className="text-muted-foreground">Not created</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Booking Details</label>
          <div className="bg-muted/50 p-3 rounded-md space-y-1 text-sm">
            <div>
              <strong>Product:</strong> {booking.productName}
            </div>
            <div>
              <strong>Customer:</strong> {booking.customerName}
            </div>
            <div>
              <strong>Email:</strong> {booking.customerEmail}
            </div>
            <div>
              <strong>Time:</strong> {formatDateTime(booking.date, booking.startTime)} - {toTimeString(booking.endTime)}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncBooking}
            disabled={syncing || !booking.calendarEventId}
          >
            {syncing ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Status
              </>
            )}
          </Button>

          {booking.status !== "cancelled" && (
            <Button variant="destructive" size="sm" onClick={handleCancelBooking} disabled={cancelling}>
              {cancelling ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Cancel Booking
                </>
              )}
            </Button>
          )}
        </div>

        {booking.calendarError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Calendar Error:</strong> {booking.calendarError}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Calendar events are automatically created after payment confirmation</p>
          <p>• Customers receive email invitations with booking details</p>
          <p>• Use sync button to update status from Google Calendar</p>
        </div>
      </CardContent>
    </Card>
  )
}
