import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useUIStore } from '../../store/ui.store'
import { formatCurrency, formatDate } from '../../utils/format'
import { TableRowSkeleton } from '../../components/ui/Skeleton'

const STATUSES = ['All', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
}
const NEXT_LABEL: Record<string, string> = {
  PENDING: 'Accept Order',
  CONFIRMED: 'Mark Processing',
  PROCESSING: 'Mark Shipped',
  SHIPPED: 'Mark Delivered',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
}

export default function VendorOrders() {
  const [statusFilter, setStatusFilter] = useState('All')
  const { toast } = useUIStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'All') params.set('status', statusFilter)
      const res = await api.get(`/orders/vendor/incoming?${params.toString()}`)
      return res.data.data
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) =>
      api.patch(`/orders/vendor/items/${itemId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] })
      toast('Order status updated', 'success')
    },
    onError: () => toast('Failed to update status', 'error'),
  })

  // Backend returns OrderItem[] — each item has a nested `order` with customer info
  const items: any[] = data || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Orders</h1>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-[#0088DD] text-white'
                : 'bg-white border border-[#EEEEEE] text-[#333333] hover:bg-[#E6F4FF]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white border border-[#EEEEEE] rounded-xl p-4">
              {/* Order header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-[#333333]">
                    {item.order?.orderNumber ?? '—'}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                  <p className="text-xs text-gray-500">
                    {item.order?.user?.firstName} {item.order?.user?.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {item.status}
                  </span>
                  <p className="text-sm font-bold text-[#0088DD] mt-1">
                    {formatCurrency(item.totalPrice)}
                  </p>
                </div>
              </div>

              {/* Item details + action */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <img
                  src={item.productImage || 'https://placehold.co/40x40?text=?'}
                  alt={item.productName}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#333333] truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                {NEXT_STATUS[item.status] && (
                  <button
                    onClick={() =>
                      updateStatus.mutate({ itemId: item.id, status: NEXT_STATUS[item.status] })
                    }
                    disabled={updateStatus.isPending}
                    className="shrink-0 text-xs bg-[#0088DD] text-white px-3 py-1.5 rounded-lg hover:bg-[#0077C2] transition-colors disabled:opacity-60 font-medium"
                  >
                    {NEXT_LABEL[item.status]}
                  </button>
                )}
                {item.status === 'DELIVERED' && (
                  <span className="shrink-0 text-xs text-green-600 font-medium">✓ Delivered</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
