"use client"

import { useState } from "react"
import type { Product, Booking } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { format, addDays, isBefore, startOfDay, differenceInDays, addMonths } from "date-fns"
import { CalendarIcon, Minus, Plus, ShoppingCart, Info, CheckCircle2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface TimeBookingDialogProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (startDate?: string, endDate?: string, days?: number, quantity?: number) => void
}

const mockBookings: Booking[] = [
  {
    productId: "10010",
    productName: "Cover set white",
    startTime: "2025-01-15",
    endTime: "2025-01-17",
    customerEmail: "mike@example.com",
    customerName: "Mike Wilson",
    status: "confirmed",
    price: 30.0,
  },
  {
    productId: "10010",
    productName: "Cover set white",
    startTime: "2025-01-20",
    endTime: "2025-01-22",
    customerEmail: "sarah@example.com",
    customerName: "Sarah Johnson",
    status: "confirmed",
    price: 30.0,
  },
]

const getProductAvailability = (productId: string, date: Date, requestedQuantity: number): boolean => {
  const dateString = format(date, "yyyy-MM-dd")

  const bookedQuantity = mockBookings.filter((booking) => {
    if (booking.productId !== productId || booking.status !== "confirmed") {
      return false
    }

    const bookingStart = new Date(booking.startTime)
    const bookingEnd = new Date(booking.endTime)
    const checkDate = new Date(dateString)

    return checkDate >= bookingStart && checkDate <= bookingEnd
  }).length

  const maxAvailable = 10
  const availableQuantity = maxAvailable - bookedQuantity

  return availableQuantity >= requestedQuantity
}

