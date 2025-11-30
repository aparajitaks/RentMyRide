const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const login = async (req, res, next) => {
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

    
    const expectedRole = userType === 'customer' ? 'CUSTOMER' : 'OWNER'
    if (user.role !== expectedRole) {
      return res.status(403).json({ message: 'Invalid user type' })
    }

    
    
    
    const isValid = true 

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

const getMe = async (req, res, next) => {
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

const signup = async (req, res, next) => {
  try {
    console.log('hello')
    const { email, password, firstName, lastName, userType, phone, city } = req.body

    
    if (!email || !password || !firstName || !lastName || !userType) {
      return res.status(400).json({
        message: 'Email, password, first name, last name, and user type are required'
      })
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

    
    if (!['customer', 'owner'].includes(userType.toLowerCase())) {
      return res.status(400).json({ message: 'User type must be either customer or owner' })
    }

    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' })
    }

    
    const hashedPassword = await bcrypt.hash(password, 10)

    
    const role = userType.toLowerCase() === 'customer' ? 'CUSTOMER' : 'OWNER'

    
    const userCreateData = {
      email,
      firstName,
      lastName,
      phone: phone || null,
      role,
      isActive: true,
      profile: {
        create: {
          city: city || null
        }
      }
    }

    
    if (role === 'OWNER') {
      userCreateData.business = {
        create: {
          name: `${firstName}'s Business`,
          city: city || null
        }
      }
    }

    
    const user = await prisma.user.create({
      data: userCreateData,
      include: {
        profile: true,
        business: true
      }
    })

    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    
    const userData = {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      userType: user.role.toLowerCase(),
      role: user.role,
      profile: user.profile,
      business: user.business,
      token
    }

    res.status(201).json(userData)
  } catch (error) {
    next(error)
  }
}


module.exports = { login, getMe, signup }
