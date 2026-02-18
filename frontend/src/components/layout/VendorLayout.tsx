import { useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import Navbar from './Navbar'
import ToastContainer from '../ui/Toast'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../store/auth.store'

const navItems = [
  { to: '/vendor-dashboard', label: 'Dashboard' },
  { to: '/vendor/products', label: 'Products' },
  { to: '/vendor/orders', label: 'Orders' },
  { to: '/vendor/analytics', label: 'Analytics' },
  { to: '/vendor/profile', label: 'Store Profile' },
]

export default function VendorLayout() {
  const { setUser } = useAuthStore()

  // Sync fresh user data (including vendor status) from server on mount
  useEffect(() => {
    authService.getMe().then(setUser).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 bg-white border-r border-[#EEEEEE] shrink-0">
          <div className="sticky top-16 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Vendor Panel
            </p>
            <nav className="space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/vendor-dashboard'}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-[#E6F4FF] text-[#0088DD] font-medium'
                        : 'text-[#333333] hover:bg-[#E6F4FF]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 min-w-0">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
