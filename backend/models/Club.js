const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    tagline: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Technical', 'Cultural', 'Sports', 'Social', 'Academic', 'General'],
      default: 'General',
    },
    logo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    email: { type: String, default: '' },
    instagram: { type: String, default: '' },
    website: { type: String, default: '' },
    coordinator: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    announcements: [announcementSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Virtual for member count
clubSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

module.exports = mongoose.model('Club', clubSchema);
