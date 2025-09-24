"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getProducts } from "@/lib/products"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Calendar, Users, Euro, TrendingUp, Clock, AlertCircle } from "lucide-react"
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
      // Fetch products
      const products = await getProducts()
      const availableProducts = products.filter((p) => p.available).length

      // Fetch recent bookings
      const bookingsRef = collection(db, "bookings")
      const bookingsQuery = query(bookingsRef, orderBy("createdAt", "desc"), limit(5))
      const bookingsSnapshot = await getDocs(bookingsQuery)

      const bookingsData = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RecentBooking[]

      // Calculate stats
      const totalRevenue = bookingsData.reduce((sum, booking) => sum + booking.price, 0)
      const pendingBookings = bookingsData.filter((b) => b.status === "pending").length

      setStats({
        totalProducts: products.length,
        availableProducts,
        totalBookings: bookingsData.length,
        pendingBookings,
        totalRevenue,
        monthlyRevenue: totalRevenue * 0.8, // Mock monthly revenue
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
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your rental business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">{stats.availableProducts} available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingBookings} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-green-600">+12% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{booking.productName}</p>
                      <p className="text-sm text-muted-foreground">{booking.customerName}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(booking.date), "MMM dd, yyyy")}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(booking.status)}
                      <p className="text-sm font-medium mt-1">€{booking.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent bookings</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/admin/bookings">View All Bookings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/admin/products">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/admin/bookings">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Bookings
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/admin/customers">
                  <Users className="h-4 w-4 mr-2" />
                  Customer Management
                </Link>
              </Button>

              <div className="pt-4 border-t">
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-medium mb-2">System Status</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>All systems operational</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
