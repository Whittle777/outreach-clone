// services/mcp.test.js

const { MCP } = require('./mcp');

describe('MCP', () => {
  let mcp;

  beforeEach(() => {
    mcp = new MCP();
  });

  describe('encrypt', () => {
    it('should encrypt data correctly', () => {
      const data = 'test data';
      const encrypted = mcp.encrypt(data);
      expect(encrypted).not.toBe(data);
    });
  });

  describe('decrypt', () => {
    it('should decrypt data correctly', () => {
      const data = 'test data';
      const encrypted = mcp.encrypt(data);
      const decrypted = mcp.decrypt(encrypted);
      expect(decrypted).toBe(data);
    });
  });

  describe('sign', () => {
    it('should sign data correctly', () => {
      const data = 'test data';
      const signature = mcp.sign(data);
      expect(signature).not.toBe(data);
    });
  });

  describe('verify', () => {
    it('should verify a valid signature', () => {
      const data = 'test data';
      const signature = mcp.sign(data);
      const isValid = mcp.verify(data, signature);
      expect(isValid).toBe(true);
    });

    it('should return false for an invalid signature', () => {
      const data = 'test data';
      const signature = 'invalid signature';
      const isValid = mcp.verify(data, signature);
      expect(isValid).toBe(false);
    });
  });
});
