import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { Colors } from './src/theme/colors';
import { MobileAPI, setAuthToken, setApiUrl, getApiUrl } from './src/services/api';
import { DEFAULT_LIVE_API_URL, LOCAL_WIFI_API_URL } from './src/config/env';
import { MobileTour, TourStep } from './src/components/MobileTour';
import { MobileGuidanceModal } from './src/components/MobileGuidanceModal';

export default function App() {
  // Global App States
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'recurring' | 'reports' | 'profile'>('dashboard');

  // Server URL Configuration Modal
  const [showServerModal, setShowServerModal] = useState(false);
  const [currentServerUrl, setCurrentServerUrl] = useState(getApiUrl());
  const [inputServerUrl, setInputServerUrl] = useState(getApiUrl());

  // Auth & Onboarding States
  const [authStep, setAuthStep] = useState<'phone' | 'otp'>('phone');
  const [phoneInput, setPhoneInput] = useState('9876543210');
  const [otpInput, setOtpInput] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  
  // Onboarding Form
  const [onboardName, setOnboardName] = useState('');
  const [onboardBank, setOnboardBank] = useState('');
  const [onboardAccount, setOnboardAccount] = useState('');

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Transactions State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txnFilter, setTxnFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [showAddTxnModal, setShowAddTxnModal] = useState(false);
  const [txnType, setTxnType] = useState<'credit' | 'debit'>('debit');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnCategory, setTxnCategory] = useState('General Expense');
  const [txnReason, setTxnReason] = useState('');

  // Recurring Payments State
  const [recurringList, setRecurringList] = useState<any[]>([]);
  const [showAddRecModal, setShowAddRecModal] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recCategory, setRecCategory] = useState('EMI');
  const [recRecurrence, setRecRecurrence] = useState('Monthly');
  const [recAmount, setRecAmount] = useState('');
  const [recDueDate, setRecDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Reports State
  const [reportData, setReportData] = useState<any>(null);

  // Profile Edit Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editAccount, setEditAccount] = useState('');

  // Walkthrough & Guidance States
  const [tourVisible, setTourVisible] = useState(false);
  const [currentTourSteps, setCurrentTourSteps] = useState<TourStep[]>([]);
  const [guidanceVisible, setGuidanceVisible] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // ----------------------------------------------------
  // AUTHENTICATION FLOW
  // ----------------------------------------------------
  const handleSendOtp = async () => {
    if (!phoneInput || phoneInput.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await MobileAPI.sendOtp(phoneInput);
      if (res.otp) setDemoOtp(res.otp);
      setAuthStep('otp');
      Alert.alert('OTP Sent', `Verification code sent to +91 ${phoneInput}. (Demo OTP: ${res.otp || '123456'})`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput) {
      Alert.alert('Error', 'Please enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      const res = await MobileAPI.verifyOtp(phoneInput, otpInput);
      setToken(res.token);
      setAuthToken(res.token);
      setUser(res.user);
      if (res.user?.isOnboarded) {
        loadDashboardData();
        checkModuleTutorial(res.user, 'dashboard');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!onboardName.trim()) {
      Alert.alert('Error', 'Name is required to complete onboarding.');
      return;
    }
    setLoading(true);
    try {
      const res = await MobileAPI.completeOnboarding({
        name: onboardName.trim(),
        bankName: onboardBank.trim(),
        accountNumber: onboardAccount.trim(),
      });
      setUser(res.user);
      loadDashboardData();
      checkModuleTutorial(res.user, 'dashboard');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete onboarding.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------
  const loadDashboardData = async () => {
    try {
      const res = await MobileAPI.getDashboardSummary();
      setDashboardData(res);
      // Also load notifications
      const nRes = await MobileAPI.getNotifications();
      setNotifications(nRes.notifications || []);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      const params: any = {};
      if (txnFilter !== 'all') params.type = txnFilter;
      const res = await MobileAPI.getTransactions(params);
      setTransactions(res.transactions || []);
    } catch (err) {
      console.warn('Txn fetch error:', err);
    }
  };

  const loadRecurring = async () => {
    try {
      const res = await MobileAPI.getRecurring();
      setRecurringList(res.recurringPayments || []);
    } catch (err) {
      console.warn('Recurring fetch error:', err);
    }
  };

  const loadReports = async () => {
    try {
      const res = await MobileAPI.getReports();
      setReportData(res);
    } catch (err) {
      console.warn('Report fetch error:', err);
    }
  };

  useEffect(() => {
    if (user?.isOnboarded) {
      if (activeTab === 'dashboard') loadDashboardData();
      if (activeTab === 'transactions') loadTransactions();
      if (activeTab === 'recurring') loadRecurring();
      if (activeTab === 'reports') loadReports();
    }
  }, [activeTab, txnFilter, user?.isOnboarded]);

  // ----------------------------------------------------
  // TUTORIAL & GUIDANCE HANDLERS
  // ----------------------------------------------------
  const checkModuleTutorial = (currentUser: any, moduleName: string) => {
    if (!currentUser?.tutorialStatus?.[moduleName]) {
      triggerTour(moduleName);
    }
  };

  const triggerTour = (moduleName: string) => {
    if (moduleName === 'dashboard') {
      setCurrentTourSteps([
        {
          targetName: 'Total Balance & Net Savings',
          title: 'Financial Health Cards',
          description: 'Tracks your net accumulated cashflow, income credits, and debit expenses in real-time.',
          direction: 'down',
        },
        {
          targetName: 'Urgent Payment Due Banner',
          title: 'Payments Due Today Alert',
          description: 'Any active EMI, home loan, or subscription due today alerts you instantly so you never incur late penalties.',
          direction: 'down',
        },
        {
          targetName: 'Recent Activity & Quick Action',
          title: 'Fast Entry Hub',
          description: 'Quickly access actions to log new income, track expenses, or view your loan schedules.',
          direction: 'up',
        },
      ]);
    } else if (moduleName === 'transactions') {
      setCurrentTourSteps([
        {
          targetName: 'Add Transaction Button',
          title: 'Log Credits and Debits',
          description: 'Record salary, client invoices, grocery purchases, or utility bills with custom notes and references.',
          direction: 'down',
        },
        {
          targetName: 'Credit / Debit Filter Pills',
          title: 'Smart Ledger Filter',
          description: 'Switch between Income (Credit) and Expense (Debit) views seamlessly.',
          direction: 'down',
        },
      ]);
    } else if (moduleName === 'recurring') {
      setCurrentTourSteps([
        {
          targetName: 'Add Recurring Payment',
          title: 'Automated Loan & EMI Tracking',
          description: 'Configure loan schedules across 6 categories: EMI, Bank Loan, Subscription, Gold Loan, Home Loan, and Car Loan.',
          direction: 'down',
        },
        {
          targetName: 'Mark as Paid Action',
          title: '1-Tap Settlement & Auto-Advance',
          description: 'When an installment is paid, tap Mark as Paid to log a Debit expense and calculate the next due date automatically!',
          direction: 'up',
        },
      ]);
    } else if (moduleName === 'reports') {
      setCurrentTourSteps([
        {
          targetName: 'Income vs Expense Breakdown',
          title: 'Financial Diagnostics',
          description: 'Inspect net savings, calculate your savings rate %, and see expenditure distribution.',
          direction: 'down',
        },
      ]);
    }
    setTourVisible(true);
  };

  const handleFinishTour = async () => {
    setTourVisible(false);
    try {
      await MobileAPI.updateTutorialStatus(activeTab);
      setUser((prev: any) => ({
        ...prev,
        tutorialStatus: { ...(prev?.tutorialStatus || {}), [activeTab]: true },
      }));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleReplayTour = () => {
    triggerTour(activeTab);
  };

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------
  const handleCreateTxn = async () => {
    if (!txnAmount || isNaN(Number(txnAmount))) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    try {
      await MobileAPI.createTransaction({
        type: txnType,
        amount: Number(txnAmount),
        date: new Date().toISOString(),
        category: txnCategory,
        reason: txnReason,
      });
      setShowAddTxnModal(false);
      setTxnAmount('');
      setTxnReason('');
      loadTransactions();
      Alert.alert('Success', `${txnType === 'credit' ? 'Income' : 'Expense'} recorded!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create transaction.');
    }
  };

  const handleCreateRecurring = async () => {
    if (!recTitle.trim() || !recAmount) {
      Alert.alert('Error', 'Please enter title and amount.');
      return;
    }
    try {
      await MobileAPI.createRecurring({
        title: recTitle.trim(),
        paymentType: recCategory,
        recurrenceType: recRecurrence,
        amount: Number(recAmount),
        dueDate: recDueDate,
      });
      setShowAddRecModal(false);
      setRecTitle('');
      setRecAmount('');
      loadRecurring();
      Alert.alert('Success', 'Recurring payment scheduled!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to schedule recurring payment.');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await MobileAPI.markAsPaid(id);
      Alert.alert('Settled', 'Payment recorded and next due date advanced!');
      loadRecurring();
      if (activeTab === 'dashboard') loadDashboardData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to settle payment.');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await MobileAPI.updateProfile({
        name: editName,
        bankName: editBank,
        accountNumber: editAccount,
      });
      setUser(res.user);
      setShowEditProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    }
  };

  const handleResetWalkthroughs = async () => {
    Alert.alert(
      'Reset Tutorials',
      'Would you like to reset all module walkthroughs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            await MobileAPI.resetTutorialStatus();
            setUser((prev: any) => ({
              ...prev,
              tutorialStatus: { dashboard: false, transactions: false, recurring: false, reports: false },
            }));
            Alert.alert('Done', 'Walkthroughs reset! They will display when visiting each screen.');
          },
        },
      ]
    );
  };

  const formatCurrency = (val: number) => '₹' + Number(val || 0).toLocaleString('en-IN');

  // ====================================================
  // SCREEN 1: LOGIN & OTP
  // ====================================================
  if (!user || !token) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4C1D95" />
        <ScrollView contentContainerStyle={styles.authScroll}>
          {/* Logo Badge */}
          <View style={styles.authLogoBox}>
            <Text style={styles.authLogoIcon}>💳</Text>
          </View>
          <Text style={styles.authTitle}>RB Payment Management</Text>
          <Text style={styles.authSubtitle}>Secure Finance, Loans & Recurring Ledger</Text>

          {/* Server URL Badge / Switcher */}
          <TouchableOpacity
            style={styles.serverPill}
            onPress={() => {
              setInputServerUrl(currentServerUrl);
              setShowServerModal(true);
            }}
          >
            <Text style={styles.serverPillText}>
              🌐 Backend: <Text style={{ fontWeight: 'bold' }}>{currentServerUrl}</Text> (Tap to edit)
            </Text>
          </TouchableOpacity>

          {/* Quick Demo Pill */}
          <TouchableOpacity
            style={styles.demoPill}
            onPress={() => {
              setPhoneInput('9876543210');
              setOtpInput('123456');
            }}
          >
            <Text style={styles.demoPillText}>✨ Fill Demo Credentials (9876543210 / 123456)</Text>
          </TouchableOpacity>

          <View style={styles.authCard}>
            {authStep === 'phone' ? (
              <View>
                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <View style={styles.phoneInputRow}>
                  <Text style={styles.prefixText}>+91</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                    placeholder="Enter 10-digit number"
                  />
                </View>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Request OTP Code →</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.fieldLabel}>6-Digit OTP Code</Text>
                  <TouchableOpacity onPress={() => setAuthStep('phone')}>
                    <Text style={styles.linkText}>Change Number</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.textInput, styles.otpInput]}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpInput}
                  onChangeText={setOtpInput}
                  placeholder="• • • • • •"
                />
                {demoOtp ? (
                  <Text style={styles.demoOtpHint}>Received OTP: {demoOtp}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify & Continue 🛡️</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Server Configuration Modal */}
        <Modal visible={showServerModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Configure Backend API Server</Text>
              <Text style={styles.cardSub}>
                Connect to your live cloud server or local Wi-Fi:
              </Text>

              <TextInput
                style={[styles.textInput, { marginTop: 12, fontSize: 13 }]}
                value={inputServerUrl}
                onChangeText={setInputServerUrl}
                placeholder="https://your-backend.onrender.com/api"
                autoCapitalize="none"
              />

              {/* Quick Presets */}
              <View style={{ marginTop: 12, gap: 8 }}>
                <TouchableOpacity
                  style={{ padding: 10, borderRadius: 10, backgroundColor: '#FAF5FF', borderWidth: 1, borderColor: '#E9D5FF' }}
                  onPress={() => setInputServerUrl(DEFAULT_LIVE_API_URL)}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: Colors.primary }}>
                    ☁️ Use Live Cloud: {DEFAULT_LIVE_API_URL}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ padding: 10, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
                  onPress={() => setInputServerUrl(LOCAL_WIFI_API_URL)}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: Colors.textSecondary }}>
                    📡 Use Local Machine Wi-Fi: {LOCAL_WIFI_API_URL}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowServerModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => {
                    const trimmed = inputServerUrl.trim();
                    setApiUrl(trimmed);
                    setCurrentServerUrl(trimmed);
                    setShowServerModal(false);
                    Alert.alert('Server Updated', `Now connecting to: ${trimmed}`);
                  }}
                >
                  <Text style={styles.saveBtnText}>Save Server</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ====================================================
  // SCREEN 2: FIRST-TIME ONBOARDING
  // ====================================================
  if (!user.isOnboarded) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4C1D95" />
        <ScrollView contentContainerStyle={styles.authScroll}>
          <Text style={styles.onboardBadge}>FIRST-TIME CUSTOMER SETUP</Text>
          <Text style={styles.authTitle}>Complete Your Profile</Text>
          <Text style={styles.authSubtitle}>Please enter your customer identity details</Text>

          <View style={styles.authCard}>
            <Text style={styles.fieldLabel}>Customer Full Name (Required) *</Text>
            <TextInput
              style={styles.textInput}
              value={onboardName}
              onChangeText={setOnboardName}
              placeholder="e.g. Rajesh Balasubramanian"
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Phone Number (Auto-Filled)</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={`+91 ${user.phoneNumber}`}
              editable={false}
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Primary Bank Name (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={onboardBank}
              onChangeText={setOnboardBank}
              placeholder="e.g. HDFC Bank, SBI, ICICI"
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Account Number (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={onboardAccount}
              onChangeText={setOnboardAccount}
              placeholder="e.g. 50100492817291"
            />

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 18 }]}
              onPress={handleCompleteOnboarding}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Save Profile & Enter App →</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Server Configuration Modal */}
        <Modal visible={showServerModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Configure Backend API Server</Text>
              <Text style={styles.cardSub}>
                Connect to your live cloud server or local Wi-Fi:
              </Text>

              <TextInput
                style={[styles.textInput, { marginTop: 12, fontSize: 13 }]}
                value={inputServerUrl}
                onChangeText={setInputServerUrl}
                placeholder="https://your-backend.onrender.com/api"
                autoCapitalize="none"
              />

              {/* Quick Presets */}
              <View style={{ marginTop: 12, gap: 8 }}>
                <TouchableOpacity
                  style={{ padding: 10, borderRadius: 10, backgroundColor: '#FAF5FF', borderWidth: 1, borderColor: '#E9D5FF' }}
                  onPress={() => setInputServerUrl(DEFAULT_LIVE_API_URL)}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: Colors.primary }}>
                    ☁️ Use Live Cloud: {DEFAULT_LIVE_API_URL}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ padding: 10, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
                  onPress={() => setInputServerUrl(LOCAL_WIFI_API_URL)}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: Colors.textSecondary }}>
                    📡 Use Local Machine Wi-Fi: {LOCAL_WIFI_API_URL}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowServerModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => {
                    const trimmed = inputServerUrl.trim();
                    setApiUrl(trimmed);
                    setCurrentServerUrl(trimmed);
                    setShowServerModal(false);
                    Alert.alert('Server Updated', `Now connecting to: ${trimmed}`);
                  }}
                >
                  <Text style={styles.saveBtnText}>Save Server</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ====================================================
  // MAIN APP NAVIGATION & HEADER
  // ====================================================
  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Interactive Tour Modal */}
      <MobileTour
        visible={tourVisible}
        steps={currentTourSteps}
        onFinish={handleFinishTour}
      />

      {/* Module Guidance "How to Use" Modal */}
      <MobileGuidanceModal
        visible={guidanceVisible}
        onClose={() => setGuidanceVisible(false)}
        moduleTitle={`How to Use ${activeTab.toUpperCase()}`}
        features={[
          { title: 'Overview', desc: 'Centralized financial management adhering to the RB Payment standard.' },
          { title: 'Smart Automation', desc: 'Auto-advancing due dates and seamless credit/debit tracking.' },
        ]}
        instructions={[
          { action: 'Adding Records', steps: ['Click the (+) Add button', 'Fill required details', 'Tap Save'] },
          { action: 'Reviewing Details', steps: ['Browse cards or lists', 'Tap row for breakdown'] },
        ]}
        fields={[
          { name: 'Credit (Income)', meaning: 'Positive inflow of funds.' },
          { name: 'Debit (Expense)', meaning: 'Outflow or installment payments.' },
          { name: 'Due Date', meaning: 'Settlement deadline for recurring loans.' },
        ]}
      />

      {/* Top Header Bar */}
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.headerAppTitle}>RB Payment</Text>
          <Text style={styles.headerUserGreeting}>
            Hi, {user.name ? user.name.split(' ')[0] : 'Customer'} 👋
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          {/* "How to Use" Guide Button */}
          <TouchableOpacity
            style={styles.headerGuideBtn}
            onPress={() => setGuidanceVisible(true)}
          >
            <Text style={styles.headerGuideText}>📖 Guide</Text>
          </TouchableOpacity>

          {/* Replay Tutorial Button */}
          <TouchableOpacity
            style={styles.headerTourBtn}
            onPress={handleReplayTour}
          >
            <Text style={styles.headerTourText}>✨ Tour</Text>
          </TouchableOpacity>

          {/* Notifications Bell */}
          <TouchableOpacity
            style={styles.headerBellBtn}
            onPress={() => setShowNotifModal(true)}
          >
            <Text style={styles.headerBellText}>🔔</Text>
            {notifications.length > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Module Content Body */}
      <View style={styles.contentArea}>
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <ScrollView contentContainerStyle={styles.tabScroll}>
            {/* Urgent Due Today Banner */}
            {dashboardData?.dueToday && dashboardData.dueToday.length > 0 && (
              <View style={styles.dueTodayBanner}>
                <Text style={styles.dueTodayTag}>🚨 PAYMENT DUE TODAY</Text>
                <Text style={styles.dueTodayTitle}>
                  {dashboardData.dueToday[0]?.title}
                </Text>
                <Text style={styles.dueTodayAmt}>
                  {formatCurrency(dashboardData.dueToday[0]?.amount)}
                </Text>
                <TouchableOpacity
                  style={styles.duePayBtn}
                  onPress={() => handleMarkPaid(dashboardData.dueToday[0]?._id)}
                >
                  <Text style={styles.duePayBtnText}>Mark as Paid Now ✓</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Metrics Row */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>NET BALANCE</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(dashboardData?.summary?.netBalance)}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>TOTAL INCOME</Text>
                <Text style={[styles.metricValue, { color: Colors.income }]}>
                  {formatCurrency(dashboardData?.summary?.totalIncome)}
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>TOTAL EXPENSES</Text>
                <Text style={[styles.metricValue, { color: Colors.expense }]}>
                  {formatCurrency(dashboardData?.summary?.totalExpenses)}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>THIS MONTH SAVINGS</Text>
                <Text style={[styles.metricValue, { color: Colors.primaryDark }]}>
                  {formatCurrency(dashboardData?.summary?.thisMonthSavings)}
                </Text>
              </View>
            </View>

            {/* Upcoming Payments Header (Due in ≤ 3 Days) */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Upcoming Dues (Next 3 Days)</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8' }}>Only displaying commitments due within 3 days</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveTab('recurring')}>
                <Text style={styles.sectionLink}>View All →</Text>
              </TouchableOpacity>
            </View>

            {(!dashboardData?.upcomingPayments || dashboardData.upcomingPayments.filter((item: any) => item.diffDays <= 3).length === 0) ? (
              <View style={[styles.listCard, { paddingVertical: 16, alignItems: 'center' }]}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primaryDark }}>
                  ✨ No Commitments Due in Next 3 Days
                </Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>
                  All active commitments remain hidden until 3 days before their due date.
                </Text>
              </View>
            ) : (
              dashboardData.upcomingPayments
                .filter((item: any) => item.diffDays <= 3)
                .slice(0, 3)
                .map((item: any) => (
                  <View key={item._id} style={styles.listCard}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: item.diffDays === 0 ? '#E11D48' : '#D97706',
                            backgroundColor: item.diffDays === 0 ? '#FFE4E6' : '#FEF3C7',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          {item.diffDays === 0 ? 'Due Today' : `Due in ${item.diffDays}d`}
                        </Text>
                      </View>
                      <Text style={styles.cardSub}>
                        {item.paymentType} • Due {new Date(item.nextDueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={styles.cardAmt}>{formatCurrency(item.amount)}</Text>
                      <TouchableOpacity
                        onPress={() => handleMarkPaid(item._id)}
                        style={{
                          backgroundColor: Colors.income,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Mark Paid</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
            )}

            {/* Recent Transactions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => setActiveTab('transactions')}>
                <Text style={styles.sectionLink}>View Ledger →</Text>
              </TouchableOpacity>
            </View>

            {dashboardData?.recentTransactions?.slice(0, 3).map((txn: any) => (
              <View key={txn._id} style={styles.listCard}>
                <View>
                  <Text style={styles.cardTitle}>{txn.reason || txn.category}</Text>
                  <Text style={styles.cardSub}>
                    {new Date(txn.date).toLocaleDateString()} • {txn.category}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.cardAmt,
                    { color: txn.type === 'credit' ? Colors.income : Colors.text },
                  ]}
                >
                  {txn.type === 'credit' ? '+' : '-'}
                  {formatCurrency(txn.amount)}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* TAB 2: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <View style={{ flex: 1 }}>
            {/* Filter Pills */}
            <View style={styles.filterStrip}>
              {(['all', 'credit', 'debit'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterPill,
                    txnFilter === filter && styles.activeFilterPill,
                  ]}
                  onPress={() => setTxnFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      txnFilter === filter && styles.activeFilterPillText,
                    ]}
                  >
                    {filter === 'all' ? 'All' : filter === 'credit' ? 'Income (+)' : 'Expense (-)'}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.addBtnSmall}
                onPress={() => setShowAddTxnModal(true)}
              >
                <Text style={styles.addBtnSmallText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={transactions}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={styles.listCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.reason || item.category}</Text>
                    <Text style={styles.cardSub}>
                      {new Date(item.date).toLocaleDateString()} • Ref: {item.referenceNumber || 'N/A'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.cardAmt,
                      { color: item.type === 'credit' ? Colors.income : Colors.expense },
                    ]}
                  >
                    {item.type === 'credit' ? '+' : '-'}
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              )}
            />
          </View>
        )}

        {/* TAB 3: RECURRING PAYMENTS */}
        {activeTab === 'recurring' && (
          <View style={{ flex: 1 }}>
            <View style={styles.filterStrip}>
              <Text style={styles.sectionTitle}>Recurring Schedules</Text>
              <TouchableOpacity
                style={styles.addBtnSmall}
                onPress={() => setShowAddRecModal(true)}
              >
                <Text style={styles.addBtnSmallText}>+ Add Schedule</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={recurringList}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={styles.recurringCard}>
                  <View style={styles.recurringTopRow}>
                    <View>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardSub}>
                        {item.paymentType} • {item.recurrenceType}
                      </Text>
                    </View>
                    <Text style={styles.cardAmt}>{formatCurrency(item.amount)}</Text>
                  </View>

                  <View style={styles.recurringBottomRow}>
                    <Text style={styles.cardSub}>
                      Next Due: {new Date(item.nextDueDate).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity
                      style={styles.settleBtn}
                      onPress={() => handleMarkPaid(item._id)}
                    >
                      <Text style={styles.settleBtnText}>Mark Paid ✓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* TAB 4: REPORTS */}
        {activeTab === 'reports' && (
          <ScrollView contentContainerStyle={styles.tabScroll}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>FINANCIAL EFFICIENCY</Text>
              <Text style={[styles.metricValue, { color: Colors.primary }]}>
                {reportData?.summary?.savingsRate || 0}% Savings Rate
              </Text>
              <Text style={styles.cardSub}>Retained from total earned income</Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category Expenditure</Text>
            </View>

            {reportData?.expenseCategories?.map((cat: any, i: number) => (
              <View key={i} style={styles.listCard}>
                <Text style={styles.cardTitle}>{cat._id}</Text>
                <Text style={styles.cardAmt}>{formatCurrency(cat.total)}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* TAB 5: PROFILE */}
        {activeTab === 'profile' && (
          <ScrollView contentContainerStyle={styles.tabScroll}>
            <View style={styles.profileHeaderCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarLetter}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <Text style={styles.profileName}>{user.name || 'Customer'}</Text>
              <Text style={styles.profilePhone}>+91 {user.phoneNumber}</Text>
            </View>

            <View style={styles.profileDetailCard}>
              <Text style={styles.fieldLabel}>Registered Bank</Text>
              <Text style={styles.cardTitle}>{user.bankName || 'Not configured'}</Text>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Account Number</Text>
              <Text style={styles.cardTitle}>{user.accountNumber || 'Not configured'}</Text>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 16 }]}
                onPress={() => {
                  setEditName(user.name || '');
                  setEditBank(user.bankName || '');
                  setEditAccount(user.accountNumber || '');
                  setShowEditProfileModal(true);
                }}
              >
                <Text style={styles.primaryBtnText}>Edit Profile Details</Text>
              </TouchableOpacity>
            </View>

            {/* Reset Walkthroughs Button */}
            <TouchableOpacity
              style={styles.resetTourBtn}
              onPress={handleResetWalkthroughs}
            >
              <Text style={styles.resetTourText}>✨ Reset All Walkthrough Tutorials</Text>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setUser(null);
                setToken(null);
                setAuthToken(null);
              }}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Bottom Navigation Strip */}
      <View style={styles.bottomNav}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'transactions', label: 'Income/Exp', icon: '💳' },
          { id: 'recurring', label: 'Recurring', icon: '🔄' },
          { id: 'reports', label: 'Reports', icon: '📈' },
          { id: 'profile', label: 'Profile', icon: '👤' },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navItem}
              onPress={() => {
                setActiveTab(item.id as any);
                checkModuleTutorial(user, item.id);
              }}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.navLabel,
                  isActive && { color: Colors.primary, fontWeight: 'bold' },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Add Transaction Modal */}
      <Modal visible={showAddTxnModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Record Transaction</Text>
            <View style={styles.typeToggleRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  txnType === 'credit' && { backgroundColor: Colors.income },
                ]}
                onPress={() => setTxnType('credit')}
              >
                <Text style={styles.typeBtnText}>Credit (Income)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  txnType === 'debit' && { backgroundColor: Colors.expense },
                ]}
                onPress={() => setTxnType('debit')}
              >
                <Text style={styles.typeBtnText}>Debit (Expense)</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              placeholder="Amount (₹)"
              value={txnAmount}
              onChangeText={setTxnAmount}
            />
            <TextInput
              style={[styles.textInput, { marginTop: 10 }]}
              placeholder="Category (e.g. Salary, EMI, Food)"
              value={txnCategory}
              onChangeText={setTxnCategory}
            />
            <TextInput
              style={[styles.textInput, { marginTop: 10 }]}
              placeholder="Reason / Notes"
              value={txnReason}
              onChangeText={setTxnReason}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddTxnModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateTxn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Recurring Modal */}
      <Modal visible={showAddRecModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Recurring Schedule</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Title (e.g. HDFC Home Loan)"
              value={recTitle}
              onChangeText={setRecTitle}
            />
            <TextInput
              style={[styles.textInput, { marginTop: 10 }]}
              placeholder="Category: EMI, Bank Loan, Sub, Gold, Home, Car"
              value={recCategory}
              onChangeText={setRecCategory}
            />
            <TextInput
              style={[styles.textInput, { marginTop: 10 }]}
              keyboardType="numeric"
              placeholder="Amount (₹)"
              value={recAmount}
              onChangeText={setRecAmount}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddRecModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateRecurring}
              >
                <Text style={styles.saveBtnText}>Save Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfileModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Customer Profile</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Customer Name"
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={[styles.textInput, { marginTop: 10 }]}
              placeholder="Bank Name"
              value={editBank}
              onChangeText={setEditBank}
            />
            <TextInput
              style={[styles.textInput, { marginTop: 10 }]}
              placeholder="Account Number"
              value={editAccount}
              onChangeText={setEditAccount}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    backgroundColor: '#3B0764',
  },
  authScroll: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  authLogoBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  authLogoIcon: {
    fontSize: 32,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 13,
    color: '#D8B4FE',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  onboardBadge: {
    color: '#F472B6',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
  },
  serverPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  serverPillText: {
    color: '#EDE9FE',
    fontSize: 11,
  },
  demoPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  demoPillText: {
    color: '#F3E8FF',
    fontSize: 12,
    fontWeight: '600',
  },
  authCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: 'bold',
  },
  disabledInput: {
    backgroundColor: '#F8FAFC',
    color: Colors.textMuted,
  },
  demoOtpHint: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'center',
  },
  linkText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  appHeader: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerAppTitle: {
    color: '#D8B4FE',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerUserGreeting: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerGuideBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  headerGuideText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  headerTourBtn: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  headerTourText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  headerBellBtn: {
    position: 'relative',
    padding: 6,
  },
  headerBellText: {
    fontSize: 18,
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.dueAlert,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  contentArea: {
    flex: 1,
  },
  tabScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  dueTodayBanner: {
    backgroundColor: Colors.dueAlert,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  dueTodayTag: {
    color: '#FFE4E6',
    fontSize: 10,
    fontWeight: '900',
  },
  dueTodayTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dueTodayAmt: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  duePayBtn: {
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  duePayBtnText: {
    color: Colors.dueAlert,
    fontSize: 13,
    fontWeight: 'bold',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  recurringCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  recurringTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurringBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardAmt: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.text,
  },
  settleBtn: {
    backgroundColor: Colors.income,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  settleBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
  },
  activeFilterPill: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  activeFilterPillText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  addBtnSmall: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addBtnSmallText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E9D5FF',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileHeaderCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: {
    fontSize: 26,
    color: Colors.white,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  profilePhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileDetailCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16,
  },
  resetTourBtn: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  resetTourText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.expense,
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 14,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
});

