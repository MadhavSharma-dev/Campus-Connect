const express = require('express');
const router = express.Router();
const {
  getAll,
  getOne,
  create,
  update,
  remove,
  joinRequest,
  approveRequest,
  rejectRequest,
  leaveClub,
  addAnnouncement,
  deleteAnnouncement,
} = require('../controllers/clubController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', protect, adminOnly, create);
router.put('/:id', protect, adminOnly, update);
router.delete('/:id', protect, adminOnly, remove);

router.post('/:id/join', protect, joinRequest);
router.post('/:id/leave', protect, leaveClub);
router.post('/:id/approve/:userId', protect, adminOnly, approveRequest);
router.post('/:id/reject/:userId', protect, adminOnly, rejectRequest);

router.post('/:id/announcements', protect, adminOnly, addAnnouncement);
router.delete('/:id/announcements/:annId', protect, adminOnly, deleteAnnouncement);

module.exports = router;
