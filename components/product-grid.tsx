"use client"

import { useEffect, useState } from "react"
import type { Product } from "@/lib/types"
import { getProducts } from "@/lib/products"
import { ProductCard } from "./product-card"
import { Package, Sparkles } from "lucide-react"
import { Button } from "./ui/button"

const CATEGORIES = [
  { id: "all", name: "All Products", icon: Sparkles },
  { id: "events", name: "Events & Party", types: ["Entertainment", "Shelter", "Decoration"] },
  { id: "audio", name: "Audio & Tech", types: ["Audio Equipment"] },
  { id: "furniture", name: "Furniture & More", types: ["Furniture", "Article"] }
]

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const fetchedProducts = await getProducts()
        setProducts(fetchedProducts)
      } catch (err) {
        setError("Failed to load products")
        console.error("Error fetching products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = products.filter(product => {
    if (selectedCategory === "all") return true
    const category = CATEGORIES.find(cat => cat.id === selectedCategory)
    return category?.types?.includes(product.type)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto border-4 border-[rgb(var(--mavi-blue))] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto mb-6 p-6 rounded-3xl bg-destructive/10 w-fit">
          <Package className="h-16 w-16 text-destructive" />
        </div>
        <p className="text-destructive text-lg">{error}</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 w-fit">
          <Package className="h-16 w-16 text-[rgb(var(--mavi-blue))]" />
        </div>
        <h3 className="text-2xl font-bold mb-3">No products available</h3>
        <p className="text-muted-foreground">Check back soon for amazing rental options!</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 justify-center">
        {CATEGORIES.map((category, index) => (
          <Button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="lg"
            className={`
              transition-all hover:scale-105 animate-fade-in
              ${selectedCategory === category.id
                ? 'bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 shadow-lg'
                : 'hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] hover:border-[rgb(var(--mavi-blue))]'
              }
            `}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {category.icon && <category.icon className="h-4 w-4 mr-2" />}
            {category.name}
          </Button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 w-fit">
            <Package className="h-16 w-16 text-[rgb(var(--mavi-blue))]" />
          </div>
          <h3 className="text-2xl font-bold mb-3">No products in this category</h3>
          <p className="text-muted-foreground">Try selecting a different category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
