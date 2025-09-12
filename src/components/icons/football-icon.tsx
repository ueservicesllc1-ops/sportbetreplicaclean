import type { SVGProps } from 'react';

export function FootballIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <path d="m5.64 5.64 12.72 12.72" />
      <path d="m5.64 18.36 12.72-12.72" />
      <path d="m18.36 5.64-12.72 12.72" />
      <path d="m18.36 18.36-12.72-12.72" />
    </svg>
  );
}
