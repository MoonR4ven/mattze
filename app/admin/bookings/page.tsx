"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, addDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/contexts/i18n-context"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, Package, Search, Filter, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { getProducts } from "@/lib/products"
import type { Product } from "@/lib/types"
import { toast } from "sonner"

interface Booking {
  id: string
  orderId: string
  productId: string
  productName: string
  date: string
  startDate?: string
  endDate?: string
  endDayOffset?: number
  startTime: string
  endTime: string
  customerEmail: string
  customerName: string
  status: string
  price: number
  quantity?: number
  location?: string
  source?: string
  createdAt: string
  calendarEventId?: string
  calendarStatus?: string
  calendarError?: string
}

// Helper to safely convert Firestore timestamp to Date
const toDate = (value: unknown): Date => {
  if (!value) return new Date()
  try {
    // Firestore Timestamp has toDate() method
    if (typeof value === "object" && value !== null && "toDate" in value) {
      const maybeTimestamp = value as { toDate?: () => Date }
      if (typeof maybeTimestamp.toDate === "function") {
        return maybeTimestamp.toDate()
      }
    }
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
const safeFormat = (date: unknown, formatStr: string): string => {
  try {
    return format(toDate(date), formatStr)
  } catch (e) {
    console.error('Error formatting date:', e)
    return "N/A"
  }
}

// Safe format helper for start/end times
const formatTime = (time: unknown): string => {
  if (!time) return "00:00"
  try {
    if (typeof time === "string") return time
    if (typeof time === "object" && time !== null && "toDate" in time) {
      const maybeTimestamp = time as { toDate?: () => Date }
      if (typeof maybeTimestamp.toDate === "function") {
        return maybeTimestamp.toDate().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
      }
    }
    if (time instanceof Date) return time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  } catch (e) {
    console.error('Error formatting time:', e)
  }
  return "00:00"
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [blocking, setBlocking] = useState(false)
  const [statusSyncing, setStatusSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [blockProductId, setBlockProductId] = useState<string>("")
  const [blockStartDate, setBlockStartDate] = useState<string>("")
  const [blockEndDate, setBlockEndDate] = useState<string>("")
  const [blockQuantity, setBlockQuantity] = useState<number>(1)
  const [blockNotes, setBlockNotes] = useState<string>("")
  const { t } = useI18n()

  // Initial load only.
  useEffect(() => {
    fetchData()
    // fetchData is intentionally omitted to avoid re-fetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addDaysToDateString = (dateString: string, days: number): string => {
    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    date.setDate(date.getDate() + days)
    return format(date, "yyyy-MM-dd")
  }

  const getBookingEndDateTime = (booking: Booking): Date | null => {
    const startDate = booking.startDate || booking.date
    const rawEndDate = booking.endDate || booking.date || startDate
    const endOffset = Number.isFinite(Number(booking.endDayOffset)) ? Number(booking.endDayOffset) : 0
    if (!startDate || !rawEndDate) return null

    try {
      const resolvedEndDate = addDaysToDateString(rawEndDate, endOffset)
      return new Date(`${resolvedEndDate}T${formatTime(booking.endTime)}:00`)
    } catch {
      return null
    }
  }

  const normalizeBookingStatuses = async (sourceBookings: Booking[]): Promise<Booking[]> => {
    const now = new Date()
    const normalized = [...sourceBookings]
    const updates: Promise<void>[] = []

    setStatusSyncing(true)
    try {
      normalized.forEach((booking, index) => {
        const endDateTime = getBookingEndDateTime(booking)
        if (!endDateTime) return

        let targetStatus = booking.status

        if ((booking.status === "confirmed" || booking.status === "pending") && endDateTime <= now) {
          targetStatus = "completed"
        }

        if (booking.status === "completed" && endDateTime > now) {
          targetStatus = "confirmed"
        }

        if (targetStatus !== booking.status) {
          normalized[index] = { ...booking, status: targetStatus }
          updates.push(
            updateDoc(doc(db, "bookings", booking.id), {
              status: targetStatus,
              updatedAt: new Date().toISOString(),
            }) as Promise<void>,
          )
        }
      })

      if (updates.length > 0) {
        await Promise.all(updates)
      }

      return normalized
    } finally {
      setStatusSyncing(false)
    }
  }

  const fetchBookings = async (): Promise<Booking[]> => {
    try {
      const bookingsRef = collection(db, "bookings")
      const q = query(bookingsRef, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const bookingsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[]

      return bookingsData
    } catch (error) {
      console.error("Error fetching bookings:", error)
      return []
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [bookingsData, productsData] = await Promise.all([fetchBookings(), getProducts()])
      setProducts(productsData)
      const normalizedBookings = await normalizeBookingStatuses(bookingsData)
      setBookings(normalizedBookings)
    } catch (error) {
      console.error("Error loading bookings admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateManualBlocks = async () => {
    if (!blockProductId || !blockStartDate) {
      toast.error("Please choose product and start date")
      return
    }

    const selectedProduct = products.find((product) => product.id === blockProductId)
    if (!selectedProduct) {
      toast.error("Selected product was not found")
      return
    }

    const start = new Date(`${blockStartDate}T00:00:00`)
    const end = new Date(`${(blockEndDate || blockStartDate)}T00:00:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      toast.error("Invalid date range")
      return
    }

    const startTime = selectedProduct.bookingStartTime || "00:00"
    const endTime = selectedProduct.bookingEndTime || "23:59"
    const endDayOffset = selectedProduct.bookingEndDayOffset ?? 0
    const qty = Math.max(1, Math.floor(blockQuantity || 1))

    try {
      setBlocking(true)
      const cursor = new Date(start)
      let created = 0

      while (cursor <= end) {
        const dateString = format(cursor, "yyyy-MM-dd")

        await addDoc(collection(db, "bookings"), {
          orderId: `MANUAL-${Date.now()}-${created + 1}`,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          date: dateString,
          startDate: dateString,
          endDate: dateString,
          startTime,
          endTime,
          endDayOffset,
          customerEmail: "manual.block@internal.local",
          customerName: "Manual block",
          status: "blocked",
          quantity: qty,
          price: 0,
          source: "manual",
          location: "Manual / phone booking",
          notes: blockNotes.trim() || undefined,
          createdAt: new Date().toISOString(),
          calendarStatus: "not_linked",
        })

        created += 1
        cursor.setDate(cursor.getDate() + 1)
      }

      toast.success(`Blocked ${created} day(s) for ${selectedProduct.name}`)
      setBlockStartDate("")
      setBlockEndDate("")
      setBlockQuantity(1)
      setBlockNotes("")
      await fetchData()
    } catch (error) {
      console.error("Error creating manual blocks:", error)
      toast.error("Failed to create day blocks")
    } finally {
      setBlocking(false)
    }
  }

  const handleUnblock = async (bookingId: string) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      })
      setBookings((prev) => prev.map((booking) => booking.id === bookingId ? { ...booking, status: "cancelled" } : booking))
      toast.success("Day block removed")
    } catch (error) {
      console.error("Error unblocking booking:", error)
      toast.error("Failed to remove day block")
    }
  }

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.customerEmail || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    blocked: bookings.filter((b) => b.status === "blocked").length,
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
      case "blocked":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Blocked
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

          {statusSyncing && (
            <div className="mb-3 text-xs text-muted-foreground">
              Syncing booking status based on booking dates...
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
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
            <Card className="border-2 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer bg-slate-100">
              <CardContent className="p-2.5 text-center">
                <div className="text-xs text-muted-foreground">Blocked</div>
                <div className="text-4xl font-bold text-amber-600">{stats.blocked}</div>
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
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cancelled">{t("admin.cancelledStatus")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Manual Day Blocking */}
          <Card className="mt-4 border-2 bg-slate-100">
            <CardHeader>
              <CardTitle className="text-base">Block Product Day-by-Day (Manual / Phone Orders)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Product</Label>
                  <Select value={blockProductId} onValueChange={setBlockProductId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Choose product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Start date</Label>
                  <Input type="date" value={blockStartDate} onChange={(e) => setBlockStartDate(e.target.value)} className="h-10" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">End date</Label>
                  <Input type="date" value={blockEndDate} onChange={(e) => setBlockEndDate(e.target.value)} className="h-10" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Blocked quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={blockQuantity}
                    onChange={(e) => setBlockQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Notes (optional)</Label>
                  <Input value={blockNotes} onChange={(e) => setBlockNotes(e.target.value)} placeholder="Phone booking, marketplace, etc." className="h-10" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCreateManualBlocks}
                  disabled={blocking}
                  className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black"
                >
                  {blocking ? "Blocking..." : "Create Day Blocks"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Table */}
        <Card className="border-2">
          <CardContent className="p-0">
            {filteredBookings.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">{t("admin.product")}</TableHead>
                    <TableHead className="font-semibold">{t("admin.customer")}</TableHead>
                    <TableHead className="font-semibold">{t("admin.dateTime")}</TableHead>
                    <TableHead className="font-semibold">Qty</TableHead>
                    <TableHead className="font-semibold">{t("admin.price")}</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">{t("admin.orderId")}</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
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
                      <TableCell>{booking.quantity || 1}</TableCell>
                      <TableCell className="font-bold text-[rgb(var(--mavi-blue))]">€{booking.price.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{booking.orderId ? booking.orderId.substring(0, 8) : "-"}</code>
                      </TableCell>
                      <TableCell>
                        {booking.status === "blocked" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7"
                            onClick={() => handleUnblock(booking.id)}
                          >
                            Unblock
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
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
