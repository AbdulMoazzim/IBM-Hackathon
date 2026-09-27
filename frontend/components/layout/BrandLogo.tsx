import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

export default function BrandLogo({ className, compact = false }: BrandLogoProps) {
  return (
    <Image
      src={compact ? '/vibeguard-mark.svg' : '/vibeguard-logo.svg'}
      alt={compact ? 'VibeGuard' : 'VibeGuard — Build with confidence'}
      width={compact ? 48 : 220}
      height={compact ? 48 : 48}
      className={className}
    />
  );
}
