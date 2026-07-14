import { Schema, model } from 'mongoose';
import type { HydratedDocument, Model } from 'mongoose';

import type { IAuditLog } from './audit-log.types';

// Audit logs are immutable once written (database_rules.md #16), so updatedAt is
// intentionally disabled - only createdAt is meaningful for this collection.
const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entity: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

export type AuditLogDocument = HydratedDocument<IAuditLog>;
export type AuditLogModel = Model<IAuditLog>;

export const AuditLog = model<IAuditLog, AuditLogModel>('AuditLog', auditLogSchema, 'auditLogs');
