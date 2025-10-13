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
    <header className="sticky top-0 z-50 glass-effect border-b border-border/40 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="group">
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent transition-all group-hover:scale-105">
                  MaVi
                </div>
                <div className="text-3xl font-light text-foreground transition-all group-hover:scale-105">Rent</div>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="relative text-sm font-medium text-muted-foreground hover:text-[rgb(var(--mavi-blue))] transition-colors group">
                Products
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] transition-all group-hover:w-full"></span>
              </Link>
              {user && (
                <Link href="/admin" className="relative text-sm font-medium text-muted-foreground hover:text-[rgb(var(--mavi-blue))] transition-colors group">
                  Admin
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] transition-all group-hover:w-full"></span>
                </Link>
              )}
              <a href="#contact" className="relative text-sm font-medium text-muted-foreground hover:text-[rgb(var(--mavi-blue))] transition-colors group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] transition-all group-hover:w-full"></span>
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAuthAction}
              className="hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] transition-all"
            >
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
          </div>
        </div>
      </div>
    </header>
  )
}
