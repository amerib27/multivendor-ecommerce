import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-8xl font-bold text-[#0088DD] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[#333333] mb-3">Page Not Found</h2>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/"
            className="bg-[#0088DD] text-white px-6 py-2 rounded-lg hover:bg-[#0077C2] transition-colors font-medium"
          >
            Go Home
          </Link>
          <Link
            to="/products"
            className="border border-[#0088DD] text-[#0088DD] px-6 py-2 rounded-lg hover:bg-[#E6F4FF] transition-colors font-medium"
          >
            Browse Products
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
