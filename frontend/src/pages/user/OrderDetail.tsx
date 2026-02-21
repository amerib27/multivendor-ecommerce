import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import api from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/format'
import { Skeleton } from '../../components/ui/Skeleton'
import { useState } from 'react'
import { useUIStore } from '../../store/ui.store'
import { useCartStore } from '../../store/cart.store'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

const STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

function PaymentForm() {
  const stripe = useStripe()
  const elements = useElements()
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
      window.location.reload() // Refresh to show updated order status
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
        {paying ? 'Processing Payment...' : 'Complete Payment'}
      </button>
    </form>
  )
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [showPayment, setShowPayment] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>('')
  const { toast } = useUIStore()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })

  const createPaymentIntent = useMutation({
    mutationFn: async () => {
      const res = await api.post('/payments/create-intent', { orderId: id })
      return res.data.data
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret)
      setShowPayment(true)
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to initiate payment', 'error')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!order) return null

  const isCancelled = order.status === 'CANCELLED'
  const isPending = order.status === 'PENDING' && (!order.payment || order.payment.status !== 'PAID')
  const currentStep = isCancelled ? -1 : STEPS.indexOf(order.status)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="text-gray-400 hover:text-[#333333] transition-colors">← Back</Link>
        <h1 className="text-2xl font-bold text-[#333333]">{order.orderNumber}</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {order.status}
        </span>
      </div>

      {/* Progress Tracker */}
      {!isCancelled && (
        <div className="bg-white border border-[#EEEEEE] rounded-xl p-5 mb-6">
          <div className="flex items-center">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className={`flex flex-col items-center ${i <= currentStep ? 'text-[#0088DD]' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${i <= currentStep ? 'border-[#0088DD] bg-[#E6F4FF] text-[#0088DD]' : 'border-gray-200 bg-white'}`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block">{step}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? 'bg-[#0088DD]' : 'bg-[#EEEEEE]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Delivery Address */}
        <div className="bg-white border border-[#EEEEEE] rounded-xl p-4">
          <h2 className="font-semibold text-[#333333] mb-3">Delivery Address</h2>
          {order.address ? (
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium">{order.address.fullName}</p>
              <p>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</p>
              <p>{order.address.city}, {order.address.state} {order.address.postalCode}</p>
              <p>{order.address.country}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No address</p>
          )}
        </div>

        {/* Payment Info */}
        <div className="bg-white border border-[#EEEEEE] rounded-xl p-4">
          <h2 className="font-semibold text-[#333333] mb-3">Payment</h2>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${order.payment?.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.payment?.status ?? 'PENDING'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="text-[#333333]">{formatDate(order.createdAt)}</span>
            </div>
            {isPending && !showPayment && (
              <button
                onClick={() => createPaymentIntent.mutate()}
                disabled={createPaymentIntent.isPending}
                className="w-full mt-3 bg-[#FF4D4D] text-white py-2 rounded-lg font-semibold hover:bg-[#E63939] disabled:opacity-60 transition-colors"
              >
                {createPaymentIntent.isPending ? 'Loading...' : 'Complete Payment'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Form (for pending orders) */}
      {showPayment && clientSecret && (
        <div className="bg-white border border-[#EEEEEE] rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-[#333333] mb-4">Complete Your Payment</h2>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm />
          </Elements>
        </div>
      )}

      {/* Items */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl p-4">
        <h2 className="font-semibold text-[#333333] mb-4">Items</h2>
        <div className="space-y-3">
          {(order.items || []).map((item: any) => (
            <div key={item.id} className="flex items-center gap-3">
              <img
                src={item.productImage || 'https://placehold.co/56x56?text=?'}
                alt={item.productName}
                className="w-14 h-14 rounded-lg object-cover border border-[#EEEEEE]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#333333] truncate">{item.productName}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#333333]">{formatCurrency(item.totalPrice)}</p>
                <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} each</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#EEEEEE] mt-4 pt-4">
          <div className="flex justify-between font-bold text-[#333333]">
            <span>Total</span>
            <span className="text-[#0088DD]">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
