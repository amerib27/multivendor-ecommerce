import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useUIStore } from '../../store/ui.store'
import { formatCurrency } from '../../utils/format'
import { TableRowSkeleton } from '../../components/ui/Skeleton'

export default function VendorProducts() {
  const [search, setSearch] = useState('')
  const { toast } = useUIStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-products-list'],
    queryFn: async () => {
      const res = await api.get('/products/vendor/mine?limit=50')
      return res.data.data
    },
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/products/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-products-list'] }),
  })

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products-list'] })
      toast('Product deleted', 'success')
    },
    onError: () => toast('Failed to delete product', 'error'),
  })

  const products: any[] = (data || []).filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">My Products</h1>
        <Link
          to="/vendor/products/new"
          className="bg-[#0088DD] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0077C2] transition-colors"
        >
          + Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="border border-[#EEEEEE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0088DD] w-64"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No products yet.</p>
          <Link to="/vendor/products/new" className="bg-[#0088DD] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#0077C2] transition-colors">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#EEEEEE] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-[#EEEEEE]">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEEE]">
              {products.map((product: any) => (
                <tr key={product.id} className="hover:bg-[#E6F4FF] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]?.url || 'https://placehold.co/40x40?text=?'}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#EEEEEE]"
                      />
                      <div>
                        <p className="font-medium text-[#333333] line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.sku || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#333333]">
                    {formatCurrency(product.price)}
                    {product.comparePrice && (
                      <span className="text-xs text-gray-400 line-through ml-1">{formatCurrency(product.comparePrice)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.stock === 0 ? 'text-[#FF4D4D]' : 'text-green-600'}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive.mutate({ id: product.id, isActive: !product.isActive })}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${product.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/vendor/products/${product.id}/edit`}
                        className="text-xs text-[#0088DD] hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Delete this product?')) deleteProduct.mutate(product.id)
                        }}
                        className="text-xs text-[#FF4D4D] hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
