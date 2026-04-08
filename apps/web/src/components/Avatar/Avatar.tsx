import { getAvatarColors, getInitials } from '../../utils/avatar';

interface AvatarProps {
  name: string;
  size?: number;
  fontSize?: number;
}

export function Avatar({ name, size = 36, fontSize = 13 }: AvatarProps) {
  const { bg, text } = getAvatarColors(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}
