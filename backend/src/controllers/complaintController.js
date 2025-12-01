const prisma = require('../lib/prisma')

const getCustomerComplaints = async (req, res, next) => {
  try {
    const userId = req.user.id

    const complaints = await prisma.complaint.findMany({
      where: {
        filedById: userId
      },
      include: {
        booking: {
          include: {
            vehicle: true
          }
        },
        target: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedComplaints = complaints.map(complaint => ({
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      status: complaint.status.toLowerCase(),
      resolution: complaint.resolution,
      resolvedAt: complaint.resolvedAt,
      booking: complaint.booking ? {
        id: complaint.booking.id,
        carMake: complaint.booking.vehicle.make,
        carModel: complaint.booking.vehicle.model
      } : null,
      target: complaint.target ? {
        name: `${complaint.target.firstName || ''} ${complaint.target.lastName || ''}`.trim() || complaint.target.email
      } : null,
      createdAt: complaint.createdAt
    }))

    res.json(formattedComplaints)
  } catch (error) {
    next(error)
  }
}

const createCustomerComplaint = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { bookingId, title, description, category } = req.body

    if (!bookingId || !title || !description || !category) {
      return res.status(400).json({ message: 'Booking ID, title, description, and category are required' })
    }

    
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: userId,
        status: 'COMPLETED'
      },
      include: {
        vehicle: {
          include: {
            owner: true
          }
        }
      }
    })

    if (!booking) {
      return res.status(404).json({ message: 'Completed booking not found' })
    }

    
    const completedDate = booking.updatedAt
    const daysSince = (new Date() - completedDate) / (1000 * 60 * 60 * 24)

    if (daysSince > 5) {
      return res.status(400).json({ message: 'Complaints can only be filed within 5 days of completing a transaction' })
    }

    
    const complaint = await prisma.complaint.create({
      data: {
        filedById: userId,
        targetId: booking.vehicle.ownerId,
        bookingId: bookingId,
        title,
        description,
        category,
        status: 'PENDING'
      },
      include: {
        booking: {
          include: {
            vehicle: true
          }
        }
      }
    })

    res.status(201).json({
      id: complaint.id,
      message: 'Complaint filed successfully',
      complaint: {
        id: complaint.id,
        title: complaint.title,
        status: complaint.status.toLowerCase(),
        createdAt: complaint.createdAt
      }
    })
  } catch (error) {
    next(error)
  }
}

const getOwnerComplaints = async (req, res, next) => {
  try {
    const userId = req.user.id

    const complaints = await prisma.complaint.findMany({
      where: {
        filedById: userId
      },
      include: {
        booking: {
          include: {
            vehicle: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        target: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedComplaints = complaints.map(complaint => ({
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      status: complaint.status.toLowerCase(),
      resolution: complaint.resolution,
      resolvedAt: complaint.resolvedAt,
      booking: complaint.booking ? {
        id: complaint.booking.id,
        carMake: complaint.booking.vehicle.make,
        carModel: complaint.booking.vehicle.model,
        customerName: `${complaint.booking.user.firstName || ''} ${complaint.booking.user.lastName || ''}`.trim() || complaint.booking.user.email
      } : null,
      target: complaint.target ? {
        name: `${complaint.target.firstName || ''} ${complaint.target.lastName || ''}`.trim() || complaint.target.email
      } : null,
      createdAt: complaint.createdAt
    }))

    res.json(formattedComplaints)
  } catch (error) {
    next(error)
  }
}

const createOwnerComplaint = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { bookingId, title, description, category } = req.body

    if (!bookingId || !title || !description || !category) {
      return res.status(400).json({ message: 'Booking ID, title, description, and category are required' })
    }

    
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        vehicle: {
          ownerId: userId
        },
        status: 'COMPLETED'
      },
      include: {
        vehicle: true,
        user: true
      }
    })

    if (!booking) {
      return res.status(404).json({ message: 'Completed booking not found' })
    }

    
    const completedDate = booking.updatedAt
    const daysSince = (new Date() - completedDate) / (1000 * 60 * 60 * 24)

    if (daysSince > 5) {
      return res.status(400).json({ message: 'Complaints can only be filed within 5 days of completing a transaction' })
    }

    
    const complaint = await prisma.complaint.create({
      data: {
        filedById: userId,
        targetId: booking.userId,
        bookingId: bookingId,
        title,
        description,
        category,
        status: 'PENDING'
      },
      include: {
        booking: {
          include: {
            vehicle: true
          }
        }
      }
    })

    res.status(201).json({
      id: complaint.id,
      message: 'Complaint filed successfully',
      complaint: {
        id: complaint.id,
        title: complaint.title,
        status: complaint.status.toLowerCase(),
        createdAt: complaint.createdAt
      }
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getCustomerComplaints, createCustomerComplaint, getOwnerComplaints, createOwnerComplaint }
