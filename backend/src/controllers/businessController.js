const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const searchBusinesses = async (req, res, next) => {
  try {
    const { city } = req.query

    if (!city) {
      return res.status(400).json({ message: 'City parameter is required' })
    }

    const businesses = await prisma.business.findMany({
      where: {
        city: {
          contains: city,
          mode: 'insensitive'
        },
        isActive: true
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        vehicles: {
          where: {
            isAvailable: true,
            isActive: true
          },
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1
            }
          }
        },
        _count: {
          select: {
            vehicles: true
          }
        }
      }
    })

    
    const businessesWithRatings = await Promise.all(
      businesses.map(async (business) => {
        const reviews = await prisma.review.findMany({
          where: {
            vehicle: {
              businessId: business.id
            }
          },
          select: {
            rating: true
          }
        })

        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0


        const avgPrice = business.vehicles.length > 0
          ? business.vehicles.reduce((sum, v) => sum + parseFloat(v.pricePerDay.toString()), 0) / business.vehicles.length
          : 0

        let priceRange = '$'
        if (avgPrice > 100) priceRange = '$$$$'
        else if (avgPrice > 75) priceRange = '$$$'
        else if (avgPrice > 50) priceRange = '$$'

        return {
          id: business.id,
          name: business.name,
          description: business.description,
          address: business.address,
          city: business.city,
          state: business.state,
          ownerName: `${business.owner.firstName || ''} ${business.owner.lastName || ''}`.trim() || business.owner.email,
          rating: parseFloat(averageRating.toFixed(1)),
          totalCars: business._count.vehicles,
          totalReviews: reviews.length,
          priceRange,
          logo: business.logo
        }
      })
    )

    res.json(businessesWithRatings)
  } catch (error) {
    next(error)
  }
}

const getBusinessDetails = async (req, res, next) => {
  try {
    const { id } = req.params

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        vehicles: {
          where: {
            isActive: true
          },
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      }
    })

    if (!business) {
      return res.status(404).json({ message: 'Business not found' })
    }

    
    const reviews = await prisma.review.findMany({
      where: {
        vehicle: {
          businessId: business.id
        }
      },
      select: {
        rating: true
      }
    })

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    res.json({
      id: business.id,
      name: business.name,
      description: business.description,
      address: business.address,
      city: business.city,
      state: business.state,
      zipCode: business.zipCode,
      country: business.country,
      phone: business.phone,
      website: business.website,
      logo: business.logo,
      isVerified: business.isVerified,
      owner: {
        name: `${business.owner.firstName || ''} ${business.owner.lastName || ''}`.trim() || business.owner.email,
        email: business.owner.email,
        phone: business.owner.phone
      },
      rating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      totalCars: business.vehicles.length
    })
  } catch (error) {
    next(error)
  }
}

const getBusinessCars = async (req, res, next) => {
  try {
    const { id } = req.params

    const vehicles = await prisma.vehicle.findMany({
      where: {
        businessId: id,
        isActive: true
      },
      include: {
        photos: {
          orderBy: {
            isPrimary: 'desc'
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

    const cars = vehicles.map(vehicle => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      seats: vehicle.seats,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      pricePerDay: vehicle.pricePerDay,
      pricePerWeek: vehicle.pricePerWeek,
      pricePerMonth: vehicle.pricePerMonth,
      description: vehicle.description,
      features: vehicle.features,
      photos: vehicle.photos.map(p => ({
        id: p.id,
        url: p.url,
        caption: p.caption,
        isPrimary: p.isPrimary
      })),
      isAvailable: vehicle.isAvailable && vehicle.bookings.length === 0,
      bookings: vehicle.bookings
    }))

    res.json(cars)
  } catch (error) {
    next(error)
  }
}

const getBusinessReviews = async (req, res, next) => {
  try {
    const { id } = req.params

    const reviews = await prisma.review.findMany({
      where: {
        vehicle: {
          businessId: id
        }
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      authorName: `${review.author.firstName || ''} ${review.author.lastName || ''}`.trim() || review.author.email,
      vehicleName: `${review.vehicle.make} ${review.vehicle.model} (${review.vehicle.year})`,
      createdAt: review.createdAt,
      isVerified: review.isVerified
    }))

    res.json(formattedReviews)
  } catch (error) {
    next(error)
  }
}

module.exports = { searchBusinesses, getBusinessDetails, getBusinessCars, getBusinessReviews }
