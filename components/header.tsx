"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart, User } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import Link from "next/link"

export function Header() {
  const { getTotalItems } = useCart()
  const totalItems = getTotalItems()

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-2xl font-bold cursor-pointer">MAVI-RENT</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Products
              </Link>
              <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground">
                Admin
              </Link>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
            <Link href="/cart">
              <Button variant="outline" size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({totalItems})
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
