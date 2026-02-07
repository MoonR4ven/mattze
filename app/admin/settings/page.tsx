"use client"

// Admin settings page with category management
import type React from "react"

import { useState, useEffect } from "react"
import { useI18n } from "@/contexts/i18n-context"
import { getCategories, addCategory, updateCategory, deleteCategory, getCategoryProductCount } from "@/lib/categories"
import type { Category } from "@/lib/categories"
import { getSettings, updateSettings } from "@/lib/settings"
import type { AppSettings } from "@/lib/settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Settings as SettingsIcon, Percent, Truck, MapPin } from "lucide-react"
import { toast } from "sonner"

export default function AdminSettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: "", color: "#3B82F6" })
  const [categoryProductCounts, setCategoryProductCounts] = useState<Record<string, number>>({})
  const [vatRate, setVatRate] = useState<number>(21)
  const [deliveryOriginAddress, setDeliveryOriginAddress] = useState("")
  const [deliveryBaseRadiusKm, setDeliveryBaseRadiusKm] = useState<number>(10)
  const [deliveryBaseFee, setDeliveryBaseFee] = useState<number>(20)
  const [deliveryPerKmFee, setDeliveryPerKmFee] = useState<number>(1)
  const [assemblyFee, setAssemblyFee] = useState<number>(0)
  const [pickupLocations, setPickupLocations] = useState<AppSettings["pickupLocations"]>([])
  const [pickupSelectionLimit, setPickupSelectionLimit] = useState<number>(2)
  const [newPickupName, setNewPickupName] = useState("")
  const [newPickupAddress, setNewPickupAddress] = useState("")
  const { t } = useI18n()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [categoriesData, settingsData] = await Promise.all([getCategories(), getSettings()])
      setCategories(categoriesData)
      setSettings(settingsData)
      setVatRate(settingsData.vatRate)
      setDeliveryOriginAddress(settingsData.deliveryOriginAddress || "")
      setDeliveryBaseRadiusKm(settingsData.deliveryBaseRadiusKm ?? 10)
      setDeliveryBaseFee(settingsData.deliveryBaseFee ?? 20)
      setDeliveryPerKmFee(settingsData.deliveryPerKmFee ?? 1)
      setAssemblyFee(settingsData.assemblyFee ?? 0)
      setPickupLocations(settingsData.pickupLocations || [])
      setPickupSelectionLimit(settingsData.pickupSelectionLimit ?? 2)

      setCategories(categoriesData)
      setSettings(settingsData)
      setVatRate(settingsData.vatRate)

      // Fetch product counts for each category
      const counts: Record<string, number> = {}
      for (const category of categoriesData) {
        counts[category.id] = await getCategoryProductCount(category.name)
      }
      setCategoryProductCounts(counts)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVatRate = async () => {
    try {
      setIsSubmitting(true)
      const success = await updateSettings({ vatRate })
      if (success) {
        toast.success(t("admin.settingsSaved"))
        await fetchData()
      } else {
        toast.error(t("admin.settingsFailed"))
      }
    } catch (error) {
      console.error("Error saving VAT rate:", error)
      toast.error(t("admin.settingsFailed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDeliverySettings = async () => {
    try {
      setIsSubmitting(true)
      const success = await updateSettings({
        deliveryOriginAddress,
        deliveryBaseRadiusKm,
        deliveryBaseFee,
        deliveryPerKmFee,
        assemblyFee,
      })
      if (success) {
        toast.success(t("admin.settingsSaved"))
        await fetchData()
      } else {
        toast.error(t("admin.settingsFailed"))
      }
    } catch (error) {
      console.error("Error saving delivery settings:", error)
      toast.error(t("admin.settingsFailed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSavePickupSettings = async () => {
    try {
      setIsSubmitting(true)
      const success = await updateSettings({
        pickupLocations,
        pickupSelectionLimit,
      })
      if (success) {
        toast.success(t("admin.settingsSaved"))
        await fetchData()
      } else {
        toast.error(t("admin.settingsFailed"))
      }
    } catch (error) {
      console.error("Error saving pickup settings:", error)
      toast.error(t("admin.settingsFailed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const addPickupLocation = () => {
    if (!newPickupName.trim() || !newPickupAddress.trim()) return
    const newLocation = {
      id: `${Date.now()}`,
      name: newPickupName.trim(),
      address: newPickupAddress.trim(),
    }
    setPickupLocations((prev) => [...prev, newLocation])
    setNewPickupName("")
    setNewPickupAddress("")
  }

  const removePickupLocation = (id: string) => {
    setPickupLocations((prev) => prev.filter((loc) => loc.id !== id))
  }

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({ name: category.name, color: category.color || "#3B82F6" })
    } else {
      setEditingCategory(null)
      setFormData({ name: "", color: "#3B82F6" })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name: "", color: "#3B82F6" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error(t("admin.categoryName"))
      return
    }

    setIsSubmitting(true)
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          color: formData.color,
        })
        toast.success(t("admin.categoryUpdated"))
      } else {
        await addCategory({
          name: formData.name,
          color: formData.color,
          createdAt: new Date().toISOString(),
        })
        toast.success(t("admin.categoryAdded"))
      }
      handleCloseDialog()
      await fetchCategories()
    } catch (error) {
      console.error("Error saving category:", error)
      toast.error("Failed to save category")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (category: Category) => {
    try {
      setIsSubmitting(true)
      await deleteCategory(category.id)
      toast.success(t("admin.categoryDeleted"))
      await fetchCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to delete category")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#d9d9d9] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10">
              <SettingsIcon className="h-6 w-6 text-[rgb(var(--mavi-blue))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                {t("admin.settingsManagement")}
              </h1>
              <p className="text-sm text-muted-foreground">{t("admin.manageSettings")}</p>
            </div>
          </div>
        </div>

        {/* General Settings Section */}
        <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 transition-all bg-slate-100">
          <CardHeader className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 to-[rgb(var(--mavi-turquoise))]/5 border-b-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Percent className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
                  {t("admin.taxSettings")}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{t("admin.vatRateDescription")}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vatRate" className="text-sm font-medium flex items-center gap-2">
                  {t("admin.vatRate")}
                  <span className="text-xs text-muted-foreground">({settings?.vatRate || 21}%)</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="vatRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                    className="h-11 border-2"
                    placeholder="21"
                  />
                  <Button
                    onClick={handleSaveVatRate}
                    disabled={isSubmitting || vatRate === settings?.vatRate}
                    className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black"
                  >
                    {isSubmitting ? t("admin.saving") : t("admin.save")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("admin.vatRateDescription")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Settings Section */}
        <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 transition-all bg-slate-100">
          <CardHeader className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 to-[rgb(var(--mavi-turquoise))]/5 border-b-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Truck className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
                  {t("admin.deliverySettings")}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{t("admin.deliverySettingsDescription")}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryOrigin" className="text-sm font-medium">
                {t("admin.deliveryOrigin")}
              </Label>
              <Input
                id="deliveryOrigin"
                value={deliveryOriginAddress}
                onChange={(e) => setDeliveryOriginAddress(e.target.value)}
                placeholder={t("admin.deliveryOriginPlaceholder")}
                className="h-11 border-2"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryRadius" className="text-sm font-medium">{t("admin.deliveryBaseRadius")}</Label>
                <Input
                  id="deliveryRadius"
                  type="number"
                  min="0"
                  step="0.1"
                  value={deliveryBaseRadiusKm}
                  onChange={(e) => setDeliveryBaseRadiusKm(parseFloat(e.target.value) || 0)}
                  className="h-11 border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryBaseFee" className="text-sm font-medium">{t("admin.deliveryBaseFee")}</Label>
                <Input
                  id="deliveryBaseFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryBaseFee}
                  onChange={(e) => setDeliveryBaseFee(parseFloat(e.target.value) || 0)}
                  className="h-11 border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryPerKm" className="text-sm font-medium">{t("admin.deliveryPerKmFee")}</Label>
                <Input
                  id="deliveryPerKm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryPerKmFee}
                  onChange={(e) => setDeliveryPerKmFee(parseFloat(e.target.value) || 0)}
                  className="h-11 border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assemblyFee" className="text-sm font-medium">{t("admin.assemblyFee")}</Label>
                <Input
                  id="assemblyFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={assemblyFee}
                  onChange={(e) => setAssemblyFee(parseFloat(e.target.value) || 0)}
                  className="h-11 border-2"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveDeliverySettings}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black"
            >
              {isSubmitting ? t("admin.saving") : t("admin.save")}
            </Button>
          </CardContent>
        </Card>

        {/* Pickup Locations Section */}
        <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 transition-all bg-slate-100">
          <CardHeader className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 to-[rgb(var(--mavi-turquoise))]/5 border-b-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MapPin className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
                  {t("admin.pickupLocations")}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{t("admin.pickupLocationsDescription")}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickupLimit" className="text-sm font-medium">{t("admin.pickupLimit")}</Label>
              <Input
                id="pickupLimit"
                type="number"
                min="1"
                max="5"
                value={pickupSelectionLimit}
                onChange={(e) => setPickupSelectionLimit(parseInt(e.target.value, 10) || 1)}
                className="h-11 border-2"
              />
            </div>

            <div className="space-y-3">
              {pickupLocations.length > 0 ? (
                <div className="grid gap-2">
                  {pickupLocations.map((location) => (
                    <div key={location.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-[#d9d9d9]">
                      <div>
                        <div className="font-semibold text-sm">{location.name}</div>
                        <div className="text-xs text-muted-foreground">{location.address}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePickupLocation(location.id)}
                        className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center">{t("admin.noPickupLocations")}</p>
              )}

              <div className="grid md:grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  value={newPickupName}
                  onChange={(e) => setNewPickupName(e.target.value)}
                  placeholder={t("admin.pickupNamePlaceholder")}
                  className="h-10"
                />
                <Input
                  value={newPickupAddress}
                  onChange={(e) => setNewPickupAddress(e.target.value)}
                  placeholder={t("admin.pickupAddressPlaceholder")}
                  className="h-10"
                />
                <Button
                  type="button"
                  onClick={addPickupLocation}
                  className="h-10 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-white hover:text-black"
                >
                  {t("admin.add")}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSavePickupSettings}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black"
            >
              {isSubmitting ? t("admin.saving") : t("admin.save")}
            </Button>
          </CardContent>
        </Card>

        {/* Categories Section */}
        <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 transition-all bg-slate-100">
          <CardHeader className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 to-[rgb(var(--mavi-turquoise))]/5 border-b-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Plus className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
                  {t("admin.categoryManagement")}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{t("admin.manageCategoryList")}</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => handleOpenDialog()}
                  className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black"
                  >
                    <Plus className="h-4 w-4 mr-2 text-[rgb(var(--mavi-dark-teal))]" />
                    {t("admin.addCategory")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="animate-scale-in bg-[#d9d9d9]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? t("admin.editCategory") : t("admin.addCategory")}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        {t("admin.categoryName")}
                      </Label>
                      <Input
                        id="name"
                        placeholder={t("admin.categoryName")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-10 border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color" className="text-sm font-medium">
                        {t("admin.categoryColor")}
                      </Label>
                      <div className="flex gap-2">
                        <input
                          id="color"
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="h-10 w-16 rounded-lg border-2 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="h-10 border-2 flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        {t("admin.cancel")}
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black"
                      >
                        {isSubmitting ? t("admin.saving") : t("admin.save")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">{t("admin.loadingProducts")}</div>
              </div>
            ) : categories.length > 0 ? (
              <div className="grid gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 rounded-lg border-2 hover:border-[rgb(var(--mavi-blue))]/30 bg-gradient-to-r hover:from-[rgb(var(--mavi-blue))]/5 to-transparent transition-all group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="h-10 w-10 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: category.color || "#3B82F6" }}
                      />
                      <div>
                        <h3 className="font-semibold text-base">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {categoryProductCounts[category.id] || 0} {t("admin.product")}
                          {(categoryProductCounts[category.id] || 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(category)}
                        className="border-2 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t("admin.edit")}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                            disabled={(categoryProductCounts[category.id] || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {t("admin.delete")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="animate-scale-in bg-[#d9d9d9]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("admin.deleteCategory")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {(categoryProductCounts[category.id] || 0) > 0
                                ? t("admin.categoryInUse")
                                : t("admin.categoryDeleteConfirm")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel>
                            {(categoryProductCounts[category.id] || 0) === 0 && (
                              <AlertDialogAction
                                onClick={() => handleDelete(category)}
                                disabled={isSubmitting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t("admin.delete")}
                              </AlertDialogAction>
                            )}
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Plus className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                <div>
                  <h3 className="font-semibold text-base">{t("admin.noCategoriesFound")}</h3>
                  <p className="text-sm text-muted-foreground">{t("admin.addYourFirstCategory")}</p>
                </div>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("admin.addCategory")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
