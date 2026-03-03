import { prisma } from '../../config/database'
import { hashPassword, comparePassword } from '../../utils/bcrypt.utils'
import { sendPasswordChangedEmail } from '../../utils/email.utils'
import type { UpdateProfileBody, ChangePasswordBody, CreateAddressBody } from './users.schema'

export class UsersService {
  async getProfile(userId: string) {
    return prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    })
  }

  async updateProfile(userId: string, data: UpdateProfileBody) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    })
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    })
  }

  async changePassword(userId: string, data: ChangePasswordBody) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    const isValid = await comparePassword(data.currentPassword, user.passwordHash)
    if (!isValid) throw new Error('Current password is incorrect')

    const passwordHash = await hashPassword(data.newPassword)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash, refreshToken: null } })

    // Send email notification (fire-and-forget)
    sendPasswordChangedEmail(user.email, user.firstName).catch(console.error)
  }

  // ─── Addresses ───────────────────────────────────────────────────────────────

  async getAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async createAddress(userId: string, data: CreateAddressBody) {
    // If this is default, unset all other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      })
    }

    // If it's the first address, make it default
    const count = await prisma.address.count({ where: { userId } })

    return prisma.address.create({
      data: {
        ...data,
        userId,
        isDefault: data.isDefault || count === 0,
      },
    })
  }

  async updateAddress(userId: string, addressId: string, data: Partial<CreateAddressBody>) {
    // Ensure address belongs to user
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } })
    if (!address) throw new Error('Address not found')

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      })
    }

    return prisma.address.update({ where: { id: addressId }, data })
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } })
    if (!address) throw new Error('Address not found')
    await prisma.address.delete({ where: { id: addressId } })
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } })
    if (!address) throw new Error('Address not found')

    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
    return prisma.address.update({ where: { id: addressId }, data: { isDefault: true } })
  }

  // ─── Account Deletion ────────────────────────────────────────────────────────

  async deleteAccount(userId: string, password: string) {
    // Verify password first
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        vendor: true,
        orders: {
          where: {
            status: {
              notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED'],
            },
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found or already deleted')
    }

    const isValidPassword = await comparePassword(password, user.passwordHash)
    if (!isValidPassword) {
      throw new Error('Incorrect password')
    }

    // Check for pending orders
    if (user.orders.length > 0) {
      throw new Error(
        'Cannot delete account with pending orders. Please wait until all orders are completed or cancel them first.'
      )
    }

    // Check if vendor with active products
    if (user.vendor) {
      const activeProducts = await prisma.product.count({
        where: { vendorId: user.vendor.id, isActive: true },
      })

      if (activeProducts > 0) {
        throw new Error(
          'Cannot delete account while you have active products. Please deactivate or delete all products first.'
        )
      }
    }

    // Soft delete the user
    await prisma.$transaction(async (tx) => {
      // Mark user as deleted
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          isActive: false,
          email: `deleted_${userId}@deleted.com`, // Prevent email conflicts
          refreshToken: null, // Revoke all sessions
        },
      })

      // If vendor, suspend the vendor account
      if (user.vendor) {
        await tx.vendor.update({
          where: { id: user.vendor.id },
          data: { status: 'SUSPENDED' },
        })
      }

      // Clear cart
      const userCart = await tx.cart.findUnique({ where: { userId } })
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } })
        await tx.cart.delete({ where: { id: userCart.id } })
      }

      // Clear wishlist
      const userWishlist = await tx.wishlist.findUnique({ where: { userId } })
      if (userWishlist) {
        await tx.wishlistItem.deleteMany({ where: { wishlistId: userWishlist.id } })
        await tx.wishlist.delete({ where: { id: userWishlist.id } })
      }

      // Delete notifications
      await tx.notification.deleteMany({ where: { userId } })

      // Note: We keep orders, reviews, and addresses for legal/audit purposes
    })

    return { message: 'Account deleted successfully' }
  }
}
