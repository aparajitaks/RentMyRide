const prisma = require('../lib/prisma')

const createBookingRequest = async (req, res, next) => {
  try {
    const userId = req.user.id
    const {
      carId,
      vehicleId,
      businessId,
      pickupLocation,
      dropoffLocation,
      startDate,
      endDate,
      specialRequests
    } = req.body

    const actualCarId = vehicleId || carId

    if (!actualCarId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Vehicle ID, start date, and end date are required' })
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end <= start) {
      return res.status(400).json({ code: 'INVALID_DATES', message: 'End date must be after start date' })
    }

    
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: actualCarId }
    })

    if (!vehicle) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Vehicle not found' })
    }

    if (!vehicle.isAvailable) {
      return res.status(400).json({ message: 'Vehicle is not available' })
    }

    // No overlap check at request time - allow creating PENDING bookings
    // Overlap check will happen at approval time

    
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    const totalPrice = parseFloat(vehicle.pricePerDay.toString()) * totalDays

    const booking = await prisma.booking.create({
      data: {
        userId,
        vehicleId: actualCarId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays,
        totalPrice,
        pickupLocation,
        dropoffLocation,
        specialRequests,
        status: 'PENDING'
      },
      include: {
        vehicle: {
          include: {
            business: true
          }
        }
      }
    })

    res.status(200).json({
      ok: true,
      data: {
        id: booking.id,
        carMake: booking.vehicle.make,
        carModel: booking.vehicle.model,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalDays: booking.totalDays,
        totalPrice: booking.totalPrice,
        status: booking.status
      }
    })
  } catch (error) {
    next(error)
  }
}

const getBookingDetails = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            business: true,
            photos: {
              where: { isPrimary: true },
              take: 1
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        payment: true,
        travelLog: {
          include: {
            photos: true
          }
        }
      }
    })

    if (!booking) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Booking not found' })
    }

    
    const isCustomer = booking.userId === userId
    const isOwner = booking.vehicle.ownerId === userId

    if (!isCustomer && !isOwner) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json({
      id: booking.id,
      carMake: booking.vehicle.make,
      carModel: booking.vehicle.model,
      carYear: booking.vehicle.year,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalDays: booking.totalDays,
      totalPrice: booking.totalPrice,
      status: booking.status.toLowerCase(),
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      specialRequests: booking.specialRequests,
      customer: {
        name: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || booking.user.email,
        email: booking.user.email,
        phone: booking.user.phone
      },
      business: {
        id: booking.vehicle.business.id,
        name: booking.vehicle.business.name
      },
      payment: booking.payment ? {
        status: booking.payment.status.toLowerCase(),
        amount: booking.payment.amount,
        method: booking.payment.method
      } : null,
      travelLog: booking.travelLog,
      imageUrl: booking.vehicle.photos[0]?.url,
      createdAt: booking.createdAt
    })
  } catch (error) {
    next(error)
  }
}

const processPayment = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { method, transactionId } = req.body

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: true,
        payment: true
      }
    })

    if (!booking) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Booking not found' })
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ message: 'Booking must be confirmed before payment' })
    }

    if (booking.payment) {
      return res.status(400).json({ message: 'Payment already exists for this booking' })
    }

    
    const payment = await prisma.payment.create({
      data: {
        bookingId: id,
        userId,
        amount: booking.totalPrice,
        method: method || 'CREDIT_CARD',
        transactionId: transactionId || `TXN-${Date.now()}`,
        status: 'COMPLETED',
        processedAt: new Date()
      }
    })

    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(booking.startDate)
    startDate.setHours(0, 0, 0, 0)

    if (startDate <= today) {
      await prisma.booking.update({
        where: { id },
        data: { status: 'ACTIVE' }
      })
    }

    res.json({
      id: payment.id,
      message: 'Payment processed successfully',
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status.toLowerCase(),
        transactionId: payment.transactionId
      }
    })
  } catch (error) {
    next(error)
  }
}

const approveBooking = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            business: true
          }
        }
      }
    })

    if (!booking) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Booking not found' })
    }

    // Check if user is the vehicle owner (through business)
    const isOwner = booking.vehicle.ownerId === userId || booking.vehicle.business?.ownerId === userId
    
    if (!isOwner) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Only vehicle owner can approve' })
    }

    // Check current status
    if (booking.status !== 'PENDING') {
      return res.status(409).json({ code: 'INVALID_TRANSITION', message: `Cannot approve booking with status ${booking.status}` })
    }

    // Check for overlapping bookings
    const overlaps = await prisma.booking.findMany({
      where: {
        vehicleId: booking.vehicleId,
        id: { not: booking.id },
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        OR: [
          {
            startDate: { lte: booking.endDate },
            endDate: { gte: booking.startDate }
          }
        ]
      }
    })

    if (overlaps.length > 0) {
      return res.status(409).json({ code: 'NOT_AVAILABLE', message: 'Vehicle not available for selected dates' })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' }
    })

    res.status(200).json({ ok: true, data: updated })
  } catch (error) {
    next(error)
  }
}

