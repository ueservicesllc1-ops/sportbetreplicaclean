
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
    
    // Since Firestore doesn't support case-insensitive search natively,
    // we will search by exact email and exact shortId (which is always uppercase).
    const searchByEmail = query(usersRef, where('email', '==', searchTerm));
    const searchByShortId = query(usersRef, where('shortId', '==', searchTerm.toUpperCase()));

    try {
        const [emailSnapshot, shortIdSnapshot] = await Promise.all([
            getDocs(searchByEmail),
            getDocs(searchByShortId)
        ]);
        
        const usersMap = new Map<string, UserSearchResult>();
        
        const processSnapshot = (snapshot: any) => {
            snapshot.forEach((doc: any) => {
                const data = doc.data();
                // Ensure the document has the required fields before adding it to the map
                if (data.uid && data.email && data.shortId) {
                    usersMap.set(doc.id, {
                        uid: data.uid,
                        email: data.email,
                        shortId: data.shortId,
                        balance: data.balance || 0
                    });
                }
            });
        }

        processSnapshot(emailSnapshot);
        processSnapshot(shortIdSnapshot);
        
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
