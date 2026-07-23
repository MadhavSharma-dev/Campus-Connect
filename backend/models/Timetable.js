const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true,
  },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "10:00"
  subject: { type: String, required: true, trim: true },
  subjectCode: { type: String, default: '', trim: true },
  faculty: { type: String, default: '', trim: true },
  room: { type: String, default: '', trim: true },
  type: { type: String, enum: ['lecture', 'lab', 'tutorial'], default: 'lecture' },
});

const timetableSchema = new mongoose.Schema(
  {
    semester: { type: Number, required: true, min: 1, max: 8 },
    branch: { type: String, required: true, trim: true },
    academicYear: { type: String, default: '' },
    slots: [slotSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

timetableSchema.index({ semester: 1, branch: 1 }, { unique: false });

module.exports = mongoose.model('Timetable', timetableSchema);
