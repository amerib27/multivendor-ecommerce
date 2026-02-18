import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '../../store/cart.store'
import { useAuthStore } from '../../store/auth.store'
import { formatCurrency } from '../../utils/format'

export default function Cart() {
  const { items, updateQuantity, removeItem, itemCount, total } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } })
    } else {
      navigate('/checkout')
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-xl font-semibold text-[#333333] mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add items to get started.</p>
        <Link to="/products" className="bg-[#0088DD] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#0077C2] transition-colors">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Shopping Cart ({items.length})</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items */}
        <div className="flex-1 space-y-4">
          <AnimatePresence>
            {items.map(item => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border border-[#EEEEEE] rounded-xl p-4 flex gap-4"
              >
                <img
                  src={item.imageUrl || 'https://placehold.co/80x80?text=No+Image'}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.slug}`} className="font-medium text-[#333333] hover:text-[#0088DD] text-sm line-clamp-2">
                    {item.name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">{item.vendorName}</p>
                  <p className="text-[#0088DD] font-semibold mt-1">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-gray-400 hover:text-[#FF4D4D] transition-colors text-lg"
                  >
                    ×
                  </button>
                  <div className="flex items-center border border-[#EEEEEE] rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="px-2.5 py-1 hover:bg-[#E6F4FF] transition-colors text-sm"
                    >
                      −
                    </button>
                    <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="px-2.5 py-1 hover:bg-[#E6F4FF] transition-colors text-sm disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white border border-[#EEEEEE] rounded-xl p-5 sticky top-20">
            <h2 className="font-semibold text-[#333333] mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal ({itemCount} items)</span>
                <span className="text-[#333333]">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-green-600">Calculated at checkout</span>
              </div>
            </div>
            <div className="border-t border-[#EEEEEE] pt-4 mb-5">
              <div className="flex justify-between font-semibold">
                <span className="text-[#333333]">Total</span>
                <span className="text-[#0088DD] text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-[#0088DD] text-white py-3 rounded-xl font-semibold hover:bg-[#0077C2] transition-colors"
            >
              Proceed to Checkout
            </button>
            <Link
              to="/products"
              className="block text-center text-sm text-gray-500 hover:text-[#0088DD] mt-3 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
