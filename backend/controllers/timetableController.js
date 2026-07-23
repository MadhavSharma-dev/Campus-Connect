const Timetable = require('../models/Timetable');

// @GET /api/timetable/my — get timetable for logged-in student (by semester+branch)
exports.getMyTimetable = async (req, res) => {
  try {
    const { semester, branch } = req.user;
    const timetable = await Timetable.findOne({ semester, branch, isActive: true }).sort('-updatedAt');
    res.json({ success: true, data: timetable || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/timetable/all — admin: list all timetables
exports.getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find().sort('-createdAt');
    res.json({ success: true, data: timetables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/timetable — admin: create timetable
exports.createTimetable = async (req, res) => {
  try {
    const { semester, branch, academicYear, slots, isActive } = req.body;
    if (!semester || !branch)
      return res.status(400).json({ success: false, message: 'semester and branch are required' });
    const timetable = await Timetable.create({
      semester,
      branch,
      academicYear: academicYear || '',
      slots: slots || [],
      isActive: isActive !== undefined ? isActive : true,
    });
    res.status(201).json({ success: true, data: timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/timetable/:id — admin: update timetable
exports.updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!timetable)
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/timetable/:id — admin: delete
exports.deleteTimetable = async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Timetable deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/timetable/:id/slots — admin: add a slot
exports.addSlot = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    timetable.slots.push(req.body);
    await timetable.save();
    res.json({ success: true, data: timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/timetable/:id/slots/:slotId — admin: update a slot
exports.updateSlot = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    const slot = timetable.slots.id(req.params.slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    Object.assign(slot, req.body);
    await timetable.save();
    res.json({ success: true, data: timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/timetable/:id/slots/:slotId — admin: delete a slot
exports.deleteSlot = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    timetable.slots = timetable.slots.filter((s) => s._id.toString() !== req.params.slotId);
    await timetable.save();
    res.json({ success: true, data: timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
