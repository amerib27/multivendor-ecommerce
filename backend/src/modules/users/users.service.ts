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
}
