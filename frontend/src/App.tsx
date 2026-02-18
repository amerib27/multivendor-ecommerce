import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Layouts
import PublicLayout from './components/layout/PublicLayout'
import AuthLayout from './components/layout/AuthLayout'
import UserLayout from './components/layout/UserLayout'
import VendorLayout from './components/layout/VendorLayout'
import AdminLayout from './components/layout/AdminLayout'
import ProtectedRoute from './components/shared/ProtectedRoute'
import { ProductGridSkeleton } from './components/ui/Skeleton'

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/public/Home'))
const ProductList = lazy(() => import('./pages/public/ProductList'))
const ProductDetail = lazy(() => import('./pages/public/ProductDetail'))
const VendorStore = lazy(() => import('./pages/public/VendorStore'))
const Search = lazy(() => import('./pages/public/Search'))
const NotFound = lazy(() => import('./pages/public/NotFound'))

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))

const UserDashboard = lazy(() => import('./pages/user/Dashboard'))
const UserOrders = lazy(() => import('./pages/user/Orders'))
const UserOrderDetail = lazy(() => import('./pages/user/OrderDetail'))
const UserProfile = lazy(() => import('./pages/user/Profile'))
const UserAddresses = lazy(() => import('./pages/user/Addresses'))
const UserWishlist = lazy(() => import('./pages/user/Wishlist'))
const UserCart = lazy(() => import('./pages/user/Cart'))
const Checkout = lazy(() => import('./pages/user/Checkout'))

const VendorApply = lazy(() => import('./pages/vendor/Apply'))
const VendorDashboard = lazy(() => import('./pages/vendor/Dashboard'))
const VendorProducts = lazy(() => import('./pages/vendor/Products'))
const VendorProductForm = lazy(() => import('./pages/vendor/ProductForm'))
const VendorOrders = lazy(() => import('./pages/vendor/Orders'))
const VendorAnalytics = lazy(() => import('./pages/vendor/Analytics'))
const VendorProfile = lazy(() => import('./pages/vendor/Profile'))

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminVendors = lazy(() => import('./pages/admin/Vendors'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

const PageLoader = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <ProductGridSkeleton count={8} />
  </div>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/vendor/:slug" element={<VendorStore />} />
              <Route path="/search" element={<Search />} />
              <Route path="/cart" element={<UserCart />} />
            </Route>

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Vendor Apply — any authenticated user can apply */}
            <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
              <Route element={<PublicLayout />}>
                <Route path="/vendor/apply" element={<VendorApply />} />
              </Route>
            </Route>

            {/* Customer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR', 'ADMIN']} />}>
              <Route element={<UserLayout />}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/orders" element={<UserOrders />} />
                <Route path="/orders/:id" element={<UserOrderDetail />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/addresses" element={<UserAddresses />} />
                <Route path="/wishlist" element={<UserWishlist />} />
                <Route path="/checkout" element={<Checkout />} />
              </Route>
            </Route>

            {/* Vendor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['VENDOR', 'ADMIN']} />}>
              <Route element={<VendorLayout />}>
                <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                <Route path="/vendor/products" element={<VendorProducts />} />
                <Route path="/vendor/products/new" element={<VendorProductForm />} />
                <Route path="/vendor/products/:id/edit" element={<VendorProductForm />} />
                <Route path="/vendor/orders" element={<VendorOrders />} />
                <Route path="/vendor/analytics" element={<VendorAnalytics />} />
                <Route path="/vendor/profile" element={<VendorProfile />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/vendors" element={<AdminVendors />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
