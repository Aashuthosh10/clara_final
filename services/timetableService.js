const Timetable = require('../models/Timetable');
const User = require('../models/User');

class TimetableService {
  constructor() {
    this.days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  }

  /**
   * Create or update a teacher's timetable
   */
  async updateTimetable(teacherId, timetableData) {
    try {
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'staff') {
        throw new Error('Invalid teacher ID or user is not staff');
      }

      // Validate timetable data
      this.validateTimetableData(timetableData);

      // Check if timetable already exists
      let timetable = await Timetable.findOne({
        teacherId,
        academicYear: timetableData.academicYear || '2024-25',
        semester: timetableData.semester || '1'
      });

      if (timetable) {
        // Update existing timetable
        timetable.schedule = timetableData.schedule || [];
        timetable.officeHours = timetableData.officeHours || [];
        timetable.lastUpdated = new Date();
      } else {
        // Create new timetable
        timetable = new Timetable({
          teacherId,
          teacherName: teacher.name,
          department: teacher.department,
          schedule: timetableData.schedule || [],
          officeHours: timetableData.officeHours || [],
          academicYear: timetableData.academicYear || '2024-25',
          semester: timetableData.semester || '1'
        });
      }

      await timetable.save();
      return timetable;
    } catch (error) {
      throw new Error(`Failed to update timetable: ${error.message}`);
    }
  }

  /**
   * Get teacher's current availability status
   */
  async getTeacherAvailability(teacherName) {
    try {
      const teacher = await User.findOne({
        name: { $regex: new RegExp(teacherName, 'i') },
        role: 'staff'
      });

      if (!teacher) {
        return { error: 'Teacher not found' };
      }

      const timetable = await Timetable.findOne({
        teacherId: teacher._id,
        isActive: true
      }).sort({ lastUpdated: -1 });

      if (!timetable) {
        return { error: 'No timetable found for this teacher' };
      }

      const currentStatus = timetable.getCurrentStatus();
      return {
        teacherName: teacher.name,
        department: teacher.department,
        currentStatus,
        lastUpdated: timetable.lastUpdated
      };
    } catch (error) {
      throw new Error(`Failed to get teacher availability: ${error.message}`);
    }
  }

  /**
   * Get teacher's full schedule for a specific day
   */
  async getTeacherSchedule(teacherName, day) {
    try {
      const teacher = await User.findOne({
        name: { $regex: new RegExp(teacherName, 'i') },
        role: 'staff'
      });

      if (!teacher) {
        return { error: 'Teacher not found' };
      }

      const timetable = await Timetable.findOne({
        teacherId: teacher._id,
        isActive: true
      }).sort({ lastUpdated: -1 });

      if (!timetable) {
        return { error: 'No timetable found for this teacher' };
      }

      const daySchedule = timetable.schedule.find(s => 
        s.day.toLowerCase() === day.toLowerCase()
      );

      if (!daySchedule) {
        return {
          teacherName: teacher.name,
          department: teacher.department,
          day: day,
          message: 'No classes scheduled for this day',
          schedule: []
        };
      }

      return {
        teacherName: teacher.name,
        department: teacher.department,
        day: day,
        schedule: daySchedule.timeSlots,
        officeHours: timetable.officeHours.filter(oh => 
          oh.day.toLowerCase() === day.toLowerCase()
        )
      };
    } catch (error) {
      throw new Error(`Failed to get teacher schedule: ${error.message}`);
    }
  }

  /**
   * Get all teachers in a department
   */
  async getDepartmentTeachers(department) {
    try {
      const teachers = await User.find({
        role: 'staff',
        department: { $regex: new RegExp(department, 'i') }
      }).select('name department email');

      const teachersWithTimetables = await Promise.all(
        teachers.map(async (teacher) => {
          const timetable = await Timetable.findOne({
            teacherId: teacher._id,
            isActive: true
          }).sort({ lastUpdated: -1 });

          return {
            ...teacher.toObject(),
            hasTimetable: !!timetable,
            lastTimetableUpdate: timetable ? timetable.lastUpdated : null
          };
        })
      );

      return teachersWithTimetables;
    } catch (error) {
      throw new Error(`Failed to get department teachers: ${error.message}`);
    }
  }

  /**
   * Search for available teachers at a specific time
   */
  async findAvailableTeachers(day, time) {
    try {
      const timetables = await Timetable.find({
        isActive: true
      }).populate('teacherId', 'name department email');

      const availableTeachers = [];

      for (const timetable of timetables) {
        if (timetable.isAvailableAt(day, time)) {
          availableTeachers.push({
            name: timetable.teacherName,
            department: timetable.department,
            email: timetable.teacherId.email
          });
        }
      }

      return availableTeachers;
    } catch (error) {
      throw new Error(`Failed to find available teachers: ${error.message}`);
    }
  }

  /**
   * Get room availability for a specific time
   */
  async getRoomAvailability(day, time) {
    try {
      const timetables = await Timetable.find({
        isActive: true
      });

      const roomUsage = new Map();

      for (const timetable of timetables) {
        const daySchedule = timetable.schedule.find(s => 
          s.day.toLowerCase() === day.toLowerCase()
        );

        if (daySchedule) {
          for (const slot of daySchedule.timeSlots) {
            const startMinutes = this.timeToMinutes(slot.startTime);
            const endMinutes = this.timeToMinutes(slot.endTime);
            const timeInMinutes = this.timeToMinutes(time);

            if (timeInMinutes >= startMinutes && timeInMinutes < endMinutes) {
              // Room is occupied
              if (!roomUsage.has(slot.room)) {
                roomUsage.set(slot.room, []);
              }
              roomUsage.get(slot.room).push({
                subject: slot.subject,
                teacher: timetable.teacherName,
                class: slot.class,
                time: `${slot.startTime}-${slot.endTime}`
              });
            }
          }
        }
      }

      return Array.from(roomUsage.entries()).map(([room, usage]) => ({
        room,
        status: 'occupied',
        usage
      }));
    } catch (error) {
      throw new Error(`Failed to get room availability: ${error.message}`);
    }
  }

  /**
   * Validate timetable data structure
   */
  validateTimetableData(data) {
    if (!data.schedule || !Array.isArray(data.schedule)) {
      throw new Error('Schedule must be an array');
    }

    for (const daySchedule of data.schedule) {
      if (!this.days.includes(daySchedule.day.toLowerCase())) {
        throw new Error(`Invalid day: ${daySchedule.day}`);
      }

      if (!daySchedule.timeSlots || !Array.isArray(daySchedule.timeSlots)) {
        throw new Error(`Time slots must be an array for ${daySchedule.day}`);
      }

      for (const slot of daySchedule.timeSlots) {
        if (!slot.startTime || !slot.endTime || !slot.subject || !slot.room || !slot.class) {
          throw new Error(`Missing required fields in time slot for ${daySchedule.day}`);
        }

        // Validate time format
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.startTime) ||
            !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.endTime)) {
          throw new Error(`Invalid time format in ${daySchedule.day}`);
        }

        // Validate time logic
        const startMinutes = this.timeToMinutes(slot.startTime);
        const endMinutes = this.timeToMinutes(slot.endTime);
        if (startMinutes >= endMinutes) {
          throw new Error(`Start time must be before end time in ${daySchedule.day}`);
        }
      }
    }
  }

  /**
   * Helper method to convert time to minutes
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get current academic information
   */
  getCurrentAcademicInfo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    let academicYear, semester;
    
    if (month >= 6 && month <= 12) {
      academicYear = `${year}-${year + 1}`;
      semester = '1';
    } else {
      academicYear = `${year - 1}-${year}`;
      semester = '2';
    }
    
    return { academicYear, semester };
  }
}

module.exports = TimetableService;
