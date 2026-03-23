const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EmailActivities {
  static async updateStatus(email, status) {
    try {
      await prisma.emailActivities.update({
        where: { email },
        data: { status },
      });
    } catch (error) {
      console.error(`Error updating email status for ${email}:`, error);
    }
  }

  static async detectHardBounce(email) {
    // Implement logic to detect hard bounce
    // For now, let's assume we have a method to check if an email is hard bounced
    // This is a placeholder implementation
    const hardBouncePatterns = [
      '5.1.1',
      '5.1.2',
      '5.3.0',
      '5.3.4',
      '5.3.5',
      '5.4.1',
      '5.4.7',
      '5.7.1',
    ];

    // Simulate checking for hard bounce
    const bounceCode = Math.floor(Math.random() * 10); // Random number for demonstration
    return hardBouncePatterns.includes(bounceCode.toString());
  }

  static async getSoftBouncedEmails() {
    try {
      const softBouncedEmails = await prisma.emailActivities.findMany({
        where: { status: 'soft-bounced' },
      });
      return softBouncedEmails;
    } catch (error) {
      console.error('Error fetching soft-bounced emails:', error);
      return [];
    }
  }

  static async trackLinkClick(email, url) {
    try {
      await prisma.emailActivities.create({
        data: {
          email,
          url,
          clickedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Error tracking link click for ${email}:`, error);
    }
  }
}

module.exports = EmailActivities;
