import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../store/auth.store'
import { useUIStore } from '../../store/ui.store'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { setAuth } = useAuthStore()
  const { toast } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await authService.login({ email, password })
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast('Welcome back!', 'success')
      // Role-based redirect
      if (data.user.role === 'ADMIN') navigate('/admin', { replace: true })
      else if (data.user.role === 'VENDOR') navigate('/vendor-dashboard', { replace: true })
      else navigate(from, { replace: true })
    } catch (err: any) {
      toast(err.response?.data?.message || 'Invalid email or password', 'error')
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
          <h1 className="text-2xl font-bold text-[#333333]">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0088DD] text-white py-2.5 rounded-lg font-semibold hover:bg-[#0077C2] disabled:opacity-60 transition-colors text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#0088DD] font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </motion.div>
  )
}
