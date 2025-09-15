import type { SVGProps } from 'react';
import Image from 'next/image';

export function Logo(props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) {
  return (
    <Image
      src="https://iili.io/KTE9RXj.png"
      alt="SportBet Replica Logo"
      width={150}
      height={38}
      priority
      {...props}
    />
  );
}

    