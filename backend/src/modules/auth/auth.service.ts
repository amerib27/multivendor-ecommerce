import { prisma } from '../../config/database'
import { hashPassword, comparePassword } from '../../utils/bcrypt.utils'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.utils'
import type { RegisterBody, LoginBody } from './auth.schema'

export class AuthService {
  async register(data: RegisterBody) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      throw new Error('An account with this email already exists')
    }

    const passwordHash = await hashPassword(data.password)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        isEmailVerified: true,
        createdAt: true,
      },
    })

    const payload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    // Store hashed refresh token? For simplicity we store it plainly;
    // can be hashed in production for extra security
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    return { user, accessToken, refreshToken }
  }

  async login(data: LoginBody) {
    const user = await prisma.user.findUnique({ where: { email: data.email } })

    if (!user || !user.isActive) {
      throw new Error('Invalid email or password')
    }

    const isValid = await comparePassword(data.password, user.passwordHash)
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    const payload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } })

    // Return safe user (no passwordHash, no refreshToken)
    const { passwordHash: _, refreshToken: __, ...safeUser } = user
    return { user: safeUser, accessToken, refreshToken }
  }

  async refresh(token: string) {
    let payload
    try {
      payload = verifyRefreshToken(token)
    } catch {
      throw new Error('Invalid refresh token')
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || user.refreshToken !== token) {
      throw new Error('Refresh token has been revoked')
    }

    // Rotate tokens
    const newPayload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = signAccessToken(newPayload)
    const refreshToken = signRefreshToken(newPayload)

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } })

    return { accessToken, refreshToken }
  }

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    })
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
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
        isActive: true,
        createdAt: true,
        vendor: {
          select: {
            id: true,
            storeName: true,
            storeSlug: true,
            status: true,
            logoUrl: true,
          },
        },
      },
    })
    if (!user) throw new Error('User not found')
    return user
  }
}
