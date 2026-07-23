const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get or create attendance record for user
const getOrCreate = async (userId) => {
  let record = await Attendance.findOne({ user: userId });
  if (!record) record = await Attendance.create({ user: userId, sessions: [], subjectStats: [] });
  return record;
};

// Generate session key (unique per slot per date)
const sessionKey = (date, slotId) => `${date}__${slotId}`;

// @GET /api/attendance — get full attendance record with timetable context
exports.getRecord = async (req, res) => {
  try {
    const user = req.user;
    const record = await getOrCreate(user._id);

    const timetable = await Timetable.findOne({
      semester: user.semester,
      branch: user.branch,
      isActive: true,
    }).sort('-updatedAt');

    // Sync timetable reference
    if (timetable && (!record.timetable || record.timetable.toString() !== timetable._id.toString())) {
      record.timetable = timetable._id;
      await record.save();
    }

    res.json({
      success: true,
      data: record,
      timetable: timetable || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/attendance/today — get today's schedule with attendance status
exports.getTodaySchedule = async (req, res) => {
  try {
    const user = req.user;
    const timetable = await Timetable.findOne({
      semester: user.semester,
      branch: user.branch,
      isActive: true,
    }).sort('-updatedAt');

    if (!timetable) return res.json({ success: true, data: [], date: getTodayStr(), day: getTodayDay() });

    const today = getTodayStr();
    const dayName = getTodayDay();

    const todaySlots = timetable.slots.filter((s) => s.day === dayName);
    const record = await getOrCreate(user._id);

    const schedule = todaySlots
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((slot) => {
        const existing = record.sessions.find(
          (s) => s.date === today && s.slotId === slot._id.toString()
        );
        return {
          slotId: slot._id,
          subject: slot.subject,
          subjectCode: slot.subjectCode,
          startTime: slot.startTime,
          endTime: slot.endTime,
          faculty: slot.faculty,
          room: slot.room,
          type: slot.type,
          status: existing ? existing.status : null, // null = not marked yet
          markedAt: existing ? existing.markedAt : null,
        };
      });

    res.json({ success: true, data: schedule, date: today, day: dayName });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/attendance/mark — mark a session present/absent/cancelled/holiday
exports.markSession = async (req, res) => {
  try {
    const { date, slotId, status, subject, subjectCode, startTime, endTime, faculty, type } = req.body;

    if (!date || !slotId || !status)
      return res.status(400).json({ success: false, message: 'date, slotId, and status are required' });

    const validStatuses = ['present', 'absent', 'cancelled', 'holiday'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}` });

    const record = await getOrCreate(req.user._id);

    const existing = record.sessions.find(
      (s) => s.date === date && s.slotId === slotId.toString()
    );

    if (existing) {
      existing.status = status;
      existing.markedAt = new Date();
    } else {
      record.sessions.push({
        date,
        slotId: slotId.toString(),
        subject: subject || 'Unknown',
        subjectCode: subjectCode || '',
        startTime: startTime || '',
        endTime: endTime || '',
        faculty: faculty || '',
        type: type || 'lecture',
        status,
        markedAt: new Date(),
      });
    }

    record.recomputeStats();
    await record.save();

    res.json({ success: true, data: { sessions: record.sessions, subjectStats: record.subjectStats } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/attendance/stats — get subject-wise stats
exports.getStats = async (req, res) => {
  try {
    const record = await getOrCreate(req.user._id);
    res.json({ success: true, data: record.subjectStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/attendance/calendar?month=2024-08 — get sessions for a month
exports.getCalendar = async (req, res) => {
  try {
    const { month } = req.query; // "YYYY-MM"
    const record = await getOrCreate(req.user._id);

    let sessions = record.sessions;
    if (month) {
      sessions = sessions.filter((s) => s.date.startsWith(month));
    }

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/attendance/session — remove a specific session mark
exports.deleteSession = async (req, res) => {
  try {
    const { date, slotId } = req.body;
    const record = await getOrCreate(req.user._id);

    const before = record.sessions.length;
    record.sessions = record.sessions.filter(
      (s) => !(s.date === date && s.slotId === slotId.toString())
    );

    if (record.sessions.length === before)
      return res.status(404).json({ success: false, message: 'Session not found' });

    record.recomputeStats();
    await record.save();
    res.json({ success: true, data: { sessions: record.sessions, subjectStats: record.subjectStats } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helpers
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}
function getTodayDay() {
  return DAY_NAMES[new Date().getDay()];
}
