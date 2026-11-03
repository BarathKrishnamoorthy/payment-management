const RecurringPayment = require('../models/RecurringPayment');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Checks all active recurring payments and creates notifications for:
 * 1. Payments due TODAY
 * 2. Payments due within the next 3 days (upcoming reminder)
 */
const checkAndSendRecurringNotifications = async (userId = null) => {
  try {
    const query = { status: 'Active' };
    if (userId) {
      query.user = userId;
    }

    const recurringPayments = await RecurringPayment.find(query).populate('user', 'name phoneNumber pushToken');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    threeDaysLater.setHours(23, 59, 59, 999);

    let createdCount = 0;

    for (const payment of recurringPayments) {
      const nextDue = new Date(payment.nextDueDate);
      nextDue.setHours(0, 0, 0, 0);

      const isDueToday = nextDue.getTime() === today.getTime();
      const isUpcoming = nextDue > today && nextDue <= threeDaysLater;

      if (isDueToday) {
        // Check if notification for today already exists for this payment
        const existing = await Notification.findOne({
          user: payment.user._id,
          relatedId: payment._id,
          type: 'due_today',
          createdAt: { $gte: today, $lte: endOfToday },
        });

        if (!existing) {
          await Notification.create({
            user: payment.user._id,
            title: `Payment Due Today: ${payment.title}`,
            message: `Your ${payment.paymentType} payment of ₹${payment.amount.toLocaleString()} for "${payment.title}" is due today. Please settle it to avoid late fees.`,
            type: 'due_today',
            relatedId: payment._id,
            amount: payment.amount,
            dueDate: payment.nextDueDate,
          });
          createdCount++;
        }
      } else if (isUpcoming) {
        const diffTime = nextDue.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const existing = await Notification.findOne({
          user: payment.user._id,
          relatedId: payment._id,
          type: 'upcoming_due',
          createdAt: { $gte: today, $lte: endOfToday },
        });

        if (!existing) {
          await Notification.create({
            user: payment.user._id,
            title: `Upcoming Payment: ${payment.title}`,
            message: `Reminder: Your ${payment.paymentType} payment of ₹${payment.amount.toLocaleString()} is due in ${diffDays} day${diffDays > 1 ? 's' : ''} on ${payment.nextDueDate.toLocaleDateString()}.`,
            type: 'upcoming_due',
            relatedId: payment._id,
            amount: payment.amount,
            dueDate: payment.nextDueDate,
          });
          createdCount++;
        }
      }
    }

    console.log(`[NotificationService] Checked recurring payments. Generated ${createdCount} new notifications.`);
    return { success: true, count: createdCount };
  } catch (err) {
    console.error('[NotificationService] Error checking notifications:', err);
    return { success: false, error: err.message };
  }
};

module.exports = { checkAndSendRecurringNotifications };

