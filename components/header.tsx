"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, User, LogOut, Menu, X, Globe } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/contexts/auth-context"
import { useI18n } from "@/contexts/i18n-context"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function Header() {
  const { getTotalItems, toggleCart, isOpen: cartOpen } = useCart()
  const totalItems = getTotalItems()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { locale, setLocale, t } = useI18n()

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale as "en" | "de")
  }

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
    <header className="sticky top-0 z-50 bg-[#d9d9d9] border-b border-black">
      <div className="container mx-auto px-4 py-4 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="group">
              <div className="flex items-center">
                <span className="text-3xl sm:text-4xl font-bold text-[rgb(var(--mavi-blue))] transition-all group-hover:scale-105 mr-[-4px]">Ma</span>
                <span className="text-3xl sm:text-4xl font-bold text-[rgb(var(--mavi-turquoise))] transition-all group-hover:scale-105">Vi</span>
              </div>
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/" className="relative text-base font-semibold text-muted-foreground hover:text-[rgb(var(--mavi-blue))] transition-colors group">
                {t("nav.products")}
                <span className="absolute -bottom-1 left-0 w-0 h-1 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] rounded-full transition-all group-hover:w-full"></span>
              </Link>
              {user && (
                <Link href="/admin" className="relative text-base font-semibold text-muted-foreground hover:text-[rgb(var(--mavi-blue))] transition-colors group">
                  {t("nav.admin")}
                  <span className="absolute -bottom-1 left-0 w-0 h-1 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] rounded-full transition-all group-hover:w-full"></span>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {!cartOpen && (
              <>
                <Select value={locale} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-16 h-10 border-0 bg-transparent hover:bg-[rgb(var(--mavi-blue))]/10">
                    <Globe className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>

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
                      <span className="hidden md:inline">{t("nav.logout")}</span>
                    </>
                  ) : (
                    <>
                      <User className="h-5 w-5 mr-2" />
                      <span className="hidden md:inline">{t("nav.login")}</span>
                    </>
                  )}
                </Button>
              </>
            )}

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
              <SheetContent side="right" className="w-[300px] bg-[#d9d9d9] px-4">
                <div className="flex flex-col gap-6 mt-8">
                  <Link
                    href="/"
                    className="text-xl font-semibold hover:text-[rgb(var(--mavi-blue))] transition-colors px-4"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("nav.products")}
                  </Link>
                  {user && (
                    <Link
                      href="/admin"
                      className="text-xl font-semibold hover:text-[rgb(var(--mavi-blue))] transition-colors px-4"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("nav.admin")}
                    </Link>
                  )}
                  <div className="pt-6 border-t-2 px-4">
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
                          {t("nav.logout")}
                        </>
                      ) : (
                        <>
                          <User className="h-5 w-5 mr-2" />
                          {t("nav.login")}
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
