import { ProductGrid } from "@/components/product-grid"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <main className="container mx-auto px-4 py-2 sm:py-3 md:py-4">
        <ProductGrid />
      </main>
    </div>
  )
}
