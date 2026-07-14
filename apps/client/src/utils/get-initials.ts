export const getInitials = (fullName?: string | null): string => {
  if (!fullName) {
    return '?';
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');

  return initials.join('') || '?';
};
