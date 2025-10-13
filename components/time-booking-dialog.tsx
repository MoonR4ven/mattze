"use client"

import { useState } from "react"
import type { Product, Booking } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { format, addDays, isBefore, startOfDay, differenceInDays, addMonths } from "date-fns"
import { CalendarIcon, CheckCircle2, Minus, Plus } from "lucide-react"

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
  {
    productId: "10010",
    productName: "Cover set white",
    startTime: "2025-02-01",
    endTime: "2025-02-03",
    customerEmail: "alex@example.com",
    customerName: "Alex Brown",
    status: "confirmed",
    price: 30.0,
  },
  {
    productId: "10011",
    productName: "Elegant table runner",
    startTime: "2025-01-18",
    endTime: "2025-01-19",
    customerEmail: "john@example.com",
    customerName: "John Doe",
    status: "confirmed",
    price: 15.0,
  },
  {
    productId: "10012",
    productName: "Crystal wine glasses",
    startTime: "2025-02-14",
    endTime: "2025-02-16",
    customerEmail: "emma@example.com",
    customerName: "Emma Davis",
    status: "confirmed",
    price: 45.0,
  },
]

const getProductAvailability = (productId: string, date: Date, requestedQuantity: number): boolean => {
  const dateString = format(date, "yyyy-MM-dd")

  // Count how many items of this product are already booked on this date
  const bookedQuantity = mockBookings.filter((booking) => {
    if (booking.productId !== productId || booking.status !== "confirmed") {
      return false
    }

    const bookingStart = new Date(booking.startTime)
    const bookingEnd = new Date(booking.endTime)
    const checkDate = new Date(dateString)

    // Check if the date is within the booking range (inclusive)
    return checkDate >= bookingStart && checkDate <= bookingEnd
  }).length

  // Assume we have a maximum of 10 items per product type (this could be dynamic)
  const maxAvailable = 10
  const availableQuantity = maxAvailable - bookedQuantity

  return availableQuantity >= requestedQuantity
}

export function TimeBookingDialog({ product, open, onOpenChange, onConfirm }: TimeBookingDialogProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [selectionMode, setSelectionMode] = useState<"single" | "range">("single")
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
      setSelectionMode("single")
      setQuantity(1)
    }
    onOpenChange(open)
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !isDateAvailable(date)) return

    if (selectionMode === "single") {
      setSelectedDates([date])
    } else {
      // Range mode - handle consecutive day selection
      if (selectedDates.length === 0) {
        setSelectedDates([date])
      } else if (selectedDates.length === 1) {
        const firstDate = selectedDates[0]
        const daysDiff = differenceInDays(date, firstDate)

        if (daysDiff === 0) {
          // Same date clicked, keep single selection
          setSelectedDates([date])
        } else if (daysDiff > 0) {
          // Create range from first date to selected date
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
            // If any date in range is unavailable, start new selection
            setSelectedDates([date])
          }
        } else {
          // Selected date is before first date, create range backwards
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
        // Start new selection
        setSelectedDates([date])
      }
    }
  }

  const isDateSelected = (date: Date) => {
    return selectedDates.some((selectedDate) => format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    setQuantity(newQuantity)
    // Clear selected dates if they're no longer available with new quantity
    if (selectedDates.length > 0) {
      const stillAvailable = selectedDates.every((date) => getProductAvailability(product.id, date, newQuantity))
      if (!stillAvailable) {
        setSelectedDates([])
      }
    }
  }

  const totalPrice = product.price * numberOfDays * quantity

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto p-0 bg-background">
        <div className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/10 via-[rgb(var(--mavi-turquoise))]/5 to-transparent p-6 border-b">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
              </div>
              Book {product.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              Select your rental period • €{product.price.toFixed(2)} per day per item
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <Label className="text-base font-medium mb-3 block">Quantity</Label>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg w-fit">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium min-w-[3rem] text-center">
                    {quantity} item{quantity > 1 ? "s" : ""}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Availability is checked for all {quantity} item{quantity > 1 ? "s" : ""} of this product
                </p>
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">Selection Mode</Label>
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <Button
                    variant={selectionMode === "single" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setSelectionMode("single")
                      setSelectedDates(selectedDates.slice(0, 1))
                    }}
                    className="flex-1"
                  >
                    Single Day
                  </Button>
                  <Button
                    variant={selectionMode === "range" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectionMode("range")}
                    className="flex-1"
                  >
                    Multiple Days
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">
                  {selectionMode === "single" ? "Select Date" : "Select Date Range"}
                </Label>

                <div className="flex gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">
                      Available ({quantity} item{quantity > 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Unavailable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Selected</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }, (_, i) => {
                    const monthDate = addMonths(new Date(), i)
                    return (
                      <div key={i} className="border rounded-xl p-4 bg-card">
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
                              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                            available:
                              "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50",
                            unavailable:
                              "bg-red-100 text-red-800 cursor-not-allowed dark:bg-red-900/30 dark:text-red-400",
                            range_middle: "bg-primary/20 text-primary hover:bg-primary/30",
                          }}
                          classNames={{
                            month: "space-y-4 w-full",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium",
                            nav: "space-x-1 flex items-center",
                            nav_button:
                              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-accent rounded-md",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex w-full",
                            head_cell:
                              "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex-1 text-center",
                            row: "flex w-full mt-2",
                            cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
                            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors mx-auto",
                            day_today: "bg-accent text-accent-foreground font-medium ring-2 ring-primary/20",
                            day_outside: "text-muted-foreground opacity-30",
                            day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
                            day_hidden: "invisible",
                          }}
                        />
                      </div>
                    )
                  })}
                </div>

                <p className="text-sm text-muted-foreground mt-4">
                  {selectionMode === "single"
                    ? `Click on a green (available) date to select it for rental. Green dates have ${quantity} or more items available.`
                    : `Click on a start date, then click on an end date to select a range. All dates in the range must have ${quantity} or more items available.`}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {startDate && endDate && (
                <div className="space-y-4">
                  <Label className="text-base font-medium">Booking Summary</Label>
                  <div className="p-6 bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 rounded-xl border border-[rgb(var(--mavi-blue))]/20">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Quantity</span>
                        <span className="font-medium">
                          {quantity} item{quantity > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Start Date</span>
                        <span className="font-medium">{format(startDate, "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">End Date</span>
                        <span className="font-medium">{format(endDate, "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <span className="font-medium">
                          {numberOfDays} day{numberOfDays > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="h-px bg-border"></div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Price</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                          €{totalPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        €{product.price.toFixed(2)} × {quantity} item{quantity > 1 ? "s" : ""} × {numberOfDays} day
                        {numberOfDays > 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                        {quantity} item{quantity > 1 ? "s" : ""} available for selected period
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/30">
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => handleOpenChange(false)} className="px-6">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!startDate || !endDate}
              className="px-6 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 transition-all"
            >
              Confirm Booking • €{totalPrice.toFixed(2)}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
