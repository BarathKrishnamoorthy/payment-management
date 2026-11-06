const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./src/server');

let server;
let port;

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://127.0.0.1:${port}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' STARTING COMPREHENSIVE RB PAYMENT MANAGEMENT AUDIT');
  console.log('======================================================\n');

  // Start test server on dynamic port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      console.log(`[Test Server] Running on http://127.0.0.1:${port}`);
      resolve();
    });
  });

  // Give DB a moment to connect
  await new Promise((r) => setTimeout(r, 1000));

  console.log('[Test Setup] MongoDB readyState:', mongoose.connection.readyState);
  assert(mongoose.connection.readyState === 1, 'MongoDB connection must be established (readyState === 1)');

  // Clean test users if they exist
  const User = require('./src/models/User');
  const Workspace = require('./src/models/Workspace');
  const Transaction = require('./src/models/Transaction');
  const RecurringPayment = require('./src/models/RecurringPayment');
  const Account = require('./src/models/Account');
  const Budget = require('./src/models/Budget');
  const SavingsGoal = require('./src/models/SavingsGoal');
  const Loan = require('./src/models/Loan');

  const phoneA = '9876500001';
  const phoneB = '9876500002';

  await User.deleteMany({ phoneNumber: { $in: [phoneA, phoneB] } });

  // ---------------------------------------------------------
  // TEST 1: USER A FIRST-TIME REGISTRATION & ONBOARDING
  // ---------------------------------------------------------
  console.log('\n--- 1. Testing User A First-Time Registration & Onboarding ---');

  // 1a. Send OTP
  const otpResA = await request('POST', '/api/auth/send-otp', { phoneNumber: phoneA });
  assert(otpResA.status === 200 && otpResA.body.success, 'User A OTP generated successfully');
  const otpA = otpResA.body.otp;

  // 1b. Verify OTP (First time user)
  const verifyResA = await request('POST', '/api/auth/verify-otp', { phoneNumber: phoneA, otp: otpA });
  assert(verifyResA.status === 200, 'User A OTP verified');
  assert(verifyResA.body.isFirstTime === true, 'First-time user flag is TRUE');
  assert(verifyResA.body.user.isOnboarded === false, 'User A isOnboarded is FALSE initially');
  const tokenA = verifyResA.body.token;
  const userAId = verifyResA.body.user._id;

  // 1c. Complete Onboarding
  const onbResA = await request(
    'POST',
    '/api/onboarding/complete',
    {
      name: 'User A Fullname',
      bankName: 'HDFC Bank',
      accountNumber: '111122223333',
    },
    tokenA
  );
  assert(onbResA.status === 200 && onbResA.body.success, 'User A completed onboarding');
  assert(onbResA.body.user.isOnboarded === true, 'User A isOnboarded is now TRUE in response');
  assert(onbResA.body.user.name === 'User A Fullname', 'User A name saved properly');

  // Verify directly from MongoDB
  const dbUserA = await User.findById(userAId);
  assert(dbUserA.isOnboarded === true, 'MongoDB document has isOnboarded === true');
  assert(dbUserA.name === 'User A Fullname', 'MongoDB document has correct name');

  // 1d. Existing User Login Test (Simulate re-login after app restart / logout)
  console.log('\n--- 2. Testing Existing User A Re-Login (Must Bypass Onboarding) ---');
  const otpResA2 = await request('POST', '/api/auth/send-otp', { phoneNumber: phoneA });
  const verifyResA2 = await request('POST', '/api/auth/verify-otp', { phoneNumber: phoneA, otp: otpResA2.body.otp });
  assert(verifyResA2.status === 200, 'User A re-login OTP verified');
  assert(verifyResA2.body.isFirstTime === false, 'Existing user isFirstTime is FALSE');
  assert(verifyResA2.body.user.isOnboarded === true, 'Existing user isOnboarded is TRUE');
  assert(verifyResA2.body.user.name === 'User A Fullname', 'Existing user profile name is returned directly from backend');

  // 1e. GetMe session verification
  const meResA = await request('GET', '/api/auth/me', null, tokenA);
  assert(meResA.status === 200, 'GET /api/auth/me succeeds');
  assert(meResA.body.user.isOnboarded === true, 'GET /api/auth/me returns isOnboarded === true');
  assert(meResA.body.user.name === 'User A Fullname', 'GET /api/auth/me returns correct name');

  // ---------------------------------------------------------
  // TEST 2: TUTORIAL COMPLETION & PERSISTENCE
  // ---------------------------------------------------------
  console.log('\n--- 3. Testing Tutorial Completion & Persistence ---');
  assert(meResA.body.user.tutorialStatus?.dashboard !== true, 'Dashboard tutorial starts uncompleted');

  // Complete dashboard tutorial
  const tutRes = await request('POST', '/api/profile/tutorial-status', { module: 'dashboard', completed: true }, tokenA);
  assert(tutRes.status === 200, 'Mark tutorial completed API returns 200');
  assert(tutRes.body.tutorialStatus.dashboard === true, 'Dashboard tutorial status is TRUE in response');

  // Verify persisted in MongoDB
  const dbUserAfterTut = await User.findById(userAId);
  assert(dbUserAfterTut.tutorialStatus.dashboard === true, 'Tutorial completion persisted directly in MongoDB');

  // Complete family tutorial
  await request('POST', '/api/profile/tutorial-status', { module: 'family', completed: true }, tokenA);
  const dbUserAfterTut2 = await User.findById(userAId);
  assert(dbUserAfterTut2.tutorialStatus.family === true, 'Family tutorial completion persisted in MongoDB');

  // ---------------------------------------------------------
  // TEST 3: FAMILY MODULE COMPLETE CRUD & OPERATIONS
  // ---------------------------------------------------------
  console.log('\n--- 4. Testing Family Module (Create, Add Member, Edit, Payments, Delete) ---');

  // 3a. Get initial workspaces (Personal created automatically)
  const wsResA = await request('GET', '/api/workspaces', null, tokenA);
  assert(wsResA.status === 200, 'User A fetched workspaces');
  const personalWsA = wsResA.body.workspaces.find((w) => w.type === 'personal');
  assert(personalWsA != null, 'Personal workspace auto-created for User A');

  // 3b. Create Family Workspace
  const createWsRes = await request('POST', '/api/workspaces/family', { name: 'User A Family Circle' }, tokenA);
  assert(createWsRes.status === 201, 'Family workspace created');
  const familyWsA = createWsRes.body.workspace;
  assert(familyWsA.name === 'User A Family Circle', 'Family workspace name is correct');
  assert(String(familyWsA.owner) === String(userAId), 'Family workspace belongs to User A');

  // 3c. Add Member 1 (Spouse)
  const addMem1Res = await request(
    'POST',
    `/api/workspaces/family/${familyWsA._id}/members`,
    {
      name: 'Priya A',
      phoneNumber: '9876599001',
      relationship: 'Spouse',
      role: 'admin',
      email: 'priya@example.com',
      monthlyBudget: 25000,
      notes: 'Manages household groceries and utilities',
    },
    tokenA
  );
  assert(addMem1Res.status === 200, 'Family member 1 added');
  const member1 = addMem1Res.body.workspace.members.find((m) => m.name === 'Priya A');
  assert(member1 != null, 'Member 1 found in workspace');
  assert(member1.relationship === 'Spouse', 'Member 1 relationship saved');
  assert(member1.monthlyBudget === 25000, 'Member 1 monthly budget saved');

  // 3d. Add Member 2 (Child)
  const addMem2Res = await request(
    'POST',
    `/api/workspaces/family/${familyWsA._id}/members`,
    {
      name: 'Rohan A',
      phoneNumber: '9876599002',
      relationship: 'Child',
      role: 'viewer',
      monthlyBudget: 5000,
    },
    tokenA
  );
  assert(addMem2Res.status === 200, 'Family member 2 added');
  const member2 = addMem2Res.body.workspace.members.find((m) => m.name === 'Rohan A');
  assert(member2 != null, 'Member 2 found in workspace');

  // 3e. Duplicate phone validation test
  const dupMemRes = await request(
    'POST',
    `/api/workspaces/family/${familyWsA._id}/members`,
    {
      name: 'Duplicate Member',
      phoneNumber: '9876599001', // same as Member 1
    },
    tokenA
  );
  assert(dupMemRes.status === 400, 'Duplicate member phone number rejected with 400 error');

  // 3f. Edit Member 1 details
  const editMemRes = await request(
    'PUT',
    `/api/workspaces/family/${familyWsA._id}/members/${member1._id}`,
    {
      name: 'Priya A (Updated)',
      phoneNumber: '9876599001',
      relationship: 'Spouse',
      role: 'admin',
      email: 'priya.updated@example.com',
      monthlyBudget: 30000,
      notes: 'Updated budget to 30000',
    },
    tokenA
  );
  assert(editMemRes.status === 200, 'Member 1 updated successfully');
  const updatedMember1 = editMemRes.body.workspace.members.find((m) => String(m._id) === String(member1._id));
  assert(updatedMember1.name === 'Priya A (Updated)', 'Member 1 name updated');
  assert(updatedMember1.monthlyBudget === 30000, 'Member 1 budget updated');

  // 3g. Associate Payment with Member 1
  const payMemRes = await request(
    'POST',
    `/api/workspaces/family/${familyWsA._id}/members/${member1._id}/payments`,
    {
      amount: 4500,
      type: 'debit',
      category: 'Groceries',
      date: new Date().toISOString(),
      reason: 'Weekly Organic Groceries',
      referenceNumber: 'UPI-11223344',
    },
    tokenA
  );
  assert(payMemRes.status === 201, 'Payment associated with family member 1 created');
  assert(payMemRes.body.payment.amount === 4500, 'Payment amount is 4500');

  // 3h. View Member 1 Payment History
  const histRes = await request(
    'GET',
    `/api/workspaces/family/${familyWsA._id}/members/${member1._id}/payments`,
    null,
    tokenA
  );
  assert(histRes.status === 200, 'Member 1 payment history fetched');
  assert(histRes.body.payments.length === 1, 'Member 1 has 1 payment recorded');
  assert(histRes.body.totalPaid === 4500, 'Member 1 totalPaid is 4500');

  // 3i. Family Summary Verification
  const famSumRes = await request('GET', `/api/workspaces/family/${familyWsA._id}/summary`, null, tokenA);
  assert(famSumRes.status === 200, 'Family summary fetched');
  assert(famSumRes.body.totalSharedExpense === 4500, 'Family totalSharedExpense includes member payment');

  // 3j. Delete Member 2
  const delMemRes = await request(
    'DELETE',
    `/api/workspaces/family/${familyWsA._id}/members/${member2._id}`,
    null,
    tokenA
  );
  assert(delMemRes.status === 200, 'Member 2 removed successfully');
  const remainingMem = delMemRes.body.workspace.members.find((m) => String(m._id) === String(member2._id));
  assert(remainingMem == null, 'Member 2 no longer in family workspace');

  // ---------------------------------------------------------
  // TEST 4: CORE MODULES AUDIT FOR USER A
  // ---------------------------------------------------------
  console.log('\n--- 5. Testing All Core Modules for User A ---');

  // 4a. Transactions: Income & Expense
  const crRes = await request(
    'POST',
    '/api/transactions',
    {
      type: 'credit',
      amount: 85000,
      category: 'Salary',
      reason: 'Monthly In-hand Salary',
    },
    tokenA
  );
  assert(crRes.status === 201, 'Credit transaction created (₹85,000)');

  const drRes = await request(
    'POST',
    '/api/transactions',
    {
      type: 'debit',
      amount: 15000,
      category: 'Rent',
      reason: 'Monthly Apartment Rent',
    },
    tokenA
  );
  assert(drRes.status === 201, 'Debit transaction created (₹15,000)');

  const txnsResA = await request('GET', '/api/transactions', null, tokenA);
  assert(txnsResA.status === 200, 'Transactions list fetched');
  assert(txnsResA.body.summary.totalCredit === 85000, 'Total credit is ₹85,000');
  // Total debit is ₹15,000 + ₹4,500 family grocery payment recorded in step 3h = ₹19,500
  assert(txnsResA.body.summary.totalDebit === 19500, 'Total debit is ₹19,500 (15k rent + 4.5k family grocery)');

  // 4b. Recurring Payments (EMIs, Loans)
  const recRes = await request(
    'POST',
    '/api/recurring',
    {
      title: 'HDFC Car Loan',
      paymentType: 'Car Loan',
      recurrenceType: 'Monthly',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // due tomorrow
      amount: 14500,
      autoCreateDebit: true,
    },
    tokenA
  );
  assert(recRes.status === 201, 'Recurring payment created');
  const recId = (recRes.body.recurring || recRes.body.recurringPayment)?._id;

  // Mark recurring as paid -> auto-creates debit transaction
  const payRecRes = await request('POST', `/api/recurring/${recId}/pay`, { paidAmount: 14500 }, tokenA);
  assert(payRecRes.status === 200, 'Recurring payment marked as paid');

  // 4c. Accounts & Wallets
  const accRes = await request(
    'POST',
    '/api/accounts',
    {
      accountName: 'HDFC Savings Account',
      accountType: 'Savings',
      bankName: 'HDFC Bank',
      accountNumber: '4455',
      openingBalance: 120000,
      isDefault: true,
    },
    tokenA
  );
  assert(accRes.status === 201, 'Account created');

  // 4d. Planning: Budgets & Savings Goals
  const bgtRes = await request(
    'POST',
    '/api/planning/budgets',
    {
      category: 'Rent',
      amount: 20000,
      period: 'monthly',
    },
    tokenA
  );
  assert(bgtRes.status === 201, 'Monthly budget created');

  const goalRes = await request(
    'POST',
    '/api/planning/savings-goals',
    {
      goalName: 'Emergency Reserve',
      targetAmount: 100000,
      targetDate: '2026-12-31',
    },
    tokenA
  );
  assert(goalRes.status === 201, 'Savings goal created');

  // 4e. Loans: Borrow & Lend
  const loanRes = await request(
    'POST',
    '/api/loans',
    {
      personName: 'Ramesh Colleague',
      mobileNumber: '9988776655',
      type: 'lent',
      principal: 10000,
      dueDate: '2026-12-15',
    },
    tokenA
  );
  assert(loanRes.status === 201, 'Personal loan record created');

  // 4f. Dashboard Metrics Check
  const dashResA = await request('GET', '/api/dashboard/summary', null, tokenA);
  assert(dashResA.status === 200, 'Dashboard summary fetched');
  assert(dashResA.body.summary.totalIncome === 85000, 'Dashboard totalIncome === 85000');
  assert(dashResA.body.summary.netBalance > 0, 'Dashboard netBalance computed accurately');

  // 4g. Reports Analytics Check
  const repResA = await request('GET', '/api/reports/analytics', null, tokenA);
  assert(repResA.status === 200, 'Reports analytics fetched');
  assert(repResA.body.summary.totalIncome === 85000, 'Reports totalIncome === 85000');

  // ---------------------------------------------------------
  // TEST 5: USER B CREATION & COMPLETE STRICT DATA ISOLATION
  // ---------------------------------------------------------
  console.log('\n--- 6. Testing User B Creation & Strict Cross-User Data Isolation ---');

  // 5a. User B Registration & Onboarding
  const otpResB = await request('POST', '/api/auth/send-otp', { phoneNumber: phoneB });
  const verifyResB = await request('POST', '/api/auth/verify-otp', { phoneNumber: phoneB, otp: otpResB.body.otp });
  assert(verifyResB.body.isFirstTime === true, 'User B starts as first-time user');
  const tokenB = verifyResB.body.token;
  const userBId = verifyResB.body.user._id;

  const onbResB = await request(
    'POST',
    '/api/onboarding/complete',
    {
      name: 'User B Professional',
      bankName: 'ICICI Bank',
      accountNumber: '999988887777',
    },
    tokenB
  );
  assert(onbResB.body.user.isOnboarded === true, 'User B onboarded independently');

  // 5b. User B Transactions (Different amounts)
  await request(
    'POST',
    '/api/transactions',
    {
      type: 'credit',
      amount: 40000,
      category: 'Freelance',
      reason: 'Web Design Project',
    },
    tokenB
  );

  // 5c. User B Family Workspace
  const createWsB = await request('POST', '/api/workspaces/family', { name: 'User B Family Hub' }, tokenB);
  const familyWsB = createWsB.body.workspace;

  await request(
    'POST',
    `/api/workspaces/family/${familyWsB._id}/members`,
    {
      name: 'Brother B',
      phoneNumber: '9876588001',
      relationship: 'Sibling',
    },
    tokenB
  );

  // 5d. STRICT ISOLATION CHECKS:
  console.log('\n--- 7. Verifying Strict Isolation Between User A and User B ---');

  // Check 1: User B cannot see User A's transactions
  const txnsResB = await request('GET', '/api/transactions', null, tokenB);
  assert(txnsResB.body.summary.totalCredit === 40000, 'User B sees only their own credit (₹40,000)');
  assert(!txnsResB.body.transactions.some((t) => t.reason.includes('Salary')), 'User B never sees User A Salary');

  // Check 2: User A cannot see User B's transactions
  const txnsCheckA = await request('GET', '/api/transactions', null, tokenA);
  assert(!txnsCheckA.body.transactions.some((t) => t.reason.includes('Web Design')), 'User A never sees User B Freelance');

  // Check 3: User A cannot see User B's family workspace or members
  const wsCheckA = await request('GET', '/api/workspaces', null, tokenA);
  assert(!wsCheckA.body.workspaces.some((w) => w.name === 'User B Family Hub'), 'User A never sees User B family group');

  // Check 4: User B cannot see User A's family workspace or members
  const wsCheckB = await request('GET', '/api/workspaces', null, tokenB);
  assert(!wsCheckB.body.workspaces.some((w) => w.name === 'User A Family Circle'), 'User B never sees User A family group');

  // Check 5: User B cannot delete or access User A's family workspace
  const unauthorizedDelete = await request('DELETE', `/api/workspaces/family/${familyWsA._id}/members/${member1._id}`, null, tokenB);
  assert(unauthorizedDelete.status === 403 || unauthorizedDelete.status === 404, 'User B unauthorized to remove User A member');

  // Check 6: User B cannot access User A's recurring payments
  const recResB = await request('GET', '/api/recurring', null, tokenB);
  assert(recResB.body.recurringPayments.length === 0, 'User B has 0 recurring payments (cannot see User A car loan)');

  // Check 7: User B's dashboard shows only User B's figures
  const dashB = await request('GET', '/api/dashboard/summary', null, tokenB);
  assert(dashB.body.summary.totalIncome === 40000, 'User B dashboard totalIncome === 40000 (not 85000)');

  // Check 8: User A's dashboard still shows User A's figures
  const dashA = await request('GET', '/api/dashboard/summary', null, tokenA);
  assert(dashA.body.summary.totalIncome === 85000, 'User A dashboard totalIncome === 85000 unaffected');

  console.log('\n======================================================');
  console.log(' ALL 35+ TEST ASSERTIONS PASSED WITH ZERO ERRORS!');
  console.log('======================================================\n');

  await mongoose.disconnect();
  server.close();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ AUDIT FAILED WITH ERROR:', err);
  if (server) server.close();
  process.exit(1);
});
