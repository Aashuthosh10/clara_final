const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const ClassTimetable = require('../models/ClassTimetable');
const StaffTimetable = require('../models/StaffTimetable');
const TimetableService = require('../services/timetableService');
const Appointment = require('../models/Appointment');
const { authenticateToken } = require('../middleware/auth');

const timetableService = new TimetableService();

// Middleware to check if user is staff
const requireStaff = (req, res, next) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Access denied. Staff only.' });
  }
  next();
};

/**
 * @route POST /api/timetable/update
 * @desc Update or create teacher's timetable
 * @access Private (Staff only)
 */
router.post('/update', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { schedule, officeHours, academicYear, semester } = req.body;
    const teacherId = req.user._id;

    const timetableData = {
      schedule: schedule || [],
      officeHours: officeHours || [],
      academicYear: academicYear || '2024-25',
      semester: semester || '1'
    };

    const timetable = await timetableService.updateTimetable(teacherId, timetableData);
    
    res.json({
      success: true,
      message: 'Timetable updated successfully',
      timetable: {
        id: timetable._id,
        teacherName: timetable.teacherName,
        department: timetable.department,
        lastUpdated: timetable.lastUpdated
      }
    });
  } catch (error) {
    console.error('Timetable update error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/timetable/my-timetable
 * @desc Get current user's timetable
 * @access Private (Staff only)
 */
router.get('/my-timetable', authenticateToken, requireStaff, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { academicYear, semester } = req.query;
    
    const query = { teacherId };
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const timetable = await Timetable.findOne(query).sort({ lastUpdated: -1 });
    
    if (!timetable) {
      return res.json({
        hasTimetable: false,
        message: 'No timetable found. Please create one.',
        teacherName: req.user.name,
        department: req.user.department
      });
    }

    res.json({
      hasTimetable: true,
      timetable: {
        id: timetable._id,
        teacherName: timetable.teacherName,
        department: timetable.department,
        schedule: timetable.schedule,
        officeHours: timetable.officeHours,
        academicYear: timetable.academicYear,
        semester: timetable.semester,
        lastUpdated: timetable.lastUpdated
      }
    });
  } catch (error) {
    console.error('Get my timetable error:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

/**
 * @route GET /api/timetable/staff-timetable/:staffId
 * @desc Get staff timetable from StaffTimetable model
 * @access Public
 */
router.get('/staff-timetable/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    const { academicYear, semester } = req.query;
    
    const query = { staffId, isActive: true };
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const staffTimetable = await StaffTimetable.findOne(query).sort({ lastUpdated: -1 });
    
    if (!staffTimetable) {
      return res.json({
        hasTimetable: false,
        message: 'No timetable found for this staff member.',
        staffId: staffId
      });
    }

    res.json({
      hasTimetable: true,
      timetable: {
        id: staffTimetable._id,
        staffId: staffTimetable.staffId,
        academicYear: staffTimetable.academicYear,
        semester: staffTimetable.semester,
        entries: staffTimetable.entries,
        lastUpdated: staffTimetable.lastUpdated,
        isActive: staffTimetable.isActive
      }
    });
  } catch (error) {
    console.error('Get staff timetable error:', error);
    res.status(500).json({ error: 'Failed to fetch staff timetable' });
  }
});

/**
 * @route GET /api/timetable/teacher/:teacherName
 * @desc Get teacher's timetable by name
 * @access Public
 */
router.get('/teacher/:teacherName', async (req, res) => {
  try {
    const { teacherName } = req.params;
    const { day } = req.query;

    if (day) {
      // Get schedule for specific day
      const schedule = await timetableService.getTeacherSchedule(teacherName, day);
      res.json(schedule);
    } else {
      // Get current availability
      const availability = await timetableService.getTeacherAvailability(teacherName);
      res.json(availability);
    }
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/timetable/department/:department
 * @desc Get all teachers in a department with timetable status
 * @access Public
 */
router.get('/department/:department', async (req, res) => {
  try {
    const { department } = req.params;
    const teachers = await timetableService.getDepartmentTeachers(department);
    res.json(teachers);
  } catch (error) {
    console.error('Get department teachers error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/timetable/available
 * @desc Find available teachers at a specific time
 * @access Public
 */
router.get('/available', async (req, res) => {
  try {
    const { day, time } = req.query;
    
    if (!day || !time) {
      return res.status(400).json({ 
        error: 'Both day and time parameters are required' 
      });
    }

    const availableTeachers = await timetableService.findAvailableTeachers(day, time);
    res.json({
      day,
      time,
      availableTeachers,
      count: availableTeachers.length
    });
  } catch (error) {
    console.error('Find available teachers error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/timetable/room-availability
 * @desc Get room availability for a specific time
 * @access Public
 */
router.get('/room-availability', async (req, res) => {
  try {
    const { day, time } = req.query;
    
    if (!day || !time) {
      return res.status(400).json({ 
        error: 'Both day and time parameters are required' 
      });
    }

    const roomAvailability = await timetableService.getRoomAvailability(day, time);
    res.json({
      day,
      time,
      roomAvailability,
      occupiedCount: roomAvailability.length
    });
  } catch (error) {
    console.error('Get room availability error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/timetable/academic-info
 * @desc Get current academic year and semester information
 * @access Public
 */
router.get('/academic-info', (req, res) => {
  try {
    const academicInfo = timetableService.getCurrentAcademicInfo();
    res.json(academicInfo);
  } catch (error) {
    console.error('Get academic info error:', error);
    res.status(500).json({ error: 'Failed to get academic information' });
  }
});

/**
 * @route DELETE /api/timetable/delete
 * @desc Delete teacher's timetable
 * @access Private (Staff only)
 */
router.delete('/delete', authenticateToken, requireStaff, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { academicYear, semester } = req.query;
    
    const query = { teacherId };
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const result = await Timetable.deleteMany(query);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No timetable found to delete' });
    }

    res.json({
      success: true,
      message: 'Timetable deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({ error: 'Failed to delete timetable' });
  }
});

/**
 * @route GET /api/timetable/weekly
 * @desc Get weekly timetable with filters
 * @access Private (Staff) / Public (with restrictions)
 */
router.get('/weekly', async (req, res) => {
  try {
    const { staffId, start, end, day, course, location } = req.query;
    
    // Build query
    const query = { isActive: true };
    if (staffId) query.teacherId = staffId;
    
    // Date range filter
    if (start && end) {
      query.lastUpdated = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    const timetables = await Timetable.find(query)
      .populate('teacherId', 'name department email')
      .sort({ lastUpdated: -1 });

    // Normalize to weekly structure
    const weeklyStructure = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(dayName => {
      weeklyStructure[dayName] = [];
    });

    timetables.forEach(timetable => {
      timetable.schedule.forEach(daySchedule => {
        const dayName = daySchedule.day.toLowerCase();
        if (days.includes(dayName)) {
          daySchedule.timeSlots.forEach(slot => {
            // Apply filters
            if (course && !slot.subject.toLowerCase().includes(course.toLowerCase())) return;
            if (location && !slot.room.toLowerCase().includes(location.toLowerCase())) return;
            
            weeklyStructure[dayName].push({
              ...slot,
              teacherName: timetable.teacherName,
              department: timetable.department,
              teacherId: timetable.teacherId
            });
          });
        }
      });
    });

    // Sort slots by time
    days.forEach(dayName => {
      weeklyStructure[dayName].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json({
      success: true,
      weeklyTimetable: weeklyStructure,
      filters: { staffId, start, end, day, course, location },
      totalTimetables: timetables.length
    });
  } catch (error) {
    console.error('Get weekly timetable error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly timetable' });
  }
});

/**
 * @route GET /api/timetable/availability
 * @desc Get staff availability for specific date/time
 * @access Private (Staff) / Public
 */
router.get('/availability', async (req, res) => {
  try {
    const { staffId, date, durationMinutes = 30 } = req.query;
    
    if (!staffId || !date) {
      return res.status(400).json({ error: 'staffId and date are required' });
    }

    const targetDate = new Date(date);
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getDay()];
    
    // Get staff timetable
    const timetable = await Timetable.findOne({ teacherId: staffId, isActive: true })
      .populate('teacherId', 'name department email');
    
    if (!timetable) {
      return res.status(404).json({ error: 'No timetable found for this staff member' });
    }

    // Get existing appointments
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      staffId: staffId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['Pending', 'Confirmed'] }
    });

    // Find day schedule
    const daySchedule = timetable.schedule.find(s => s.day.toLowerCase() === dayName);
    if (!daySchedule || !daySchedule.timeSlots.length) {
      return res.json({
        success: true,
        staffId,
        staffName: timetable.teacherName,
        date,
        day: dayName,
        available: false,
        message: 'No schedule for this day',
        freeSlots: []
      });
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
          const slotDuration = timetableService.timeToMinutes(endTime) - timetableService.timeToMinutes(startTime);
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

    res.json({
      success: true,
      staffId,
      staffName: timetable.teacherName,
      date,
      day: dayName,
      available: freeSlots.length > 0,
      freeSlots,
      bookedSlots,
      totalSlots: daySchedule.timeSlots.length
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

/**
 * @route PUT /api/timetable
 * @desc Update timetable (for live editing)
 * @access Private (Staff)
 */
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { semester, class: className, section, academic_year, room, timetable: timetableData } = req.body;
    
    // Find existing timetable or create new one
    let timetable = await ClassTimetable.findOne({ 
      semester, 
      class: className, 
      section, 
      academic_year 
    });
    
    if (!timetable) {
      // Create new timetable
      timetable = new ClassTimetable({
        semester,
        class: className,
        section,
        academic_year,
        room,
        timetable: timetableData,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
    } else {
      // Update existing timetable
      timetable.timetable = timetableData;
      timetable.room = room;
      timetable.updatedBy = req.user.id;
      timetable.lastUpdated = new Date();
    }
    
    await timetable.save();
    
    // Emit update to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('timetable_update', {
        semester,
        class: className,
        section,
        academic_year,
        room,
        timetable: timetableData
      });
    }
    
    res.json({
      success: true,
      timetable,
      message: 'Timetable updated successfully'
    });
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({ error: 'Failed to update timetable' });
  }
});

/**
 * @route GET /api/timetable/sections
 * @desc Get all timetable sections
 * @access Private (Staff)
 */
router.get('/sections', async (req, res) => {
  try {
    const sections = await ClassTimetable.find({ isActive: true })
      .select('semester class section academic_year room lastUpdated')
      .sort({ academic_year: -1, semester: 1, class: 1, section: 1 });
    
    res.json({
      success: true,
      sections
    });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

/**
 * @route GET /api/timetable/class/:section
 * @desc Get class timetable by section
 * @access Private (Staff)
 */
router.get('/class/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const { semester, class: className, academic_year } = req.query;
    
    const query = { section, isActive: true };
    if (semester) query.semester = semester;
    if (className) query.class = className;
    if (academic_year) query.academic_year = academic_year;
    
    const timetable = await ClassTimetable.findOne(query);
    
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }
    
    res.json({
      success: true,
      timetable
    });
  } catch (error) {
    console.error('Get class timetable error:', error);
    res.status(500).json({ error: 'Failed to fetch class timetable' });
  }
});

module.exports = router;
