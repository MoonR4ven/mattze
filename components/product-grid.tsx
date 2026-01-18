"use client"

import { useEffect, useState } from "react"
import type { Product } from "@/lib/types"
import { getProducts } from "@/lib/products"
import { ProductCard } from "./product-card"
import { Package, Sparkles } from "lucide-react"
import { Button } from "./ui/button"
import { useFilter } from "@/contexts/filter-context"

const CATEGORIES = [
  { id: "all", name: "All Products", icon: Sparkles, types: [] },
  { id: "events", name: "Events & Party", types: ["Entertainment", "Shelter", "Decoration"] },
  { id: "audio", name: "Audio & Tech", types: ["Audio Equipment"] },
  { id: "furniture", name: "Furniture & More", types: ["Furniture", "Article"] }
]

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectedCategory } = useFilter()

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('🚀 ProductGrid: Starting to fetch products...')
        setLoading(true)
        const fetchedProducts = await getProducts()
        console.log('📊 ProductGrid: Received', fetchedProducts.length, 'products')
        setProducts(fetchedProducts)
      } catch (err) {
        setError("Failed to load products")
        console.error("❌ ProductGrid: Error fetching products:", err)
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
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 w-fit">
            <Package className="h-16 w-16 text-[rgb(var(--mavi-blue))]" />
          </div>
          <h3 className="text-2xl font-bold mb-3">No products in this category</h3>
          <p className="text-muted-foreground">Try selecting a different category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredProducts.map((product, index) => {
            // Use a combination of id and index to ensure unique keys even with duplicate product IDs
            const uniqueKey = `${product.id}-${index}`
            return (
              <div
                key={uniqueKey}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard product={product} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
