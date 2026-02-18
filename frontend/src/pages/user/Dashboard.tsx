import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { formatCurrency, formatDate } from '../../utils/format'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function UserDashboard() {
  const { user } = useAuthStore()

  const { data: ordersData } = useQuery({
    queryKey: ['user-orders-summary'],
    queryFn: async () => {
      const res = await api.get('/orders?limit=3')
      return res.data
    },
  })

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: async () => {
      const res = await api.get('/wishlist')
      return res.data.data
    },
  })

  const orders = ordersData?.data || []
  const totalOrders = ordersData?.meta?.total || 0
  const wishlistCount = wishlistData?.items?.length || 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-2">
        Welcome back, {user?.firstName}! 👋
      </h1>
      <p className="text-gray-500 text-sm mb-6">Here's what's happening with your account.</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: totalOrders, icon: '📦', link: '/orders' },
          { label: 'Wishlist', value: wishlistCount, icon: '♥', link: '/wishlist' },
          { label: 'Addresses', value: '', icon: '📍', link: '/addresses' },
        ].map((stat) => (
          <Link key={stat.label} to={stat.link} className="bg-white border border-[#EEEEEE] rounded-xl p-4 hover:border-[#0088DD] transition-colors">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className="text-2xl font-bold text-[#333333]">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Become a Vendor Banner */}
      <div className="bg-gradient-to-r from-[#0088DD] to-[#005599] rounded-xl p-5 mb-8 flex items-center justify-between">
        <div className="text-white">
          <h2 className="font-bold text-lg">Start Selling Today</h2>
          <p className="text-sm opacity-80">Create your store and reach thousands of customers.</p>
        </div>
        <Link to="/vendor/apply" className="bg-white text-[#0088DD] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E6F4FF] transition-colors shrink-0">
          Become a Vendor
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#333333]">Recent Orders</h2>
          <Link to="/orders" className="text-sm text-[#0088DD] hover:underline">View all</Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No orders yet.</p>
            <Link to="/products" className="text-[#0088DD] text-sm hover:underline">Start shopping →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#E6F4FF] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-[#333333]">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || ''}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-semibold text-[#0088DD]">{formatCurrency(order.totalAmount)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
