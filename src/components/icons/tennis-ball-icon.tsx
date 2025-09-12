import type { SVGProps } from 'react';

export function TennisBallIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M3.55 10A10 10 0 0 1 10 3.55" />
      <path d="M20.45 14A10 10 0 0 1 14 20.45" />
    </svg>
  );
}
