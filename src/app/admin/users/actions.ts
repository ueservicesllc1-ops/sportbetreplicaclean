
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, orderBy, query, updateDoc, Timestamp } from 'firebase/firestore';
import type { UserProfile, UserRole } from '@/contexts/auth-context';
import { revalidatePath } from 'next/cache';

export async function getUsers(): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('createdAt', 'desc'));
  
  try {
    const snapshot = await getDocs(q);
    const users: UserProfile[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;

      // Convert Timestamp to a plain object
      let serializableCreatedAt: { seconds: number; nanoseconds: number; } | null = null;
      if (createdAt instanceof Timestamp) {
        serializableCreatedAt = {
          seconds: createdAt.seconds,
          nanoseconds: createdAt.nanoseconds,
        };
      } else if (createdAt && typeof createdAt === 'object' && 'seconds' in createdAt && 'nanoseconds' in createdAt) {
        serializableCreatedAt = createdAt as { seconds: number; nanoseconds: number; };
      }
      
      users.push({
        ...data,
        createdAt: serializableCreatedAt,
      } as UserProfile);
    });
    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}


export async function updateUserRole(userId: string, newRole: UserRole) {
    if (!userId || !newRole) {
        throw new Error('ID de usuario y nuevo rol son requeridos.');
    }
    
    // Add any extra checks here, e.g., ensuring only a superadmin can make this change.
    // This should also be protected by Firestore security rules.

    const userDocRef = doc(db, 'users', userId);

    try {
        await updateDoc(userDocRef, {
            role: newRole
        });
        revalidatePath('/admin/users');
        return { success: true, message: 'Rol de usuario actualizado correctamente.' };
    } catch (error) {
        console.error("Error updating user role:", error);
        throw new Error('No se pudo actualizar el rol del usuario.');
    }
}
