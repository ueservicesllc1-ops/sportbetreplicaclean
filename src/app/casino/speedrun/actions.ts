'use server';

import { db } from '@/lib/firebase';
import { doc, runTransaction, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';

type BetResult = {
    success: true;
} | {
    success: false;
    error: string;
};

export async function placeBet(userId: string, betAmount: number): Promise<BetResult> {
    if (!userId) {
        return { success: false, error: 'Debes iniciar sesión para realizar una apuesta.' };
    }
    if (betAmount <= 0) {
        return { success: false, error: 'El monto de la apuesta debe ser mayor que cero.' };
    }

    const userDocRef = doc(db, 'users', userId);

    try {
        const newBalance = await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error('No se encontró el perfil de usuario.');
            }

            const currentBalance = userDoc.data().balance || 0;
            if (currentBalance < betAmount) {
                throw new Error('Saldo insuficiente para realizar esta apuesta.');
            }

            const newBalance = currentBalance - betAmount;
            transaction.update(userDocRef, { balance: newBalance });

            return newBalance;
        });

        const transactionsRef = collection(db, 'game_transactions');
        await addDoc(transactionsRef, {
            userId: userId,
            game: 'Speedrun',
            type: 'debit',
            amount: betAmount,
            createdAt: serverTimestamp(),
        });

        return { success: true };

    } catch (error) {
        console.error("Error placing bet:", error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}


export async function cashOut(userId: string, betAmount: number, multiplier: number): Promise<BetResult> {
     if (!userId) {
        return { success: false, error: 'Usuario no autenticado.' };
    }

    const winnings = betAmount * multiplier;
    if (winnings <= 0) {
        return { success: false, error: 'Las ganancias deben ser mayores que cero.' };
    }

    const userDocRef = doc(db, 'users', userId);

    try {
        await runTransaction(db, async (transaction) => {
            transaction.update(userDocRef, { balance: increment(winnings) });

            const transactionsRef = collection(db, 'game_transactions');
            transaction.set(doc(transactionsRef), {
                userId: userId,
                game: 'Speedrun',
                type: 'credit',
                amount: winnings,
                details: { betAmount, multiplier },
                createdAt: serverTimestamp(),
            });
        });
        return { success: true };
    } catch (error) {
        console.error("Error cashing out:", error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}
