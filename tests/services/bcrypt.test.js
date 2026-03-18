const bcrypt = require('../services/bcrypt');

describe('bcrypt', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hashPassword(password);
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toBeInstanceOf(String);
    });
  });

  describe('comparePassword', () => {
    it('should return true for a valid password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hashPassword(password);
      const isMatch = await bcrypt.comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for an invalid password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword123';
      const hashedPassword = await bcrypt.hashPassword(password);
      const isMatch = await bcrypt.comparePassword(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });
  });
});
