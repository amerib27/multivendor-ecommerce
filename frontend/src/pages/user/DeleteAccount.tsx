import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { useUIStore } from '../../store/ui.store'

export default function DeleteAccount() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const { toast } = useUIStore()
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await api.delete('/users/account', { data: { password } })
      return res.data
    },
    onSuccess: () => {
      toast('Account deleted successfully', 'success')
      logout()
      navigate('/')
    },
    onError: (error: any) => {
      toast(error.response?.data?.error || 'Failed to delete account', 'error')
    },
  })

  const handleDeleteClick = () => {
    if (!password) {
      toast('Please enter your password', 'error')
      return
    }
    setShowConfirmation(true)
  }

  const handleConfirmDelete = () => {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      toast('Please type "DELETE MY ACCOUNT" to confirm', 'error')
      return
    }
    deleteAccountMutation.mutate(password)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Delete Account</h1>
        <p className="text-gray-600 mb-6">
          This action cannot be undone. Please read carefully before proceeding.
        </p>

        {/* Warning Box */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Warning: Permanent Action</h3>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>Your account will be permanently deleted</li>
                <li>You will be immediately logged out</li>
                <li>Your cart and wishlist will be cleared</li>
                <li>Order history will be kept for legal purposes</li>
                <li>You cannot delete your account if you have pending orders</li>
                <li>Vendors cannot delete their account if they have active products</li>
              </ul>
            </div>
          </div>
        </div>

        {!showConfirmation ? (
          // Step 1: Enter Password
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password to continue
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/user/profile')}
                className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={!password}
                className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          // Step 2: Final Confirmation
          <div className="space-y-4">
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE MY ACCOUNT</span> to confirm
              </label>
              <input
                id="confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE MY ACCOUNT"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={confirmText !== 'DELETE MY ACCOUNT' || deleteAccountMutation.isPending}
                className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete My Account Forever'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Need help instead?</p>
            <p>If you're having issues with your account, please contact support instead of deleting your account. We're here to help!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
