const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const Transaction = require('../models/Transaction');
const fallbackStore = require('../utils/fallbackStore');

const isDbReady = () => mongoose.connection.readyState === 1;

// Get all workspaces (Personal + Families)
const getWorkspaces = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const phone = req.user?.phoneNumber || '';

    if (!isDbReady()) {
      const workspaces = fallbackStore.getWorkspaces(userId, phone);
      return res.status(200).json({ success: true, workspaces, isDbConnected: false });
    }

    // Find workspaces where user is owner or listed in members
    let workspaces = await Workspace.find({
      $or: [
        { owner: userId },
        { 'members.user': userId },
        { 'members.phoneNumber': phone },
      ],
      status: 'active',
    });

    // Ensure user always has a Personal Workspace
    let personalWs = workspaces.find((w) => w.type === 'personal');
    if (!personalWs) {
      personalWs = await Workspace.create({
        name: 'Personal Workspace',
        type: 'personal',
        owner: userId,
        members: [{
          user: userId,
          phoneNumber: phone,
          name: req.user?.name || 'Owner',
          role: 'owner',
          status: 'active',
        }],
      });
      workspaces.unshift(personalWs);
    }

    res.status(200).json({ success: true, workspaces, isDbConnected: true });
  } catch (err) {
    console.error('[Workspace] getWorkspaces error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving workspaces.' });
  }
};

// Create a new Family Workspace
const createFamilyWorkspace = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Family group name is required.' });
    }

    const phone = req.user?.phoneNumber || '';
    const ownerName = req.user?.name || 'Family Head';

    if (!isDbReady()) {
      const ws = fallbackStore.createFamilyWorkspace(userId, {
        name: name.trim(),
        ownerPhone: phone,
        ownerName,
      });
      return res.status(201).json({ success: true, workspace: ws, isDbConnected: false });
    }

    const ws = await Workspace.create({
      name: name.trim(),
      type: 'family',
      owner: userId,
      members: [
        {
          user: userId,
          phoneNumber: phone,
          name: ownerName,
          role: 'owner',
          status: 'active',
        },
      ],
    });

    res.status(201).json({ success: true, workspace: ws, isDbConnected: true });
  } catch (err) {
    console.error('[Workspace] createFamily error:', err);
    res.status(500).json({ success: false, message: 'Error creating family group.' });
  }
};

// Invite a Member to Family Workspace
const inviteMember = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { workspaceId } = req.params;
    const { name, phoneNumber, role } = req.body;

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number is required.' });
    }

    const cleanPhone = phoneNumber.trim().replace(/[^0-9]/g, '').slice(-10);

    if (!isDbReady()) {
      const ws = fallbackStore.inviteMember(workspaceId, userId, {
        name: name ? name.trim() : `Member ${cleanPhone.slice(-4)}`,
        phoneNumber: cleanPhone,
        role: role || 'member',
      });
      return res.status(200).json({ success: true, message: `Invited +91 ${cleanPhone} to family!`, workspace: ws, isDbConnected: false });
    }

    const ws = await Workspace.findOne({ _id: workspaceId, status: 'active' });
    if (!ws) return res.status(404).json({ success: false, message: 'Family workspace not found.' });

    // Check if already in members
    const existing = ws.members.find((m) => m.phoneNumber === cleanPhone);
    if (existing) {
      return res.status(400).json({ success: false, message: 'This mobile number is already in the family group.' });
    }

    ws.members.push({
      phoneNumber: cleanPhone,
      name: name ? name.trim() : `Member ${cleanPhone.slice(-4)}`,
      role: role || 'member',
      status: 'active',
    });

    await ws.save();

    res.status(200).json({
      success: true,
      message: `Successfully added ${name || cleanPhone} to family group!`,
      workspace: ws,
      isDbConnected: true,
    });
  } catch (err) {
    console.error('[Workspace] inviteMember error:', err);
    res.status(500).json({ success: false, message: 'Error adding member.' });
  }
};

// Remove a Member
const removeMember = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { workspaceId, memberId } = req.params;

    if (!isDbReady()) {
      const ws = fallbackStore.removeMember(workspaceId, memberId, userId);
      return res.status(200).json({ success: true, message: 'Member removed from family.', workspace: ws });
    }

    const ws = await Workspace.findOne({ _id: workspaceId, owner: userId });
    if (!ws) return res.status(403).json({ success: false, message: 'Only family owner can remove members.' });

    ws.members = ws.members.filter((m) => String(m._id) !== String(memberId));
    await ws.save();

    res.status(200).json({ success: true, message: 'Member removed.', workspace: ws });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error removing member.' });
  }
};

// Family Dashboard & Financial Summary
const getFamilySummary = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!isDbReady()) {
      const summary = fallbackStore.getFamilySummary(workspaceId);
      return res.status(200).json({ success: true, ...summary, isDbConnected: false });
    }

    const ws = await Workspace.findById(workspaceId);
    if (!ws) return res.status(404).json({ success: false, message: 'Family workspace not found.' });

    const sharedTransactions = await Transaction.find({ workspaceId }).sort({ date: -1 });

    let totalSharedExpense = 0;
    let totalContributions = 0;
    const memberTotals = {};

    ws.members.forEach((m) => {
      memberTotals[m.phoneNumber] = {
        name: m.name || m.phoneNumber,
        phoneNumber: m.phoneNumber,
        role: m.role,
        paid: 0,
        share: 0,
      };
    });

    sharedTransactions.forEach((tx) => {
      if (tx.type === 'debit') {
        totalSharedExpense += tx.amount;
        if (tx.familyPayerId && memberTotals[tx.familyPayerId]) {
          memberTotals[tx.familyPayerId].paid += tx.amount;
        }
      } else if (tx.type === 'credit') {
        totalContributions += tx.amount;
      }
    });

    res.status(200).json({
      success: true,
      workspace: ws,
      totalSharedExpense,
      totalContributions,
      memberBreakdown: Object.values(memberTotals),
      recentTransactions: sharedTransactions.slice(0, 10),
      isDbConnected: true,
    });
  } catch (err) {
    console.error('[Workspace] getFamilySummary error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving family summary.' });
  }
};

module.exports = {
  getWorkspaces,
  createFamilyWorkspace,
  inviteMember,
  removeMember,
  getFamilySummary,
};

