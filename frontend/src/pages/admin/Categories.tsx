import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useUIStore } from '../../store/ui.store'

interface CatForm { name: string; parentId: string }
const EMPTY: CatForm = { name: '', parentId: '' }

export default function AdminCategories() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<CatForm>(EMPTY)
  const { toast } = useUIStore()
  const queryClient = useQueryClient()

  const { data: categories } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: async () => {
      const res = await api.get('/categories')
      return res.data.data
    },
  })

  const save = useMutation({
    mutationFn: () =>
      editId
        ? api.put(`/categories/${editId}`, { name: form.name })
        : api.post('/categories', { name: form.name, parentId: form.parentId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] })
      setShowForm(false)
      setEditId(null)
      setForm(EMPTY)
      toast('Category saved!', 'success')
    },
    onError: () => toast('Failed to save category', 'error'),
  })

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] })
      toast('Category deleted', 'success')
    },
    onError: (err: any) => toast(err.response?.data?.message || 'Cannot delete category', 'error'),
  })

  const openEdit = (cat: any) => {
    setEditId(cat.id)
    setForm({ name: cat.name, parentId: cat.parentId || '' })
    setShowForm(true)
  }

  const flatCategories: any[] = []
  const flatten = (cats: any[], depth = 0) => {
    cats.forEach(cat => {
      flatCategories.push({ ...cat, depth })
      if (cat.children?.length) flatten(cat.children, depth + 1)
    })
  }
  if (categories) flatten(categories)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">Categories</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY) }}
          className="bg-[#0088DD] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0077C2] transition-colors"
        >
          + Add Category
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-[#0088DD] rounded-xl p-5 mb-6 max-w-md">
          <h2 className="font-semibold text-[#333333] mb-4">{editId ? 'Edit Category' : 'New Category'}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Category name"
                className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0088DD]"
              />
            </div>
            {!editId && (
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">Parent Category</label>
                <select
                  value={form.parentId}
                  onChange={e => setForm(prev => ({ ...prev, parentId: e.target.value }))}
                  className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0088DD]"
                >
                  <option value="">None (Root Category)</option>
                  {flatCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {'—'.repeat(cat.depth)} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => save.mutate()}
              disabled={!form.name.trim() || save.isPending}
              className="bg-[#0088DD] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0077C2] disabled:opacity-60 transition-colors"
            >
              {save.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null) }}
              className="border border-[#EEEEEE] text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-[#E6F4FF] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Tree */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl overflow-hidden">
        {flatCategories.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No categories yet.</p>
        ) : (
          <div className="divide-y divide-[#EEEEEE]">
            {flatCategories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#E6F4FF] transition-colors"
                style={{ paddingLeft: `${(cat.depth + 1) * 16}px` }}
              >
                <div className="flex items-center gap-2">
                  {cat.depth > 0 && <span className="text-gray-400 text-xs">↳</span>}
                  <p className="text-sm font-medium text-[#333333]">{cat.name}</p>
                  <span className="text-xs text-gray-400">/{cat.slug}</span>
                  {cat._count?.products > 0 && (
                    <span className="text-xs bg-[#E6F4FF] text-[#0088DD] px-2 py-0.5 rounded-full">
                      {cat._count.products} products
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(cat)} className="text-xs text-[#0088DD] hover:underline">Edit</button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this category?')) del.mutate(cat.id)
                    }}
                    className="text-xs text-[#FF4D4D] hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
