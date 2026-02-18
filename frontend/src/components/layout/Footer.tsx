import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#333333] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-[#0088DD] font-bold text-xl mb-3">MultiVendor</h3>
            <p className="text-gray-400 text-sm">
              The modern multi-vendor marketplace for buyers and sellers.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2">
              {[
                { to: '/products', label: 'All Products' },
                { to: '/products?featured=true', label: 'Featured' },
                { to: '/search', label: 'Search' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Sell</h4>
            <ul className="space-y-2">
              {[
                { to: '/vendor-dashboard', label: 'Vendor Dashboard' },
                { to: '/register', label: 'Become a Vendor' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Account</h4>
            <ul className="space-y-2">
              {[
                { to: '/dashboard', label: 'My Dashboard' },
                { to: '/orders', label: 'My Orders' },
                { to: '/wishlist', label: 'Wishlist' },
                { to: '/profile', label: 'Profile' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} MultiVendor. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            <span className="text-gray-400 text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
