const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Call = require('../models/Call');
const Timetable = require('../models/Timetable');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /api/appointments
 * @desc Get appointments with pagination and filters
 * @access Private (Staff)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      staffId, 
      clientId, 
      startDate, 
      endDate 
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (staffId) query.staffId = staffId;
    if (clientId) query.clientId = clientId;
    
    // Date range filter
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { appointmentDate: 1 },
      populate: [
        { path: 'staffId', select: 'name email department' },
        { path: 'clientId', select: 'name email phone' },
        { path: 'callId', select: 'purpose status' }
      ]
    };

    const appointments = await Appointment.paginate(query, options);

    res.json({
      success: true,
      appointments: appointments.docs,
      pagination: {
        page: appointments.page,
        pages: appointments.totalPages,
        total: appointments.totalDocs,
        limit: appointments.limit
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

/**
 * @route GET /api/appointments/:id
 * @desc Get appointment details
 * @access Private (Staff)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('staffId', 'name email department')
      .populate('clientId', 'name email phone')
      .populate('callId', 'purpose status updates');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Get appointment details error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment details' });
  }
});

/**
 * @route POST /api/appointments
 * @desc Create new appointment
 * @access Private (Staff)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      clientId,
      staffId,
      purpose,
      appointmentDate,
      appointmentTime,
      location,
      callId,
      createdFromCall = false
    } = req.body;

    if (!clientId || !staffId || !purpose || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ 
        error: 'clientId, staffId, purpose, appointmentDate, and appointmentTime are required' 
      });
    }

    // Check availability
    const availability = await checkStaffAvailability(staffId, appointmentDate, appointmentTime);
    if (!availability.available) {
      return res.status(400).json({ 
        error: 'Staff not available at this time',
        details: availability
      });
    }

    const appointment = new Appointment({
      clientId,
      staffId,
      purpose,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      location,
      callId,
      createdFromCall,
      status: 'Pending',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    await appointment.save();

    // If created from call, update call with appointment reference
    if (callId && createdFromCall) {
      await Call.findByIdAndUpdate(callId, {
        $push: {
          updates: {
            notes: `Appointment created: ${purpose}`,
            appointmentId: appointment._id,
            updatedBy: req.user.id,
            updatedAt: new Date()
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

/**
 * @route PUT /api/appointments/:id
 * @desc Update appointment
 * @access Private (Staff)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      purpose,
      appointmentDate,
      appointmentTime,
      location,
      status
    } = req.body;

    const updateData = {
      updatedBy: req.user.id,
      updatedAt: new Date()
    };

    if (purpose) updateData.purpose = purpose;
    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
    if (appointmentTime) updateData.appointmentTime = appointmentTime;
    if (location) updateData.location = location;
    if (status) updateData.status = status;

    // If changing time/date, check availability
    if (appointmentDate || appointmentTime) {
      const appointment = await Appointment.findById(req.params.id);
      if (appointment) {
        const checkDate = appointmentDate ? new Date(appointmentDate) : appointment.appointmentDate;
        const checkTime = appointmentTime || appointment.appointmentTime;
        
        const availability = await checkStaffAvailability(appointment.staffId, checkDate, checkTime, req.params.id);
        if (!availability.available) {
          return res.status(400).json({ 
            error: 'Staff not available at this time',
            details: availability
          });
        }
      }
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('staffId', 'name email department')
     .populate('clientId', 'name email phone')
     .populate('callId', 'purpose status');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

/**
 * @route DELETE /api/appointments/:id
 * @desc Cancel appointment
 * @access Private (Staff)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Cancelled',
        updatedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

/**
 * @route GET /api/appointments/availability/:staffId
 * @desc Get staff availability for appointments
 * @access Private (Staff)
 */
router.get('/availability/:staffId', authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { date, durationMinutes = 30 } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date parameter is required' });
    }

    const availability = await checkStaffAvailability(staffId, date, null, null, durationMinutes);

    res.json({
      success: true,
      staffId,
      date,
      availability
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

/**
 * Helper function to check staff availability
 */
async function checkStaffAvailability(staffId, date, appointmentTime, excludeAppointmentId = null, durationMinutes = 30) {
  const targetDate = new Date(date);
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getDay()];
  
  // Get staff timetable
  const timetable = await Timetable.findOne({ teacherId: staffId, isActive: true });
  
  if (!timetable) {
    return {
      available: false,
      message: 'No timetable found for this staff member'
    };
  }

  // Get existing appointments for the day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const appointmentQuery = {
    staffId: staffId,
    appointmentDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['Pending', 'Confirmed'] }
  };

  if (excludeAppointmentId) {
    appointmentQuery._id = { $ne: excludeAppointmentId };
  }

  const appointments = await Appointment.find(appointmentQuery);

  // Find day schedule
  const daySchedule = timetable.schedule.find(s => s.day.toLowerCase() === dayName);
  if (!daySchedule || !daySchedule.timeSlots.length) {
    return {
      available: false,
      message: 'No schedule for this day',
      freeSlots: []
    };
  }

  // Calculate free slots
  const freeSlots = [];
  const bookedSlots = appointments.map(apt => ({
    start: apt.appointmentTime.start,
    end: apt.appointmentTime.end,
    purpose: apt.purpose
  }));

  // Check each time slot for availability
  for (const slot of daySchedule.timeSlots) {
    if (slot.type === 'office-hours') {
      const startTime = slot.startTime;
      const endTime = slot.endTime;
      
      // Check if this slot conflicts with appointments
      const hasConflict = bookedSlots.some(booked => 
        (startTime < booked.end && endTime > booked.start)
      );
      
      if (!hasConflict) {
        // Check if slot is long enough
        const slotDuration = timeToMinutes(endTime) - timeToMinutes(startTime);
        if (slotDuration >= parseInt(durationMinutes)) {
          freeSlots.push({
            start: startTime,
            end: endTime,
            duration: slotDuration,
            type: 'office-hours',
            room: slot.room || 'Office'
          });
        }
      }
    }
  }

  // If specific time requested, check if it's available
  if (appointmentTime) {
    const requestedStart = appointmentTime.start;
    const requestedEnd = appointmentTime.end;
    
    const isAvailable = freeSlots.some(slot => 
      slot.start <= requestedStart && slot.end >= requestedEnd
    );

    return {
      available: isAvailable,
      freeSlots,
      bookedSlots,
      requestedTime: appointmentTime,
      message: isAvailable ? 'Time slot is available' : 'Time slot is not available'
    };
  }

  return {
    available: freeSlots.length > 0,
    freeSlots,
    bookedSlots,
    totalSlots: daySchedule.timeSlots.length
  };
}

/**
 * Helper function to convert time to minutes
 */
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

module.exports = router;
