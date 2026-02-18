import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/format'
import { useAuthStore } from '../../store/auth.store'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function VendorDashboard() {
  const { user } = useAuthStore()

  const { data: stats } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: async () => {
      const res = await api.get('/vendors/dashboard/stats')
      return res.data.data
    },
  })

  const { data: recentOrders } = useQuery({
    queryKey: ['vendor-recent-orders'],
    queryFn: async () => {
      const res = await api.get('/orders/vendor/incoming?limit=5')
      return res.data.data
    },
  })

  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(Number(stats?.totalRevenue ?? 0)), icon: '💰', color: 'text-green-600' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: '📦', color: 'text-blue-600' },
    { label: 'Products', value: stats?.totalProducts ?? 0, icon: '🏷️', color: 'text-purple-600' },
    { label: 'Avg Rating', value: `${Number(stats?.avgRating ?? 0).toFixed(1)} ★`, icon: '⭐', color: 'text-yellow-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-1">
        {user?.vendor?.storeName || 'Vendor Dashboard'}
      </h1>
      <p className="text-gray-500 text-sm mb-6">Manage your store and track performance.</p>

      {/* Pending approval notice */}
      {user?.vendor?.status === 'PENDING' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-2xl shrink-0">⏳</span>
          <div>
            <p className="font-semibold text-yellow-800">Store Pending Approval</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              Your store application is under review. An admin will approve it shortly.
              You won't be able to create products until your store is approved.
            </p>
          </div>
        </div>
      )}

      {user?.vendor?.status === 'SUSPENDED' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-2xl shrink-0">🚫</span>
          <div>
            <p className="font-semibold text-red-800">Store Suspended</p>
            <p className="text-sm text-red-700 mt-0.5">Your store has been suspended. Please contact support.</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-[#EEEEEE] rounded-xl p-4">
            <p className="text-2xl mb-2">{kpi.icon}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-sm text-gray-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Add Product', to: '/vendor/products/new', icon: '+' },
          { label: 'View Orders', to: '/vendor/orders', icon: '📋' },
          { label: 'Analytics', to: '/vendor/analytics', icon: '📈' },
          { label: 'Store Profile', to: '/vendor/profile', icon: '🏪' },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="bg-[#E6F4FF] text-[#0088DD] rounded-xl p-3 text-center hover:bg-[#0088DD] hover:text-white transition-colors"
          >
            <p className="text-xl mb-1">{action.icon}</p>
            <p className="text-xs font-medium">{action.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#333333]">Recent Orders</h2>
          <Link to="/vendor/orders" className="text-sm text-[#0088DD] hover:underline">View all</Link>
        </div>

        {!recentOrders?.length ? (
          <p className="text-center text-gray-400 py-8 text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-[#EEEEEE]">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEE]">
                {recentOrders.map((item: any) => (
                  <tr key={item.id} className="hover:bg-[#E6F4FF] transition-colors">
                    <td className="py-3">
                      <p className="font-medium text-[#333333]">{item.order?.orderNumber ?? '—'}</p>
                      <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
                    </td>
                    <td className="py-3 text-gray-600">
                      {item.order?.user?.firstName} {item.order?.user?.lastName}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-[#0088DD]">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
