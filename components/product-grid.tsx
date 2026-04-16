"use client"

import { useEffect, useMemo, useState } from "react"
import type { Product } from "@/lib/types"
import { getProducts } from "@/lib/products"
import { ProductCard } from "./product-card"
import { Package, Sparkles } from "lucide-react"
import { useFilter } from "@/contexts/filter-context"
import { useI18n } from "@/contexts/i18n-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const getProductCategory = (product: Product): string => {
  const category = (product.category || "").trim()
  if (category) return category

  const type = (product.type || "").trim()
  if (type) return type

  return "Uncategorized"
}

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectedCategory, setSelectedCategory } = useFilter()
  const { t } = useI18n()

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('🚀 ProductGrid: Starting to fetch products...')
        setLoading(true)
        const fetchedProducts = await getProducts()
        console.log('📊 ProductGrid: Received', fetchedProducts.length, 'products')
        setProducts(fetchedProducts)
      } catch (err) {
        setError(t("productGrid.loadFailed"))
        console.error("❌ ProductGrid: Error fetching products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [t])

  const categoryOptions = useMemo(() => {
    const values = Array.from(new Set(products.map(getProductCategory).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

    return ["all", ...values]
  }, [products])

  useEffect(() => {
    if (selectedCategory === "all") return
    if (!categoryOptions.includes(selectedCategory)) {
      setSelectedCategory("all")
    }
  }, [categoryOptions, selectedCategory, setSelectedCategory])

  const filteredProducts = products.filter(product => {
    if (selectedCategory === "all") return true
    return getProductCategory(product) === selectedCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto border-4 border-[rgb(var(--mavi-blue))] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">{t("productGrid.loading")}</p>
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
        <h3 className="text-2xl font-bold mb-3">{t("productGrid.noProducts")}</h3>
        <p className="text-muted-foreground">{t("productGrid.checkBackSoon")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        className="sticky z-40 rounded-xl border-2 bg-[#d9d9d9]/95 p-2 backdrop-blur-sm"
        style={{ top: "var(--site-header-offset, 88px)" }}
      >
        <div className="flex items-center justify-end gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("productGrid.filterBy")}</span>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 min-w-[170px] border-2 bg-[#d9d9d9] text-xs sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? t("productGrid.categoryAll") : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 w-fit">
            <Package className="h-16 w-16 text-[rgb(var(--mavi-blue))]" />
          </div>
          <h3 className="text-2xl font-bold mb-3">{t("productGrid.noProductsInCategory")}</h3>
          <p className="text-muted-foreground">{t("productGrid.tryDifferentCategory")}</p>
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
