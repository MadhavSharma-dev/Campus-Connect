const express = require('express');
const router = express.Router();
const {
  getMyTimetable,
  getAllTimetables,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  addSlot,
  updateSlot,
  deleteSlot,
} = require('../controllers/timetableController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

// Student
router.get('/my', getMyTimetable);

// Admin
router.get('/', adminOnly, getAllTimetables);
router.post('/', adminOnly, createTimetable);
router.put('/:id', adminOnly, updateTimetable);
router.delete('/:id', adminOnly, deleteTimetable);
router.post('/:id/slots', adminOnly, addSlot);
router.put('/:id/slots/:slotId', adminOnly, updateSlot);
router.delete('/:id/slots/:slotId', adminOnly, deleteSlot);

module.exports = router;
