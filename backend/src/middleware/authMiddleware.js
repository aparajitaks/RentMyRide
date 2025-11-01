// backend/src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in the 'Authorization' header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Get user from the token's ID and attach to request
      // This makes req.user available in all protected routes
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true }, // Don't select the password
      });

      next(); // Move to the next function (the controller)
    } catch (error) {
      console.error(error);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};
