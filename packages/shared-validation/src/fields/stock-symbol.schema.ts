import { z } from 'zod';

// tasks/phase-07.md - Stock Symbol Rules: examples AAPL/GOOGL/MSFT/TSLA/META,
// "must be unique." Uniqueness itself is a database concern (checked via
// stockRepository.findBySymbol + assertUniqueSymbol - a stateless Zod schema
// can't express it), so this only validates shape: trimmed, normalized to
// uppercase, 1-10 characters of letters/digits/dot (the dot allows
// class-suffixed symbols like "BRK.A").
export const stockSymbolSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9.]{1,10}$/, 'Symbol must be 1-10 uppercase letters, digits, or dots.');
