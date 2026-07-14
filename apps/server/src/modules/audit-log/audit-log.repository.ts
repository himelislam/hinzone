import type { QueryFilter, Types } from 'mongoose';

import { AuditLog } from './audit-log.model';
import type { AuditLogDocument } from './audit-log.model';
import type { AuditAction, AuditContext, CreateAuditLogInput, IAuditLog } from './audit-log.types';

export interface AuditLogListOptions {
  page: number;
  limit: number;
}

export interface PaginatedAuditLogs {
  items: AuditLogDocument[];
  total: number;
}

const create = async (data: CreateAuditLogInput): Promise<AuditLogDocument> => {
  return AuditLog.create(data);
};

const list = async (
  options: AuditLogListOptions,
  filter: QueryFilter<IAuditLog> = {},
): Promise<PaginatedAuditLogs> => {
  const skip = (options.page - 1) * options.limit;

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(options.limit).exec(),
    AuditLog.countDocuments(filter).exec(),
  ]);

  return { items, total };
};

// Convenience wrapper for the common case of logging an event against a User entity
// (every authentication event does this) - avoids repeating entity/entityId at
// every call site.
const logUserAction = async (
  userId: Types.ObjectId,
  action: AuditAction,
  context: AuditContext = {},
): Promise<void> => {
  await create({
    userId,
    action,
    entity: 'User',
    entityId: userId.toString(),
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
};

export const auditLogRepository = {
  create,
  list,
  logUserAction,
};
