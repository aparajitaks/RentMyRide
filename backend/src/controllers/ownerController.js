import { PrismaClient } from '../../../prisma-client-app/index.js'

const prisma = new PrismaClient()

// Helper functions for date manipulation
const startOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const endOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

const subMonths = (date, months) => {
  const result = new Date(date)
  result.setMonth(result.getMonth() - months)
  return result
}

const formatDate = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        business: true
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
      avatar: user.profile?.avatar,
      business: user.business
    }

    res.json(profile)
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { firstName, lastName, phone, address, city, state, zipCode, country, bio, avatar, businessName, businessDescription } = req.body

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone
      }
    })

    // Update or create profile
    await prisma.profile.upsert({
      where: { userId },
      update: {
        address,
        city,
        state,
        zipCode,
        country,
        bio,
        avatar
      },
      create: {
        userId,
        address,
        city,
        state,
        zipCode,
        country,
        bio,
        avatar
      }
    })

    // Update or create business
    if (businessName) {
      await prisma.business.upsert({
        where: { ownerId: userId },
        update: {
          name: businessName,
          description: businessDescription
        },
        create: {
          ownerId: userId,
          name: businessName,
          description: businessDescription
        }
      })
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        business: true
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
      business: updatedUser.business
    }

    res.json(profile)
  } catch (error) {
    next(error)
  }
}

export const getProfileStats = async (req, res, next) => {
  try {
    const userId = req.user.id

    const [totalBookings, activeRentals, totalRevenue] = await Promise.all([
      prisma.booking.count({
        where: {
          vehicle: { ownerId: userId }
        }
      }),
      prisma.booking.count({
        where: {
          vehicle: { ownerId: userId },
          status: 'ACTIVE'
        }
      }),
      prisma.payment.aggregate({
        where: {
          booking: {
            vehicle: { ownerId: userId }
          },
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      })
    ])

    res.json({
      totalBookings,
      activeRentals,
      totalRevenue: totalRevenue._sum.amount || 0
    })
  } catch (error) {
    next(error)
  }
}

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id

    const [totalBookings, activeRentals, pendingRequests, completedBookings, totalRevenue] = await Promise.all([
      prisma.booking.count({
        where: {
          vehicle: { ownerId: userId }
        }
      }),
      prisma.booking.count({
        where: {
          vehicle: { ownerId: userId },
          status: 'ACTIVE'
        }
      }),
      prisma.booking.count({
        where: {
          vehicle: { ownerId: userId },
          status: 'PENDING'
        }
      }),
      prisma.booking.count({
        where: {
          vehicle: { ownerId: userId },
          status: 'COMPLETED'
        }
      }),
      prisma.payment.aggregate({
        where: {
          booking: {
            vehicle: { ownerId: userId }
          },
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      })
    ])

    // Calculate average rating
    const reviews = await prisma.review.findMany({
      where: {
        vehicle: { ownerId: userId }
      },
      select: {
        rating: true
      }
    })

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    res.json({
      totalBookings,
      activeRentals,
      pendingRequests,
      completedBookings,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRevenue: parseFloat((totalRevenue._sum.amount || 0).toString())
    })
  } catch (error) {
    next(error)
  }
}

export const getDashboardGrowth = async (req, res, next) => {
  try {
    const userId = req.user.id
    const months = []
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const monthEnd = endOfMonth(subMonths(new Date(), i))
      
      const [bookings, revenue] = await Promise.all([
        prisma.booking.count({
          where: {
            vehicle: { ownerId: userId },
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        }),
        prisma.payment.aggregate({
          where: {
            booking: {
              vehicle: { ownerId: userId }
            },
            status: 'COMPLETED',
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          },
          _sum: {
            amount: true
          }
        })
      ])

      months.push({
        month: formatDate(monthStart),
        bookings,
        revenue: parseFloat((revenue._sum.amount || 0).toString())
      })
    }

    res.json(months)
  } catch (error) {
    next(error)
  }
}

