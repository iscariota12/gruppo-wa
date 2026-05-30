import type { Member } from '../types';

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

interface MemberAvatarProps {
  member: Member;
  size?: keyof typeof sizeMap;
  showRing?: boolean;
  ringColor?: string;
}

export function MemberAvatar({
  member,
  size = 'md',
  showRing = false,
  ringColor,
}: MemberAvatarProps) {
  return (
    <div
      className={`${sizeMap[size]} flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md ${
        showRing ? 'ring-4 ring-offset-2 ring-offset-white' : ''
      }`}
      style={{
        backgroundColor: member.color,
        ...(showRing ? { boxShadow: `0 0 0 4px ${ringColor ?? member.color}40` } : {}),
      }}
      title={member.displayName}
      aria-label={member.displayName}
    >
      {member.initials}
    </div>
  );
}
