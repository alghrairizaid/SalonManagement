const db = require('../config/database');

// إضافة ثوابت للتحقق
const WORKING_HOURS = {
  START: 9,
  END: 19,
  TIME_SLOT_DURATION: 30
};

// وظائف مساعدة للتحقق من التواريخ والأوقات
const helpers = {
  isValidWorkingHours(date) {
    const hour = date.getHours();
    return hour >= WORKING_HOURS.START && hour < WORKING_HOURS.END;
  },

  formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  },

  isTimeSlotAvailable(startTime, duration, existingAppointments) {
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    return !existingAppointments.some(appointment => {
      const appointmentEnd = new Date(appointment.appointment_date.getTime() + appointment.duration * 60000);
      return (
        (startTime >= appointment.appointment_date && startTime < appointmentEnd) ||
        (endTime > appointment.appointment_date && endTime <= appointmentEnd) ||
        (startTime <= appointment.appointment_date && endTime >= appointmentEnd)
      );
    });
  },

  generateTimeSlots(date) {
    const slots = [];
    for (let hour = WORKING_HOURS.START; hour < WORKING_HOURS.END; hour++) {
      for (let minute = 0; minute < 60; minute += WORKING_HOURS.TIME_SLOT_DURATION) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);
        slots.push(slotDate);
      }
    }
    return slots;
  }
};

