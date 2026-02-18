import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { useUIStore } from '../../store/ui.store'

export default function VendorApply() {
  const { user, setUser, setTokens, refreshToken } = useAuthStore()
  const { toast } = useUIStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ storeName: '', description: '', email: user?.email || '', phone: '' })
  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  // Already a vendor — redirect
  if (user?.role === 'VENDOR' || user?.role === 'ADMIN') {
    navigate('/vendor-dashboard', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/vendors/apply', form)
      // Refresh tokens so new JWT carries role: VENDOR (backend updated DB before this call)
      const refreshRes = await api.post('/auth/refresh', { refreshToken })
      setTokens(refreshRes.data.data.accessToken, refreshRes.data.data.refreshToken)
      if (user) setUser({ ...user, role: 'VENDOR', vendor: res.data.data })
      toast('Application submitted! Your store is pending review.', 'success')
      navigate('/vendor-dashboard', { replace: true })
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to submit application', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">🏪</p>
          <h1 className="text-3xl font-bold text-[#333333]">Start Selling Today</h1>
          <p className="text-gray-500 mt-2">Create your store and reach thousands of customers.</p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '💰', title: 'No Listing Fees', desc: 'Free to list products' },
            { icon: '📊', title: 'Analytics', desc: 'Track your performance' },
            { icon: '🚀', title: 'Easy Setup', desc: 'Be live in minutes' },
          ].map((b) => (
            <div key={b.title} className="bg-[#E6F4FF] rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{b.icon}</p>
              <p className="font-semibold text-[#333333] text-sm">{b.title}</p>
              <p className="text-xs text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#EEEEEE] rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[#333333] mb-6">Store Information</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">Store Name *</label>
              <input
                type="text"
                value={form.storeName}
                onChange={e => set('storeName', e.target.value)}
                required
                placeholder="My Awesome Store"
                className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">Store Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                placeholder="Tell customers what you sell..."
                className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] resize-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">Business Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                  className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] transition-colors"
                />
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              Your application will be reviewed by our team. You'll receive an email once approved.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0088DD] text-white py-3 rounded-xl font-semibold hover:bg-[#0077C2] disabled:opacity-60 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
