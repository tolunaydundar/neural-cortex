import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { db } from '../firebase';

export async function assertOwnedDocument(
  collectionName: string,
  id: string,
  userId: string
): Promise<DocumentData> {
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists() || snap.data().userId !== userId) {
    throw new Error(`Unauthorized ${collectionName} access.`);
  }
  return snap.data();
}
