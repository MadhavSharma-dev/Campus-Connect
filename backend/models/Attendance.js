const mongoose = require('mongoose');

// Each session is one occurrence of a timetable slot on a specific date
const sessionLogSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },       // "YYYY-MM-DD"
    slotId: { type: String, required: true },     // timetable slot _id (stringified)
    subject: { type: String, required: true },
    subjectCode: { type: String, default: '' },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    faculty: { type: String, default: '' },
    type: { type: String, default: 'lecture' },
    status: {
      type: String,
      enum: ['present', 'absent', 'cancelled', 'holiday'],
      default: 'absent',
    },
    markedAt: { type: Date, default: null },
  },
  { _id: false }
);

// Per-subject aggregated stats (updated on every mark)
const subjectStatSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    subjectCode: { type: String, default: '' },
    totalClasses: { type: Number, default: 0 },
    attended: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    timetable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      default: null,
    },
    sessions: [sessionLogSchema],
    subjectStats: [subjectStatSchema],
  },
  { timestamps: true }
);

// Recompute subjectStats from sessions
attendanceSchema.methods.recomputeStats = function () {
  const map = {};
  for (const s of this.sessions) {
    if (s.status === 'holiday') continue;
    if (!map[s.subject]) {
      map[s.subject] = { subject: s.subject, subjectCode: s.subjectCode, totalClasses: 0, attended: 0, cancelled: 0 };
    }
    if (s.status === 'cancelled') {
      map[s.subject].cancelled += 1;
    } else {
      map[s.subject].totalClasses += 1;
      if (s.status === 'present') map[s.subject].attended += 1;
    }
  }
  this.subjectStats = Object.values(map);
};

module.exports = mongoose.model('Attendance', attendanceSchema);
