import {
  Flame,
  Gamepad2,
  type LucideIcon,
  Trophy,
  Dices,
  Footprints,
} from 'lucide-react';
import { TennisBallIcon } from '@/components/icons/tennis-ball-icon';
import { BasketballIcon } from '@/components/icons/basketball-icon';
import { SoccerBallIcon } from '@/components/icons/soccer-ball-icon';


export interface Sport {
  name: string;
  icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  leagues: League[];
}

export interface League {
  name: string;
  events: MatchEvent[];
}

export interface MatchEvent {
  id: string;
  teamA: string;
  teamB:string;
  time: string;
  odds: {
    '1': number;
    X: number;
    '2': number;
  };
}

export const sportsData: Sport[] = [
  {
    name: 'Fútbol',
    icon: SoccerBallIcon,
    leagues: [
      {
        name: 'Liga Pro Ecuador',
        events: [
          { id: 'ecu1', teamA: 'LDU Quito', teamB: 'Barcelona SC', time: 'En Vivo', odds: { '1': 2.1, X: 3.3, '2': 3.5 } },
          { id: 'ecu2', teamA: 'Emelec', teamB: 'Independiente del Valle', time: '18:00', odds: { '1': 2.8, X: 3.1, '2': 2.6 } },
        ],
      },
      {
        name: 'Premier League',
        events: [
          { id: 'pl1', teamA: 'Man City', teamB: 'Arsenal', time: 'En Vivo', odds: { '1': 1.9, X: 3.8, '2': 4.0 } },
          { id: 'pl2', teamA: 'Liverpool', teamB: 'Man United', time: '20:00', odds: { '1': 1.7, X: 4.2, '2': 4.5 } },
        ],
      },
    ],
  },
  {
    name: 'Baloncesto',
    icon: BasketballIcon,
    leagues: [
      {
        name: 'NBA',
        events: [
          { id: 'nba1', teamA: 'Lakers', teamB: 'Celtics', time: 'En Vivo', odds: { '1': 1.85, X: 0, '2': 2.05 } },
          { id: 'nba2', teamA: 'Warriors', teamB: 'Nets', time: '21:30', odds: { '1': 1.6, X: 0, '2': 2.4 } },
        ],
      },
    ],
  },
  {
    name: 'Tenis',
    icon: TennisBallIcon,
    leagues: [
      {
        name: 'ATP Finals',
        events: [
          { id: 'atp1', teamA: 'Alcaraz', teamB: 'Sinner', time: '14:00', odds: { '1': 1.75, X: 0, '2': 2.1 } },
        ],
      },
    ],
  },
  {
    name: 'e-Sports',
    icon: Gamepad2,
    leagues: [
        {
            name: 'Dota 2 International',
            events: [
                { id: 'dota1', teamA: 'Team Spirit', teamB: 'Gaimin Gladiators', time: '16:30', odds: { '1': 1.9, X: 0, '2': 1.9 } },
            ]
        }
    ]
  }
];

export const mainNavSports = [
  { name: 'En Vivo', icon: Flame, href: '/#en-vivo' },
  { name: 'Fútbol', icon: SoccerBallIcon, href: '/#futbol' },
  { name: 'Tenis', icon: Trophy, href: '/#tenis' },
  { name: 'e-Sports', icon: Gamepad2, href: '/#esports' },
  { name: 'Casino', icon: Dices, href: '/casino' },
];
