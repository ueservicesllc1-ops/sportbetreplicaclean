'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Bet {
  id: string;
  event: string;
  market: '1' | 'X' | '2';
  selection: string;
  odd: number;
}

interface BetSlipContextType {
  bets: Bet[];
  addBet: (bet: Bet) => void;
  removeBet: (betId: string) => void;
  clearBets: () => void;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [bets, setBets] = useState<Bet[]>([]);
  const { toast } = useToast();

  const addBet = (newBet: Bet) => {
    setBets((prevBets) => {
      const existingBetIndex = prevBets.findIndex(
        (bet) => bet.id.split('_')[0] === newBet.id.split('_')[0]
      );

      let updatedBets;
      if (existingBetIndex !== -1) {
        // Replace bet for the same event
        updatedBets = [...prevBets];
        updatedBets[existingBetIndex] = newBet;
      } else {
        // Add new bet
        updatedBets = [...prevBets, newBet];
      }
      return updatedBets;
    });
    toast({
      title: 'Apuesta añadida',
      description: `${newBet.selection} @ ${newBet.odd}`,
    });
  };

  const removeBet = (betId: string) => {
    setBets((prevBets) => prevBets.filter((bet) => bet.id !== betId));
  };
  
  const clearBets = () => {
    setBets([]);
  }

  return (
    <BetSlipContext.Provider value={{ bets, addBet, removeBet, clearBets }}>
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (context === undefined) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
}
