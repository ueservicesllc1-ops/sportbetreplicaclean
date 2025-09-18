
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
        });
        
        const grid = generateMinesGrid(25, mineCount);

        const transactionsRef = collection(db, 'game_transactions');
        await addDoc(transactionsRef, {
            userId: userId,
            game: 'Mines',
            type: 'bet_placed', 
            amount: betAmount,
            details: { mineCount },
            status: 'pending',
            createdAt: serverTimestamp(),
        });

        return { success: true, grid };

    } catch (error) {
        console.error("Error placing mines bet:", error);
        const message = error instanceof Error ? error.message : 'No se pudo procesar tu apuesta. Inténtalo de nuevo.';
        return { success: false, error: message };
    }
}


export async function resolveMinesLoss(userId: string, penaltyAmount: number): Promise<{ success: boolean, error?: string }> {
    if (!userId) {
        return { success: false, error: 'Usuario no autenticado.' };
    }
    if (penaltyAmount <= 0) {
        return { success: true }; 
    }
    
    const userDocRef = doc(db, 'users', userId);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error('No se encontró el perfil de usuario para procesar la pérdida.');
            }
            
            transaction.update(userDocRef, { balance: increment(-penaltyAmount) });

            const transactionsRef = collection(db, 'game_transactions');
            transaction.set(doc(transactionsRef), {
                userId: userId,
                game: 'Mines',
                type: 'debit_loss',
                amount: penaltyAmount,
                createdAt: serverTimestamp(),
            });
        });
        return { success: true };
    } catch (error) {
        console.error("Error applying mines loss penalty:", error);
        const message = error instanceof Error ? error.message : 'No se pudo aplicar la penalización por pérdida.';
        return { success: false, error: message };
    }
}


export async function cashOutMines(userId: string, betAmount: number, winnings: number): Promise<{ success: boolean, error?: string }> {
    if (!userId) {
         return { success: false, error: 'Usuario no autenticado.' };
    }
    if (winnings <= betAmount) {
        return { success: false, error: 'Las ganancias deben ser mayores a la apuesta inicial.' };
    }

    const netWinnings = winnings - betAmount;
    const userDocRef = doc(db, 'users', userId);

    try {
         await runTransaction(db, async (transaction) => {
            transaction.update(userDocRef, { balance: increment(netWinnings) });

            const transactionsRef = collection(db, 'game_transactions');
            transaction.set(doc(transactionsRef), {
                userId: userId,
                game: 'Mines',
                type: 'credit_win',
                amount: netWinnings,
                details: { betAmount, totalPayout: winnings },
                createdAt: serverTimestamp(),
            });
        });
        return { success: true };
    } catch (error) {
        console.error("Error cashing out mines:", error);
        const message = error instanceof Error ? error.message : 'No se pudieron acreditar tus ganancias.';
        return { success: false, error: message };
    }
}

