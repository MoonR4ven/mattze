"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { getProducts, addProduct, updateProduct, deleteProduct } from "@/lib/products"
import { getCategories } from "@/lib/categories"
import type { Product } from "@/lib/types"
import type { Category } from "@/lib/categories"
import { useI18n } from "@/contexts/i18n-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Plus, Edit, Trash2, Package, Euro, X, Sparkles, TrendingUp, Upload } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { uploadToImgBB } from "@/lib/imgbb"

interface ProductFormData {
  name: string
  description: string
  type: string
  price: number
  image: string
  images: string[]
  available: boolean
  inventory: number
  dimensions: string
  capacity: string
  specifications: Record<string, string>
  features: string[]
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  type: "",
  price: 0,
  image: "",
  images: [],
  available: true,
  inventory: 1,
  dimensions: "",
  capacity: "",
  specifications: {},
  features: [],
}

const PLACEHOLDER_IMAGE = "/placeholder.svg?height=400&width=600&text=No+Image+Selected"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newFeature, setNewFeature] = useState("")
  const [newSpecKey, setNewSpecKey] = useState("")
  const [newSpecValue, setNewSpecValue] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()])
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load products and categories")
    } finally {
      setLoading(false)
    }
  }

  const getCategoryNames = (): string[] => categories.map((cat) => cat.name)

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingProduct(null)
    setNewFeature("")
    setNewSpecKey("")
    setNewSpecValue("")
    setUploadingImage(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const dataToSave = {
        ...formData,
        price: Number(formData.price) || 0,
      }

      if (editingProduct) {
        const success = await updateProduct(editingProduct.id, dataToSave)
        if (success) {
          toast.success("Product updated successfully")
          await fetchData()
        } else {
          toast.error("Failed to update product")
        }
      } else {
        const productId = await addProduct(dataToSave)
        if (productId) {
          toast.success("Product added successfully")
          await fetchData()
        } else {
          toast.error("Failed to add product")
        }
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("An error occurred while saving the product")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    // Filter out undefined values from specifications
    const cleanedSpecs: Record<string, string> = {}
    if (product.specifications) {
      Object.entries(product.specifications).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedSpecs[key] = value
        }
      })
    }
    
    setFormData({
      name: product.name,
      description: product.description || "",
      type: product.type || "",
      price: product.price ?? 0,
      image: product.image || "",
      images: product.images || [],
      available: product.available ?? true,
      inventory: product.inventory ?? 1,
      dimensions: product.dimensions || "",
      capacity: product.capacity || "",
      specifications: cleanedSpecs,
      features: product.features || [],
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (product: Product) => {
    try {
      const success = await deleteProduct(product.id)
      if (success) {
        toast.success("Product deleted successfully")
        setProducts((prev) => prev.filter((p) => p.id !== product.id))
      } else {
        toast.error("Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("An error occurred while deleting the product")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.type.startsWith("image/")) {
          toast.error(`File ${file.name} is not an image`)
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Image ${file.name} size should be less than 5MB`)
          continue
        }

        const imageUrl = await uploadToImgBB(file)
        if (imageUrl) {
          uploadedUrls.push(imageUrl)
        } else {
          toast.error(`Failed to upload ${file.name}`)
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => {
          // Set first image as primary, rest as additional images
          const firstImage = uploadedUrls[0]
          const remainingImages = uploadedUrls.slice(1)
          
          return {
            ...prev,
            image: prev.image || firstImage,
            images: [...(prev.images || []), ...remainingImages]
          }
        })
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully`)
      }
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Failed to upload images")
    } finally {
      setUploadingImage(false)
    }
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpecKey.trim()]: newSpecValue.trim(),
        },
      }))
      setNewSpecKey("")
      setNewSpecValue("")
    }
  }

  const removeSpecification = (key: string) => {
    setFormData((prev) => {
      const newSpecs = { ...prev.specifications }
      delete newSpecs[key]
      return {
        ...prev,
        specifications: newSpecs,
      }
    })
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.type ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#d9d9d9]">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto border-4 border-[rgb(var(--mavi-blue))] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">{t("admin.loadingProducts")}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#d9d9d9]">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6 space-y-6 animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border border-[rgb(var(--mavi-blue))]/20">
                  <Package className="h-7 w-7 text-[rgb(var(--mavi-blue))]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                    {t("admin.productManagement")}
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                    <TrendingUp className="h-4 w-4" />
                    {t("admin.manageInventory")}
                  </p>
                </div>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 transition-all hover:scale-105 shadow-lg hover:shadow-xl duration-200 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {t("admin.addNewProduct")}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] h-[90vh] flex flex-col bg-[#d9d9d9] p-0">
                <DialogHeader className="border-b px-6 py-4 shrink-0">
                  <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-700" />
                    {editingProduct ? t("admin.edit") : t("admin.addNewProduct")}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                  <div className="overflow-y-auto flex-1 px-6 py-4">
                    <div className="space-y-6">

                      {/* ================= BASIC INFORMATION ================= */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 uppercase tracking-wide">
                          <Package className="h-4 w-4" />
                          {t("admin.basicInformation")}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                              {t("admin.productName")}
                            </Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Premium Party Tent 5x5m"
                              required
                              className="h-11"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="type" className="text-sm font-medium">
                              {t("admin.category")}
                            </Label>
                            <Select 
                              value={formData.type} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder={t("admin.selectCategory")} />
                              </SelectTrigger>
                              <SelectContent>
                                {getCategoryNames().map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">
                              {t("admin.description")}
                            </Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Enter detailed product description..."
                              rows={6}
                              required
                              className="resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ================= PRICING & DETAILS ================= */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 uppercase tracking-wide">
                          <Euro className="h-4 w-4" />
                          {t("admin.pricingDetails")}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="price" className="text-sm font-medium">
                              {t("admin.dailyPrice")}
                            </Label>
                            <Input
                              id="price"
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.price || ""}
                              onChange={(e) => {
                                const val = e.target.value
                                setFormData(prev => ({
                                  ...prev,
                                  price: val === "" ? 0 : Number(val)
                                }))
                              }}
                              placeholder="0.00"
                              required
                              className="h-11"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="inventory" className="text-sm font-medium">
                              Inventory
                            </Label>
                            <Input
                              id="inventory"
                              type="number"
                              min="0"
                              value={formData.inventory || ""}
                              onChange={(e) => {
                                const val = e.target.value
                                setFormData(prev => ({
                                  ...prev,
                                  inventory: val === "" ? 1 : Number(val)
                                }))
                              }}
                              placeholder="e.g., 5"
                              required
                              className="h-11"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="dimensions" className="text-sm font-medium">
                              {t("admin.dimensions")}
                            </Label>
                            <Input
                              id="dimensions"
                              value={formData.dimensions}
                              onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                              placeholder="e.g., 5x5m"
                              className="h-11"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="capacity" className="text-sm font-medium">
                              {t("admin.capacity")}
                            </Label>
                            <Input
                              id="capacity"
                              value={formData.capacity}
                              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                              placeholder="e.g., 50 persons"
                              className="h-11"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ================= IMAGE & AVAILABILITY ================= */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 uppercase tracking-wide">
                          <Upload className="h-4 w-4" />
                          {t("admin.imageAvailability")}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Product Images (Multiple)</Label>
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Input
                                  id="image"
                                  value={formData.image}
                                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                                  placeholder="Or paste first image URL"
                                  className="h-11"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById("image-upload")?.click()}
                                  disabled={uploadingImage}
                                  className="h-11 px-6 hover:bg-gray-50"
                                >
                                  {uploadingImage ? (
                                    <div className="h-4 w-4 border-2 border-[rgb(var(--mavi-blue))] border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              
                              {/* Display multiple images preview */}
                              {(formData.images.length > 0 || formData.image) && (
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    {formData.images.length + (formData.image ? 1 : 0)} image(s) selected
                                  </p>
                                  <div className="grid grid-cols-4 gap-2">
                                    {formData.image && (
                                      <div className="relative group">
                                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                                          <Image
                                            src={formData.image}
                                            alt="Primary image"
                                            fill
                                            className="object-cover"
                                            unoptimized={formData.image.includes("imgbb")}
                                          />
                                        </div>
                                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">Primary</div>
                                      </div>
                                    )}
                                    {formData.images.map((img, idx) => (
                                      <div key={idx} className="relative group">
                                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                                          <Image
                                            src={img}
                                            alt={`Product image ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                            unoptimized={img.includes("imgbb")}
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setFormData(prev => ({
                                            ...prev,
                                            images: prev.images.filter((_, i) => i !== idx)
                                          }))}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="available" className="text-sm font-medium">
                              {t("admin.availabilityStatus")}
                            </Label>
                            <Select
                              value={formData.available.toString()}
                              onValueChange={(value) =>
                                setFormData(prev => ({ ...prev, available: value === "true" }))
                              }
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">{t("admin.available")}</SelectItem>
                                <SelectItem value="false">{t("admin.unavailable")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-2">
                              {t("admin.controlWhetherProduct")}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ================= SPECIFICATIONS ================= */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 uppercase tracking-wide">
                          <Sparkles className="h-4 w-4" />
                          {t("admin.specifications")}
                        </h3>
                        <div className="p-3 rounded-lg bg-gray-50 border space-y-3">
                          {Object.entries(formData.specifications).length > 0 ? (
                            <div className="grid gap-2">
                              {Object.entries(formData.specifications).map(([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center gap-3 p-2 bg-[#d9d9d9] rounded-lg border hover:border-gray-300 transition-all group"
                                >
                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <span className="font-medium text-xs">{key}</span>
                                    <span className="text-xs text-muted-foreground">{value}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSpecification(key)}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              {t("admin.noSpecificationsAdded")}
                            </p>
                          )}
                          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 pt-2">
                            <Input
                              placeholder={t("admin.specificationKey")}
                              value={newSpecKey}
                              onChange={(e) => setNewSpecKey(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecification())}
                              className="h-10"
                            />
                            <Input
                              placeholder={t("admin.specificationValue")}
                              value={newSpecValue}
                              onChange={(e) => setNewSpecValue(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecification())}
                              className="h-10"
                            />
                            <Button
                              type="button"
                              onClick={addSpecification}
                              className="h-10 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-white hover:text-black"
                            >
                              {t("admin.add")}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* ================= FEATURES ================= */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 uppercase tracking-wide">
                          <TrendingUp className="h-4 w-4" />
                          {t("admin.features")}
                        </h3>
                        <div className="p-3 rounded-lg bg-gray-50 border space-y-3">
                          {formData.features.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {formData.features.map((feature, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 p-2 px-3 bg-[#d9d9d9] rounded-lg border hover:border-gray-300 transition-all group text-xs"
                                >
                                  <span className="font-medium">{feature}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFeature(index)}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              {t("admin.noFeaturesAddedYet")}
                            </p>
                          )}
                          <div className="grid grid-cols-[1fr_auto] gap-2 pt-2">
                            <Input
                              placeholder={t("admin.addFeaturePlaceholder")}
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                              className="h-10"
                            />
                            <Button
                              type="button"
                              onClick={addFeature}
                              className="h-10 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-white hover:text-black"
                            >
                              {t("admin.add")}
                            </Button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="shrink-0 bg-[#d9d9d9] border-t px-6 py-4 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
                        resetForm()
                      }}
                      className="h-11 px-6"
                      disabled={isSubmitting}
                    >
                      {t("admin.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-11 px-8 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-white hover:text-black"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t("admin.saving")}
                        </div>
                      ) : (
                        editingProduct ? t("admin.updateProduct") : t("admin.createProduct")
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="max-w-md">
            <Input
              placeholder={t("admin.searchProducts")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 transition-all focus:ring-2 focus:ring-[rgb(var(--mavi-blue))]/20 border-2"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product, index) => (
            <Card
              key={product.id}
              className="group overflow-hidden border-2 hover:border-[rgb(var(--mavi-blue))]/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="p-0">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={product.image || PLACEHOLDER_IMAGE}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized={product.image?.includes("imgbb")}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant={product.available ? "default" : "destructive"}
                      className="shadow-lg backdrop-blur-sm"
                    >
                      {product.available ? t("admin.available") : t("admin.unavailable")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-lg mb-1.5 line-clamp-1 group-hover:text-[rgb(var(--mavi-blue))] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                </div>

                {(product.dimensions || product.capacity) && (
                  <div className="flex gap-2 flex-wrap">
                    {product.dimensions && (
                      <Badge variant="outline" className="text-xs">
                        {product.dimensions}
                      </Badge>
                    )}
                    {product.capacity && (
                      <Badge variant="outline" className="text-xs">
                        {product.capacity}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1.5">
                  <div className="flex items-center gap-1.5">
                    <Euro className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
                    <span className="font-bold text-xl bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                      {product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">/day</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border-[rgb(var(--mavi-blue))]/20 text-xs"
                  >
                    {product.type}
                  </Badge>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] hover:border-[rgb(var(--mavi-blue))] transition-all hover:scale-105 duration-200"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    {t("admin.edit")}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all hover:scale-105 duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="animate-scale-in bg-[#d9d9d9]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("admin.deleteProduct")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("admin.deleteConfirmation")} "{product.name}"? {t("admin.cannotBeUndone")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(product)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t("admin.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card className="border-2 border-dashed border-border animate-fade-in bg-slate-100">
            <CardContent className="text-center py-20">
              <div className="mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 w-fit">
                <Package className="h-20 w-20 text-[rgb(var(--mavi-blue))]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">
                {searchQuery ? t("admin.noProductsFound") : t("admin.noProductsYet")}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery
                  ? t("admin.adjustSearchTerms")
                  : t("admin.startByAdding")}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 transition-all hover:scale-105 shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {t("admin.addFirstProduct")}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}