export const getRequests = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { status } = req.query

    const where = {
      vehicle: { ownerId: userId }
    }
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: true,
        vehicle: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const requests = bookings.map(booking => ({
      id: booking.id,
      carMake: booking.vehicle.make,
      carModel: booking.vehicle.model,
      customerName: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || booking.user.email,
      customerEmail: booking.user.email,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalDays: booking.totalDays,
      totalPrice: booking.totalPrice,
      status: booking.status.toLowerCase(),
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt
    }))

    res.json(requests)
  } catch (error) {
    next(error)
  }
}

export const approveRequest = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        vehicle: { ownerId: userId },
        status: 'PENDING'
      }
    })

    if (!booking) {
      return res.status(404).json({ message: 'Booking request not found' })
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' }
    })

    res.json({ message: 'Request approved successfully' })
  } catch (error) {
    next(error)
  }
}

export const rejectRequest = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        vehicle: { ownerId: userId },
        status: 'PENDING'
      }
    })

    if (!booking) {
      return res.status(404).json({ message: 'Booking request not found' })
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })

    res.json({ message: 'Request rejected successfully' })
  } catch (error) {
    next(error)
  }
}

export const getCalendarBookings = async (req, res, next) => {
  try {
    const userId = req.user.id

    const bookings = await prisma.booking.findMany({
      where: {
        vehicle: { ownerId: userId },
        status: {
          in: ['CONFIRMED', 'ACTIVE']
        }
      },
      include: {
        user: true,
        vehicle: true
      }
    })

    const calendarBookings = bookings.map(booking => ({
      id: booking.id,
      title: `${booking.vehicle.make} ${booking.vehicle.model} - ${booking.user.firstName || booking.user.email}`,
      start: booking.startDate,
      end: booking.endDate,
      status: booking.status.toLowerCase(),
      customerName: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || booking.user.email
    }))

    res.json(calendarBookings)
  } catch (error) {
    next(error)
  }
}

export const getCars = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { status } = req.query

    const where = { ownerId: userId }
    
    if (status === 'available') {
      where.isAvailable = true
    } else if (status === 'booked') {
      where.isAvailable = false
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        photos: {
          where: { isPrimary: true },
          take: 1
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'ACTIVE']
            }
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const cars = vehicles.map(vehicle => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      seats: vehicle.seats,
      transmission: vehicle.transmission,
      pricePerDay: vehicle.pricePerDay,
      imageUrl: vehicle.photos[0]?.url,
      status: vehicle.isAvailable ? 'available' : 'booked',
      hasActiveBooking: vehicle.bookings.length > 0
    }))

    res.json(cars)
  } catch (error) {
    next(error)
  }
}

export const createCar = async (req, res, next) => {
  try {
    const userId = req.user.id
    const {
      make, model, year, color, licensePlate, vin, mileage, seats,
      transmission, fuelType, pricePerDay, pricePerWeek, pricePerMonth,
      description, features, businessId
    } = req.body

    // Get or create business for owner
    let business = await prisma.business.findUnique({
      where: { ownerId: userId }
    })

    if (!business) {
      business = await prisma.business.create({
        data: {
          ownerId: userId,
          name: `${req.user.firstName || 'Owner'}'s Business`
        }
      })
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        make,
        model,
        year: parseInt(year),
        color,
        licensePlate,
        vin,
        mileage: mileage ? parseInt(mileage) : null,
        seats: seats ? parseInt(seats) : 5,
        transmission,
        fuelType,
        pricePerDay: parseFloat(pricePerDay),
        pricePerWeek: pricePerWeek ? parseFloat(pricePerWeek) : null,
        pricePerMonth: pricePerMonth ? parseFloat(pricePerMonth) : null,
        description,
        features: typeof features === 'string' ? features : JSON.stringify(features),
        businessId: businessId || business.id,
        ownerId: userId,
        isAvailable: true
      },
      include: {
        photos: {
          where: { isPrimary: true },
          take: 1
        }
      }
    })

    res.status(201).json({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      pricePerDay: vehicle.pricePerDay,
      imageUrl: vehicle.photos[0]?.url,
      status: 'available'
    })
  } catch (error) {
    next(error)
  }
}

