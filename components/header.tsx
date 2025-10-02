"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart, User, LogOut } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function Header() {
  const { getTotalItems } = useCart()
  const totalItems = getTotalItems()
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleAuthAction = async () => {
    if (user) {
      await signOut()
      router.push("/")
    } else {
      router.push("/login")
    }
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-2xl font-bold cursor-pointer">RentEasy</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Products
              </Link>
              {user && (
                <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              )}
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleAuthAction}>
              {user ? (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Login
                </>
              )}
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
