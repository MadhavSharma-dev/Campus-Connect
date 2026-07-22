const Club = require('../models/Club');

// @GET /api/clubs
exports.getAll = async (req, res) => {
  try {
    const { category, search, active } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tagline: { $regex: search, $options: 'i' } },
    ];
    if (active !== undefined) query.isActive = active === 'true';

    const clubs = await Club.find(query)
      .populate('members', 'name')
      .populate('joinRequests', 'name email')
      .sort('name');

    res.json({ success: true, data: clubs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/clubs/:id
exports.getOne = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('members', 'name email')
      .populate('joinRequests', 'name email')
      .populate('announcements.postedBy', 'name');
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    res.json({ success: true, data: club });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/clubs (admin)
exports.create = async (req, res) => {
  try {
    const club = await Club.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: club });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @PUT /api/clubs/:id (admin)
exports.update = async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    res.json({ success: true, data: club });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @DELETE /api/clubs/:id (admin)
exports.remove = async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    res.json({ success: true, message: 'Club deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/clubs/:id/join
exports.joinRequest = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    if (!club.isActive) return res.status(400).json({ success: false, message: 'Club is not accepting members' });

    const uid = req.user._id.toString();
    if (club.members.map(m => m.toString()).includes(uid))
      return res.status(400).json({ success: false, message: 'Already a member' });
    if (club.joinRequests.map(r => r.toString()).includes(uid))
      return res.status(400).json({ success: false, message: 'Request already pending' });

    club.joinRequests.push(req.user._id);
    await club.save();
    res.json({ success: true, message: 'Join request sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/clubs/:id/approve/:userId (admin)
exports.approveRequest = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    club.joinRequests = club.joinRequests.filter((u) => u.toString() !== req.params.userId);
    if (!club.members.map(m => m.toString()).includes(req.params.userId))
      club.members.push(req.params.userId);
    await club.save();
    res.json({ success: true, message: 'Member approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/clubs/:id/reject/:userId (admin)
exports.rejectRequest = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    club.joinRequests = club.joinRequests.filter((u) => u.toString() !== req.params.userId);
    await club.save();
    res.json({ success: true, message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/clubs/:id/leave (user)
exports.leaveClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    const uid = req.user._id.toString();
    if (!club.members.map(m => m.toString()).includes(uid))
      return res.status(400).json({ success: false, message: 'Not a member' });
    club.members = club.members.filter((m) => m.toString() !== uid);
    await club.save();
    res.json({ success: true, message: 'Left club successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/clubs/:id/announcements (admin)
exports.addAnnouncement = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    club.announcements.unshift({ text, postedBy: req.user._id });
    await club.save();
    await club.populate('announcements.postedBy', 'name');
    res.json({ success: true, data: club.announcements[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/clubs/:id/announcements/:annId (admin)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    club.announcements = club.announcements.filter(
      (a) => a._id.toString() !== req.params.annId
    );
    await club.save();
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
