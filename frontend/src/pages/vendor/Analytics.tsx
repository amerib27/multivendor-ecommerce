import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts'
import api from '../../services/api'
import { formatCurrency } from '../../utils/format'
import { Skeleton } from '../../components/ui/Skeleton'

export default function VendorAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vendor-analytics'],
    queryFn: async () => {
      const res = await api.get('/vendors/dashboard/analytics')
      return res.data.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  const revenue = stats?.revenueByDay || []
  const topProducts = stats?.topProducts || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: formatCurrency(Number(stats?.totalRevenue ?? 0)), color: 'text-green-600' },
          { label: 'This Month', value: formatCurrency(Number(stats?.monthRevenue ?? 0)), color: 'text-blue-600' },
          { label: 'Total Sales', value: stats?.totalSales ?? 0, color: 'text-purple-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-[#EEEEEE] rounded-xl p-4">
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-sm text-gray-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-[#333333] mb-4">Revenue (Last 30 Days)</h2>
        {revenue.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No revenue data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#0088DD" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Products */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
        <h2 className="font-semibold text-[#333333] mb-4">Top Products</h2>
        {topProducts.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No sales data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
              <Tooltip />
              <Bar dataKey="sales" fill="#0088DD" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
