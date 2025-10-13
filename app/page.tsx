import { ProductGrid } from "@/components/product-grid"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 space-y-6 animate-slide-up">
          <div className="inline-block">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border border-[rgb(var(--mavi-blue))]/20 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--mavi-turquoise))] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[rgb(var(--mavi-turquoise))]"></span>
              </span>
              <span className="text-sm font-medium">Premium Event Equipment</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-balance mb-6">
            <span className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
              Elevate Your Events
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground text-pretty max-w-3xl mx-auto leading-relaxed">
            Book high-quality party equipment and event supplies with flexible scheduling and instant confirmation
          </p>
        </div>
        <ProductGrid />
      </main>
    </div>
  )
}
