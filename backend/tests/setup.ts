import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, inject, vi } from 'vitest';
import { mailer } from '../src/config/mailer.js';
import { settingsService } from '../src/services/settings.service.js';
// Registers every model before indexes are synced.
import '../src/routes/index.js';
import '../src/models/AuditLog.js';
import '../src/models/GeocodeCache.js';

beforeAll(async () => {
  const uri = inject('mongoUri');
  await mongoose.connect(uri, { dbName: `test-${randomUUID()}` });
  // Unique + text indexes must exist for conflict and search tests.
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()));
});

beforeEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
  settingsService.invalidate();
  vi.restoreAllMocks();
  // No real email in tests — individual tests assert on this spy.
  vi.spyOn(mailer, 'send').mockResolvedValue(undefined);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
