import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useUIStore } from '../../store/ui.store'

interface AddressForm {
  label: string
  fullName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  country: string
  postalCode: string
  isDefault: boolean
}

const EMPTY: AddressForm = {
  label: '', fullName: '', phone: '', line1: '', line2: '',
  city: '', state: '', country: 'US', postalCode: '', isDefault: false,
}

export default function Addresses() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<AddressForm>(EMPTY)
  const { toast } = useUIStore()
  const queryClient = useQueryClient()

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await api.get('/users/addresses')
      return res.data.data
    },
  })

  const save = useMutation({
    mutationFn: () =>
      editing
        ? api.put(`/users/addresses/${editing}`, form)
        : api.post('/users/addresses', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setShowForm(false)
      setEditing(null)
      setForm(EMPTY)
      toast('Address saved!', 'success')
    },
    onError: (err: any) => {
      const errors: Array<{ field: string; message: string }> = err.response?.data?.errors
      if (errors?.length) {
        toast(errors.map(e => `${e.field}: ${e.message}`).join(' | '), 'error')
      } else {
        toast(err.response?.data?.message || 'Failed to save address', 'error')
      }
    },
  })

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/users/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast('Address deleted', 'success')
    },
  })

  const setDefault = useMutation({
    mutationFn: (id: string) => api.patch(`/users/addresses/${id}/default`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })

  const openEdit = (addr: any) => {
    setEditing(addr.id)
    setForm({
      label: addr.label || '',
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || 'US',
      postalCode: addr.postalCode || '',
      isDefault: addr.isDefault,
    })
    setShowForm(true)
  }

  const set = (k: keyof AddressForm, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }))

  const fields = [
    { label: 'Label (optional)', key: 'label', placeholder: 'Home / Work', full: true },
    { label: 'Full Name *', key: 'fullName', placeholder: 'John Doe', full: false },
    { label: 'Phone *', key: 'phone', placeholder: '+1 234 567 8900', full: false },
    { label: 'Address Line 1 *', key: 'line1', placeholder: '123 Main St', full: true },
    { label: 'Address Line 2', key: 'line2', placeholder: 'Apt 4B (optional)', full: true },
    { label: 'City *', key: 'city', placeholder: 'New York', full: false },
    { label: 'State *', key: 'state', placeholder: 'NY', full: false },
    { label: 'Country Code *', key: 'country', placeholder: 'US', full: false },
    { label: 'Postal Code *', key: 'postalCode', placeholder: '10001', full: false },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">Saved Addresses</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY) }}
          className="bg-[#0088DD] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0077C2] transition-colors"
        >
          + Add Address
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-[#0088DD] rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#333333] mb-4">{editing ? 'Edit Address' : 'New Address'}</h2>
          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ label, key, placeholder, full }) => (
              <div key={key} className={full ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-[#333333] mb-1">{label}</label>
                <input
                  type="text"
                  value={(form as any)[key]}
                  onChange={e => set(key as keyof AddressForm, e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0088DD]"
                />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={e => set('isDefault', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-[#333333]">Set as default address</span>
          </label>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending || !form.line1 || !form.city || !form.country || !form.fullName || !form.phone}
              className="bg-[#0088DD] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0077C2] disabled:opacity-60 transition-colors"
            >
              {save.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditing(null) }}
              className="border border-[#EEEEEE] text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-[#E6F4FF] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : addresses?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📍</p>
          <p className="text-gray-500">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(addresses ?? []).map((addr: any) => (
            <div key={addr.id} className={`bg-white border-2 rounded-xl p-4 ${addr.isDefault ? 'border-[#0088DD]' : 'border-[#EEEEEE]'}`}>
              {addr.isDefault && (
                <span className="text-xs bg-[#E6F4FF] text-[#0088DD] px-2 py-0.5 rounded-full mb-2 inline-block">Default</span>
              )}
              <p className="font-medium text-[#333333] text-sm">{addr.label || 'Address'}</p>
              <p className="text-sm text-gray-600 mt-1">{addr.fullName}</p>
              <p className="text-sm text-gray-500">{addr.phone}</p>
              <p className="text-sm text-gray-600 mt-1">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
              <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.postalCode}</p>
              <p className="text-sm text-gray-600">{addr.country}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(addr)} className="text-xs text-[#0088DD] hover:underline">Edit</button>
                {!addr.isDefault && (
                  <button onClick={() => setDefault.mutate(addr.id)} className="text-xs text-gray-500 hover:text-[#0088DD]">Set Default</button>
                )}
                <button onClick={() => del.mutate(addr.id)} className="text-xs text-[#FF4D4D] hover:underline ml-auto">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
