import { ProductGrid } from "@/components/product-grid"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-4">Premium Event Rentals</h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            Book high-quality party equipment and event supplies with flexible scheduling and instant confirmation
          </p>
        </div>
        <ProductGrid />
      </main>
    </div>
  )
}
