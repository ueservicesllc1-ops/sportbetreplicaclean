
'use server';

import { db } from '@/lib/firebase';
import { doc, runTransaction, increment, addDoc, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';


const ASSET_COLLECTION = 'game_assets';
const PENALTY_SHOOTOUT_DOC = 'penalty_shootout';

export async function placePenaltyBet(userId: string, betAmount: number): Promise<void> {
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

            transaction.set(doc(transactionsRef), {
                userId: userId,
                game: 'PenaltyShootout',
                type: 'debit_bet',
                amount: betAmount,
                createdAt: serverTimestamp(),
            });
        });
    } catch (error) {
        console.error("Error placing penalty bet:", error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
        if (errorMessage.includes('Saldo insuficiente') || errorMessage.includes('iniciar sesión')) {
            throw new Error(errorMessage);
        }
        throw new Error('No se pudo procesar tu apuesta. Inténtalo de nuevo.');
    }
}

export async function resolvePenaltyBet(userId: string, winnings: number): Promise<void> {
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    if (winnings <= 0) {
        return;
    }

    const userDocRef = doc(db, 'users', userId);
    const transactionsRef = collection(db, 'game_transactions');

    try {
        await runTransaction(db, async (transaction) => {
            transaction.update(userDocRef, { balance: increment(winnings) });

             transaction.set(doc(transactionsRef), {
                userId: userId,
                game: 'PenaltyShootout',
                type: 'credit_win',
                amount: winnings,
                createdAt: serverTimestamp(),
            });
        });
    } catch (error) {
        console.error("Error resolving penalty bet:", error);
        throw new Error('No se pudieron acreditar tus ganancias.');
    }
}

export async function resolvePenaltyLoss(userId: string, penaltyAmount: number): Promise<void> {
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }
     if (penaltyAmount <= 0) {
        return;
    }

    const userDocRef = doc(db, 'users', userId);
    const transactionsRef = collection(db, 'game_transactions');

     try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error('No se encontró el perfil de usuario para procesar la pérdida.');
            }
            const currentBalance = userDoc.data().balance || 0;
            const amountToDeduct = penaltyAmount; 

            if (currentBalance < amountToDeduct) {
                transaction.update(userDocRef, { balance: 0 });
            } else {
                transaction.update(userDocRef, { balance: increment(-amountToDeduct) });
            }

            transaction.set(doc(transactionsRef), {
                userId: userId,
                game: 'PenaltyShootout',
                type: 'debit_loss_penalty',
                amount: amountToDeduct,
                createdAt: serverTimestamp(),
            });
        });
    } catch (error) {
        console.error("Error resolving penalty loss:", error);
        throw new Error('No se pudo procesar la penalización por pérdida.');
    }
}

interface InitialState {
    success: boolean;
    message: string;
}

export async function updateGameAssetPositions(prevState: InitialState, formData: FormData): Promise<InitialState> {
    try {
        const positions = {
            keeperTop: parseFloat(formData.get('keeperTop') as string),
            keeperLeft: parseFloat(formData.get('keeperLeft') as string),
            keeperScale: parseFloat(formData.get('keeperScale') as string),
            ballTop: parseFloat(formData.get('ballTop') as string),
            ballLeft: parseFloat(formData.get('ballLeft') as string),
            ballScale: parseFloat(formData.get('ballScale') as string),
        };

        const docRef = doc(db, ASSET_COLLECTION, PENALTY_SHOOTOUT_DOC);

        await setDoc(docRef, {
            ...positions,
            lastUpdated: serverTimestamp()
        }, { merge: true });

        revalidatePath('/casino/penalty-shootout');
        
        return { success: true, message: 'Las posiciones de los recursos se han guardado.' };

    } catch (error) {
        console.error('Error updating game asset positions:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
        return { success: false, message: `No se pudo guardar la configuración: ${errorMessage}` };
    }
}
