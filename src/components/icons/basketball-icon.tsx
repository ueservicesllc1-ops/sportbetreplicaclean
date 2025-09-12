import type { SVGProps } from 'react';

export function BasketballIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M12 2a5 5 0 0 0-5 5" />
      <path d="M12 22a5 5 0 0 1-5-5" />
      <path d="M22 12a5 5 0 0 0-5-5" />
      <path d="M2 12a5 5 0 0 1 5-5" />
    </svg>
  );
}
