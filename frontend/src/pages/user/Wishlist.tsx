import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useCartStore } from '../../store/cart.store'
import { useUIStore } from '../../store/ui.store'
import { formatCurrency, calcDiscount } from '../../utils/format'
import { ProductGridSkeleton } from '../../components/ui/Skeleton'

export default function Wishlist() {
  const { addItem } = useCartStore()
  const { toast } = useUIStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await api.get('/wishlist')
      return res.data.data
    },
  })

  const remove = useMutation({
    mutationFn: (productId: string) => api.delete(`/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast('Removed from wishlist', 'success')
    },
  })

  // data is a Wishlist object; actual items are nested in data.items
  const items: any[] = data?.items || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">My Wishlist ({items.length})</h1>

      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">♡</p>
          <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
          <Link to="/products" className="bg-[#0088DD] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#0077C2] transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item: any) => {
            const product = item.product
            if (!product) return null
            const discount = product.comparePrice ? calcDiscount(product.price, product.comparePrice) : 0

            return (
              <div key={item.id} className="bg-white border border-[#EEEEEE] rounded-xl overflow-hidden group">
                <div className="relative">
                  <Link to={`/products/${product.slug}`}>
                    <img
                      src={product.images?.[0]?.url || 'https://placehold.co/300x300?text=No+Image'}
                      alt={product.name}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <button
                    onClick={() => remove.mutate(product.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center text-[#FF4D4D] hover:bg-[#FF4D4D] hover:text-white transition-colors"
                  >
                    ♥
                  </button>
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-[#FF4D4D] text-white text-xs px-2 py-0.5 rounded-md">
                      -{discount}%
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="text-sm font-medium text-[#333333] line-clamp-2 hover:text-[#0088DD] transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-[#0088DD] text-sm">
                      {formatCurrency(product.price)}
                    </span>
                    {discount > 0 && (
                      <span className="text-xs text-gray-400 line-through">{formatCurrency(product.comparePrice)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      addItem({
                        productId: product.id,
                        slug: product.slug,
                        name: product.name,
                        price: product.price,
                        comparePrice: product.comparePrice ?? null,
                        imageUrl: product.images?.[0]?.url ?? '',
                        quantity: 1,
                        stock: product.stock,
                        vendorSlug: product.vendor?.storeSlug ?? '',
                        vendorName: product.vendor?.storeName ?? '',
                      })
                      toast(`${product.name} added to cart`, 'success')
                    }}
                    disabled={product.stock === 0}
                    className="mt-2 w-full bg-[#0088DD] text-white py-1.5 rounded-lg text-xs font-medium hover:bg-[#0077C2] disabled:opacity-50 transition-colors"
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
