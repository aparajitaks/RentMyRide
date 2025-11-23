import { PrismaClient } from '../../../prisma-client-app/index.js'

const prisma = new PrismaClient()

export const getCarDetails = async (req, res, next) => {
  try {
    const { id } = req.params

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        business: {
          include: {
            owner: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        photos: {
          orderBy: {
            isPrimary: 'desc'
          }
        },
        reviews: {
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          take: 5,
          orderBy: {
            createdAt: 'desc'
          }
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'ACTIVE']
            }
          },
          select: {
            startDate: true,
            endDate: true
          }
        }
      }
    })

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    // Calculate average rating
    const allReviews = await prisma.review.findMany({
      where: {
        vehicleId: id
      },
      select: {
        rating: true
      }
    })

    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0

    // Check availability
    const isAvailable = vehicle.isAvailable && vehicle.bookings.length === 0

    res.json({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin,
      mileage: vehicle.mileage,
      seats: vehicle.seats,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      pricePerDay: vehicle.pricePerDay,
      pricePerWeek: vehicle.pricePerWeek,
      pricePerMonth: vehicle.pricePerMonth,
      description: vehicle.description,
      features: vehicle.features,
      isAvailable,
      photos: vehicle.photos.map(p => ({
        id: p.id,
        url: p.url,
        caption: p.caption,
        isPrimary: p.isPrimary
      })),
      business: {
        id: vehicle.business.id,
        name: vehicle.business.name,
        address: vehicle.business.address,
        city: vehicle.business.city,
        ownerName: `${vehicle.business.owner.firstName || ''} ${vehicle.business.owner.lastName || ''}`.trim() || vehicle.business.owner.email
      },
      rating: parseFloat(averageRating.toFixed(1)),
      totalReviews: allReviews.length,
      reviews: vehicle.reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        authorName: `${r.author.firstName || ''} ${r.author.lastName || ''}`.trim() || 'Anonymous',
        createdAt: r.createdAt
      })),
      bookings: vehicle.bookings
    })
  } catch (error) {
    next(error)
  }
}

