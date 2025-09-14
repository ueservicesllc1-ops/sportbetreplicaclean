'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Bet {
  id: string; // Composite ID, e.g., eventId_marketKey
  event: string;
  market: string; // e.g., h2h, totals, etc.
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
      // An event can only have one bet from a specific market (e.g., only one 'h2h' winner).
      // The bet ID should be a composite of eventId and marketKey to enforce this.
      const existingBetIndex = prevBets.findIndex(
        (bet) => bet.id === newBet.id
      );

      let updatedBets;
      if (existingBetIndex !== -1) {
        // If the same selection is clicked again, remove it (deselect)
        if (prevBets[existingBetIndex].selection === newBet.selection) {
          updatedBets = prevBets.filter((bet) => bet.id !== newBet.id);
           toast({
            variant: 'destructive',
            title: 'Apuesta eliminada',
            description: `${newBet.selection}`,
          });
        } else {
          // If a different selection for the same market is clicked, replace it
          updatedBets = [...prevBets];
          updatedBets[existingBetIndex] = newBet;
          toast({
            title: 'Apuesta actualizada',
            description: `${newBet.selection} @ ${newBet.odd.toFixed(2)}`,
          });
        }
      } else {
        // Add new bet
        updatedBets = [...prevBets, newBet];
         toast({
          title: 'Apuesta añadida',
          description: `${newBet.selection} @ ${newBet.odd.toFixed(2)}`,
        });
      }
      return updatedBets;
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
