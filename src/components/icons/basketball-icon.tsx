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
      <path d="M7 7a5.8 5.8 0 0 1 10 0" />
      <path d="M7 17a5.8 5.8 0 0 0 10 0" />
      <path d="M12 2v20" />
    </svg>
  );
}
