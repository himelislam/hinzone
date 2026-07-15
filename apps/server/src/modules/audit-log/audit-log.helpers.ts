import type { Request } from 'express';

import type { AuditContext } from './audit-log.types';

// Shared by every admin controller that writes an audit log entry
// (admin-users.controller.ts, admin-settings.controller.ts) - narrower than
// auth.controller.ts's buildRequestContext (no device/browser/operatingSystem),
// since only session creation needs those.
export const buildAuditContext = (req: Request): AuditContext => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
