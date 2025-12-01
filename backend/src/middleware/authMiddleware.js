const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const authenticate = async (req, res, next) => {
  try {
    // Test mode: allow x-user-id header for testing
    if (process.env.NODE_ENV === 'test' && req.headers['x-user-id']) {
      const userId = req.headers['x-user-id']
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          business: true
        }
      })
      if (user) {
        req.user = user
        return next()
      }
      // In test mode, if user not found, create a minimal user object
      req.user = {
        id: userId,
        role: 'CUSTOMER',
        isActive: true
      }
      return next()
    }

    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        business: true
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    next(error)
  }
}

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' })
    }

    next()
  }
}

module.exports = { authenticate, requireRole }
