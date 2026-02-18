import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/format'
import { TableRowSkeleton } from '../../components/ui/Skeleton'

const STATUSES = ['All', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState('All')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' })
      if (statusFilter !== 'All') params.set('status', statusFilter)
      const res = await api.get(`/admin/orders?${params.toString()}`)
      return res.data.data
    },
    refetchInterval: 15000,
  })

  const queryClient = useQueryClient()
  const resync = useMutation({
    mutationFn: () => api.post('/admin/orders/resync-statuses'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      alert(`Synced ${res.data.data.synced} order statuses.`)
    },
  })

  const orders: any[] = data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">All Orders</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => resync.mutate()}
            disabled={resync.isPending}
            className="text-sm text-gray-500 hover:text-[#0088DD] disabled:opacity-50"
          >
            {resync.isPending ? 'Syncing...' : 'Sync Statuses'}
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-sm text-[#0088DD] hover:underline disabled:opacity-50"
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-[#0088DD] text-white' : 'bg-white border border-[#EEEEEE] text-[#333333] hover:bg-[#E6F4FF]'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}
        </div>
      ) : (
        <div className="bg-white border border-[#EEEEEE] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-[#EEEEEE]">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEEE]">
              {orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-[#E6F4FF] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#333333]">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{order.user?.firstName} {order.user?.lastName}</p>
                    <p className="text-xs text-gray-400">{order.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{order._count?.items ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || ''}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#0088DD]">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No orders found.</p>
          )}
        </div>
      )}
    </div>
  )
}
