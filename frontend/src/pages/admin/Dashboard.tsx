import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/format'
import { Skeleton } from '../../components/ui/Skeleton'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats')
      return res.data.data
    },
  })

  const { data: pendingVendors } = useQuery({
    queryKey: ['admin-pending-vendors'],
    queryFn: async () => {
      const res = await api.get('/admin/vendors?status=PENDING&limit=5')
      return res.data.data
    },
  })

  const kpis = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: '👥', link: '/admin/users' },
    { label: 'Total Vendors', value: stats?.totalVendors ?? 0, icon: '🏪', link: '/admin/vendors' },
    { label: 'Total Products', value: stats?.totalProducts ?? 0, icon: '🏷️', link: '/admin/products' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: '📦', link: '/admin/orders' },
    { label: 'Total Revenue', value: formatCurrency(Number(stats?.totalRevenue ?? 0)), icon: '💰', link: '/admin/orders' },
    { label: 'Pending Vendors', value: stats?.pendingVendors ?? 0, icon: '⏳', link: '/admin/vendors' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Admin Dashboard</h1>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {kpis.map((kpi) => (
            <Link key={kpi.label} to={kpi.link} className="bg-white border border-[#EEEEEE] rounded-xl p-4 hover:border-[#0088DD] transition-colors">
              <p className="text-2xl mb-1">{kpi.icon}</p>
              <p className="text-2xl font-bold text-[#333333]">{kpi.value}</p>
              <p className="text-sm text-gray-500">{kpi.label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Pending Vendor Applications */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#333333]">Pending Vendor Applications</h2>
          <Link to="/admin/vendors" className="text-sm text-[#0088DD] hover:underline">View all</Link>
        </div>
        {!pendingVendors?.length ? (
          <p className="text-center text-gray-400 text-sm py-8">No pending applications.</p>
        ) : (
          <div className="space-y-3">
            {pendingVendors.map((vendor: any) => (
              <div key={vendor.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#E6F4FF] transition-colors">
                <div>
                  <p className="font-medium text-[#333333] text-sm">{vendor.storeName}</p>
                  <p className="text-xs text-gray-500">{vendor.user?.email} · {formatDate(vendor.createdAt)}</p>
                </div>
                <Link to="/admin/vendors" className="text-xs bg-[#0088DD] text-white px-3 py-1.5 rounded-lg hover:bg-[#0077C2] transition-colors">
                  Review
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
