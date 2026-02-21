import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCartStore } from '../../store/cart.store'
import { useUIStore } from '../../store/ui.store'
import { formatCurrency, calcDiscount } from '../../utils/format'

export interface ProductCardData {
  id: string
  slug: string
  name: string
  price: number
  comparePrice?: number | null
  rating: number
  reviewCount: number
  soldCount?: number
  stock: number
  images: { url: string; altText?: string | null }[]
  vendor: {
    storeName: string
    storeSlug: string
  }
}

interface ProductCardProps {
  product: ProductCardData
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-3.5 h-3.5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore(s => s.addItem)
  const addToast = useUIStore(s => s.addToast)

  const discountPct = product.comparePrice
    ? calcDiscount(product.price, product.comparePrice)
    : null

  const primaryImage = product.images[0] // First image
  const imageUrl = primaryImage?.url || '/placeholder-product.jpg'

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (product.stock === 0) {
      addToast({ type: 'warning', message: 'This product is out of stock' })
      return
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      quantity: 1,
      imageUrl,
      vendorName: product.vendor.storeName,
      vendorSlug: product.vendor.storeSlug,
      stock: product.stock,
    })
    addToast({ type: 'success', message: `"${product.name}" added to cart` })
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-[#EEEEEE] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
    >
      {/* Image */}
      <Link to={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden">
        <img
          src={imageUrl}
          alt={primaryImage?.altText || product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {discountPct && discountPct > 0 && (
          <span className="absolute top-2 left-2 bg-[#FF4D4D] text-white text-xs px-2 py-0.5 rounded-full font-semibold">
            -{discountPct}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full font-medium">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link
          to={`/vendor/${product.vendor.storeSlug}`}
          className="text-xs text-[#0088DD] hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {product.vendor.storeName}
        </Link>

        <Link to={`/products/${product.slug}`}>
          <h3 className="text-[#333333] font-medium mt-1 text-sm line-clamp-2 hover:text-[#0088DD] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(star => (
              <StarIcon key={star} filled={star <= Math.round(product.rating)} />
            ))}
          </div>
          <span className="text-xs text-gray-400">({product.reviewCount})</span>
        </div>

        {/* Price & Cart */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-[#333333] font-bold text-base">
              {formatCurrency(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-gray-400 text-xs line-through ml-2">
                {formatCurrency(product.comparePrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="bg-[#0088DD] hover:bg-[#0077C2] disabled:bg-gray-300 disabled:cursor-not-allowed
                       text-white text-xs px-3 py-1.5 rounded-md transition-colors font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  )
}
