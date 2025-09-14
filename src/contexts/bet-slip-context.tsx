'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Bet {
  id: string; // Composite ID, e.g., eventId_marketKey_selectionName
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
      // We create a market-specific ID to check for existing bets on that market.
      const marketSpecificId = `${newBet.event}_${newBet.market}`;
      
      const existingBetForMarketIndex = prevBets.findIndex(
        (bet) => bet.event === newBet.event && bet.market === newBet.market
      );

      let updatedBets;

      if (existingBetForMarketIndex !== -1) {
        // A bet for this market already exists.
        const existingBet = prevBets[existingBetForMarketIndex];

        if (existingBet.selection === newBet.selection) {
          // The user clicked the same bet selection again, so we remove it (deselect).
          updatedBets = prevBets.filter((bet) => bet.id !== existingBet.id);
          toast({
            variant: 'destructive',
            title: 'Apuesta eliminada',
            description: `${newBet.selection}`,
          });
        } else {
          // The user clicked a different selection for the same market, so we replace the old one.
          updatedBets = prevBets.filter((bet) => bet.id !== existingBet.id);
          updatedBets.push(newBet);
           toast({
            title: 'Apuesta actualizada',
            description: `${newBet.selection} @ ${newBet.odd.toFixed(2)}`,
          });
        }
      } else {
        // No bet for this market exists, so we add the new one.
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
