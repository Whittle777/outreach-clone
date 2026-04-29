const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(authenticateToken);

/**
 * GET /email-activities/sequence/:sequenceId
 * Returns a merged list of:
 *   - EmailActivity records (sent, opened, failed, cancelled) for this sequence
 *   - Upcoming/scheduled items derived from active SequenceEnrollments with nextStepDue set
 */
router.get('/sequence/:sequenceId', async (req, res) => {
  const sequenceId = parseInt(req.params.sequenceId);
  try {
    // Historical activity records
    const activities = await prisma.emailActivity.findMany({
      where: {
        enrollment: { sequenceId },
      },
      include: {
        prospect: { select: { id: true, firstName: true, lastName: true, email: true, companyName: true } },
        sequenceStep: { select: { id: true, order: true, subject: true, stepType: true } },
        enrollment: { select: { id: true, currentStepOrder: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Upcoming scheduled emails — active enrollments with a nextStepDue
    const scheduled = await prisma.sequenceEnrollment.findMany({
      where: { sequenceId, status: 'active', nextStepDue: { not: null } },
      include: {
        prospect: { select: { id: true, firstName: true, lastName: true, email: true, companyName: true } },
        sequence: {
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
    });

    // Build scheduled items — find the next step for each enrollment
    const scheduledItems = scheduled.map(enr => {
      const nextStep = enr.sequence.steps.find(s =>
        enr.currentStepOrder === 0 ? s.order === 1 : s.order > enr.currentStepOrder
      );
      return {
        type: 'scheduled',
        enrollmentId: enr.id,
        prospect: enr.prospect,
        sequenceStep: nextStep ? { id: nextStep.id, order: nextStep.order, subject: nextStep.subject, stepType: nextStep.stepType } : null,
        subject: nextStep?.subject || '',
        scheduledFor: enr.nextStepDue,
        status: 'scheduled',
      };
    });

    const activityItems = activities.map(a => ({ type: 'activity', ...a }));

    res.json([...scheduledItems, ...activityItems]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /email-activities/:id/cancel
 * Mark an EmailActivity as cancelled (for sent/failed records).
 */
router.patch('/:id/cancel', async (req, res) => {
  try {
    const activity = await prisma.emailActivity.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'cancelled' },
    });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /email-activities/enrollment/:enrollmentId/cancel
 * Cancel a scheduled email — pauses the enrollment so nextStepDue is cleared.
 */
router.patch('/enrollment/:enrollmentId/cancel', async (req, res) => {
  try {
    const enrollment = await prisma.sequenceEnrollment.update({
      where: { id: parseInt(req.params.enrollmentId) },
      data: { status: 'paused', nextStepDue: null, pausedAt: new Date(), pausedReason: 'Cancelled by user' },
    });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /email-activities/enrollment/:enrollmentId/reschedule
 * Reschedule a scheduled email — updates nextStepDue.
 * Body: { scheduledFor: ISO date string }
 */
router.patch('/enrollment/:enrollmentId/reschedule', async (req, res) => {
  const { scheduledFor } = req.body;
  if (!scheduledFor) return res.status(400).json({ message: 'scheduledFor required' });
  try {
    const enrollment = await prisma.sequenceEnrollment.update({
      where: { id: parseInt(req.params.enrollmentId) },
      data: { status: 'active', nextStepDue: new Date(scheduledFor), pausedAt: null, pausedReason: null },
    });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /email-activities/enrollment/:enrollmentId/retry
 * Retry a failed email — set nextStepDue to now so it's picked up by the next cron run.
 */
router.patch('/enrollment/:enrollmentId/retry', async (req, res) => {
  try {
    const enrollment = await prisma.sequenceEnrollment.update({
      where: { id: parseInt(req.params.enrollmentId) },
      data: { status: 'active', nextStepDue: new Date(), pausedAt: null, pausedReason: null },
    });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
