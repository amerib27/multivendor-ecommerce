import { prisma } from '../../config/database'

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          vendor: { select: { storeName: true, storeSlug: true } },
        },
      },
    },
  },
}

export class CartService {
  async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({ where: { userId }, include: cartInclude })
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId }, include: cartInclude })
    }
    return cart
  }

  async addItem(userId: string, productId: string, quantity: number) {
    // Validate product
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true, vendor: { status: 'ACTIVE' } },
    })
    if (!product) throw new Error('Product not found or unavailable')
    if (product.stock < quantity) throw new Error(`Only ${product.stock} items in stock`)

    let cart = await prisma.cart.findUnique({ where: { userId } })
    if (!cart) cart = await prisma.cart.create({ data: { userId } })

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    })

    if (existing) {
      const newQty = existing.quantity + quantity
      if (product.stock < newQty) throw new Error(`Only ${product.stock} items in stock`)
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      })
    }

    return this.getCart(userId)
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } })
    if (!cart) throw new Error('Cart not found')

    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } })
    if (!item) throw new Error('Cart item not found')

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } })
    } else {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (product && product.stock < quantity) {
        throw new Error(`Only ${product.stock} items in stock`)
      }
      await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })
    }

    return this.getCart(userId)
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } })
    if (!cart) throw new Error('Cart not found')
    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } })
    if (!item) throw new Error('Cart item not found')
    await prisma.cartItem.delete({ where: { id: itemId } })
    return this.getCart(userId)
  }

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } })
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }
  }
}
