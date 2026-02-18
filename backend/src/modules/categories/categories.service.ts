import slugify from 'slugify'
import { prisma } from '../../config/database'
import type { CreateCategoryBody, UpdateCategoryBody } from './categories.schema'

export class CategoriesService {
  async listCategories(flat = false) {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: { where: { product: { isActive: true } } } },
        },
      },
    })

    if (flat) return categories

    // Build tree structure
    const map = new Map(categories.map(c => [c.id, { ...c, children: [] as typeof categories }]))
    const roots: typeof categories = []

    for (const cat of categories) {
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(cat)
      } else {
        roots.push(cat)
      }
    }

    return roots
  }

  async getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug, isActive: true },
      include: { children: { where: { isActive: true } } },
    })
    if (!category) throw new Error('Category not found')
    return category
  }

  async createCategory(data: CreateCategoryBody) {
    const slug = await this.generateUniqueSlug(data.name)
    return prisma.category.create({ data: { ...data, slug } })
  }

  async updateCategory(id: string, data: UpdateCategoryBody) {
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) throw new Error('Category not found')

    const updateData: typeof data & { slug?: string } = { ...data }
    if (data.name && data.name !== category.name) {
      updateData.slug = await this.generateUniqueSlug(data.name, id)
    }

    return prisma.category.update({ where: { id }, data: updateData })
  }

  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) throw new Error('Category not found')

    // Check if it has products
    const productCount = await prisma.productCategory.count({ where: { categoryId: id } })
    if (productCount > 0) {
      throw new Error(`Cannot delete category with ${productCount} products. Remove products first.`)
    }

    await prisma.category.delete({ where: { id } })
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true })
    let slug = base
    let i = 1
    while (true) {
      const existing = await prisma.category.findUnique({ where: { slug } })
      if (!existing || existing.id === excludeId) break
      slug = `${base}-${i++}`
    }
    return slug
  }
}
