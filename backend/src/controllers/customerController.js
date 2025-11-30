const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const profile = {
      id: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.profile?.address,
      city: user.profile?.city,
      state: user.profile?.state,
      zipCode: user.profile?.zipCode,
      country: user.profile?.country,
      bio: user.profile?.bio,
      avatar: user.profile?.avatar
    }

    res.json(profile)
  } catch (error) {
    next(error)
  }
}

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { firstName, lastName, phone, address, city, state, zipCode, country, bio, avatar, dateOfBirth, licenseNumber } = req.body

    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone
      }
    })

    
    await prisma.profile.upsert({
      where: { userId },
      update: {
        address,
        city,
        state,
        zipCode,
        country,
        bio,
        avatar,
        dateOfBirth,
        licenseNumber
      },
      create: {
        userId,
        address,
        city,
        state,
        zipCode,
        country,
        bio,
        avatar,
        dateOfBirth,
        licenseNumber
      }
    })

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    })

    const profile = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      address: updatedUser.profile?.address,
      city: updatedUser.profile?.city,
      state: updatedUser.profile?.state,
      zipCode: updatedUser.profile?.zipCode,
      country: updatedUser.profile?.country,
      bio: updatedUser.profile?.bio,
      avatar: updatedUser.profile?.avatar,
      dateOfBirth: updatedUser.profile?.dateOfBirth,
      licenseNumber: updatedUser.profile?.licenseNumber,
      userType: updatedUser.role.toLowerCase(),
      role: updatedUser.role
    }

    console.log('Profile updated successfully:', profile.id)
    res.json(profile)
  } catch (error) {
    console.error('Error updating customer profile:', error)
    next(error)
  }
}

const getBookings = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { status } = req.query

    const where = { userId }
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const bookings = await prisma.booking.findMany({
      where,
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
        payment: true,
        travelLog: {
          include: {
            photos: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedBookings = bookings.map(booking => ({
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
      imageUrl: booking.vehicle.photos[0]?.url,
      businessName: booking.vehicle.business.name,
      paymentStatus: booking.payment?.status?.toLowerCase(),
      completedAt: booking.status === 'COMPLETED' ? booking.updatedAt : null,
      createdAt: booking.createdAt
    }))

    res.json(formattedBookings)
  } catch (error) {
    next(error)
  }
}

const getTravelLog = async (req, res, next) => {
  try {
    const userId = req.user.id

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        status: 'COMPLETED'
      },
      include: {
        travelLog: {
          include: {
            photos: true
          }
        },
        vehicle: {
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const travelLogs = bookings
      .filter(booking => booking.travelLog)
      .map(booking => ({
        id: booking.travelLog.id,
        bookingId: booking.id,
        carMake: booking.vehicle.make,
        carModel: booking.vehicle.model,
        carYear: booking.vehicle.year,
        startMileage: booking.travelLog.startMileage,
        endMileage: booking.travelLog.endMileage,
        startLocation: booking.travelLog.startLocation,
        endLocation: booking.travelLog.endLocation,
        notes: booking.travelLog.notes,
        photos: booking.travelLog.photos,
        carImageUrl: booking.vehicle.photos[0]?.url,
        createdAt: booking.travelLog.createdAt
      }))

    res.json(travelLogs)
  } catch (error) {
    next(error)
  }
}

module.exports = { getProfile, updateProfile, getBookings, getTravelLog }
