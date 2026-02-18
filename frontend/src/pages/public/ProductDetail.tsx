import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { productsService } from '../../services/products.service'
import api from '../../services/api'
import { useCartStore } from '../../store/cart.store'
import { useAuthStore } from '../../store/auth.store'
import { useUIStore } from '../../store/ui.store'
import { formatCurrency, formatRelativeTime, calcDiscount } from '../../utils/format'
import { Skeleton } from '../../components/ui/Skeleton'
import ProductCard from '../../components/shared/ProductCard'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [selectedImage, setSelectedImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)

  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const { toast } = useUIStore()
  const queryClient = useQueryClient()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsService.getBySlug(slug!),
    enabled: !!slug,
  })

  // related is embedded in the product detail response
  const related = product?.related

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist-check', product?.id],
    queryFn: async () => {
      const res = await api.get('/wishlist')
      // Response is a Wishlist object; items are nested inside
      return (res.data.data?.items ?? []) as { productId: string }[]
    },
    enabled: isAuthenticated && !!product?.id,
  })

  const isWishlisted = wishlistData?.some((w) => w.productId === product?.id)

  const wishlistMutation = useMutation({
    mutationFn: () =>
      isWishlisted
        ? api.delete(`/wishlist/${product?.id}`)
        : api.post(`/wishlist/${product?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', product?.id] })
      toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success')
    },
  })

  const reviewMutation = useMutation({
    mutationFn: () =>
      api.post(`/reviews/product/${product?.id}`, { rating: reviewRating, body: reviewText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', slug] })
      setReviewText('')
      setReviewRating(5)
      toast('Review submitted!', 'success')
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to submit review', 'error')
    },
  })

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice ?? null,
      quantity: qty,
      imageUrl: product.images?.[0]?.url ?? '',
      vendorName: product.vendor?.storeName ?? '',
      vendorSlug: product.vendor?.storeSlug ?? '',
      stock: product.stock,
    })
    toast(`${product.name} added to cart`, 'success')
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="w-1/2">
            <Skeleton className="aspect-square rounded-xl" />
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  const discount = product.comparePrice ? calcDiscount(product.price, product.comparePrice) : 0
  const displayImages = product.images?.length ? product.images : [{ url: 'https://placehold.co/600x600?text=No+Image', id: '0', isPrimary: true }]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-[#0088DD]">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-[#0088DD]">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-[#333333]">{product.name}</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Image Gallery */}
        <div className="md:w-1/2">
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={displayImages[selectedImage]?.url}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-xl border border-[#EEEEEE] mb-3"
            />
          </AnimatePresence>
          {displayImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {displayImages.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-[#0088DD]' : 'border-transparent'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="md:w-1/2">
          <h1 className="text-2xl font-bold text-[#333333] mb-2">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>{i < Math.round(product.rating ?? 0) ? '★' : '☆'}</span>
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.reviewCount ?? 0} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-[#0088DD]">
              {formatCurrency(product.price)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatCurrency(product.comparePrice)}</span>
                <span className="bg-[#FF4D4D] text-white text-sm px-2 py-0.5 rounded-md font-medium">-{discount}%</span>
              </>
            )}
          </div>

          {/* Stock */}
          <p className={`text-sm mb-4 ${product.stock > 0 ? 'text-green-600' : 'text-[#FF4D4D]'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>

          {/* Quantity */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-medium text-[#333333]">Quantity:</span>
              <div className="flex items-center border border-[#EEEEEE] rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-2 hover:bg-[#E6F4FF] transition-colors"
                >
                  −
                </button>
                <span className="px-4 py-2 text-sm font-medium">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 hover:bg-[#E6F4FF] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-[#0088DD] text-white py-3 rounded-xl font-semibold hover:bg-[#0077C2] transition-colors disabled:opacity-50"
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => wishlistMutation.mutate()}
                className={`px-4 py-3 rounded-xl border-2 transition-colors ${isWishlisted ? 'border-[#FF4D4D] text-[#FF4D4D]' : 'border-[#EEEEEE] text-gray-500 hover:border-[#FF4D4D] hover:text-[#FF4D4D]'}`}
              >
                {isWishlisted ? '♥' : '♡'}
              </button>
            )}
          </div>

          {/* Vendor */}
          {product.vendor && (
            <Link
              to={`/vendor/${product.vendor.storeSlug}`}
              className="flex items-center gap-3 p-3 border border-[#EEEEEE] rounded-xl hover:bg-[#E6F4FF] transition-colors"
            >
              {product.vendor.logoUrl ? (
                <img src={product.vendor.logoUrl} alt={product.vendor.storeName} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0088DD] flex items-center justify-center text-white font-bold text-sm">
                  {product.vendor.storeName[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-[#333333]">{product.vendor.storeName}</p>
                <p className="text-xs text-[#0088DD]">Visit store →</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="border-t border-[#EEEEEE] pt-8 mb-12">
        <h2 className="text-xl font-bold text-[#333333] mb-6">Customer Reviews</h2>

        {isAuthenticated && (
          <div className="bg-[#E6F4FF] rounded-xl p-4 mb-6">
            <h3 className="font-medium text-[#333333] mb-3">Write a Review</h3>
            <div className="flex gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewRating(i + 1)}
                  className={`text-2xl ${i < reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full border border-[#EEEEEE] rounded-lg p-3 text-sm focus:outline-none focus:border-[#0088DD] resize-none"
            />
            <button
              onClick={() => reviewMutation.mutate()}
              disabled={!reviewText.trim() || reviewMutation.isPending}
              className="mt-2 bg-[#0088DD] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0077C2] disabled:opacity-50 transition-colors"
            >
              {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}

        {product.reviews?.length === 0 && (
          <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
        )}
        <div className="space-y-4">
          {(product.reviews ?? []).map((review: any) => (
            <div key={review.id} className="border border-[#EEEEEE] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0088DD] flex items-center justify-center text-white text-xs font-bold">
                    {review.user?.firstName?.[0] ?? 'U'}
                  </div>
                  <span className="text-sm font-medium text-[#333333]">
                    {review.user?.firstName} {review.user?.lastName}
                  </span>
                  {review.isVerified && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Verified Purchase</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{formatRelativeTime(review.createdAt)}</span>
              </div>
              <div className="flex text-yellow-400 text-sm mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                ))}
              </div>
              <p className="text-sm text-gray-600">{review.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Related Products */}
      {related && related.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-[#333333] mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
