import { Outlet, Link } from 'react-router-dom'
import ToastContainer from '../ui/Toast'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#E6F4FF] flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link to="/" className="text-[#0088DD] font-bold text-2xl">
          MultiVendor
        </Link>
      </div>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
      <ToastContainer />
    </div>
  )
}
