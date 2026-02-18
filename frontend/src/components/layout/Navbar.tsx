import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/auth.store'
import { useCartStore } from '../../store/cart.store'
import { authService } from '../../services/auth.service'
import { getInitials } from '../../utils/format'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const { itemCount } = useCartStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Close dropdowns on route change
  useEffect(() => {
    setIsMenuOpen(false)
    setIsProfileOpen(false)
  }, [location.pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/login'
    if (user.role === 'ADMIN') return '/admin'
    if (user.role === 'VENDOR') return '/vendor-dashboard'
    return '/dashboard'
  }

  return (
    <header className="bg-white border-b border-[#EEEEEE] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="text-[#0088DD] font-bold text-xl shrink-0">
            MultiVendor
          </Link>

          {/* Search - desktop */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden sm:flex">
            <div className="relative w-full">
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, and more..."
                className="w-full border border-[#EEEEEE] rounded-lg pl-4 pr-12 py-2 text-[#333333] text-sm
                           focus:outline-none focus:border-[#0088DD] focus:ring-1 focus:ring-[#0088DD]
                           transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0088DD] hover:text-[#0077C2] p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 hover:bg-[#E6F4FF] rounded-md transition-colors"
              aria-label="Cart"
            >
              <svg className="w-6 h-6 text-[#333333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-[#FF4D4D] text-white text-xs w-5 h-5
                             rounded-full flex items-center justify-center font-bold"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </motion.span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-[#E6F4FF] rounded-md transition-colors"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0088DD] text-white flex items-center justify-center text-xs font-bold">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                  <span className="text-sm text-[#333333] hidden md:block">{user.firstName}</span>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#EEEEEE]
                                 rounded-lg shadow-lg overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-[#EEEEEE]">
                        <p className="text-sm font-medium text-[#333333]">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link to={getDashboardLink()} className="flex items-center gap-2 px-4 py-2 text-sm text-[#333333] hover:bg-[#E6F4FF] transition-colors">
                          Dashboard
                        </Link>
                        <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-[#333333] hover:bg-[#E6F4FF] transition-colors">
                          My Orders
                        </Link>
                        <Link to="/wishlist" className="flex items-center gap-2 px-4 py-2 text-sm text-[#333333] hover:bg-[#E6F4FF] transition-colors">
                          Wishlist
                        </Link>
                        <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-[#333333] hover:bg-[#E6F4FF] transition-colors">
                          Profile Settings
                        </Link>
                        <hr className="border-[#EEEEEE] my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#FF4D4D] hover:bg-red-50 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm text-[#333333] hover:text-[#0088DD] transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-[#0088DD] hover:bg-[#0077C2] text-white text-sm px-4 py-2 rounded-md transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="sm:hidden p-2 hover:bg-[#E6F4FF] rounded-md transition-colors"
            >
              <svg className="w-5 h-5 text-[#333333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden overflow-hidden pb-3"
            >
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full border border-[#EEEEEE] rounded-lg pl-4 pr-12 py-2 text-sm
                             focus:outline-none focus:border-[#0088DD]"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0088DD]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
