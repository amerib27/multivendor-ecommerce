import { Outlet, NavLink } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ToastContainer from '../ui/Toast'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/orders', label: 'My Orders', icon: '📦' },
  { to: '/wishlist', label: 'Wishlist', icon: '♡' },
  { to: '/cart', label: 'Cart', icon: '🛒' },
  { to: '/addresses', label: 'Addresses', icon: '📍' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block w-56 shrink-0">
            <nav className="bg-white border border-[#EEEEEE] rounded-lg overflow-hidden">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-[#EEEEEE] last:border-0 ${
                      isActive
                        ? 'bg-[#E6F4FF] text-[#0088DD] font-medium'
                        : 'text-[#333333] hover:bg-[#E6F4FF]'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
      <ToastContainer />
    </div>
  )
}
