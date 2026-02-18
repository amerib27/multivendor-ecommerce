import { Outlet, NavLink } from 'react-router-dom'
import Navbar from './Navbar'
import ToastContainer from '../ui/Toast'

const navItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/vendors', label: 'Vendors' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/categories', label: 'Categories' },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex">
        <aside className="hidden md:block w-56 bg-[#333333] shrink-0">
          <div className="sticky top-16 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
              Admin Panel
            </p>
            <nav className="space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-[#0088DD] text-white font-medium'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-6 min-w-0">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
