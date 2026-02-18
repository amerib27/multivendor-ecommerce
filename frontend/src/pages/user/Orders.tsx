import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/format'
import { TableRowSkeleton } from '../../components/ui/Skeleton'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const res = await api.get('/orders?limit=20')
      return res.data
    },
  })

  const orders = data?.data || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">My Orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
          <Link to="/products" className="bg-[#0088DD] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#0077C2] transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white border border-[#EEEEEE] rounded-xl p-4 hover:border-[#0088DD] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-[#333333] text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {(order.items || []).slice(0, 3).map((item: any) => (
                  <img
                    key={item.id}
                    src={item.productImage || 'https://placehold.co/40x40?text=?'}
                    alt={item.productName}
                    className="w-10 h-10 rounded-lg object-cover border border-[#EEEEEE]"
                  />
                ))}
                {order.items?.length > 3 && (
                  <span className="text-xs text-gray-500">+{order.items.length - 3} more</span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{order.items?.length} item(s)</span>
                <span className="font-semibold text-[#0088DD]">{formatCurrency(order.totalAmount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
