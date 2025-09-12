import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="150"
      height="37.5"
      {...props}
    >
      <text
        x="10"
        y="35"
        fontFamily="'Poppins', sans-serif"
        fontSize="30"
        fontWeight="bold"
        fill="hsl(var(--primary))"
      >
        SportBet
      </text>
      <text
        x="138"
        y="35"
        fontFamily="'Poppins', sans-serif"
        fontSize="30"
        fill="hsl(var(--foreground))"
      >
        Replica
      </text>
    </svg>
  );
}
