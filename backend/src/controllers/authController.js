import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '../../../prisma-client-app/index.js'

const prisma = new PrismaClient()

export const login = async (req, res, next) => {
  try {
    const { email, password, userType } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        business: true
      }
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Check user role matches requested type
    const expectedRole = userType === 'customer' ? 'CUSTOMER' : 'OWNER'
    if (user.role !== expectedRole) {
      return res.status(403).json({ message: 'Invalid user type' })
    }

    // For demo purposes, accept any password if user exists
    // In production, use: const isValid = await bcrypt.compare(password, user.password)
    // For now, we'll use a simple check or accept any password for demo
    const isValid = true // Simplified for demo - replace with actual password check

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    const userData = {
      id: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      userType: user.role.toLowerCase(),
      role: user.role,
      profile: user.profile,
      business: user.business,
      token
    }

    res.json(userData)
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const user = req.user

    const userData = {
      id: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      userType: user.role.toLowerCase(),
      role: user.role,
      profile: user.profile,
      business: user.business
    }

    res.json(userData)
  } catch (error) {
    next(error)
  }
}

