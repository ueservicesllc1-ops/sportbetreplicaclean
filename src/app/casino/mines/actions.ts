
'use server';

import { db } from '@/lib/firebase';
import { doc, runTransaction, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';

type MinesBetResult = {
    success: true,
    grid: number[], // Array representing the grid, 1 for mine, 0 for gem
} | {
    success: false,
    error: string,
};

// Function to generate the grid with mines
function generateMinesGrid(gridSize: number, mineCount: number): number[] {
    const grid = Array(gridSize).fill(0);
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const index = Math.floor(Math.random() * gridSize);
        if (grid[index] === 0) {
            grid[index] = 1; // 1 represents a mine
            minesPlaced++;
        }
    }
    return grid;
}


export async function placeMinesBet(userId: string, betAmount: number, mineCount: number): Promise<MinesBetResult> {
    if (!userId) {
        return { success: false, error: 'Debes iniciar sesión para realizar una apuesta.' };
    }
    if (betAmount <= 0) {
        return { success: false, error: 'El monto de la apuesta debe ser mayor que cero.' };
    }
    if (mineCount < 1 || mineCount > 24) {
        return { success: false, error: 'El número de minas no es válido.' };
    }

    const userDocRef = doc(db, 'users', userId);

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
            
            // Deduct the bet amount
            transaction.update(userDocRef, { balance: increment(-betAmount) });

            // Log the transaction
            const transactionsRef = collection(db, 'game_transactions');
            transaction.set(doc(transactionsRef), {
                userId: userId,
                game: 'Mines',
                type: 'debit_bet',
                amount: betAmount,
                details: { mineCount },
                createdAt: serverTimestamp(),
            });
        });
        
        // After successfully deducting the bet, generate and return the grid
        const grid = generateMinesGrid(25, mineCount);
        return { success: true, grid };

    } catch (error: any) {
        console.error("Error placing mines bet:", error);
        return { success: false, error: error.message || 'No se pudo procesar tu apuesta. Inténtalo de nuevo.' };
    }
}


export async function cashOutMines(userId: string, winnings: number): Promise<{ success: boolean, error?: string }> {
    if (!userId) {
         return { success: false, error: 'Usuario no autenticado.' };
    }
    if (winnings <= 0) {
        return { success: false, error: 'Las ganancias deben ser mayores a cero.' };
    }

    const userDocRef = doc(db, 'users', userId);

    try {
         await runTransaction(db, async (transaction) => {
            // No need to get the user doc first if we just increment
            transaction.update(userDocRef, { balance: increment(winnings) });

            // Log the transaction
            const transactionsRef = collection(db, 'game_transactions');
            transaction.set(doc(transactionsRef), {
                userId: userId,
                game: 'Mines',
                type: 'credit_win',
                amount: winnings,
                createdAt: serverTimestamp(),
            });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error cashing out mines:", error);
        return { success: false, error: 'No se pudieron acreditar tus ganancias.' };
    }
}
