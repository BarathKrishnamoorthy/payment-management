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
          relationship: 'Head of Family',
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

// Invite / Add a Member to Family Workspace
const inviteMember = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { workspaceId } = req.params;
    const { name, phoneNumber, role, relationship, email, monthlyBudget, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Member name is required.' });
    }

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number is required.' });
    }

    const cleanPhone = phoneNumber.trim().replace(/[^0-9]/g, '').slice(-10);

    if (!isDbReady()) {
      const ws = fallbackStore.inviteMember(workspaceId, userId, {
        name: name.trim(),
        phoneNumber: cleanPhone,
        role: role || 'member',
        relationship: relationship || 'Family Member',
        email: email ? email.trim() : '',
        monthlyBudget: Number(monthlyBudget) || 0,
        notes: notes ? notes.trim() : '',
      });
      if (!ws) {
        return res.status(400).json({ success: false, message: 'Family group not found or duplicate member.' });
      }
      return res.status(200).json({
        success: true,
        message: `Successfully added ${name.trim()} to family group!`,
        workspace: ws,
        isDbConnected: false,
      });
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
      name: name.trim(),
      role: role || 'member',
      relationship: relationship ? relationship.trim() : 'Family Member',
      email: email ? email.trim() : '',
      monthlyBudget: Number(monthlyBudget) || 0,
      notes: notes ? notes.trim() : '',
      status: 'active',
    });

    await ws.save();

    res.status(200).json({
      success: true,
      message: `Successfully added ${name.trim()} to family group!`,
      workspace: ws,
      isDbConnected: true,
    });
  } catch (err) {
    console.error('[Workspace] inviteMember error:', err);
    res.status(500).json({ success: false, message: 'Error adding member: ' + err.message });
  }
};

// Update an existing Family Member
const updateMember = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { workspaceId, memberId } = req.params;
    const { name, phoneNumber, role, relationship, email, monthlyBudget, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Member name is required.' });
    }

    if (!isDbReady()) {
      const ws = fallbackStore.updateMember(workspaceId, memberId, userId, req.body);
      if (!ws) return res.status(404).json({ success: false, message: 'Member or workspace not found.' });
      return res.status(200).json({ success: true, message: 'Member details updated successfully!', workspace: ws });
    }

    const ws = await Workspace.findOne({ _id: workspaceId, status: 'active' });
    if (!ws) return res.status(404).json({ success: false, message: 'Family workspace not found.' });

    const member = ws.members.id(memberId) || ws.members.find(m => String(m._id) === String(memberId));
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone.length < 10) {
        return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number.' });
      }
      const duplicate = ws.members.find(m => String(m._id) !== String(memberId) && m.phoneNumber === cleanPhone);
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Another member with this mobile number already exists.' });
      }
      member.phoneNumber = cleanPhone;
    }

    member.name = name.trim();
    if (role && ['owner', 'admin', 'member', 'viewer'].includes(role) && member.role !== 'owner') {
      member.role = role;
    }
    if (relationship !== undefined) member.relationship = relationship.trim();
    if (email !== undefined) member.email = email.trim();
    if (monthlyBudget !== undefined) member.monthlyBudget = Number(monthlyBudget) || 0;
    if (notes !== undefined) member.notes = notes.trim();

    await ws.save();

    res.status(200).json({
      success: true,
      message: 'Member details updated successfully!',
      workspace: ws,
      isDbConnected: true,
    });
  } catch (err) {
    console.error('[Workspace] updateMember error:', err);
    res.status(500).json({ success: false, message: 'Error updating member: ' + err.message });
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

    const memberToRemove = ws.members.id(memberId) || ws.members.find(m => String(m._id) === String(memberId));
    if (memberToRemove && memberToRemove.role === 'owner') {
      return res.status(400).json({ success: false, message: 'Cannot remove the family owner.' });
    }

    ws.members = ws.members.filter((m) => String(m._id) !== String(memberId));
    await ws.save();

    res.status(200).json({ success: true, message: 'Member removed successfully.', workspace: ws });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error removing member: ' + err.message });
  }
};