export function TimeBookingDialog({ product, open, onOpenChange, onConfirm }: TimeBookingDialogProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [quantity, setQuantity] = useState(1)

  const startDate = selectedDates.length > 0 ? selectedDates[0] : undefined
  const endDate = selectedDates.length > 0 ? selectedDates[selectedDates.length - 1] : undefined
  const numberOfDays = selectedDates.length

  const handleConfirm = () => {
    if (startDate && endDate) {
      onConfirm(format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd"), numberOfDays, quantity)
    }
  }

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()))
  }

  const isDateAvailable = (date: Date) => {
    if (isDateDisabled(date)) return false
    return getProductAvailability(product.id, date, quantity)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedDates([])
      setQuantity(1)
    }
    onOpenChange(open)
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !isDateAvailable(date)) return

    if (selectedDates.length === 0) {
      setSelectedDates([date])
    } else if (selectedDates.length === 1) {
      const firstDate = selectedDates[0]
      const daysDiff = differenceInDays(date, firstDate)

      if (daysDiff === 0) {
        setSelectedDates([date])
      } else if (daysDiff > 0) {
        const range = []
        let allAvailable = true
        for (let i = 0; i <= daysDiff; i++) {
          const checkDate = addDays(firstDate, i)
          if (!isDateAvailable(checkDate)) {
            allAvailable = false
            break
          }
          range.push(checkDate)
        }
        if (allAvailable) {
          setSelectedDates(range)
        } else {
          setSelectedDates([date])
        }
      } else {
        const range = []
        let allAvailable = true
        for (let i = 0; i <= Math.abs(daysDiff); i++) {
          const checkDate = addDays(date, i)
          if (!isDateAvailable(checkDate)) {
            allAvailable = false
            break
          }
          range.push(checkDate)
        }
        if (allAvailable) {
          setSelectedDates(range)
        } else {
          setSelectedDates([date])
        }
      }
    } else {
      setSelectedDates([date])
    }
  }

  const isDateSelected = (date: Date) => {
    return selectedDates.some((selectedDate) => format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    setQuantity(newQuantity)
    if (selectedDates.length > 0) {
      const stillAvailable = selectedDates.every((date) => getProductAvailability(product.id, date, newQuantity))
      if (!stillAvailable) {
        setSelectedDates([])
      }
    }
  }

  const totalPrice = product.price * numberOfDays * quantity
  const pricePerDay = product.price * quantity

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[95vh] overflow-hidden p-0 bg-background gap-0">
        <div className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 via-transparent to-[rgb(var(--mavi-turquoise))]/5 px-6 py-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-[rgb(var(--mavi-blue))]" />
              Book {product.name}
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Select your dates and quantity to see pricing
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid md:grid-cols-[1fr_320px] h-full">
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(95vh-180px)]">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
                  How many items?
                </Label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="h-12 w-12 rounded-xl border-2 hover:border-[rgb(var(--mavi-blue))] hover:bg-[rgb(var(--mavi-blue))]/10"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                      {quantity}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {quantity === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="h-12 w-12 rounded-xl border-2 hover:border-[rgb(var(--mavi-blue))] hover:bg-[rgb(var(--mavi-blue))]/10"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[rgb(var(--mavi-blue))]"></div>
                  <span className="text-sm font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500/50"></div>
                  <span className="text-sm font-medium">Unavailable</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
                Select your dates
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                Click a date to start, then click another to create a range. All dates must be available.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 }, (_, i) => {
                  const monthDate = addMonths(new Date(), i)
                  return (
                    <div key={i} className="border-2 border-border rounded-2xl p-4 bg-card/50 hover:border-[rgb(var(--mavi-blue))]/30 transition-colors">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={handleDateSelect}
                        disabled={isDateDisabled}
                        className="w-full"
                        month={monthDate}
                        fromDate={new Date()}
                        toDate={addMonths(new Date(), 12)}
                        modifiers={{
                          selected: isDateSelected,
                          available: (date) => isDateAvailable(date) && !isDateSelected(date),
                          unavailable: (date) => !isDateAvailable(date) && !isDateDisabled(date),
                          range_middle: (date) => {
                            if (selectedDates.length <= 2) return false
                            return selectedDates
                              .slice(1, -1)
                              .some(
                                (selectedDate) => format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"),
                              )
                          },
                        }}
                        modifiersClassNames={{
                          selected:
                            "bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] text-white hover:opacity-90 font-bold",
                          available:
                            "bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 font-medium",
                          unavailable:
                            "bg-red-100/50 text-red-400 cursor-not-allowed dark:bg-red-900/20 dark:text-red-500 line-through",
                          range_middle: "bg-[rgb(var(--mavi-blue))]/20 text-[rgb(var(--mavi-blue))] hover:bg-[rgb(var(--mavi-blue))]/30 font-semibold",
                        }}
                        classNames={{
                          month: "space-y-4 w-full",
                          caption: "flex justify-center pt-1 relative items-center mb-4",
                          caption_label: "text-base font-semibold",
                          nav: "space-x-1 flex items-center",
                          nav_button:
                            "h-8 w-8 bg-transparent p-0 hover:bg-[rgb(var(--mavi-blue))]/10 rounded-lg transition-colors",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse",
                          head_row: "flex w-full",
                          head_cell:
                            "text-muted-foreground rounded-md font-semibold text-xs flex-1 text-center uppercase",
                          row: "flex w-full mt-1",
                          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
                          day: "h-10 w-10 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-lg transition-all mx-auto",
                          day_today: "bg-accent/50 font-bold ring-2 ring-[rgb(var(--mavi-blue))]/30",
                          day_outside: "text-muted-foreground opacity-30",
                          day_disabled: "text-muted-foreground opacity-20 cursor-not-allowed",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-muted/30 to-muted/50 border-l p-6 flex flex-col">
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Booking Summary
                </h3>
                <div className="space-y-3">
                  {quantity && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-semibold">{quantity} {quantity === 1 ? 'item' : 'items'}</span>
                    </div>
                  )}

                  {startDate && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Start Date</span>
                      <span className="font-semibold">{format(startDate, "MMM dd, yyyy")}</span>
                    </div>
                  )}

                  {endDate && selectedDates.length > 1 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">End Date</span>
                      <span className="font-semibold">{format(endDate, "MMM dd, yyyy")}</span>
                    </div>
                  )}

                  {numberOfDays > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-semibold">{numberOfDays} {numberOfDays === 1 ? 'day' : 'days'}</span>
                    </div>
                  )}
                </div>
              </div>

              {numberOfDays > 0 && (
                <>
                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Price per day</span>
                      <span className="font-semibold">€{product.price.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Daily total</span>
                      <span className="font-semibold">€{pricePerDay.toFixed(2)}</span>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 rounded-xl border border-[rgb(var(--mavi-blue))]/20">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Price</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                          €{totalPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        €{product.price.toFixed(2)} × {quantity} × {numberOfDays} {numberOfDays === 1 ? 'day' : 'days'}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                        Available for your selected dates
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-6 space-y-3">
              <Button
                onClick={handleConfirm}
                disabled={!startDate || !endDate}
                size="lg"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
