const PALETTE = [
  { bg: '#ddd6fe', text: '#5b21b6' }, // violet
  { bg: '#bfdbfe', text: '#1e40af' }, // blue
  { bg: '#fde68a', text: '#92400e' }, // yellow
  { bg: '#a7f3d0', text: '#065f46' }, // green
  { bg: '#fecaca', text: '#991b1b' }, // red
  { bg: '#fed7aa', text: '#c2410c' }, // orange
  { bg: '#f9a8d4', text: '#9d174d' }, // pink
  { bg: '#c7d2fe', text: '#3730a3' }, // indigo
  { bg: '#99f6e4', text: '#0f766e' }, // teal
  { bg: '#d9f99d', text: '#3f6212' }, // lime
];

export function getAvatarColors(name: string): { bg: string; text: string } {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
