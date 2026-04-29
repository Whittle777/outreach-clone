const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(authenticateToken);

const ALLOWED = new Set([
  'name', 'domain', 'website', 'industry', 'subIndustry', 'revenue', 'employees',
  'country', 'region', 'city', 'description', 'notes', 'status', 'tier',
  'techStack', 'tags', 'linkedInUrl', 'twitterUrl', 'foundedYear',
]);

const accountIncludes = {
  prospects: {
    select: {
      id: true, firstName: true, lastName: true, email: true,
      title: true, phone: true, status: true, enrichmentStatus: true,
      trackingPixelData: true,
      _count: { select: { emailActivities: true, callActivities: true, meetingActivities: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
  _count: { select: { prospects: true } },
  owners: { select: { id: true, name: true, email: true } },
};

// GET /accounts — list all with prospect count
router.get('/', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        _count: { select: { prospects: true } },
        owners: { select: { id: true, name: true, email: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /accounts/:id — full detail with prospects
router.get('/:id', async (req, res) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: parseInt(req.params.id) },
      include: accountIncludes,
    });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /accounts — create
router.post('/', async (req, res) => {
  const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => ALLOWED.has(k)));
  if (!data.name) return res.status(400).json({ message: 'name is required' });
  try {
    const account = await prisma.account.create({
      data: {
        ...data,
        owners: { connect: [{ id: req.userId }] },
      },
      include: accountIncludes,
    });
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /accounts/:id/owners — add an owner
router.post('/:id/owners', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  try {
    const account = await prisma.account.update({
      where: { id: parseInt(req.params.id) },
      data: { owners: { connect: { id: parseInt(userId) } } },
      include: accountIncludes,
    });
    res.json(account);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /accounts/:id/owners/:ownerId — remove an owner
router.delete('/:id/owners/:ownerId', async (req, res) => {
  try {
    const account = await prisma.account.update({
      where: { id: parseInt(req.params.id) },
      data: { owners: { disconnect: { id: parseInt(req.params.ownerId) } } },
      include: accountIncludes,
    });
    res.json(account);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /accounts/:id — update
router.put('/:id', async (req, res) => {
  const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => ALLOWED.has(k)));
  try {
    const account = await prisma.account.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: accountIncludes,
    });
    res.json(account);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /accounts/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.account.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /accounts/:id/link-prospect — link a prospect to this account
router.post('/:id/link-prospect', async (req, res) => {
  const { prospectId } = req.body;
  if (!prospectId) return res.status(400).json({ message: 'prospectId required' });
  try {
    const prospect = await prisma.prospect.update({
      where: { id: parseInt(prospectId) },
      data: { accountId: parseInt(req.params.id) },
    });
    res.json(prospect);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /accounts/:id/link-prospect/:prospectId — unlink
router.delete('/:id/link-prospect/:prospectId', async (req, res) => {
  try {
    await prisma.prospect.update({
      where: { id: parseInt(req.params.prospectId) },
      data: { accountId: null },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /accounts/auto-link — auto-link prospects to accounts by matching companyName
router.post('/auto-link', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({ select: { id: true, name: true } });
    let linked = 0;
    for (const acc of accounts) {
      const result = await prisma.prospect.updateMany({
        where: { companyName: { equals: acc.name }, accountId: null },
        data: { accountId: acc.id },
      });
      linked += result.count;
    }
    res.json({ linked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
