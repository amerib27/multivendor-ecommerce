import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../store/auth.store'
import { useUIStore } from '../../store/ui.store'

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const { setAuth } = useAuthStore()
  const { toast } = useUIStore()
  const navigate = useNavigate()

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast('Passwords do not match', 'error')
      return
    }
    setLoading(true)
    try {
      const data = await authService.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      })
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast('Account created! Welcome.', 'success')
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      toast(err.response?.data?.message || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#333333]">Create an account</h1>
          <p className="text-gray-500 text-sm mt-1">Join thousands of shoppers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                required
                placeholder="John"
                className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                required
                placeholder="Doe"
                className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              minLength={8}
              placeholder="Min 8 characters"
              className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">Must include uppercase, number &amp; special character (e.g. Test123!)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">Confirm Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => set('confirm', e.target.value)}
              required
              placeholder="Re-enter password"
              className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0088DD] text-white py-2.5 rounded-lg font-semibold hover:bg-[#0077C2] disabled:opacity-60 transition-colors text-sm"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0088DD] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  )
}
