const express = require('express');
const router = express.Router();
const {
  getRecord,
  getTodaySchedule,
  markSession,
  getStats,
  getCalendar,
  deleteSession,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getRecord);
router.get('/today', getTodaySchedule);
router.get('/stats', getStats);
router.get('/calendar', getCalendar);
router.post('/mark', markSession);
router.delete('/session', deleteSession);

module.exports = router;
