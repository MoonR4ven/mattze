"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, User, LogOut, Menu, X } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  const { getTotalItems, toggleCart } = useCart()
  const totalItems = getTotalItems()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleAuthAction = async () => {
    if (user) {
      await signOut()
      router.push("/")
    } else {
      router.push("/login")
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 glass-effect border-b-2 border-border/40 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="group">
              <div className="flex items-center gap-2">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent transition-all group-hover:scale-105">
                  MaVi
                </div>
                <div className="text-3xl sm:text-4xl font-light text-foreground transition-all group-hover:scale-105">Rent</div>
              </div>
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/" className="relative text-base font-semibold text-muted-foreground hover:text-[rgb(var(--mavi-blue))] transition-colors group">
                Products
                <span className="absolute -bottom-1 left-0 w-0 h-1 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] rounded-full transition-all group-hover:w-full"></span>
              </Link>
              {user && (
                <Link href="/admin" className="relative text-base font-semibold text-muted-foreground hover:text-[rgb(var(--mavi-blue))] transition-colors group">
                  Admin
                  <span className="absolute -bottom-1 left-0 w-0 h-1 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] rounded-full transition-all group-hover:w-full"></span>
                </Link>
              )}
              <a href="#contact" className="relative text-base font-semibold text-muted-foreground hover:text-[rgb(var(--mavi-blue))] transition-colors group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-1 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] rounded-full transition-all group-hover:w-full"></span>
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="default"
              onClick={handleAuthAction}
              className="hidden sm:flex hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] transition-all"
              suppressHydrationWarning
            >
              {user ? (
                <>
                  <LogOut className="h-5 w-5 mr-2" />
                  <span className="hidden md:inline">Logout</span>
                </>
              ) : (
                <>
                  <User className="h-5 w-5 mr-2" />
                  <span className="hidden md:inline">Login</span>
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="default"
              onClick={toggleCart}
              className="relative hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] transition-all"
              suppressHydrationWarning
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] text-sm font-bold text-white flex items-center justify-center shadow-lg">
                  {totalItems}
                </span>
              )}
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="default" className="lg:hidden hover:bg-[rgb(var(--mavi-blue))]/10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-white">
                <div className="flex flex-col gap-6 mt-8">
                  <Link
                    href="/"
                    className="text-xl font-semibold hover:text-[rgb(var(--mavi-blue))] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </Link>
                  {user && (
                    <Link
                      href="/admin"
                      className="text-xl font-semibold hover:text-[rgb(var(--mavi-blue))] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <a
                    href="#contact"
                    className="text-xl font-semibold hover:text-[rgb(var(--mavi-blue))] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </a>
                  <div className="pt-6 border-t-2">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleAuthAction}
                      className="w-full justify-start hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] transition-all"
                      suppressHydrationWarning
                    >
                      {user ? (
                        <>
                          <LogOut className="h-5 w-5 mr-2" />
                          Logout
                        </>
                      ) : (
                        <>
                          <User className="h-5 w-5 mr-2" />
                          Login
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
