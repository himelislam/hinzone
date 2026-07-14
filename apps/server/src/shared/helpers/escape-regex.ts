// Escapes regex metacharacters in user-supplied search text before it is used to
// build a RegExp - without this, a search term containing e.g. `.*` or `(` could
// behave unpredictably (or pathologically) as a NoSQL query operand.
export const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
