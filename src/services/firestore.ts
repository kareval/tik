import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    QuerySnapshot,
    DocumentData,
    getDocs,
    setDoc,
    query
} from "firebase/firestore";
import { db } from "../firebase";

export const subscribeToCollection = <T>(
    collectionName: string,
    callback: (data: T[]) => void
) => {
    return onSnapshot(collection(db, collectionName), (snapshot: QuerySnapshot<DocumentData>) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as T[];
        callback(data);
    });
};

export const addItem = async <T extends object>(collectionName: string, item: T) => {
    // If item (e.g. Project) has an ID we want to preserve or use as doc ID, we should handle it.
    // But generally addDoc generates a new ID. 
    // If we want to strictly use the item's ID if provided (useful for migration/manual ID), use setDoc.
    if ('id' in item && (item as any).id) {
        const { id, ...data } = item as any;
        // Check if it's a generated ID or a custom one. 
        // For simplicity, let's let Firestore generate IDs for new items if not crucial, 
        // OR allow specific ID setting.
        // Let's defer to addDoc for completely new items where ID doesn't matter, 
        // but if we are "Adding" something that already has a UUID from frontend generation, use setDoc.
        await setDoc(doc(db, collectionName, id), data);
        return id;
    } else {
        const docRef = await addDoc(collection(db, collectionName), item);
        return docRef.id;
    }
};

export const updateItem = async (collectionName: string, id: string, data: Partial<any>) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
};

export const deleteItem = async (collectionName: string, id: string) => {
    await deleteDoc(doc(db, collectionName, id));
};

export const setItem = async <T extends object>(collectionName: string, id: string, item: T) => {
    await setDoc(doc(db, collectionName, id), item);
};

export const clearCollection = async (collectionName: string) => {
    const q = query(collection(db, collectionName));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
};
