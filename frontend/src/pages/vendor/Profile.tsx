import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { useUIStore } from '../../store/ui.store'

export default function VendorProfile() {
  const { user } = useAuthStore()
  const { toast } = useUIStore()
  const queryClient = useQueryClient()

  const { data: vendor } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: async () => {
      const res = await api.get('/vendors/dashboard/profile')
      return res.data.data
    },
  })

  const [form, setForm] = useState({
    storeName: vendor?.storeName || '',
    description: vendor?.description || '',
  })

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const update = useMutation({
    mutationFn: () => api.put('/vendors/dashboard/profile', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] })
      toast('Store profile updated!', 'success')
    },
    onError: () => toast('Failed to update profile', 'error'),
  })

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('logo', file)
    try {
      await api.post('/vendors/dashboard/logo', fd)
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] })
      toast('Logo updated!', 'success')
    } catch {
      toast('Failed to upload logo', 'error')
    }
  }

  const uploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('banner', file)
    try {
      await api.post('/vendors/dashboard/banner', fd)
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] })
      toast('Banner updated!', 'success')
    } catch {
      toast('Failed to upload banner', 'error')
    }
  }

  const displayVendor = vendor

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Store Profile</h1>

      {/* Banner */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl overflow-hidden mb-6">
        <label className="relative block cursor-pointer group">
          {displayVendor?.bannerUrl ? (
            <img src={displayVendor.bannerUrl} alt="Banner" className="w-full h-36 object-cover" />
          ) : (
            <div className="w-full h-36 bg-gradient-to-r from-[#0088DD] to-[#005599]" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">Change Banner</span>
          </div>
          <input type="file" accept="image/*" onChange={uploadBanner} className="hidden" />
        </label>

        <div className="p-4 flex items-center gap-4">
          <label className="relative cursor-pointer group shrink-0">
            {displayVendor?.logoUrl ? (
              <img src={displayVendor.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow -mt-10" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#0088DD] flex items-center justify-center text-white text-2xl font-bold border-2 border-white shadow -mt-10">
                {user?.vendor?.storeName?.[0] ?? 'V'}
              </div>
            )}
            <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs">Edit</span>
            </div>
            <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
          </label>
          <div>
            <p className="font-semibold text-[#333333]">{displayVendor?.storeName}</p>
            <p className="text-xs text-gray-500">/{displayVendor?.storeSlug}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl p-5 max-w-xl">
        <h2 className="font-semibold text-[#333333] mb-4">Store Information</h2>
        <form
          onSubmit={e => { e.preventDefault(); update.mutate() }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">Store Name *</label>
            <input
              type="text"
              value={form.storeName || displayVendor?.storeName || ''}
              onChange={e => set('storeName', e.target.value)}
              required
              className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">Store Description</label>
            <textarea
              value={form.description || displayVendor?.description || ''}
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Tell customers about your store..."
              className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={update.isPending}
            className="bg-[#0088DD] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0077C2] disabled:opacity-60 transition-colors"
          >
            {update.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
