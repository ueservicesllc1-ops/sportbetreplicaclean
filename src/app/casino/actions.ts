
'use server';

import { db } from '@/lib/firebase';
import { doc, runTransaction, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function placeCasinoBet(userId: string, betAmount: number): Promise<void> {
    if (!userId) {
        throw new Error('Debes iniciar sesión para realizar una apuesta.');
    }

    if (betAmount <= 0) {
        throw new Error('El monto de la apuesta debe ser mayor que cero.');
    }

    const userDocRef = doc(db, 'users', userId);
    const transactionsRef = collection(db, 'game_transactions');

    try {
        await runTransaction(db, async (transaction) => {
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

            // Log the transaction for auditing
            transaction.set(doc(transactionsRef), {
                userId: userId,
                game: 'Speedrun',
                type: 'debit',
                amount: betAmount,
                createdAt: serverTimestamp(),
            });
        });
    } catch (error: any) {
        console.error("Error placing casino bet:", error);
        // Re-throw specific, user-friendly errors
        if (error.message.includes('Saldo insuficiente') || error.message.includes('iniciar sesión')) {
            throw error;
        }
        throw new Error('No se pudo procesar tu apuesta. Inténtalo de nuevo.');
    }
}

export async function resolveCasinoBet(userId: string, winnings: number): Promise<void> {
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    if (winnings <= 0) {
        // This can happen if cash out is hit at 1.00x, no need to throw an error
        return;
    }

    const userDocRef = doc(db, 'users', userId);
    const transactionsRef = collection(db, 'game_transactions');

    try {
        await runTransaction(db, async (transaction) => {
            transaction.update(userDocRef, { balance: increment(winnings) });

            // Log the transaction
             transaction.set(doc(transactionsRef), {
                userId: userId,
                game: 'Speedrun',
                type: 'credit',
                amount: winnings,
                createdAt: serverTimestamp(),
            });
        });
    } catch (error: any) {
        console.error("Error resolving casino bet:", error);
        throw new Error('No se pudieron acreditar tus ganancias.');
    }
}
