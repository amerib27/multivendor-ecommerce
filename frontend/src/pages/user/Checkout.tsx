import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import api from '../../services/api'
import { useCartStore } from '../../store/cart.store'
import { useUIStore } from '../../store/ui.store'
import { formatCurrency } from '../../utils/format'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

function PaymentForm({ orderId, clientSecret: _clientSecret }: { orderId: string; clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { clearCart } = useCartStore()
  const { toast } = useUIStore()
  const [paying, setPaying] = useState(false)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })
    if (error) {
      toast(error.message || 'Payment failed', 'error')
      setPaying(false)
    } else {
      clearCart()
      toast('Payment successful! Order confirmed.', 'success')
      navigate(`/orders/${orderId}`)
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full bg-[#0088DD] text-white py-3 rounded-xl font-semibold hover:bg-[#0077C2] disabled:opacity-60 transition-colors"
      >
        {paying ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  )
}

export default function Checkout() {
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [step, setStep] = useState<'address' | 'payment'>('address')
  const [orderId, setOrderId] = useState<string>('')
  const [clientSecret, setClientSecret] = useState<string>('')
  const { items, total } = useCartStore()
  const { toast } = useUIStore()

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await api.get('/users/addresses')
      return res.data.data
    },
  })

  const createOrder = useMutation({
    mutationFn: async () => {
      const res = await api.post('/orders', {
        addressId: selectedAddress,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      })
      return res.data.data
    },
    onSuccess: async (order) => {
      setOrderId(order.id)
      // Create payment intent
      const res = await api.post('/payments/create-intent', { orderId: order.id })
      setClientSecret(res.data.data.clientSecret)
      setStep('payment')
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to create order', 'error')
    },
  })

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Your cart is empty.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left */}
        <div className="flex-1">
          {step === 'address' && (
            <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
              <h2 className="font-semibold text-[#333333] mb-4">Select Delivery Address</h2>

              {(!addresses || addresses.length === 0) ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No saved addresses. Add one first.</p>
                  <a href="/addresses" className="text-[#0088DD] hover:underline text-sm">+ Add address</a>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {addresses.map((addr: any) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${selectedAddress === addr.id ? 'border-[#0088DD] bg-[#E6F4FF]' : 'border-[#EEEEEE] hover:border-gray-300'}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                        className="mt-0.5"
                      />
                      <div className="text-sm">
                        <p className="font-medium text-[#333333]">{addr.label || 'Home'}</p>
                        <p className="text-gray-500">{addr.line1}, {addr.city}, {addr.country}</p>
                        {addr.isDefault && <span className="text-xs text-[#0088DD]">Default</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button
                onClick={() => createOrder.mutate()}
                disabled={!selectedAddress || createOrder.isPending}
                className="w-full bg-[#0088DD] text-white py-3 rounded-xl font-semibold hover:bg-[#0077C2] disabled:opacity-60 transition-colors"
              >
                {createOrder.isPending ? 'Creating order...' : 'Continue to Payment'}
              </button>
            </div>
          )}

          {step === 'payment' && clientSecret && (
            <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
              <h2 className="font-semibold text-[#333333] mb-4">Payment</h2>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm orderId={orderId} clientSecret={clientSecret} />
              </Elements>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
            <h2 className="font-semibold text-[#333333] mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate mr-2">{item.name} × {item.quantity}</span>
                  <span className="text-[#333333] shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#EEEEEE] pt-4">
              <div className="flex justify-between font-semibold">
                <span className="text-[#333333]">Total</span>
                <span className="text-[#0088DD] text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
