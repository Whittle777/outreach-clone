const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const PROSPECTS = [
  { firstName: 'Sarah',   lastName: 'Chen',       email: 'schen@vertexai.io',       companyName: 'Vertex AI Solutions', title: 'VP of Engineering',        phone: '+1 415 555 0192', status: 'Uncontacted' },
  { firstName: 'Marcus',  lastName: 'Okafor',     email: 'mokafor@bridgepoint.com',  companyName: 'BridgePoint Capital', title: 'Head of Operations',       phone: '+1 212 555 0341', status: 'Uncontacted' },
  { firstName: 'Priya',   lastName: 'Sharma',     email: 'priya.sharma@nexushr.co',  companyName: 'Nexus HR',            title: 'Chief People Officer',     phone: '+1 650 555 0887', status: 'In Sequence' },
  { firstName: 'James',   lastName: 'Whitfield',  email: 'jwhitfield@lumencorp.com', companyName: 'Lumen Corp',          title: 'Director of Sales',        phone: '+1 312 555 0554', status: 'Replied'     },
  { firstName: 'Elena',   lastName: 'Vasquez',    email: 'evasquez@orbitaldata.io',  companyName: 'Orbital Data',        title: 'CTO',                      phone: '+1 469 555 0211', status: 'Uncontacted' },
  { firstName: 'Tom',     lastName: 'Gallagher',  email: 'tgallagher@apexsuite.com', companyName: 'Apex Suite',          title: 'CEO',                      phone: '+1 617 555 0763', status: 'Uncontacted' },
  { firstName: 'Amara',   lastName: 'Nwosu',      email: 'anwosu@clearpath.tech',    companyName: 'ClearPath Tech',      title: 'VP of Product',            phone: '+1 737 555 0094', status: 'Meeting Booked' },
  { firstName: 'David',   lastName: 'Kim',        email: 'dkim@stackbridge.dev',     companyName: 'StackBridge',         title: 'Engineering Manager',      phone: '+1 206 555 0437', status: 'Uncontacted' },
  { firstName: 'Rachel',  lastName: 'Thornton',   email: 'rthornton@meridianhr.com', companyName: 'Meridian HR',         title: 'Head of People & Culture', phone: '+1 303 555 0619', status: 'Uncontacted' },
  { firstName: 'Carlos',  lastName: 'Mendez',     email: 'cmendez@quantumleap.io',   companyName: 'Quantum Leap',        title: 'COO',                      phone: '+1 512 555 0882', status: 'In Sequence' },
  { firstName: 'Nina',    lastName: 'Petrov',     email: 'npetrov@driftanalytics.co',companyName: 'Drift Analytics',    title: 'Data Science Lead',        phone: '+1 415 555 0371', status: 'Uncontacted' },
  { firstName: 'Oliver',  lastName: 'Bennett',    email: 'obennett@catalystops.com', companyName: 'Catalyst Ops',        title: 'VP of Customer Success',   phone: '+1 646 555 0248', status: 'Not Interested'},
  { firstName: 'Zoe',     lastName: 'Park',       email: 'zpark@novalink.io',        companyName: 'NovaLink',            title: 'Director of Growth',       phone: '+1 415 555 0993', status: 'Uncontacted' },
  { firstName: 'Ethan',   lastName: 'Reynolds',   email: 'ereynolds@fusionstack.com',companyName: 'FusionStack',         title: 'Head of RevOps',           phone: '+1 213 555 0177', status: 'Uncontacted' },
  { firstName: 'Keiko',   lastName: 'Tanaka',     email: 'ktanaka@heliosgroup.co',   companyName: 'Helios Group',        title: 'Chief Revenue Officer',    phone: '+1 408 555 0562', status: 'Uncontacted' },
];

async function main() {
  // ── Seed user ────────────────────────────────────────────────────────────────
  let user = await prisma.user.findFirst();
  if (!user) {
    const hashed = await bcrypt.hash('password123', 10);
    user = await prisma.user.create({
      data: { email: 'henry@apex-bdr.ai', username: 'henry', password: hashed },
    });
    console.log('✓ Created user:', user.email);
  } else {
    console.log('✓ User exists:', user.email, '(id:', user.id + ')');
  }

  // ── Seed prospects ───────────────────────────────────────────────────────────
  let created = 0;
  for (const p of PROSPECTS) {
    const existing = await prisma.prospect.findUnique({ where: { email: p.email } });
    if (!existing) {
      await prisma.prospect.create({ data: p });
      created++;
    }
  }
  console.log(`✓ Prospects: ${created} created, ${PROSPECTS.length - created} already existed`);

  // ── Seed a demo sequence ─────────────────────────────────────────────────────
  let seq = await prisma.sequence.findFirst({ where: { name: 'Q2 Enterprise Outbound' } });
  if (!seq) {
    seq = await prisma.sequence.create({
      data: {
        name: 'Q2 Enterprise Outbound',
        userId: user.id,
        steps: {
          create: [
            {
              order: 1, stepType: 'AUTO_EMAIL', delayDays: 0,
              subject: 'Quick question for {{firstName}}',
              body: 'Hi {{firstName}},\n\nI noticed {{company}} has been scaling its {{title}} function — congrats on the growth.\n\nI\'m reaching out because we\'ve helped similar teams cut their prospecting time in half using AI-powered outreach. Would a 15-minute call this week make sense?\n\nBest,\nHenry',
            },
            {
              order: 2, stepType: 'CALL', delayDays: 2,
              subject: 'Discovery call with {{firstName}}',
              body: 'Objective: Understand current outreach process and pain points.\nTalk track: "Hi {{firstName}}, I sent you an email a couple of days ago about how we help teams like yours..."',
            },
            {
              order: 3, stepType: 'AUTO_EMAIL', delayDays: 3,
              subject: 'Re: Quick question for {{firstName}}',
              body: 'Hi {{firstName}},\n\nFollowing up on my earlier note. I know you\'re busy, so I\'ll keep this short — we\'ve helped 3 companies similar to {{company}} book 40% more meetings in their first month.\n\nWorth a quick chat?\n\nHenry',
            },
            {
              order: 4, stepType: 'LINKEDIN', delayDays: 2,
              subject: 'Connect with {{firstName}} on LinkedIn',
              body: 'Send a personalised connection request referencing the email sequence.',
            },
          ],
        },
      },
      include: { steps: true },
    });
    console.log(`✓ Created sequence "${seq.name}" with ${seq.steps.length} steps`);
  } else {
    console.log(`✓ Demo sequence already exists`);
  }

  // ── Enrol a couple of prospects so the UI shows activity ────────────────────
  const toEnrol = await prisma.prospect.findMany({
    where: { status: { in: ['In Sequence', 'Replied', 'Meeting Booked'] } },
    take: 3,
  });

  for (const p of toEnrol) {
    const existing = await prisma.sequenceEnrollment.findUnique({
      where: { prospectId_sequenceId: { prospectId: p.id, sequenceId: seq.id } },
    });
    if (!existing) {
      await prisma.sequenceEnrollment.create({
        data: {
          prospectId: p.id,
          sequenceId: seq.id,
          status: p.status === 'Replied' ? 'replied' : 'active',
          currentStepOrder: p.status === 'Replied' ? 2 : 1,
          lastContactedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          nextStepDue: p.status === 'Replied' ? null : new Date(),
        },
      });
    }
  }
  console.log(`✓ Enrolled ${toEnrol.length} prospects into demo sequence`);

  console.log('\n🎉 Demo data ready. Frontend: http://localhost:5175');
}

main().catch(console.error).finally(() => prisma.$disconnect());
