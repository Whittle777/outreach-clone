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
}

module.exports = EmailActivities;
