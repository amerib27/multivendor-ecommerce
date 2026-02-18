import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useUIStore } from '../../store/ui.store'
import { formatDate } from '../../utils/format'
import { TableRowSkeleton } from '../../components/ui/Skeleton'

const STATUS_FILTERS = ['All', 'PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED']

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function AdminVendors() {
  const [statusFilter, setStatusFilter] = useState('All')
  const { toast } = useUIStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'All' ? `?status=${statusFilter}&limit=50` : '?limit=50'
      const res = await api.get(`/admin/vendors${params}`)
      return res.data.data
    },
  })

  const action = useMutation({
    mutationFn: ({ id, act }: { id: string; act: string }) =>
      api.patch(`/admin/vendors/${id}/${act}`),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast(`Vendor ${vars.act}d`, 'success')
    },
    onError: () => toast('Action failed', 'error'),
  })

  const vendors: any[] = data || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Vendors</h1>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map(s => (
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
          {Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}
        </div>
      ) : (
        <div className="bg-white border border-[#EEEEEE] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-[#EEEEEE]">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Store</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Applied</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEEE]">
              {vendors.map((vendor: any) => (
                <tr key={vendor.id} className="hover:bg-[#E6F4FF] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {vendor.logoUrl ? (
                        <img src={vendor.logoUrl} alt={vendor.storeName} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#0088DD] flex items-center justify-center text-white text-xs font-bold">
                          {vendor.storeName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[#333333]">{vendor.storeName}</p>
                        <p className="text-xs text-gray-400">/{vendor.storeSlug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{vendor.user?.firstName} {vendor.user?.lastName}</p>
                    <p className="text-xs text-gray-400">{vendor.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(vendor.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[vendor.status] || ''}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {vendor.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => action.mutate({ id: vendor.id, act: 'approve' })}
                            disabled={action.isPending}
                            className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => action.mutate({ id: vendor.id, act: 'reject' })}
                            disabled={action.isPending}
                            className="text-xs bg-red-50 text-[#FF4D4D] px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {vendor.status === 'ACTIVE' && (
                        <button
                          onClick={() => action.mutate({ id: vendor.id, act: 'suspend' })}
                          disabled={action.isPending}
                          className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          Suspend
                        </button>
                      )}
                      {vendor.status === 'SUSPENDED' && (
                        <button
                          onClick={() => action.mutate({ id: vendor.id, act: 'approve' })}
                          disabled={action.isPending}
                          className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vendors.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No vendors found.</p>
          )}
        </div>
      )}
    </div>
  )
}
