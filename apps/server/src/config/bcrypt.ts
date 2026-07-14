import bcrypt from 'bcrypt';

import { env } from './environment';

export const bcryptConfig = Object.freeze({
  saltRounds: env.BCRYPT_SALT_ROUNDS,
});

// A precomputed hash with no corresponding real password. Used so that rejecting a
// login for "no such account" takes about as long as rejecting one for "wrong
// password" - without this, the two are distinguishable by response time, letting
// login be used to enumerate which identifiers are registered.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('no-such-account', bcryptConfig.saltRounds);

export const compareDummyPassword = async (candidatePassword: string): Promise<void> => {
  await bcrypt.compare(candidatePassword, DUMMY_PASSWORD_HASH);
};
