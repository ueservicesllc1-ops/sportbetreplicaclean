
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
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
  const previousBetsRef = useRef<Bet[]>([]);

  useEffect(() => {
    // This effect runs after the 'bets' state has been updated and the component has re-rendered.
    // We compare the current bets with the previous state to determine what action was taken.
    const newBets = bets;
    const oldBets = previousBetsRef.current;

    if (newBets.length > oldBets.length) {
      // A bet was added
      const addedBet = newBets.find(nb => !oldBets.some(ob => ob.id === nb.id));
      if (addedBet) {
        toast({
          title: 'Apuesta añadida',
          description: `${addedBet.selection} @ ${addedBet.odd.toFixed(2)}`,
        });
      }
    } else if (newBets.length < oldBets.length) {
      // A bet was removed
      const removedBet = oldBets.find(ob => !newBets.some(nb => nb.id === ob.id));
       if (removedBet) {
        toast({
            variant: 'destructive',
            title: 'Apuesta eliminada',
            description: `${removedBet.selection}`,
        });
      }
    } else if (newBets.length === oldBets.length && newBets.length > 0) {
        // A bet might have been updated (replaced)
        // This is a bit more complex, we can check if an ID was replaced with another for the same market
        const updatedBet = newBets.find(nb => {
            const oldVersion = oldBets.find(ob => ob.id === nb.id);
            return !oldVersion; // The new bet didn't exist before with this ID
        });
         if (updatedBet) {
            toast({
                title: 'Apuesta actualizada',
                description: `${updatedBet.selection} @ ${updatedBet.odd.toFixed(2)}`,
            });
        }
    }

    // Update the ref to the current state for the next render.
    previousBetsRef.current = bets;
  }, [bets, toast]);


  const addBet = (newBet: Bet) => {
    setBets((prevBets) => {
      const existingBetForMarketIndex = prevBets.findIndex(
        (bet) => bet.event === newBet.event && bet.market === newBet.market
      );

      let updatedBets;

      if (existingBetForMarketIndex !== -1) {
        const existingBet = prevBets[existingBetForMarketIndex];
        if (existingBet.selection === newBet.selection) {
          // Deselect: remove the bet
          updatedBets = prevBets.filter((bet) => bet.id !== existingBet.id);
        } else {
          // Replace: remove old one, add new one
          updatedBets = prevBets.filter((bet) => bet.id !== existingBet.id);
          updatedBets.push(newBet);
        }
      } else {
        // Add new bet
        updatedBets = [...prevBets, newBet];
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
