"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/contexts/i18n-context"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIntegration } from "@/components/admin/calendar-integration"
import { Calendar, Clock, User, Package, Search, Filter, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { t } = useI18n()

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

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive" className="border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="border-orange-200 text-orange-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#d9d9d9]">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-[rgb(var(--mavi-blue))] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">{t("admin.loadingBookings")}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#d9d9d9]">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border border-[rgb(var(--mavi-blue))]/20">
              <Calendar className="h-7 w-7 text-[rgb(var(--mavi-blue))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                {t("admin.bookings")}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{t("admin.manageRentalBookings")}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 hover:shadow-md transition-all cursor-pointer bg-slate-100">
              <CardContent className="p-2.5 text-center">
                <div className="text-xs text-muted-foreground">{t("admin.totalBookings")}</div>
                <div className="text-4xl font-bold text-[rgb(var(--mavi-blue))]">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-green-300 hover:shadow-md transition-all cursor-pointer bg-slate-100">
              <CardContent className="p-2.5 text-center">
                <div className="text-xs text-muted-foreground">Confirmed</div>
                <div className="text-4xl font-bold text-green-600">{stats.confirmed}</div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer bg-slate-100">
              <CardContent className="p-2.5 text-center">
                <div className="text-xs text-muted-foreground">{t("admin.pendingBookings")}</div>
                <div className="text-4xl font-bold text-orange-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-red-300 hover:shadow-md transition-all cursor-pointer bg-slate-100">
              <CardContent className="p-2.5 text-center">
                <div className="text-xs text-muted-foreground">Cancelled</div>
                <div className="text-4xl font-bold text-red-600">{stats.cancelled}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 border-2"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 border-2">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t("admin.filterStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allStatus")}</SelectItem>
                <SelectItem value="pending">{t("admin.pendingStatus")}</SelectItem>
                <SelectItem value="confirmed">{t("admin.confirmedStatus")}</SelectItem>
                <SelectItem value="completed">{t("admin.completedStatus")}</SelectItem>
                <SelectItem value="cancelled">{t("admin.cancelledStatus")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bookings Table */}
        <Card className="border-2">
          <CardContent className="p-0">
            {filteredBookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">{t("admin.product")}</TableHead>
                    <TableHead className="font-semibold">{t("admin.customer")}</TableHead>
                    <TableHead className="font-semibold">{t("admin.dateTime")}</TableHead>
                    <TableHead className="font-semibold">{t("admin.price")}</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">{t("admin.orderId")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow
                      key={booking.id}
                      className="hover:bg-[rgb(var(--mavi-blue))]/5 transition-colors cursor-pointer"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
                          <span className="max-w-[200px] truncate">{booking.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{booking.customerName}</div>
                            <div className="text-xs text-muted-foreground truncate">{booking.customerEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium" suppressHydrationWarning>
                            {safeFormat(booking.date, "MMM dd, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
                            <Clock className="h-3 w-3" />
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-[rgb(var(--mavi-blue))]">€{booking.price.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{booking.orderId.substring(0, 8)}</code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">{t("admin.noBookingsFound")}</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? t("admin.adjustFilters")
                    : t("admin.bookingsWillAppear")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
