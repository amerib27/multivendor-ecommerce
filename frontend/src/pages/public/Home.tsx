import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import ProductCard from '../../components/shared/ProductCard'
import { ProductGridSkeleton } from '../../components/ui/Skeleton'
import { productsService } from '../../services/products.service'
import { useAuthStore } from '../../store/auth.store'
import api from '../../services/api'

function HeroBanner() {
  const { isAuthenticated, user } = useAuthStore()
  const vendorLink = isAuthenticated && user?.role === 'CUSTOMER'
    ? '/vendor/apply'
    : '/register'
  const showVendorBtn = !isAuthenticated || user?.role === 'CUSTOMER'

  return (
    <section className="bg-gradient-to-r from-[#0088DD] to-[#0055AA] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Discover Products from Thousands of Vendors
          </h1>
          <p className="text-[#E6F4FF] text-lg mb-8">
            Shop unique items from independent sellers around the world. Find exactly what you need.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="bg-white text-[#0088DD] font-semibold px-6 py-3 rounded-lg hover:bg-[#E6F4FF] transition-colors"
            >
              Shop Now
            </Link>
            {showVendorBtn && (
              <Link
                to={vendorLink}
                className="border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Become a Vendor
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function CategoryStrip() {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories?flat=true')
      return (res.data.data as Array<{ id: string; name: string; slug: string }>).slice(0, 8)
    },
    staleTime: 10 * 60 * 1000,
  })

  if (!categories) return null

  return (
    <section className="border-b border-[#EEEEEE] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="shrink-0 text-sm text-[#333333] hover:text-[#0088DD] transition-colors font-medium whitespace-nowrap py-1"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedProducts() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsService.getFeatured(12),
  })

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#333333]">Featured Products</h2>
        <Link to="/products?featured=true" className="text-[#0088DD] hover:underline text-sm font-medium">
          View all
        </Link>
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(products || []).map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}

function NewArrivals() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', { sort: 'newest', limit: 8 }],
    queryFn: () => productsService.list({ sort: 'newest', limit: 8 }),
  })

  return (
    <section className="bg-[#E6F4FF] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#333333]">New Arrivals</h2>
          <Link to="/products?sort=newest" className="text-[#0088DD] hover:underline text-sm font-medium">
            View all
          </Link>
        </div>
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(data?.data || data?.products || []).slice(0, 8).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function VendorHighlights() {
  const { data } = useQuery({
    queryKey: ['top-vendors'],
    queryFn: async () => {
      const res = await api.get('/vendors/top')
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })

  if (!data || !data.length) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold text-[#333333] mb-6">Top Vendors</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {data.slice(0, 4).map((vendor: any) => (
          <Link
            key={vendor.id}
            to={`/vendor/${vendor.storeSlug}`}
            className="border border-[#EEEEEE] rounded-lg p-4 hover:border-[#0088DD] hover:bg-[#E6F4FF] transition-all text-center"
          >
            {vendor.logoUrl ? (
              <img src={vendor.logoUrl} alt={vendor.storeName} className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#0088DD] text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
                {vendor.storeName.charAt(0)}
              </div>
            )}
            <p className="font-semibold text-[#333333] text-sm truncate">{vendor.storeName}</p>
            <p className="text-xs text-gray-500 mt-1">{vendor.totalOrders} orders</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div>
      <HeroBanner />
      <CategoryStrip />
      <FeaturedProducts />
      <NewArrivals />
      <VendorHighlights />
    </div>
  )
}
