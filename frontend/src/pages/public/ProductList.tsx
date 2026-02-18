import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ProductCard from '../../components/shared/ProductCard'
import { ProductGridSkeleton } from '../../components/ui/Skeleton'
import { productsService } from '../../services/products.service'
import api from '../../services/api'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
]

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')

  const page = parseInt(searchParams.get('page') || '1')
  const category = searchParams.get('category') || undefined
  const sort = (searchParams.get('sort') || 'newest') as any
  const featured = searchParams.get('featured') === 'true'

  const updateParam = useCallback((key: string, value: string | undefined) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      next.set('page', '1')
      return next
    })
  }, [setSearchParams])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', { page, category, sort, featured, minPrice, maxPrice }],
    queryFn: () => productsService.list({
      page,
      limit: 20,
      category,
      sort,
      featured: featured || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    }),
    placeholderData: (prev: any) => prev,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories?flat=true')
      return res.data.data
    },
    staleTime: 10 * 60 * 1000,
  })

  const products = data?.data || []
  const meta = data?.meta

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="bg-white border border-[#EEEEEE] rounded-lg p-4 sticky top-20">
            <h3 className="font-semibold text-[#333333] mb-4">Filters</h3>

            {/* Categories */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Category</p>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam('category', undefined)}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                    !category ? 'text-[#0088DD] bg-[#E6F4FF]' : 'text-[#333333] hover:bg-[#E6F4FF]'
                  }`}
                >
                  All Categories
                </button>
                {(categories || []).filter((c: any) => !c.parentId).map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParam('category', cat.slug)}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                      category === cat.slug ? 'text-[#0088DD] bg-[#E6F4FF]' : 'text-[#333333] hover:bg-[#E6F4FF]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Price Range</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full border border-[#EEEEEE] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#0088DD]"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full border border-[#EEEEEE] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#0088DD]"
                />
              </div>
              <button
                onClick={() => {
                  updateParam('minPrice', minPrice || undefined)
                  updateParam('maxPrice', maxPrice || undefined)
                }}
                className="mt-2 w-full bg-[#0088DD] text-white text-sm py-1.5 rounded-md hover:bg-[#0077C2] transition-colors"
              >
                Apply
              </button>
              {(minPrice || maxPrice) && (
                <button
                  onClick={() => {
                    setMinPrice('')
                    setMaxPrice('')
                    updateParam('minPrice', undefined)
                    updateParam('maxPrice', undefined)
                  }}
                  className="mt-1 w-full text-sm text-gray-500 hover:text-[#FF4D4D] transition-colors"
                >
                  Clear price filter
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {meta ? `${meta.total} products` : ''}
              {category ? ` in ${category}` : ''}
            </p>
            <select
              value={sort}
              onChange={e => updateParam('sort', e.target.value)}
              className="border border-[#EEEEEE] rounded-md px-3 py-1.5 text-sm text-[#333333] focus:outline-none focus:border-[#0088DD]"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={20} />
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No products found</p>
              <button
                onClick={() => setSearchParams({})}
                className="mt-3 text-[#0088DD] hover:underline text-sm"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ${isFetching ? 'opacity-70' : ''} transition-opacity`}>
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => updateParam('page', String(page - 1))}
                disabled={page <= 1}
                className="px-4 py-2 border border-[#EEEEEE] rounded-md text-sm disabled:opacity-50 hover:bg-[#E6F4FF] transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {meta.totalPages}
              </span>
              <button
                onClick={() => updateParam('page', String(page + 1))}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 border border-[#EEEEEE] rounded-md text-sm disabled:opacity-50 hover:bg-[#E6F4FF] transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
