import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { formatCurrency } from '../../utils/format'
import { TableRowSkeleton } from '../../components/ui/Skeleton'

export default function AdminProducts() {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: async () => {
      const res = await api.get(`/admin/products?search=${search}&limit=50`)
      return res.data.data
    },
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/products/${id}/toggle`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  })

  const toggleFeatured = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      api.patch(`/admin/products/${id}/featured`, { isFeatured }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  })

  const products: any[] = data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">Products</h1>
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
          {Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)}
        </div>
      ) : (
        <div className="bg-white border border-[#EEEEEE] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-[#EEEEEE]">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Featured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEEE]">
              {products.map((product: any) => (
                <tr key={product.id} className="hover:bg-[#E6F4FF] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={product.images?.[0]?.url || 'https://placehold.co/32x32?text=?'}
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover border border-[#EEEEEE]"
                      />
                      <p className="font-medium text-[#333333] max-w-[180px] truncate">{product.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{product.vendor?.storeName}</td>
                  <td className="px-4 py-3 text-[#333333]">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3">
                    <span className={product.stock === 0 ? 'text-[#FF4D4D]' : 'text-green-600'}>{product.stock}</span>
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
                    <button
                      onClick={() => toggleFeatured.mutate({ id: product.id, isFeatured: !product.isFeatured })}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${product.isFeatured ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {product.isFeatured ? '★ Featured' : 'Not Featured'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No products found.</p>
          )}
        </div>
      )}
    </div>
  )
}
