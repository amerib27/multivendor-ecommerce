import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { useUIStore } from '../../store/ui.store'

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const { toast } = useUIStore()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' })
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [tab, setTab] = useState<'info' | 'password'>('info')

  const setField = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const setPass = (k: string, v: string) => setPasswords(prev => ({ ...prev, [k]: v }))

  const updateProfile = useMutation({
    mutationFn: () => api.put('/users/profile', form),
    onSuccess: (res) => {
      setUser(res.data.data)
      toast('Profile updated!', 'success')
    },
    onError: () => toast('Failed to update profile', 'error'),
  })

  const changePassword = useMutation({
    mutationFn: () =>
      api.put('/users/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      }),
    onSuccess: () => {
      setPasswords({ current: '', newPass: '', confirm: '' })
      toast('Password changed!', 'success')
    },
    onError: (err: any) => toast(err.response?.data?.message || 'Failed to change password', 'error'),
  })

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.newPass !== passwords.confirm) {
      toast('Passwords do not match', 'error')
      return
    }
    changePassword.mutate()
  }

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const res = await api.post('/users/avatar', fd)
      setUser(res.data.data)
      toast('Avatar updated!', 'success')
    } catch {
      toast('Failed to upload avatar', 'error')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">My Profile</h1>

      {/* Avatar */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl p-5 mb-6 flex items-center gap-4">
        <label className="relative cursor-pointer group">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-[#EEEEEE]" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#0088DD] flex items-center justify-center text-white text-2xl font-bold">
              {user?.firstName?.[0] ?? 'U'}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs">Change</span>
          </div>
          <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
        </label>
        <div>
          <p className="font-semibold text-[#333333]">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="text-xs bg-[#E6F4FF] text-[#0088DD] px-2 py-0.5 rounded-full">{user?.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#EEEEEE] rounded-lg p-1 w-fit">
        {(['info', 'password'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white text-[#0088DD] shadow-sm' : 'text-gray-600'}`}
          >
            {t === 'info' ? 'Personal Info' : 'Change Password'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
          <form
            onSubmit={e => { e.preventDefault(); updateProfile.mutate() }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => setField('firstName', e.target.value)}
                  className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => setField('lastName', e.target.value)}
                  className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="bg-[#0088DD] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0077C2] disabled:opacity-60 transition-colors"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { label: 'Current Password', key: 'current', placeholder: 'Enter current password' },
              { label: 'New Password', key: 'newPass', placeholder: 'Min 8 characters' },
              { label: 'Confirm New Password', key: 'confirm', placeholder: 'Re-enter new password' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-[#333333] mb-1">{label}</label>
                <input
                  type="password"
                  value={(passwords as any)[key]}
                  onChange={e => setPass(key, e.target.value)}
                  required
                  minLength={8}
                  placeholder={placeholder}
                  className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD]"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="bg-[#0088DD] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0077C2] disabled:opacity-60 transition-colors"
            >
              {changePassword.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
