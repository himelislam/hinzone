import type { Types } from 'mongoose';

import type { CreateSessionInput } from './auth.types';
import { Session } from './session.model';
import type { SessionDocument } from './session.model';

const create = async (data: CreateSessionInput): Promise<SessionDocument> => {
  return Session.create(data);
};

const findActiveByUser = async (userId: Types.ObjectId): Promise<SessionDocument[]> => {
  return Session.find({ userId, expiresAt: { $gt: new Date() } })
    .sort({ lastActivity: -1 })
    .exec();
};

// Sessions have no "revoked" flag - per docs/07-authentication.md #14, logout deletes
// the session record outright rather than marking it inactive.
const revokeById = async (sessionId: string): Promise<void> => {
  await Session.deleteOne({ _id: sessionId }).exec();
};

// Used by password change/reset, which invalidate every existing session
// (docs/07-authentication.md #20).
const deleteAllForUser = async (userId: Types.ObjectId): Promise<void> => {
  await Session.deleteMany({ userId }).exec();
};

export const sessionRepository = {
  create,
  findActiveByUser,
  revokeById,
  deleteAllForUser,
};
