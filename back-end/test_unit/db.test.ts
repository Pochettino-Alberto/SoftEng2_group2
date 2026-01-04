import path from 'path';

describe('db unit module', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.TEST_DB_IN_MEMORY = 'true';
  });

  it('mocks sqlite and resolves dbReady', async () => {
    jest.doMock('sqlite3', () => ({
      Database: function (_: any, __: any, cb: any) {
        const callback = typeof __ === 'function' ? __ : cb;
        callback(null); // Simulate successful open
        return {
          run: jest.fn(),
          get: jest.fn((q, p, cb) => cb(null, { name: 'users' })), // Simulate table exists
          serialize: jest.fn((fn) => fn())
        };
      }
    }));

    const { dbReady } = require('../src/dao/db');
    await expect(dbReady).resolves.toBeUndefined();
  });
});