// Get Member Payment History
const getMemberPayments = async (req, res) => {
  try {
    const { workspaceId, memberId } = req.params;

    if (!isDbReady()) {
      const result = fallbackStore.getMemberPayments(workspaceId, memberId);
      return res.status(200).json({ success: true, ...result, isDbConnected: false });
    }

    const ws = await Workspace.findById(workspaceId);
    if (!ws) return res.status(404).json({ success: false, message: 'Family workspace not found.' });

    const member = ws.members.id(memberId) || ws.members.find(m => String(m._id) === String(memberId));
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

    const payments = await Transaction.find({
      workspaceId: String(workspaceId),
      $or: [
        { familyMemberId: String(memberId) },
        { familyPayerId: member.phoneNumber },
      ],
    }).sort({ date: -1 });

    const totalPaid = payments.filter(p => p.type === 'debit').reduce((sum, p) => sum + p.amount, 0);
    const totalContributed = payments.filter(p => p.type === 'credit').reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      member,
      payments,
      totalPaid,
      totalContributed,
      count: payments.length,
      isDbConnected: true,
    });
  } catch (err) {
    console.error('[Workspace] getMemberPayments error:', err);
    res.status(500).json({ success: false, message: 'Error fetching member payments.' });
  }
};

// Add / Associate Payment with Family Member
const addMemberPayment = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user-id';
    const { workspaceId, memberId } = req.params;
    const { amount, type = 'debit', category = 'Family Expense', date, reason, referenceNumber } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount is required.' });
    }

    if (!isDbReady()) {
      const tx = fallbackStore.addMemberPayment(userId, workspaceId, memberId, req.body);
      return res.status(201).json({
        success: true,
        payment: tx,
        message: `Recorded ₹${numAmount} for family member!`,
        isDbConnected: false,
      });
    }

    const ws = await Workspace.findById(workspaceId);
    if (!ws) return res.status(404).json({ success: false, message: 'Family workspace not found.' });

    const member = ws.members.id(memberId) || ws.members.find(m => String(m._id) === String(memberId));
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

    const transaction = await Transaction.create({
      user: userId,
      workspaceId: String(workspaceId),
      familyMemberId: String(memberId),
      familyPayerId: member.phoneNumber,
      type: type === 'credit' ? 'credit' : 'debit',
      amount: numAmount,
      category: category ? category.trim() : 'Family Expense',
      date: date ? new Date(date) : new Date(),
      reason: reason ? reason.trim() : `Expense for ${member.name}`,
      referenceNumber: referenceNumber ? referenceNumber.trim() : '',
      source: 'manual',
    });

    res.status(201).json({
      success: true,
      message: `Recorded ₹${numAmount} ${type === 'credit' ? 'contribution' : 'expense'} for ${member.name}!`,
      payment: transaction,
      isDbConnected: true,
    });
  } catch (err) {
    console.error('[Workspace] addMemberPayment error:', err);
    res.status(500).json({ success: false, message: 'Error recording payment for member: ' + err.message });
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

    const sharedTransactions = await Transaction.find({ workspaceId: String(workspaceId) }).sort({ date: -1 });

    let totalSharedExpense = 0;
    let totalContributions = 0;
    const memberTotals = {};

    ws.members.forEach((m) => {
      memberTotals[m.phoneNumber] = {
        _id: m._id,
        name: m.name || m.phoneNumber,
        phoneNumber: m.phoneNumber,
        relationship: m.relationship || 'Family Member',
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
        } else if (tx.familyMemberId) {
          const matchMem = ws.members.find(m => String(m._id) === String(tx.familyMemberId));
          if (matchMem && memberTotals[matchMem.phoneNumber]) {
            memberTotals[matchMem.phoneNumber].paid += tx.amount;
          }
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
  updateMember,
  removeMember,
  getFamilySummary,
  getMemberPayments,
  addMemberPayment,
};
