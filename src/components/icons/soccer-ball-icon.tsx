import type { SVGProps } from 'react';

export function SoccerBallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2a10 10 0 0 0-7.5 18.07"></path>
        <path d="M22 12a10 10 0 0 0-18.07-7.5"></path>
        <path d="M16.24 3.76a10 10 0 0 0-8.48 16.48"></path>
        <path d="M3.76 7.76a10 10 0 0 0 16.48 8.48"></path>
        <path d="M12 22a10 10 0 0 0 7.5-18.07"></path>
        <path d="M2 12a10 10 0 0 0 18.07 7.5"></path>
    </svg>
  );
}
