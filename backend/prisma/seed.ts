import { PrismaClient, Role, VendorStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Admin user ──────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@12345', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@multivendor.dev' },
    update: {},
    create: {
      email: 'admin@multivendor.dev',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  })
  console.log('✅ Admin user:', admin.email)

  // ─── Root categories ──────────────────────────────────────────────────────────
  const categoryData = [
    { name: 'Electronics', slug: 'electronics', sortOrder: 1 },
    { name: 'Clothing & Fashion', slug: 'clothing-fashion', sortOrder: 2 },
    { name: 'Home & Garden', slug: 'home-garden', sortOrder: 3 },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', sortOrder: 4 },
    { name: 'Books & Media', slug: 'books-media', sortOrder: 5 },
    { name: 'Health & Beauty', slug: 'health-beauty', sortOrder: 6 },
    { name: 'Toys & Games', slug: 'toys-games', sortOrder: 7 },
    { name: 'Automotive', slug: 'automotive', sortOrder: 8 },
  ]

  const categories: Array<{ id: string; slug: string }> = []
  for (const cat of categoryData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    categories.push({ id: category.id, slug: category.slug })
  }
  console.log(`✅ Created ${categories.length} root categories`)

  // ─── Sub-categories for Electronics ──────────────────────────────────────────
  const electronicsId = categories.find(c => c.slug === 'electronics')?.id
  if (electronicsId) {
    const subCats = [
      { name: 'Smartphones', slug: 'smartphones', parentId: electronicsId, sortOrder: 1 },
      { name: 'Laptops', slug: 'laptops', parentId: electronicsId, sortOrder: 2 },
      { name: 'Audio', slug: 'audio', parentId: electronicsId, sortOrder: 3 },
      { name: 'Cameras', slug: 'cameras', parentId: electronicsId, sortOrder: 4 },
    ]
    for (const sub of subCats) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {},
        create: sub,
      })
    }
    console.log('✅ Created Electronics sub-categories')
  }

  console.log('\n✨ Seeding complete!')
  console.log('─────────────────────────────────────────')
  console.log('Admin login: admin@multivendor.dev / Admin@12345')
  console.log('─────────────────────────────────────────')
}

main()
  .catch(e => { console.error('Seed error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
