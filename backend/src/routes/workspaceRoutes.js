const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getWorkspaces,
  createFamilyWorkspace,
  inviteMember,
  updateMember,
  removeMember,
  getFamilySummary,
  getMemberPayments,
  addMemberPayment,
} = require('../controllers/workspaceController');

router.use(protect);

router.get('/', getWorkspaces);
router.post('/family', createFamilyWorkspace);

// Family workspace routes (both /family/:workspaceId and /:workspaceId supported for compatibility)
router.get('/family/:workspaceId/summary', getFamilySummary);
router.get('/:workspaceId/summary', getFamilySummary);

router.post('/family/:workspaceId/members', inviteMember);
router.post('/:workspaceId/members', inviteMember);

router.put('/family/:workspaceId/members/:memberId', updateMember);
router.put('/:workspaceId/members/:memberId', updateMember);

router.delete('/family/:workspaceId/members/:memberId', removeMember);
router.delete('/:workspaceId/members/:memberId', removeMember);

router.get('/family/:workspaceId/members/:memberId/payments', getMemberPayments);
router.get('/:workspaceId/members/:memberId/payments', getMemberPayments);

router.post('/family/:workspaceId/members/:memberId/payments', addMemberPayment);
router.post('/:workspaceId/members/:memberId/payments', addMemberPayment);

module.exports = router;
