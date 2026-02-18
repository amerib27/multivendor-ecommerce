import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productsService } from '../../services/products.service'
import ProductCard from '../../components/shared/ProductCard'
import { ProductGridSkeleton } from '../../components/ui/Skeleton'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const sort = (searchParams.get('sort') || 'newest') as any

  const { data, isLoading } = useQuery({
    queryKey: ['search', q, page, sort],
    queryFn: () =>
      productsService.list({ search: q, page, limit: 20, sort }),
    enabled: !!q,
    placeholderData: (prev: any) => prev,
  })

  const products = data?.data || []
  const meta = data?.meta

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">
          {q ? `Results for "${q}"` : 'Search Products'}
        </h1>
        {meta && (
          <p className="text-sm text-gray-500 mt-1">{meta.total} products found</p>
        )}
      </div>

      {!q ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Enter a search term to find products.</p>
        </div>
      ) : isLoading ? (
        <ProductGridSkeleton count={12} />
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No products found for "{q}"</p>
          <p className="text-sm text-gray-400 mt-2">Try different keywords or browse our categories.</p>
        </div>
      ) : (
        <>
          {/* Sort */}
          <div className="flex justify-end mb-4">
            <select
              value={sort}
              onChange={e => setSearchParams(p => { const n = new URLSearchParams(p); n.set('sort', e.target.value); n.set('page', '1'); return n })}
              className="border border-[#EEEEEE] rounded-md px-3 py-1.5 text-sm text-[#333333] focus:outline-none focus:border-[#0088DD]"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setSearchParams(p => { const n = new URLSearchParams(p); n.set('page', String(page - 1)); return n })}
                disabled={page <= 1}
                className="px-4 py-2 border border-[#EEEEEE] rounded-md text-sm disabled:opacity-50 hover:bg-[#E6F4FF] transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {meta.totalPages}</span>
              <button
                onClick={() => setSearchParams(p => { const n = new URLSearchParams(p); n.set('page', String(page + 1)); return n })}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 border border-[#EEEEEE] rounded-md text-sm disabled:opacity-50 hover:bg-[#E6F4FF] transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
