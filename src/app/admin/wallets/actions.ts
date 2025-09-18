
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, serverTimestamp, orderBy, limit, type DocumentData, type QuerySnapshot, type Timestamp } from 'firebase/firestore';
import { headers } from 'next/headers';


interface UserSearchResult {
    uid: string;
    email: string;
    shortId: string;
    balance: number;
}

export async function searchUsers(searchTerm: string): Promise<UserSearchResult[]> {
    if (!searchTerm) return [];
    
    const usersRef = collection(db, 'users');
    
    const searchByEmail = query(usersRef, where('email', '==', searchTerm));
    const searchByShortId = query(usersRef, where('shortId', '==', searchTerm.toUpperCase()));

    try {
        const [emailSnapshot, shortIdSnapshot] = await Promise.all([
            getDocs(searchByEmail),
            getDocs(searchByShortId)
        ]);
        
        const usersMap = new Map<string, UserSearchResult>();
        
        const processSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
            snapshot.forEach((doc) => {
                const data = doc.data();
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

interface AddFundsParams {
    userId: string;
    userEmail: string;
    amount: number;
    adminId: string;
    adminEmail: string;
}

export async function addFundsToUser(params: AddFundsParams) {
    const { userId, userEmail, amount, adminId, adminEmail } = params;

    if (!userId || !amount || amount <= 0 || !adminId || !adminEmail) {
        throw new Error("Información inválida para añadir fondos.");
    }

    const userDocRef = doc(db, 'users', userId);
    const transactionsRef = collection(db, 'wallet_transactions');

    const ip = headers().get('x-forwarded-for') ?? '127.0.0.1';
    let country = 'Unknown';
    if (ip !== '127.0.0.1') {
        try {
            const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=country`);
            if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                country = geoData.country || 'N/A';
            }
        } catch (e) {
            console.error('Failed to geolocate IP', e);
            country = 'Geolocation failed';
        }
    }


    try {
        await updateDoc(userDocRef, {
            balance: increment(amount)
        });

        await addDoc(transactionsRef, {
            type: 'admin_credit',
            userId,
            userEmail,
            amount,
            adminId,
            adminEmail,
            adminIp: ip,
            country: country,
            createdAt: serverTimestamp()
        });

        return { success: true, message: `Se añadieron $${amount.toFixed(2)} al saldo de ${userEmail}.` };
    } catch (error) {
        console.error("Error adding funds:", error);
        throw new Error("No se pudieron añadir los fondos al usuario.");
    }
}

export interface WalletTransaction {
    id: string;
    type: 'admin_credit' | 'game_win' | 'game_loss' | 'deposit';
    userId: string;
    userEmail: string;
    amount: number;
    adminId?: string;
    adminEmail?: string;
    adminIp?: string;
    country?: string;
    game?: string;
    createdAt: Timestamp;
}

export async function getLatestTransactions(): Promise<WalletTransaction[]> {
  const transactionsRef = collection(db, 'wallet_transactions');
  const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(10));
  
  try {
    const snapshot = await getDocs(q);
    const transactions: WalletTransaction[] = [];
    snapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() } as WalletTransaction);
    });
    return transactions;
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
}
