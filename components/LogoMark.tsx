import React from 'react';
import Image from 'next/image';

export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="RiadhCard Logo"
      width={size * 3}
      height={size}
      style={{ height: size, width: 'auto', objectFit: 'contain' }}
      priority
    />
  );
}
