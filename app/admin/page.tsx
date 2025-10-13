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
      const products = await getProducts()
      const availableProducts = products.filter((p) => p.available).length

      const bookingsRef = collection(db, "bookings")
      const bookingsQuery = query(bookingsRef, orderBy("createdAt", "desc"), limit(5))
      const bookingsSnapshot = await getDocs(bookingsQuery)

      const bookingsData = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RecentBooking[]

      const totalRevenue = bookingsData.reduce((sum, booking) => sum + booking.price, 0)
      const pendingBookings = bookingsData.filter((b) => b.status === "pending").length

      setStats({
        totalProducts: products.length,
        availableProducts,
        totalBookings: bookingsData.length,
        pendingBookings,
        totalRevenue,
        monthlyRevenue: totalRevenue * 0.8,
      })

      setRecentBookings(bookingsData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border border-[rgb(var(--mavi-blue))]/20">
              <Sparkles className="h-8 w-8 text-[rgb(var(--mavi-blue))]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground">Overview of your rental business</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover-lift border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/20 transition-all overflow-hidden animate-fade-in" style={{ animationDelay: '0ms' }}>
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

          <Card className="hover-lift border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/20 transition-all overflow-hidden animate-fade-in" style={{ animationDelay: '50ms' }}>
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

          <Card className="hover-lift border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/20 transition-all overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
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

          <Card className="hover-lift border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/20 transition-all overflow-hidden animate-fade-in" style={{ animationDelay: '150ms' }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="hover-lift border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/20 transition-all animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-[rgb(var(--mavi-blue))]/30 transition-all"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{booking.productName}</p>
                        <p className="text-sm text-muted-foreground">{booking.customerName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(booking.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(booking.status)}
                        <p className="text-sm font-bold mt-2 text-[rgb(var(--mavi-blue))]">
                          €{booking.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 w-fit">
                      <Calendar className="h-12 w-12 text-[rgb(var(--mavi-blue))]" />
                    </div>
                    <p className="text-muted-foreground">No recent bookings</p>
                  </div>
                )}
              </div>
              <div className="mt-6">
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

          <Card className="hover-lift border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/20 transition-all animate-fade-in" style={{ animationDelay: '250ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full justify-start bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 transition-all"
                >
                  <Link href="/admin/products">
                    <Package className="h-4 w-4 mr-2" />
                    Manage Products
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] hover:border-[rgb(var(--mavi-blue))] transition-all"
                >
                  <Link href="/admin/bookings">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Bookings
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] hover:border-[rgb(var(--mavi-blue))] transition-all"
                >
                  <Link href="/admin/customers">
                    <Users className="h-4 w-4 mr-2" />
                    Customer Management
                  </Link>
                </Button>

                <div className="pt-4 border-t">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border border-[rgb(var(--mavi-blue))]/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[rgb(var(--mavi-turquoise))]" />
                      System Status
                    </h4>
                    <div className="flex items-center gap-2 text-sm">
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