const payBooking = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id }
    })

    if (!booking) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Booking not found' })
    }

    // Check if user is the customer
    if (booking.userId !== userId) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Only booking customer can pay' })
    }

    // Check current status
    if (booking.status === 'PENDING') {
      return res.status(409).json({ code: 'INVALID_TRANSITION', message: 'Booking must be approved before payment' })
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return res.status(409).json({ code: 'INVALID_TRANSITION', message: `Cannot pay for ${booking.status} booking` })
    }

    // If already ACTIVE, check if payment exists
    if (booking.status === 'ACTIVE') {
      const existingPayment = await prisma.payment.findFirst({
        where: { bookingId: id }
      })
      if (existingPayment) {
        return res.status(409).json({ code: 'INVALID_TRANSITION', message: 'Payment already processed' })
      }
      // If ACTIVE but no payment, allow payment creation (edge case recovery)
    }

    // Must be CONFIRMED status to proceed with payment
    if (booking.status !== 'CONFIRMED' && booking.status !== 'ACTIVE') {
      return res.status(409).json({ code: 'INVALID_TRANSITION', message: 'Invalid booking status for payment' })
    }

    // Update to ACTIVE
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'ACTIVE' }
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: id,
        userId,
        amount: booking.totalPrice,
        status: 'COMPLETED',
        method: 'CREDIT_CARD',
        processedAt: new Date()
      }
    })

    res.status(200).json({ ok: true, data: updated })
  } catch (error) {
    next(error)
  }
}

const cancelBooking = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            business: true
          }
        }
      }
    })

    if (!booking) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Booking not found' })
    }

    // Check if user is customer or owner
    const isCustomer = booking.userId === userId
    const isOwner = booking.vehicle.ownerId === userId || booking.vehicle.business?.ownerId === userId

    if (!isCustomer && !isOwner) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Not authorized to cancel this booking' })
    }

    // Cannot cancel ACTIVE or COMPLETED bookings
    if (booking.status === 'ACTIVE' || booking.status === 'COMPLETED') {
      return res.status(409).json({ code: 'INVALID_TRANSITION', message: `Cannot cancel ${booking.status} booking` })
    }

    // Already cancelled
    if (booking.status === 'CANCELLED') {
      return res.status(200).json({ ok: true, data: booking })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })

    res.status(200).json({ ok: true, data: updated })
  } catch (error) {
    next(error)
  }
}

const completeBooking = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id }
    })

    if (!booking) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Booking not found' })
    }

    // Check if user is the customer
    if (booking.userId !== userId) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Only booking customer can complete' })
    }

    // Must be ACTIVE to complete
    if (booking.status !== 'ACTIVE') {
      return res.status(409).json({ code: 'INVALID_TRANSITION', message: `Cannot complete booking with status ${booking.status}` })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'COMPLETED' }
    })

    res.status(200).json({ ok: true, data: updated })
  } catch (error) {
    next(error)
  }
}

const listMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { status, cursor, limit = 10 } = req.query

    const where = { userId }
    if (status) {
      where.status = status
    }

    let cursorObj = {}
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
        const parsed = JSON.parse(decoded)
        if (parsed.id) {
          cursorObj = {
            skip: 1,
            cursor: { id: parsed.id }
          }
        }
      } catch (e) {
        // Invalid cursor, ignore it
      }
    }

    const items = await prisma.booking.findMany({
      where,
      take: parseInt(limit) + 1,
      orderBy: { createdAt: 'desc' },
      ...cursorObj
    })

    const hasMore = items.length > parseInt(limit)
    const results = hasMore ? items.slice(0, parseInt(limit)) : items
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ id: results[results.length - 1].id })).toString('base64')
      : null

    res.status(200).json({
      ok: true,
      data: {
        items: results,
        nextCursor,
        hasMore
      }
    })
  } catch (error) {
    next(error)
  }
}

const listVehicleBookings = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id: vehicleId } = req.params

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { business: true }
    })

    if (!vehicle) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Vehicle not found' })
    }

    // Check if user is owner
    const isOwner = vehicle.ownerId === userId || vehicle.business?.ownerId === userId
    
    if (!isOwner) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Only vehicle owner can view bookings' })
    }

    const bookings = await prisma.booking.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({ ok: true, data: { items: bookings } })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createBookingRequest,
  getBookingDetails,
  processPayment,
  approveBooking,
  payBooking,
  cancelBooking,
  completeBooking,
  listMyBookings,
  listVehicleBookings
}

