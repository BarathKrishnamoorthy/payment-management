const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getWorkspaces,
  createFamilyWorkspace,
  inviteMember,
  removeMember,
  getFamilySummary,
} = require('../controllers/workspaceController');

router.use(protect);

router.get('/', getWorkspaces);
router.post('/family', createFamilyWorkspace);
router.get('/family/:workspaceId/summary', getFamilySummary);
router.post('/family/:workspaceId/members', inviteMember);
router.delete('/family/:workspaceId/members/:memberId', removeMember);

module.exports = router;