export const updateCar = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const updateData = req.body

    // Verify ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        ownerId: userId
      }
    })

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    // Prepare update data
    const data = {}
    if (updateData.make) data.make = updateData.make
    if (updateData.model) data.model = updateData.model
    if (updateData.year) data.year = parseInt(updateData.year)
    if (updateData.color) data.color = updateData.color
    if (updateData.pricePerDay) data.pricePerDay = parseFloat(updateData.pricePerDay)
    if (updateData.description !== undefined) data.description = updateData.description
    if (updateData.isAvailable !== undefined) data.isAvailable = updateData.isAvailable

    const updated = await prisma.vehicle.update({
      where: { id },
      data
    })

    res.json(updated)
  } catch (error) {
    next(error)
  }
}

export const deleteCar = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        ownerId: userId
      }
    })

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        vehicleId: id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE']
        }
      }
    })

    if (activeBookings > 0) {
      return res.status(400).json({ message: 'Cannot delete vehicle with active bookings' })
    }

    await prisma.vehicle.delete({
      where: { id }
    })

    res.json({ message: 'Vehicle deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export const getReviews = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { limit = 10 } = req.query

    const reviews = await prisma.review.findMany({
      where: {
        vehicle: { ownerId: userId }
      },
      include: {
        author: true,
        vehicle: true
      },
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customerName: `${review.author.firstName || ''} ${review.author.lastName || ''}`.trim() || review.author.email,
      vehicleName: `${review.vehicle.make} ${review.vehicle.model}`,
      createdAt: review.createdAt
    }))

    res.json(formattedReviews)
  } catch (error) {
    next(error)
  }
}

export const getVehicles = async (req, res, next) => {
  try {
    const userId = req.user.id

    const vehicles = await prisma.vehicle.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        licensePlate: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(vehicles)
  } catch (error) {
    next(error)
  }
}

export const getVehicleDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        ownerId: userId
      }
    })

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    const documents = await prisma.document.findMany({
      where: {
        businessId: vehicle.businessId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const uploadVehicleDocument = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { type } = req.body

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        ownerId: userId
      },
      include: {
        business: true
      }
    })

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    // In production, upload file to cloud storage and get URL
    // For now, use a placeholder URL
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null

    if (!fileUrl) {
      return res.status(400).json({ message: 'File is required' })
    }

    const document = await prisma.document.create({
      data: {
        type: type || 'REGISTRATION',
        name: req.file.originalname,
        url: fileUrl,
        businessId: vehicle.businessId
      }
    })

    res.status(201).json({
      ...document,
      uploadedAt: document.createdAt
    })
  } catch (error) {
    next(error)
  }
}

export const getVehicleReminders = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        ownerId: userId
      }
    })

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    const reminders = await prisma.reminder.findMany({
      where: {
        vehicleId: id
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    res.json(reminders)
  } catch (error) {
    next(error)
  }
}

export const createVehicleReminder = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { title, description, dueDate } = req.body

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        ownerId: userId
      }
    })

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    const reminder = await prisma.reminder.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        vehicleId: id
      }
    })

    res.status(201).json(reminder)
  } catch (error) {
    next(error)
  }
}

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id

    // Get recent bookings, messages, and reviews
    const [recentBookings, recentMessages, recentReviews] = await Promise.all([
      prisma.booking.findMany({
        where: {
          vehicle: { ownerId: userId },
          status: 'PENDING'
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          vehicle: true
        }
      }),
      prisma.message.findMany({
        where: {
          receiverId: userId,
          isRead: false
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: true
        }
      }),
      prisma.review.findMany({
        where: {
          vehicle: { ownerId: userId }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true
        }
      })
    ])

    const notifications = [
      ...recentBookings.map(b => ({
        id: b.id,
        type: 'booking_request',
        message: `New booking request for ${b.vehicle.make} ${b.vehicle.model}`,
        createdAt: b.createdAt
      })),
      ...recentMessages.map(m => ({
        id: m.id,
        type: 'message',
        message: `New message from ${m.sender.firstName || m.sender.email}`,
        createdAt: m.createdAt
      })),
      ...recentReviews.map(r => ({
        id: r.id,
        type: 'review',
        message: `New review received`,
        createdAt: r.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10)

    res.json(notifications)
  } catch (error) {
    next(error)
  }
}

