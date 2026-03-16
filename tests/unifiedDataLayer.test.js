const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createProspect, getProspectById, getAllProspects, updateProspect, deleteProspect, getProspectUserId, updateProspectStatus } = require('../models/Prospect');
const { createUser, getUserByEmail, updateUserOAuthTokens, updateUserMicrosoftTokens } = require('../models/User');
const { createSequence, getSequenceById, getSequencesByUserId, updateSequence, deleteSequence } = require('../models/Sequence');
const { createSequenceStep, getSequenceStepsBySequenceId, updateSequenceStep, deleteSequenceStep } = require('../models/SequenceStep');
const { createEmailActivity, getEmailActivitiesByProspectId, getEmailActivitiesBySequenceStepId, updateEmailActivity, deleteEmailActivity } = require('../models/EmailActivity');
const { logTrackingPixelEvent, getTrackingPixelEventsByProspectId, getTrackingPixelEventsByBento } = require('../models/TrackingPixelEvent');

describe('Unified Data Layer Tests', () => {
  let bento = 0;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Prospect Model', () => {
    test('should create a prospect', async () => {
      const prospect = await createProspect('John', 'Doe', 'john.doe@example.com', 'Example Corp', 'Uncontacted', bento);
      expect(prospect.firstName).toBe('John');
      expect(prospect.lastName).toBe('Doe');
      expect(prospect.email).toBe('john.doe@example.com');
      expect(prospect.companyName).toBe('Example Corp');
      expect(prospect.status).toBe('Uncontacted');
    });

    test('should get a prospect by ID', async () => {
      const prospect = await createProspect('Jane', 'Smith', 'jane.smith@example.com', 'Example Corp', 'Uncontacted', bento);
      const retrievedProspect = await getProspectById(prospect.id, bento);
      expect(retrievedProspect.firstName).toBe('Jane');
      expect(retrievedProspect.lastName).toBe('Smith');
      expect(retrievedProspect.email).toBe('jane.smith@example.com');
      expect(retrievedProspect.companyName).toBe('Example Corp');
      expect(retrievedProspect.status).toBe('Uncontacted');
    });

    test('should update a prospect', async () => {
      const prospect = await createProspect('Alice', 'Johnson', 'alice.johnson@example.com', 'Example Corp', 'Uncontacted', bento);
      const updatedProspect = await updateProspect(prospect.id, { firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@example.com', companyName: 'Example Corp', status: 'Contacted' }, bento);
      expect(updatedProspect.status).toBe('Contacted');
    });

    test('should delete a prospect', async () => {
      const prospect = await createProspect('Bob', 'Brown', 'bob.brown@example.com', 'Example Corp', 'Uncontacted', bento);
      await deleteProspect(prospect.id, bento);
      const deletedProspect = await getProspectById(prospect.id, bento);
      expect(deletedProspect).toBeNull();
    });
  });

  describe('User Model', () => {
    test('should create a user', async () => {
      const user = await createUser('user@example.com', 'password123', bento);
      expect(user.email).toBe('user@example.com');
    });

    test('should get a user by email', async () => {
      const user = await createUser('user2@example.com', 'password123', bento);
      const retrievedUser = await getUserByEmail(user.email, bento);
      expect(retrievedUser.email).toBe('user2@example.com');
    });

    test('should update user OAuth tokens', async () => {
      const user = await createUser('user3@example.com', 'password123', bento);
      const updatedUser = await updateUserOAuthTokens(user.id, 'newAccessToken', 'newRefreshToken', bento);
      expect(updatedUser.accessToken).toBe('newAccessToken');
      expect(updatedUser.refreshToken).toBe('newRefreshToken');
    });

    test('should update user Microsoft tokens', async () => {
      const user = await createUser('user4@example.com', 'password123', bento);
      const updatedUser = await updateUserMicrosoftTokens(user.id, 'newMicrosoftAccessToken', 'newMicrosoftRefreshToken', bento);
      expect(updatedUser.microsoftAccessToken).toBe('newMicrosoftAccessToken');
      expect(updatedUser.microsoftRefreshToken).toBe('newMicrosoftRefreshToken');
    });
  });

  describe('Sequence Model', () => {
    test('should create a sequence', async () => {
      const user = await createUser('user5@example.com', 'password123', bento);
      const sequence = await createSequence(user.id, 'Test Sequence', bento);
      expect(sequence.name).toBe('Test Sequence');
    });

    test('should get a sequence by ID', async () => {
      const user = await createUser('user6@example.com', 'password123', bento);
      const sequence = await createSequence(user.id, 'Test Sequence 2', bento);
      const retrievedSequence = await getSequenceById(sequence.id, bento);
      expect(retrievedSequence.name).toBe('Test Sequence 2');
    });

    test('should update a sequence', async () => {
      const user = await createUser('user7@example.com', 'password123', bento);
      const sequence = await createSequence(user.id, 'Test Sequence 3', bento);
      const updatedSequence = await updateSequence(sequence.id, 'Updated Sequence', bento);
      expect(updatedSequence.name).toBe('Updated Sequence');
    });

    test('should delete a sequence', async () => {
      const user = await createUser('user8@example.com', 'password123', bento);
      const sequence = await createSequence(user.id, 'Test Sequence 4', bento);
      await deleteSequence(sequence.id, bento);
      const deletedSequence = await getSequenceById(sequence.id, bento);
      expect(deletedSequence).toBeNull();
    });
  });

  describe('SequenceStep Model', () => {
    test('should create a sequence step', async () => {
      const user = await createUser('user9@example.com', 'password123', bento);
      const sequence = await createSequence(user.id, 'Test Sequence 5', bento);
      const step = await createSequenceStep(sequence.id, 1, 0, 'Test Subject', 'Test Body', bento);
      expect(step.subject).toBe('Test Subject');
      expect(step.body).toBe('Test Body');
    });

    test('should get sequence steps by sequence ID', async () => {
      const user = await createUser('user10@example.com', 'password123', bento);
      const sequence = await createSequence(user.id, 'Test Sequence 6', bento);
      const step = await createSequenceStep(sequence.id, 1, 0, 'Test Subject 2', 'Test Body 2', bento);
      const steps = await getSequenceStepsBySequenceId(sequence.id, bento);
      expect(steps.length).toBe(1);
      expect(steps[0].subject).toBe('Test Subject 2');
      expect(steps[0].body).toBe('Test Body 2');
    });

    test('should update a sequence step', async () => {
      const user = await createUser('user11@example.com', 'password123', bento);
      const sequence = await createSequence(user.id, 'Test Sequence 7', bento);
      const step = await createSequenceStep(sequence.id, 1, 0, 'Test Subject 3', 'Test Body 3', bento);
      const updatedStep = await updateSequenceStep(step.id, 1, 0, 'Updated Subject', 'Updated Body', bento);
      expect(updatedStep.subject).toBe('Updated Subject');
      expect(updatedStep.body).toBe('Updated Body');
    });

    test('should delete a sequence step', async () => {
      const user = await createUser('user12@example.com', 'password123', bento);
      const sequence = await createSequence(user.id, 'Test Sequence 8', bento);
      const step = await createSequenceStep(sequence.id, 1, 0, 'Test Subject 4', 'Test Body 4', bento);
      await deleteSequenceStep(step.id, bento);
      const deletedStep = await getSequenceStepById(step.id, bento);
      expect(deletedStep).toBeNull();
    });
  });

  describe('EmailActivity Model', () => {
    test('should create an email activity', async () => {
      const prospect = await createProspect('John', 'Doe', 'john.doe@example.com', 'Example Corp', 'Uncontacted', bento);
      const sequenceStep = await createSequenceStep(1, 1, 0, 'Test Subject', 'Test Body', bento);
      const activity = await createEmailActivity(prospect.id, sequenceStep.id, 'Pending', bento);
      expect(activity.status).toBe('Pending');
    });

    test('should get email activities by prospect ID', async () => {
      const prospect = await createProspect('Jane', 'Smith', 'jane.smith@example.com', 'Example Corp', 'Uncontacted', bento);
      const sequenceStep = await createSequenceStep(1, 1, 0, 'Test Subject', 'Test Body', bento);
      const activity = await createEmailActivity(prospect.id, sequenceStep.id, 'Pending', bento);
      const activities = await getEmailActivitiesByProspectId(prospect.id, bento);
      expect(activities.length).toBe(1);
      expect(activities[0].status).toBe('Pending');
    });

    test('should get email activities by sequence step ID', async () => {
      const prospect = await createProspect('Alice', 'Johnson', 'alice.johnson@example.com', 'Example Corp', 'Uncontacted', bento);
      const sequenceStep = await createSequenceStep(1, 1, 0, 'Test Subject', 'Test Body', bento);
      const activity = await createEmailActivity(prospect.id, sequenceStep.id, 'Pending', bento);
      const activities = await getEmailActivitiesBySequenceStepId(sequenceStep.id, bento);
      expect(activities.length).toBe(1);
      expect(activities[0].status).toBe('Pending');
    });

    test('should update an email activity', async () => {
      const prospect = await createProspect('Bob', 'Brown', 'bob.brown@example.com', 'Example Corp', 'Uncontacted', bento);
      const sequenceStep = await createSequenceStep(1, 1, 0, 'Test Subject', 'Test Body', bento);
      const activity = await createEmailActivity(prospect.id, sequenceStep.id, 'Pending', bento);
      const updatedActivity = await updateEmailActivity(activity.id, 'Sent', bento);
      expect(updatedActivity.status).toBe('Sent');
    });

    test('should delete an email activity', async () => {
      const prospect = await createProspect('Charlie', 'Davis', 'charlie.davis@example.com', 'Example Corp', 'Uncontacted', bento);
      const sequenceStep = await createSequenceStep(1, 1, 0, 'Test Subject', 'Test Body', bento);
      const activity = await createEmailActivity(prospect.id, sequenceStep.id, 'Pending', bento);
      await deleteEmailActivity(activity.id, bento);
      const deletedActivity = await getEmailActivityById(activity.id, bento);
      expect(deletedActivity).toBeNull();
    });
  });

  describe('TrackingPixelEvent Model', () => {
    test('should log a tracking pixel event', async () => {
      const prospect = await createProspect('David', 'Evans', 'david.evans@example.com', 'Example Corp', 'Uncontacted', bento);
      const trackingPixelData = { pixelId: '12345' };
      const event = await logTrackingPixelEvent(prospect.id, bento, trackingPixelData);
      expect(event.trackingPixelData).toEqual(trackingPixelData);
    });

    test('should get tracking pixel events by prospect ID', async () => {
      const prospect = await createProspect('Eve', 'Foster', 'eve.foster@example.com', 'Example Corp', 'Uncontacted', bento);
      const trackingPixelData = { pixelId: '12345' };
      const event = await logTrackingPixelEvent(prospect.id, bento, trackingPixelData);
      const events = await getTrackingPixelEventsByProspectId(prospect.id, bento);
      expect(events.length).toBe(1);
      expect(events[0].trackingPixelData).toEqual(trackingPixelData);
    });

    test('should get tracking pixel events by bento', async () => {
      const prospect = await createProspect('Frank', 'Garcia', 'frank.garcia@example.com', 'Example Corp', 'Uncontacted', bento);
      const trackingPixelData = { pixelId: '12345' };
      const event = await logTrackingPixelEvent(prospect.id, bento, trackingPixelData);
      const events = await getTrackingPixelEventsByBento(bento);
      expect(events.length).toBe(1);
      expect(events[0].trackingPixelData).toEqual(trackingPixelData);
    });
  });
});
