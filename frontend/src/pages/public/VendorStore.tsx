import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '../../services/api'
import ProductCard from '../../components/shared/ProductCard'
import { ProductGridSkeleton, Skeleton } from '../../components/ui/Skeleton'
import { formatRelativeTime } from '../../utils/format'

export default function VendorStore() {
  const { slug } = useParams<{ slug: string }>()

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor', slug],
    queryFn: async () => {
      const res = await api.get(`/vendors/${slug}`)
      return res.data.data
    },
    enabled: !!slug,
  })

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['vendor-products', slug],
    queryFn: async () => {
      const res = await api.get(`/vendors/${slug}/products?limit=20`)
      return res.data.data
    },
    enabled: !!slug,
  })

  if (vendorLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-48 rounded-2xl mb-6" />
        <ProductGridSkeleton count={8} />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#333333] mb-2">Store Not Found</h1>
        <p className="text-gray-500 mb-6">This vendor store doesn't exist or may have been removed.</p>
        <Link to="/products" className="bg-[#0088DD] text-white px-6 py-2 rounded-lg hover:bg-[#0077C2] transition-colors">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Store Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8">
        {vendor.bannerUrl ? (
          <img src={vendor.bannerUrl} alt="Store banner" className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-r from-[#0088DD] to-[#005599]" />
        )}

        {/* Store Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <div className="flex items-end gap-4">
            {vendor.logoUrl ? (
              <img
                src={vendor.logoUrl}
                alt={vendor.storeName}
                className="w-20 h-20 rounded-2xl border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-[#0088DD]">{vendor.storeName[0]}</span>
              </div>
            )}
            <div className="text-white">
              <h1 className="text-2xl font-bold">{vendor.storeName}</h1>
              <p className="text-sm opacity-80">Member since {formatRelativeTime(vendor.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        {[
          { label: 'Products', value: vendor._count?.products ?? 0 },
          { label: 'Sales', value: vendor.totalSales ?? 0 },
          { label: 'Rating', value: `${Number(vendor.rating ?? 0).toFixed(1)} ★` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-[#EEEEEE] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#0088DD]">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Description */}
      {vendor.description && (
        <div className="bg-white border border-[#EEEEEE] rounded-xl p-4 mb-8">
          <h2 className="font-semibold text-[#333333] mb-2">About this store</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{vendor.description}</p>
        </div>
      )}

      {/* Products Grid */}
      <h2 className="text-xl font-bold text-[#333333] mb-4">
        Products ({products?.length ?? 0})
      </h2>

      {productsLoading ? (
        <ProductGridSkeleton count={8} />
      ) : products?.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">This store has no products yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(products ?? []).map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
