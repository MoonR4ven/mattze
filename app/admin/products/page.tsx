"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getProducts, addProduct, updateProduct, deleteProduct } from "@/lib/products"
import type { Product } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Edit, Trash2, Package, Euro, X, Sparkles, TrendingUp, Upload } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { uploadToImgBB } from "@/lib/imgbb"

const productTypes = ["Audio Equipment", "Decoration", "Furniture", "Entertainment", "Shelter", "Article"]

interface ProductFormData {
  name: string
  description: string
  type: string
  price: number
  image: string
  available: boolean
  dimensions: string
  capacity: string
  specifications: {
    material?: string
    uvProtection?: string
    [key: string]: string | undefined
  }
  features: string[]
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  type: "",
  price: 0,
  image: "",
  available: true,
  dimensions: "",
  capacity: "",
  specifications: {},
  features: [],
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
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

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const productsData = await getProducts()
      setProducts(productsData)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingProduct) {
        const success = await updateProduct(editingProduct.id, formData)
        if (success) {
          toast.success("Product updated successfully")
          await fetchProducts()
        } else {
          toast.error("Failed to update product")
        }
      } else {
        const productId = await addProduct(formData)
        if (productId) {
          toast.success("Product added successfully")
          await fetchProducts()
        } else {
          toast.error("Failed to add product")
        }
      }

      handleCloseDialog()
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("An error occurred while saving the product")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      type: product.type,
      price: product.price,
      image: product.image || "",
      available: product.available ?? true,
      dimensions: product.dimensions || "",
      capacity: product.capacity || "",
      specifications: product.specifications || {},
      features: product.features || [],
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (product: Product) => {
    try {
      const success = await deleteProduct(product.id)
      if (success) {
        toast.success("Product deleted successfully")
        setProducts(products.filter((p) => p.id !== product.id))
      } else {
        toast.error("Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("An error occurred while deleting the product")
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setFormData(initialFormData)
    setNewFeature("")
    setNewSpecKey("")
    setNewSpecValue("")
  }

  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean | any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    setUploadingImage(true)
    try {
      const imageUrl = await uploadToImgBB(file)
      if (imageUrl) {
        setFormData((prev) => ({ ...prev, image: imageUrl }))
        toast.success("Image uploaded successfully")
      } else {
        toast.error("Failed to upload image")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
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
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto border-4 border-[rgb(var(--mavi-blue))] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                    Product Management
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                    <TrendingUp className="h-4 w-4" />
                    Manage your rental inventory
                  </p>
                </div>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 transition-all hover:scale-105 shadow-lg hover:shadow-xl duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl h-[90vh] flex flex-col bg-white p-0">
                <DialogHeader className="border-b px-6 py-4 shrink-0">
                  <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-700" />
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                  <div className="overflow-y-auto flex-1 px-6 py-4">
                    <div className="space-y-6">
                    {/* Basic Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 uppercase tracking-wide">
                        <Package className="h-4 w-4" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">
                            Product Name *
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            placeholder="e.g., Premium Party Tent 5x5m"
                            required
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type" className="text-sm font-medium">
                            Category *
                          </Label>
                          <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {productTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="description" className="text-sm font-medium">
                            Description *
                          </Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            placeholder="Enter detailed product description..."
                            rows={3}
                            required
                            className="resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Details Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 uppercase tracking-wide">
                        <Euro className="h-4 w-4" />
                        Pricing & Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price" className="text-sm font-medium">
                            Daily Price (€) *
                          </Label>
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            required
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dimensions" className="text-sm font-medium">
                            Dimensions
                          </Label>
                          <Input
                            id="dimensions"
                            value={formData.dimensions}
                            onChange={(e) => handleInputChange("dimensions", e.target.value)}
                            placeholder="e.g., 5x5m"
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="capacity" className="text-sm font-medium">
                            Capacity
                          </Label>
                          <Input
                            id="capacity"
                            value={formData.capacity}
                            onChange={(e) => handleInputChange("capacity", e.target.value)}
                            placeholder="e.g., 50 persons"
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Image & Availability Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 uppercase tracking-wide">
                        <Upload className="h-4 w-4" />
                        Image & Availability
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Product Image</Label>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                id="image"
                                value={formData.image}
                                onChange={(e) => handleInputChange("image", e.target.value)}
                                placeholder="Or paste image URL"
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
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            {formData.image && (
                              <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                                <Image
                                  src={formData.image}
                                  alt="Preview"
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="available" className="text-sm font-medium">
                            Availability Status
                          </Label>
                          <Select
                            value={formData.available.toString()}
                            onValueChange={(value) => handleInputChange("available", value === "true")}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Available</SelectItem>
                              <SelectItem value="false">Unavailable</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-2">
                            Control whether this product can be rented by customers
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Specifications Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 uppercase tracking-wide">
                        <Sparkles className="h-4 w-4" />
                        Specifications
                      </h3>
                      <div className="p-3 rounded-lg bg-gray-50 border space-y-3">
                        {Object.entries(formData.specifications).length > 0 ? (
                          <div className="grid gap-2">
                            {Object.entries(formData.specifications).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-3 p-2.5 bg-white rounded-lg border hover:border-gray-300 transition-all group"
                              >
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <span className="font-medium text-sm">{key}</span>
                                  <span className="text-sm text-muted-foreground">{value}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSpecification(key)}
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            No specifications added yet
                          </p>
                        )}
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 pt-2">
                          <Input
                            placeholder="Key (e.g., Material)"
                            value={newSpecKey}
                            onChange={(e) => setNewSpecKey(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecification())}
                            className="h-10"
                          />
                          <Input
                            placeholder="Value (e.g., PVC 750N)"
                            value={newSpecValue}
                            onChange={(e) => setNewSpecValue(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecification())}
                            className="h-10"
                          />
                          <Button
                            type="button"
                            onClick={addSpecification}
                            className="h-10 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-white"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Features Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 uppercase tracking-wide">
                        <TrendingUp className="h-4 w-4" />
                        Features
                      </h3>
                      <div className="p-3 rounded-lg bg-gray-50 border space-y-3">
                        {formData.features.length > 0 ? (
                          <div className="grid gap-2">
                            {formData.features.map((feature, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-2.5 bg-white rounded-lg border hover:border-gray-300 transition-all group"
                              >
                                <span className="text-sm flex-1">{feature}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFeature(index)}
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            No features added yet
                          </p>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Input
                            placeholder="Add a feature (e.g., UV Protection 50+)"
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                            className="h-10 flex-1"
                          />
                          <Button
                            type="button"
                            onClick={addFeature}
                            className="h-10 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-white"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>

                  {/* Action Buttons - Always Visible */}
                  <div className="shrink-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCloseDialog} 
                      className="h-11 px-6"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-11 px-8 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-white"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </div>
                      ) : (
                        editingProduct ? "Update Product" : "Create Product"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="max-w-md">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 transition-all focus:ring-2 focus:ring-[rgb(var(--mavi-blue))]/20 border-2"
            />
          </div>
        </div>

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
                    src={
                      product.image || `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(product.name)}`
                    }
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant={product.available ? "default" : "destructive"}
                      className="shadow-lg backdrop-blur-sm"
                    >
                      {product.available ? "Available" : "Unavailable"}
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
                    Edit
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
                    <AlertDialogContent className="animate-scale-in bg-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{product.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(product)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
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
          <Card className="border-2 border-dashed border-border animate-fade-in">
            <CardContent className="text-center py-20">
              <div className="mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 w-fit">
                <Package className="h-20 w-20 text-[rgb(var(--mavi-blue))]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">
                {searchQuery ? "No products found" : "No products yet"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Start by adding your first rental product to your inventory."}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 transition-all hover:scale-105 shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Product
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
