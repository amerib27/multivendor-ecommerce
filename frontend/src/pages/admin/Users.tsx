import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useUIStore } from '../../store/ui.store'
import { formatDate } from '../../utils/format'
import { TableRowSkeleton } from '../../components/ui/Skeleton'

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const { toast } = useUIStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const res = await api.get(`/admin/users?search=${search}&limit=50`)
      return res.data.data
    },
  })

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/users/${id}/toggle`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast('User status updated', 'success')
    },
  })

  const users: any[] = data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">Users</h1>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="border border-[#EEEEEE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0088DD] w-64"
        />
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
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEEE]">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-[#E6F4FF] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#0088DD] flex items-center justify-center text-white text-xs font-bold">
                        {user.firstName?.[0] ?? 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-[#333333]">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : user.role === 'VENDOR' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'ADMIN' && (
                      <button
                        onClick={() => toggle.mutate({ id: user.id, isActive: !user.isActive })}
                        disabled={toggle.isPending}
                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${user.isActive ? 'bg-red-50 text-[#FF4D4D] hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No users found.</p>
          )}
        </div>
      )}
    </div>
  )
}
