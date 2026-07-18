import type { Types } from 'mongoose';

export interface IAuditLog {
  userId: Types.ObjectId;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
  // Populated by Mongoose via the `timestamps: { createdAt: true, updatedAt: false }`
  // schema option - there is deliberately no updatedAt (audit logs are immutable).
  createdAt: Date;
}

export interface CreateAuditLogInput {
  userId: Types.ObjectId;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

// Request metadata every audit-writing service/controller threads through -
// deliberately narrower than auth.types.ts's AuthRequestContext (no
// device/browser/operatingSystem), since only session creation needs those.
export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

// Authentication events that must create an audit log, per
// docs/07-authentication.md #28. Enum-like constant rather than free-form strings,
// per database_rules.md #19 ("use enums for fixed values, avoid arbitrary strings").
export const AUDIT_ACTIONS = {
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
  USER_LOGOUT: 'USER_LOGOUT',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  REFRESH_TOKEN_ROTATED: 'REFRESH_TOKEN_ROTATED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  // Admin-on-another-user actions - prefixed to distinguish them from the
  // self-actions above when reviewing the audit trail.
  ADMIN_USER_UPDATED: 'ADMIN_USER_UPDATED',
  ADMIN_USER_STATUS_CHANGED: 'ADMIN_USER_STATUS_CHANGED',
  ADMIN_USER_DELETED: 'ADMIN_USER_DELETED',
  // docs/20-settings-system.md #27 - one action for every category, since the
  // category itself is already captured in entityId; before/after carry the
  // actual previous/new values.
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  // tasks/phase-04.md - "Every adjustment requires: Reason, Admin
  // authentication, Audit log." before/after carry balanceBefore/balanceAfter.
  WALLET_ADJUSTED: 'WALLET_ADJUSTED',
  // tasks/phase-05.md's Approval/Rejection Workflows - before/after carry the
  // deposit's previous/new status (plus adminNote/rejectionReason on after).
  DEPOSIT_APPROVED: 'DEPOSIT_APPROVED',
  DEPOSIT_REJECTED: 'DEPOSIT_REJECTED',
  // tasks/phase-06.md's Approval/Rejection/Processing/Completion Workflows -
  // before/after carry the withdrawal's previous/new status (plus adminNote/
  // rejectionReason on after where applicable). WITHDRAWAL_COMPLETED is the
  // one action tied to an actual wallet debit (tasks/breakdown/phase-06-tasks.md's
  // "decision 1") - its own before/after still only carry status, since
  // balance history already lives on the ledger Transaction created by
  // WalletService.debit(), same reasoning DEPOSIT_APPROVED's audit log uses.
  WITHDRAWAL_APPROVED: 'WITHDRAWAL_APPROVED',
  WITHDRAWAL_REJECTED: 'WITHDRAWAL_REJECTED',
  WITHDRAWAL_PROCESSING: 'WITHDRAWAL_PROCESSING',
  WITHDRAWAL_COMPLETED: 'WITHDRAWAL_COMPLETED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
