
'use client';

import { useState, useEffect } from 'react';

export interface WheelSegment {
  color: string;
  label: string;
  value: number;
}

interface WheelProps {
  segments: WheelSegment[];
}

interface PathData {
  pathD: string;
  textPos: { x: number; y: number };
  textAngle: number;
}

export const Wheel = ({ segments }: WheelProps) => {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const numSegments = segments.length;
    const anglePerSegment = 360 / numSegments;

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    }

    const calculatedPaths = segments.map((_, index) => {
      const startAngle = index * anglePerSegment;
      const endAngle = (index + 1) * anglePerSegment;

      const start = polarToCartesian(0, 0, 100, startAngle);
      const end = polarToCartesian(0, 0, 100, endAngle);

      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

      const d = [
        'M', 0, 0,
        'L', start.x, start.y,
        'A', 100, 100, 0, largeArcFlag, 1, end.x, end.y,
        'L', 0, 0
      ].join(' ');

      const textAngle = startAngle + anglePerSegment / 2;
      const textPosition = polarToCartesian(0, 0, 75, textAngle);

      return {
        pathD: d,
        textPos: textPosition,
        textAngle: textAngle > 90 && textAngle < 270 ? textAngle + 180 : textAngle
      };
    });
    
    setPaths(calculatedPaths);

  }, [segments, isClient]);

  if (!isClient || paths.length === 0) {
    return (
        <svg viewBox="-105 -105 210 210" className="w-full h-full animate-pulse">
            <circle cx="0" cy="0" r="102" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="4"/>
        </svg>
    ); 
  }

  return (
    <svg viewBox="-105 -105 210 210" className="w-full h-full">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
       <circle cx="0" cy="0" r="102" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" filter="url(#shadow)"/>
      {paths.map((p, index) => (
        <g key={index}>
          <path d={p.pathD} fill={segments[index].color} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
           <text
            x={p.textPos.x}
            y={p.textPos.y}
            transform={`rotate(${p.textAngle}, ${p.textPos.x}, ${p.textPos.y})`}
            fill="white"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {segments[index].label}
          </text>
        </g>
      ))}
    </svg>
  );
};
