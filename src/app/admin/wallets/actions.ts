
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

interface UserSearchResult {
    uid: string;
    email: string;
    shortId: string;
    balance: number;
}

export async function searchUsers(searchTerm: string): Promise<UserSearchResult[]> {
    if (!searchTerm) return [];
    
    const usersRef = collection(db, 'users');
    const searchTermLower = searchTerm.toLowerCase();
    
    // Firestore queries are case-sensitive. A common workaround is to store a lowercase version of the email.
    // For now, we'll do an exact match, which is case-sensitive. The user must type the exact email.
    // A more robust solution might involve client-side filtering or a more complex backend search.
    const searchByEmail = query(usersRef, where('email', '==', searchTerm));
    const searchByShortId = query(usersRef, where('shortId', '==', searchTerm.toUpperCase()));

    try {
        const [emailSnapshot, shortIdSnapshot] = await Promise.all([
            getDocs(searchByEmail),
            getDocs(searchByShortId)
        ]);
        
        const usersMap = new Map<string, UserSearchResult>();
        
        emailSnapshot.forEach((doc) => {
            const data = doc.data();
            usersMap.set(doc.id, {
                uid: data.uid,
                email: data.email,
                shortId: data.shortId,
                balance: data.balance
            });
        });

        shortIdSnapshot.forEach((doc) => {
            const data = doc.data();
             usersMap.set(doc.id, {
                uid: data.uid,
                email: data.email,
                shortId: data.shortId,
                balance: data.balance
            });
        });
        
        return Array.from(usersMap.values());
    } catch (error) {
        console.error("Error searching users:", error);
        throw new Error("Failed to search for users.");
    }
}


export async function addFundsToUser(userId: string, amount: number) {
    if (!userId || !amount || amount <= 0) {
        throw new Error("Información inválida para añadir fondos.");
    }

    const userDocRef = doc(db, 'users', userId);

    try {
        await updateDoc(userDocRef, {
            balance: increment(amount)
        });
        return { success: true, message: `Se añadieron $${amount} al usuario.` };
    } catch (error) {
        console.error("Error adding funds:", error);
        throw new Error("No se pudieron añadir los fondos al usuario.");
    }
}
