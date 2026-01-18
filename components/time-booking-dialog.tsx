"use client"

import { useState, useEffect } from "react"
import type { Product } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { format, differenceInDays } from "date-fns"
import { de, enUS } from "date-fns/locale"
import { CalendarIcon, Minus, Plus, ShoppingCart, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { DateRange, DayPicker } from "react-day-picker"
import { getAvailableQuantityForDate } from "@/lib/bookings"
import { useI18n } from "@/contexts/i18n-context"
import "react-day-picker/dist/style.css"

interface TimeBookingDialogProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (startDate?: string, endDate?: string, days?: number, quantity?: number) => void
}

export function TimeBookingDialog({ product, open, onOpenChange, onConfirm }: TimeBookingDialogProps) {
  const [range, setRange] = useState<DateRange | undefined>()
  const [quantity, setQuantity] = useState(1)
  const [unavailableDates, setUnavailableDates] = useState<Map<string, number>>(new Map()) // date -> availableQuantity
  const [loading, setLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string>("")
  const { t, locale } = useI18n()
  
  // Get the appropriate date-fns locale
  const dateLocale = locale === "de" ? de : enUS

  const startDate = range?.from
  const endDate = range?.to
  const numberOfDays = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0
  const inventory = product.inventory || 1

  // Fetch available quantities when dialog opens
  useEffect(() => {
    if (open && product.id) {
      loadAvailability()
    }
  }, [open, product.id])

  // Check availability error when quantity or date range changes
  useEffect(() => {
    checkAvailabilityForRange()
  }, [quantity, startDate, endDate])

  const loadAvailability = async () => {
    setLoading(true)
    try {
      // Fetch availability for the next 90 days
      const disabledDatesList: Date[] = []
      const today = new Date()
      
      for (let i = 0; i < 90; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() + i)
        const dateString = format(checkDate, "yyyy-MM-dd")
        
        const available = await getAvailableQuantityForDate(product.id, dateString, inventory)
        // Add to disabled dates if inventory is fully booked
        if (available === 0) {
          disabledDatesList.push(new Date(checkDate))
        }
      }
      
      setUnavailableDates(new Map(disabledDatesList.map(d => [format(d, "yyyy-MM-dd"), 0])))
    } catch (error) {
      console.error("Error loading availability:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkAvailabilityForRange = async () => {
    if (!startDate || !endDate) {
      setAvailabilityError("")
      return
    }

    try {
      // Check if all dates in the range have enough inventory
      let minAvailable = inventory
      const current = new Date(startDate)
      
      while (current <= endDate) {
        const dateString = format(current, "yyyy-MM-dd")
        const available = await getAvailableQuantityForDate(product.id, dateString, inventory)
        minAvailable = Math.min(minAvailable, available)
        current.setDate(current.getDate() + 1)
      }

      if (minAvailable < quantity) {
        const errorMessage = t("booking.insufficientInventory").replace("{available}", minAvailable.toString())
        setAvailabilityError(errorMessage)
      } else {
        setAvailabilityError("")
      }
    } catch (error) {
      console.error("Error checking availability:", error)
    }
  }

  const handleConfirm = () => {
    if (startDate && endDate && !availabilityError) {
      onConfirm(format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd"), numberOfDays, quantity)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRange(undefined)
      setQuantity(1)
      setAvailabilityError("")
    }
    onOpenChange(open)
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    setQuantity(newQuantity)
  }

  const disabledDates = Array.from(unavailableDates.keys()).map(
    dateString => new Date(dateString)
  )

  const totalPrice = product.price * numberOfDays * quantity

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-[1200px] w-[95vw] sm:w-[90vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-0 gap-0 bg-[#d9d9d9] border-0 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] px-4 sm:px-6 py-3">
          <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">{t("booking.title")} {product.name}</span>
          </DialogTitle>
          <DialogDescription className="text-white/90 text-xs sm:text-sm">
            {t("booking.selectDates")}
          </DialogDescription>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-60px)] sm:h-[calc(85vh-60px)]">
          {/* Left Side - Calendar and Quantity */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 flex flex-col">
            {/* Quantity Selector */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold">{t("booking.quantity")}</Label>
              <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200 max-w-md">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg"
                >
                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                    {quantity}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Section */}
            <div className="space-y-1.5 sm:space-y-2 flex-1 flex flex-col min-h-0">
              <Label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[rgb(var(--mavi-blue))]" />
                <span className="text-xs sm:text-sm">{t("booking.selectRentalDates")}</span>
                {loading && <span className="text-xs text-gray-500">({t("booking.loading")})</span>}
              </Label>
              <div className="border-2 border-gray-200 rounded-xl p-2 sm:p-4 bg-[#d9d9d9] flex-1 flex items-center justify-center overflow-auto">
                <style>{`
                  .custom-day-picker {
                    --rdp-accent-color: rgb(88, 198, 188);
                    --rdp-background-color: rgba(88, 198, 188, 0.2);
                    --rdp-accent-color-dark: rgb(5, 84, 150);
                  }
                  @media (max-width: 640px) {
                    .custom-day-picker {
                      font-size: 0.75rem;
                    }
                    .custom-day-picker .rdp-months {
                      display: flex;
                      flex-direction: column;
                    }
                    .custom-day-picker .rdp-caption {
                      font-size: 0.875rem;
                    }
                    .custom-day-picker button {
                      font-size: 0.75rem;
                    }
                  }
                  .custom-day-picker .rdp-day_today {
                    font-weight: normal !important;
                    color: inherit !important;
                    background-color: transparent !important;
                    border-color: transparent !important;
                  }
                  .custom-day-picker .rdp-day_selected,
                  .custom-day-picker .rdp-day_selected:not(.rdp-day_range_middle) {
                    background-color: rgb(88, 198, 188) !important;
                    color: rgb(255, 255, 255) !important;
                    font-weight: 600 !important;
                  }
                  .custom-day-picker .rdp-day_range_middle {
                    background-color: rgba(88, 198, 188, 0.2) !important;
                    color: rgb(5, 84, 150) !important;
                    font-weight: 600 !important;
                  }
                  .custom-day-picker .rdp-day_range_start,
                  .custom-day-picker .rdp-day_range_end {
                    background-color: rgb(88, 198, 188) !important;
                    color: rgb(255, 255, 255) !important;
                    font-weight: 700 !important;
                  }
                  .custom-day-picker .rdp-day_selected.rdp-day_range_start,
                  .custom-day-picker .rdp-day_selected.rdp-day_range_end {
                    background-color: rgb(88, 198, 188) !important;
                    color: rgb(255, 255, 255) !important;
                  }
                  .custom-day-picker button.rdp-day_selected {
                    background-color: rgb(88, 198, 188) !important;
                    color: rgb(255, 255, 255) !important;
                  }
                  .custom-day-picker .rdp-day_selected:focus,
                  .custom-day-picker .rdp-day_selected:active {
                    background-color: rgb(88, 198, 188) !important;
                    color: rgb(255, 255, 255) !important;
                  }
                  .custom-day-picker .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
                    background-color: rgba(88, 198, 188, 0.15) !important;
                  }
                  .custom-day-picker .rdp-day.booked-date {
                    background-color: rgba(239, 68, 68, 0.1) !important;
                    color: rgb(185, 28, 28) !important;
                    text-decoration: line-through;
                    position: relative;
                  }
                  .custom-day-picker .rdp-day_disabled.booked-date {
                    opacity: 0.5;
                  }
                `}</style>
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  locale={dateLocale}
                  disabled={[
                    { before: new Date() },
                    ...disabledDates
                  ]}
                  modifiers={{
                    booked: disabledDates
                  }}
                  modifiersClassNames={{
                    booked: 'booked-date'
                  }}
                  numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 1024 ? 1 : 2}
                  className="custom-day-picker"
                />
              </div>
              {availabilityError && (
                <div className="flex items-start gap-2 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-red-700">{availabilityError}</p>
                </div>
              )}
              <p className="text-[10px] sm:text-xs text-gray-500 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-100 border border-red-300 rounded"></span>
                  <span>No inventory</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[rgb(31,219,206)] rounded"></span>
                  <span>{t("booking.selected")}</span>
                </span>
              </p>
            </div>
          </div>

          {/* Right Side - Summary (Always Visible) */}
          <div className="w-full lg:w-[420px] lg:min-w-[420px] flex-shrink-0 border-t lg:border-t-0 lg:border-l bg-gray-50 p-3 sm:p-4 flex flex-col">
            <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 text-gray-700">{t("booking.bookingSummary")}</h3>
            
            {numberOfDays > 0 ? (
              <div className="space-y-2 sm:space-y-3 flex-1 min-h-0">
                <div className="p-2 sm:p-3 bg-[#d9d9d9] rounded-lg border space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-600">{t("booking.from")}</span>
                    <span className="font-semibold">{format(startDate!, "MMM dd, yyyy", { locale: dateLocale })}</span>
                  </div>
                  {endDate && (
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-600">{t("booking.to")}</span>
                      <span className="font-semibold">{format(endDate, "MMM dd, yyyy", { locale: dateLocale })}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-600">{t("booking.duration")}</span>
                    <span className="font-semibold">{numberOfDays} {numberOfDays === 1 ? t("booking.day") : t("booking.days")}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-600">{t("booking.qty")}</span>
                    <span className="font-semibold">{quantity}</span>
                  </div>
                </div>

                <div className="p-2 sm:p-3 bg-[#d9d9d9] rounded-lg border space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-center text-[10px] sm:text-xs">
                    <span className="text-gray-600">€{product.price.toFixed(2)} × {quantity} × {numberOfDays}</span>
                    <span className="font-semibold">€{(product.price * quantity * numberOfDays).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs sm:text-sm">Total</span>
                    <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                      €{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 mt-auto pt-2 sm:pt-4">
                  <Button
                    onClick={handleConfirm}
                    disabled={!startDate || !endDate || !!availabilityError}
                    className="w-full h-9 sm:h-10 text-sm sm:text-base bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    {t("booking.addToCart")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    className="w-full h-9 sm:h-10 text-sm sm:text-base border-2"
                  >
                    {t("booking.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs sm:text-sm text-gray-500 text-center px-4">{t("booking.selectDatesMessage")}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
