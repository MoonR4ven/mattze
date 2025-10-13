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
  const { getTotalItems } = useCart()
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
    <header className="sticky top-0 z-50 glass-effect border-b border-border/40 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="group">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent transition-all group-hover:scale-105">
                  MaVi
                </div>
                <div className="text-2xl sm:text-3xl font-light text-foreground transition-all group-hover:scale-105">Rent</div>
              </div>
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
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

          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAuthAction}
              className="hidden sm:flex hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] transition-all"
            >
              {user ? (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Logout</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Login</span>
                </>
              )}
            </Button>

            <Link href="/cart">
              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] transition-all"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] text-xs font-bold text-white flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden hover:bg-[rgb(var(--mavi-blue))]/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-background">
                <div className="flex flex-col gap-6 mt-8">
                  <Link
                    href="/"
                    className="text-lg font-medium hover:text-[rgb(var(--mavi-blue))] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </Link>
                  {user && (
                    <Link
                      href="/admin"
                      className="text-lg font-medium hover:text-[rgb(var(--mavi-blue))] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <a
                    href="#contact"
                    className="text-lg font-medium hover:text-[rgb(var(--mavi-blue))] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </a>
                  <div className="pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={handleAuthAction}
                      className="w-full justify-start hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] transition-all"
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
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
