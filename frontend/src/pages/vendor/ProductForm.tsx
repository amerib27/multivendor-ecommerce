import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { productsService } from '../../services/products.service'
import { useUIStore } from '../../store/ui.store'

interface FormData {
  name: string
  description: string
  price: string
  comparePrice: string
  stock: string
  sku: string
  categories: string[]
}

const EMPTY: FormData = { name: '', description: '', price: '', comparePrice: '', stock: '', sku: '', categories: [] }

export default function ProductForm() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toast } = useUIStore()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormData>(EMPTY)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories-flat'],
    queryFn: async () => {
      const res = await api.get('/categories?flat=true')
      return res.data.data
    },
    staleTime: 10 * 60 * 1000,
  })

  const { data: existing } = useQuery({
    queryKey: ['product-edit', id],
    queryFn: async () => {
      const res = await api.get(`/products/vendor/mine`)
      const products = res.data.data
      return products.find((p: any) => p.id === id)
    },
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        description: existing.description || '',
        price: String(existing.price),
        comparePrice: existing.comparePrice ? String(existing.comparePrice) : '',
        stock: String(existing.stock),
        sku: existing.sku || '',
        categories: (existing.categories || []).map((c: any) => c.categoryId),
      })
    }
  }, [existing])

  const set = (k: keyof FormData, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const toggleCategory = (catId: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter(id => id !== catId)
        : [...prev.categories, catId],
    }))
  }

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5)
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        stock: parseInt(form.stock),
        sku: form.sku || undefined,
        categoryIds: form.categories,
      }
      const res = isEdit
        ? await api.put(`/products/${id}`, payload)
        : await api.post('/products', payload)
      const productId = res.data.data.id

      // Upload images if any
      if (images.length > 0) {
        setUploading(true)
        await productsService.uploadImages(productId, images)
        setUploading(false)
      }
      return productId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products-list'] })
      toast(isEdit ? 'Product updated!' : 'Product created!', 'success')
      navigate('/vendor/products')
    },
    onError: (err: any) => {
      setUploading(false)
      const errors: Array<{ field: string; message: string }> = err.response?.data?.errors
      if (errors?.length) {
        toast(errors.map(e => `${e.field}: ${e.message}`).join(' | '), 'error')
      } else {
        toast(err.response?.data?.message || 'Failed to save product', 'error')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Basic Info */}
        <div className="bg-white border border-[#EEEEEE] rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-[#333333]">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">Description <span className="text-gray-400 font-normal">(min 10 chars)</span></label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Describe your product in detail..."
              className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={e => set('sku', e.target.value)}
              placeholder="Optional"
              className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD]"
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
          <h2 className="font-semibold text-[#333333] mb-4">Pricing & Stock</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                required
                className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">Discount Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.comparePrice}
                onChange={e => set('comparePrice', e.target.value)}
                placeholder="Optional"
                className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">Stock *</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={e => set('stock', e.target.value)}
                required
                className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0088DD]"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
          <h2 className="font-semibold text-[#333333] mb-1">Categories <span className="text-[#FF4D4D] text-sm">*</span></h2>
          <p className="text-xs text-gray-400 mb-3">Select at least one category</p>
          <div className="flex flex-wrap gap-2">
            {(categories || []).map((cat: any) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${form.categories.includes(cat.id) ? 'bg-[#0088DD] text-white border-[#0088DD]' : 'bg-white text-[#333333] border-[#EEEEEE] hover:border-[#0088DD]'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        {!isEdit && (
          <div className="bg-white border border-[#EEEEEE] rounded-xl p-5">
            <h2 className="font-semibold text-[#333333] mb-4">Product Images</h2>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-[#EEEEEE] rounded-xl p-8 text-center hover:border-[#0088DD] transition-colors">
                <p className="text-2xl mb-2">📷</p>
                <p className="text-sm text-gray-500">Click to upload images (max 5)</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 5MB each</p>
              </div>
              <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
            </label>
            {previews.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {previews.map((src, i) => (
                  <img key={i} src={src} alt="" className="w-16 h-16 rounded-lg object-cover border border-[#EEEEEE]" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={save.isPending || uploading}
            className="bg-[#0088DD] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#0077C2] disabled:opacity-60 transition-colors"
          >
            {save.isPending || uploading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/vendor/products')}
            className="border border-[#EEEEEE] text-gray-600 px-6 py-2.5 rounded-lg hover:bg-[#E6F4FF] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