class Appointment {
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          a.*,
          c.name as client_name, c.email as client_email, c.phone as client_phone,
          m.name as manicurist_name,
          s.name as service_name, s.price as service_price, s.duration as service_duration
        FROM appointments a
        JOIN users c ON a.client_id = c.id
        JOIN users m ON a.manicurist_id = m.id
        JOIN services s ON a.service_id = s.id
        WHERE a.id = ?
      `, [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          a.*,
          c.name as client_name,
          m.name as manicurist_name,
          s.name as service_name, s.price as service_price
        FROM appointments a
        JOIN users c ON a.client_id = c.id
        JOIN users m ON a.manicurist_id = m.id
        JOIN services s ON a.service_id = s.id
        ORDER BY a.appointment_date DESC
      `, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  static getByClient(clientId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          a.*,
          m.name as manicurist_name,
          s.name as service_name, s.price as service_price
        FROM appointments a
        JOIN users m ON a.manicurist_id = m.id
        JOIN services s ON a.service_id = s.id
        WHERE a.client_id = ?
        ORDER BY a.appointment_date DESC
      `, [clientId], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  static getByManicurist(manicuristId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          a.*,
          c.name as client_name, c.phone as client_phone,
          s.name as service_name, s.duration as service_duration
        FROM appointments a
        JOIN users c ON a.client_id = c.id
        JOIN services s ON a.service_id = s.id
        WHERE a.manicurist_id = ?
        ORDER BY a.appointment_date DESC
      `, [manicuristId], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  static getUpcoming() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          a.*,
          c.name as client_name,
          m.name as manicurist_name,
          s.name as service_name
        FROM appointments a
        JOIN users c ON a.client_id = c.id
        JOIN users m ON a.manicurist_id = m.id
        JOIN services s ON a.service_id = s.id
        WHERE a.appointment_date >= datetime('now')
        ORDER BY a.appointment_date ASC
      `, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  static async create(appointmentData) {
    try {
      // التحقق من البيانات الأساسية
      if (!appointmentData.appointment_date || !appointmentData.manicurist_id || !appointmentData.service_id) {
        throw new Error('All fields are required: appointment date, manicurist ID, service ID');
      }

      const appointmentDate = new Date(appointmentData.appointment_date);
      const now = new Date();

      // التحقق من صحة التاريخ
      if (appointmentDate < now) {
        throw new Error('Cannot book an appointment in the past');
      }

      // التحقق من ساعات العمل
      if (!helpers.isValidWorkingHours(appointmentDate)) {
        throw new Error(`Working hours are from ${WORKING_HOURS.START} AM to ${WORKING_HOURS.END} PM`);
      }

      // التحقق من توفر المصمم والخدمة في نفس الوقت
      const [manicurist, service] = await Promise.all([
        this.checkManicuristAvailability(appointmentData.manicurist_id),
        this.checkServiceAvailability(appointmentData.service_id)
      ]);

      if (!manicurist) {
        throw new Error('Manicurist not found or unavailable');
      }

      if (!service) {
        throw new Error('Service not found');
      }

      // التحقق من تداخل المواعيد
      const conflict = await this.checkTimeSlotConflict(
        appointmentData.manicurist_id,
        appointmentDate,
        service.duration
      );

      if (conflict) {
        const conflictDate = new Date(conflict.appointment_date);
        const conflictEnd = new Date(conflictDate.getTime() + conflict.duration * 60000);
        throw new Error(
          `This time is not available. There is another appointment for "${conflict.service_name}" ` +
          `from ${helpers.formatTime(conflictDate)} to ${helpers.formatTime(conflictEnd)}`
        );
      }

      // تحقق إضافي: هل هذا الوقت محجوز بالفعل؟
      const isBooked = await this.isTimeSlotBooked(
        appointmentData.manicurist_id,
        appointmentDate
      );
      if (isBooked) {
        throw new Error('This time slot is already booked. Please choose another time.');
      }

      // إنشاء الموعد
      const result = await this.insertAppointment(appointmentData);
      return result;

    } catch (error) {
      throw error;
    }
  }

  static checkManicuristAvailability(manicuristId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE id = ? AND role = "manicurist"',
        [manicuristId],
        (err, manicurist) => {
          if (err) reject(err);
          resolve(manicurist);
        }
      );
    });
  }

  static checkServiceAvailability(serviceId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, duration, price FROM services WHERE id = ?',
        [serviceId],
        (err, service) => {
          if (err) reject(err);
          resolve(service);
        }
      );
    });
  }

  static checkTimeSlotConflict(manicuristId, appointmentDate, duration) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          a.id,
          a.appointment_date,
          s.duration,
          s.name as service_name
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.manicurist_id = ? 
        AND a.status != 'cancelled'
        AND (
          (a.appointment_date <= datetime(?, '+' || ? || ' minutes')
          AND datetime(a.appointment_date, '+' || s.duration || ' minutes') >= ?)
          OR
          (datetime(?, '+' || ? || ' minutes') >= a.appointment_date
          AND ? <= datetime(a.appointment_date, '+' || s.duration || ' minutes'))
        )
      `, [
        manicuristId,
        appointmentDate.toISOString(),
        duration,
        appointmentDate.toISOString(),
        appointmentDate.toISOString(),
        duration,
        appointmentDate.toISOString()
      ], (err, conflict) => {
        if (err) reject(err);
        resolve(conflict);
      });
    });
  }

  static insertAppointment(appointmentData) {
    return new Promise((resolve, reject) => {
      // Validate required fields
      if (!appointmentData.client_id || !appointmentData.manicurist_id || !appointmentData.service_id || !appointmentData.appointment_date) {
        return reject(new Error('Missing required fields: client_id, manicurist_id, service_id, and appointment_date are required'));
      }

      // Format the appointment date to ensure it's in the correct format
      const appointmentDate = new Date(appointmentData.appointment_date);
      if (isNaN(appointmentDate.getTime())) {
        return reject(new Error('Invalid appointment date format'));
      }

      db.run(
        `INSERT INTO appointments (
          client_id, manicurist_id, service_id, 
          appointment_date, status, notes, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          appointmentData.client_id,
          appointmentData.manicurist_id,
          appointmentData.service_id,
          appointmentDate.toISOString(),
          appointmentData.status || 'pending',
          appointmentData.notes || null
        ],
        function(err) {
          if (err) {
            console.error('Database error:', err);
            reject(new Error(`Database error: ${err.message}`));
          } else {
            resolve({ id: this.lastID, ...appointmentData });
          }
        }
      );
    });
  }

  static update(id, appointmentData) {
    return new Promise((resolve, reject) => {
      let query = 'UPDATE appointments SET ';
      const values = [];
      const fields = [];

      if (appointmentData.status) {
        fields.push('status = ?');
        values.push(appointmentData.status);
      }

      if (appointmentData.notes !== undefined) {
        fields.push('notes = ?');
        values.push(appointmentData.notes);
      }

      if (appointmentData.appointment_date) {
        fields.push('appointment_date = ?');
        values.push(appointmentData.appointment_date);
      }

      if (appointmentData.service_id) {
        fields.push('service_id = ?');
        values.push(appointmentData.service_id);
      }

      if (appointmentData.manicurist_id) {
        fields.push('manicurist_id = ?');
        values.push(appointmentData.manicurist_id);
      }

      if (fields.length === 0) {
        return resolve(null);
      }

      query += fields.join(', ') + ' WHERE id = ?';
      values.push(id);

      db.run(query, values, function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ id, ...appointmentData });
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM appointments WHERE id = ?", [id], function(err) {
        if (err) {
          return reject(err);
        }
        resolve(this.changes > 0);
      });
    });
  }

  static getAvailableTimeSlots(manicuristId, date) {
    return new Promise((resolve, reject) => {
      // Get all appointments for the manicurist on the given date
      const startOfDay = `${date} 00:00:00`;
      const endOfDay = `${date} 23:59:59`;
      
      db.all(`
        SELECT 
          a.appointment_date,
          s.duration,
          c.name as client_name
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        JOIN users c ON a.client_id = c.id
        WHERE a.manicurist_id = ?
        AND a.appointment_date BETWEEN ? AND ?
        AND a.status != 'cancelled'
        ORDER BY a.appointment_date
      `, [manicuristId, startOfDay, endOfDay], (err, appointments) => {
        if (err) {
          return reject(err);
        }
        
        // Generate time slots for the working hours
        const timeSlots = [];
        const startHour = WORKING_HOURS.START;
        const endHour = WORKING_HOURS.END;
        const slotDuration = WORKING_HOURS.TIME_SLOT_DURATION;
        
        // Generate all possible time slots
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += slotDuration) {
            // Always use ISO format for date string
            const slotTimeString = `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00.000Z`;
            const slotTime = new Date(slotTimeString);
            timeSlots.push(slotTime);
          }
        }
        
        // Filter out booked slots
        const availableSlots = timeSlots.filter(slotTime => {
          return !appointments.some(appointment => {
            const appointmentStart = new Date(appointment.appointment_date);
            const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);
            const slotEnd = new Date(slotTime.getTime() + slotDuration * 60000);
            
            // Check if the slot overlaps with any appointment
            return (
              (slotTime >= appointmentStart && slotTime < appointmentEnd) ||
              (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
              (slotTime <= appointmentStart && slotEnd >= appointmentEnd)
            );
          });
        });
        
        // Format the available slots
        const formattedSlots = availableSlots.map(slot => ({
          time: helpers.formatTime(slot),
          datetime: slot.toISOString()
        }));
        
        resolve(formattedSlots);
      });
    });
  }

  // دالة تتحقق إذا كان الوقت محجوز مسبقاً (بدقة الدقيقة)
  static async isTimeSlotBooked(manicuristId, appointmentDate) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM appointments
         WHERE manicurist_id = ?
           AND status != 'cancelled'
           AND strftime('%Y-%m-%d %H:%M', appointment_date) = strftime('%Y-%m-%d %H:%M', ?)
        `,
        [manicuristId, appointmentDate.toISOString()],
        (err, row) => {
          if (err) return reject(err);
          resolve(!!row);
        }
      );
    });
  }
}

module.exports = Appointment;
