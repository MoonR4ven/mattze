"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getSettings, updateSettings } from "@/lib/settings"
import { useI18n } from "@/contexts/i18n-context"
import { Building2, Mail, MapPin, Phone, User } from "lucide-react"
import { toast } from "sonner"

interface SellerContactForm {
  companyName: string
  contactName: string
  email: string
  phone: string
  address: string
}

const initialForm: SellerContactForm = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
}

export default function AdminContactPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<SellerContactForm>(initialForm)
  const { t } = useI18n()

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings()
        setForm({
          companyName: settings.sellerContact?.companyName || "",
          contactName: settings.sellerContact?.contactName || "",
          email: settings.sellerContact?.email || "",
          phone: settings.sellerContact?.phone || "",
          address: settings.sellerContact?.address || "",
        })
      } catch (error) {
        console.error("Error loading contact settings:", error)
        toast.error("Failed to load seller contact settings")
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const saveContact = async () => {
    try {
      setSaving(true)
      const success = await updateSettings({
        sellerContact: {
          companyName: form.companyName.trim(),
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        },
      })

      if (!success) {
        toast.error("Failed to save seller contact settings")
        return
      }

      toast.success("Seller contact settings saved")
    } catch (error) {
      console.error("Error saving contact settings:", error)
      toast.error("Failed to save seller contact settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#d9d9d9]">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-[rgb(var(--mavi-blue))] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading contact settings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#d9d9d9] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10">
              <User className="h-6 w-6 text-[rgb(var(--mavi-blue))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                Edit Seller Contact
              </h1>
              <p className="text-sm text-muted-foreground">Manage the contact details shown to customers</p>
            </div>
          </div>
        </div>

        <Card className="border-2 bg-slate-100">
          <CardHeader className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 to-[rgb(var(--mavi-turquoise))]/5 border-b-2">
            <CardTitle className="text-xl">Seller Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company name
                </Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="h-11 border-2"
                  placeholder="Your company"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact person
                </Label>
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
                  className="h-11 border-2"
                  placeholder="Owner or support contact"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="h-11 border-2"
                  placeholder="contact@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="h-11 border-2"
                  placeholder="+31 ..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                className="min-h-[100px] border-2"
                placeholder="Street, postal code, city, country"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={saveContact}
                disabled={saving}
                className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black"
              >
                {saving ? (t("admin.saving") || "Saving...") : (t("admin.save") || "Save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
