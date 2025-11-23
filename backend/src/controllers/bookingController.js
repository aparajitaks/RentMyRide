import { PrismaClient } from '../../../prisma-client-app/index.js'

const prisma = new PrismaClient()

export const createBookingRequest = async (req, res, next) => {
  try {
    const userId = req.user.id
    const {
      carId,
      businessId,
      pickupLocation,
      dropoffLocation,
      startDate,
      endDate,
      specialRequests
    } = req.body

    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Car ID, start date, and end date are required' })
    }

    // Verify vehicle exists and is available
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: carId },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'ACTIVE']
            },
            OR: [
              {
                startDate: {
                  lte: new Date(endDate)
                },
                endDate: {
                  gte: new Date(startDate)
                }
              }
            ]
          }
        }
      }
    })

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    if (!vehicle.isAvailable) {
      return res.status(400).json({ message: 'Vehicle is not available' })
    }

    if (vehicle.bookings.length > 0) {
      return res.status(400).json({ message: 'Vehicle is already booked for the selected dates' })
    }

    // Calculate total days and price
    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    const totalPrice = parseFloat(vehicle.pricePerDay.toString()) * totalDays

    const booking = await prisma.booking.create({
      data: {
        userId,
        vehicleId: carId,
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

    res.status(201).json({
      id: booking.id,
      message: 'Booking request created successfully',
      booking: {
        id: booking.id,
        carMake: booking.vehicle.make,
        carModel: booking.vehicle.model,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalDays: booking.totalDays,
        totalPrice: booking.totalPrice,
        status: booking.status.toLowerCase()
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getBookingDetails = async (req, res, next) => {
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
      return res.status(404).json({ message: 'Booking not found' })
    }

    // Check if user has access (either customer or owner)
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

export const processPayment = async (req, res, next) => {
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
      return res.status(404).json({ message: 'Booking not found' })
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

    // Create payment
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

    // Update booking status to ACTIVE if start date is today or past
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

