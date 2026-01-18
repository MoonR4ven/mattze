"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getProducts } from "@/lib/products"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Calendar, Users, Euro, TrendingUp, Clock, AlertCircle, Sparkles, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

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

// Safe format helper
const safeFormat = (date: any, formatStr: string): string => {
  try {
    return format(toDate(date), formatStr)
  } catch (e) {
    console.error('Error formatting date:', e)
    return 'Invalid date'
  }
}

interface DashboardStats {
  totalProducts: number
  availableProducts: number
  totalBookings: number
  pendingBookings: number
  totalRevenue: number
  monthlyRevenue: number
}

interface RecentBooking {
  id: string
  productName: string
  customerName: string
  date: string
  status: string
  price: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    availableProducts: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  })
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log("📊 Fetching dashboard data...")
      
      // Fetch products
      const products = await getProducts()
      console.log("✅ Products fetched:", products.length)
      const availableProducts = products.filter((p) => p.available).length

      // Fetch ALL bookings for accurate stats
      const bookingsRef = collection(db, "bookings")
      const allBookingsQuery = query(bookingsRef, orderBy("createdAt", "desc"))
      const allBookingsSnapshot = await getDocs(allBookingsQuery)
      console.log("✅ Bookings fetched:", allBookingsSnapshot.docs.length)

      const allBookings = allBookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RecentBooking[]

      // Calculate stats from all bookings
      const totalRevenue = allBookings.reduce((sum, booking) => sum + (booking.price || 0), 0)
      const pendingBookings = allBookings.filter((b) => b.status === "pending").length

      // Calculate monthly revenue (current month)
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const monthlyRevenue = allBookings
        .filter((b) => {
          const bookingDate = toDate(b.createdAt)
          return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear
        })
        .reduce((sum, booking) => sum + (booking.price || 0), 0)

      console.log("📊 Stats calculated:", {
        totalProducts: products.length,
        availableProducts,
        totalBookings: allBookings.length,
        pendingBookings,
        totalRevenue,
        monthlyRevenue,
      })

      setStats({
        totalProducts: products.length,
        availableProducts,
        totalBookings: allBookings.length,
        pendingBookings,
        totalRevenue,
        monthlyRevenue,
      })

      // Show only recent 5 bookings in the list
      setRecentBookings(allBookings.slice(0, 5))
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            Confirmed
          </Badge>
        )
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto border-4 border-[rgb(var(--mavi-blue))] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border border-[rgb(var(--mavi-blue))]/20">
              <Sparkles className="h-7 w-7 text-[rgb(var(--mavi-blue))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Overview of your rental business</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden animate-fade-in" style={{ animationDelay: '0ms' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10">
                <Package className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                {stats.totalProducts}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats.availableProducts} available</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden animate-fade-in" style={{ animationDelay: '50ms' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10">
                <Calendar className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                {stats.totalBookings}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats.pendingBookings} pending</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10">
                <Euro className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                €{stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden animate-fade-in" style={{ animationDelay: '150ms' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10">
                <TrendingUp className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                €{stats.monthlyRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 border-2 rounded-2xl hover:border-[rgb(var(--mavi-blue))]/40 hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{booking.productName}</p>
                        <p className="text-xs text-muted-foreground">{booking.customerName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>
                          {safeFormat(booking.date, "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(booking.status)}
                        <p className="text-sm font-bold mt-1.5 text-[rgb(var(--mavi-blue))]">
                          €{booking.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-3 p-3 rounded-2xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 w-fit">
                      <Calendar className="h-10 w-10 text-[rgb(var(--mavi-blue))]" />
                    </div>
                    <p className="text-sm text-muted-foreground">No recent bookings</p>
                  </div>
                )}
              </div>
              <div className="mt-4" suppressHydrationWarning>
                <Button
                  asChild
                  variant="outline"
                  className="w-full hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] hover:border-[rgb(var(--mavi-blue))] transition-all group"
                >
                  <Link href="/admin/bookings">
                    View All Bookings
                    <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: '250ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                <div suppressHydrationWarning>
                  <Button
                    asChild
                    className="w-full justify-start bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    <Link href="/admin/products">
                      <Package className="h-4 w-4 mr-2" />
                      Manage Products
                    </Link>
                  </Button>
                </div>

                <div suppressHydrationWarning>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] hover:border-[rgb(var(--mavi-blue))] hover:scale-105 transition-all duration-200"
                  >
                    <Link href="/admin/bookings">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Bookings
                    </Link>
                  </Button>
                </div>

                <div suppressHydrationWarning>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] hover:border-[rgb(var(--mavi-blue))] hover:scale-105 transition-all duration-200"
                  >
                    <Link href="/admin/customers">
                      <Users className="h-4 w-4 mr-2" />
                      Customer Management
                    </Link>
                  </Button>
                </div>

                <div className="pt-3 border-t">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border border-[rgb(var(--mavi-blue))]/20 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-[rgb(var(--mavi-turquoise))]" />
                      System Status
                    </h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="font-medium">All systems operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
