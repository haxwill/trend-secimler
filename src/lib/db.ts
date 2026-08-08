import fs from 'fs';
import path from 'path';
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

const postsFile = path.join(process.cwd(), 'data', 'posts.json');

export async function getProducts() {
  if (db) {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const products: any[] = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      return products;
    } catch (e) {
      console.error("Firebase read error:", e);
      return [];
    }
  } else {
    if (!fs.existsSync(postsFile)) return [];
    const data = fs.readFileSync(postsFile, 'utf8');
    return JSON.parse(data);
  }
}

export async function addProducts(newProducts: any[]) {
  if (db) {
    try {
      const batchPromises = newProducts.map((p) => {
        // Use custom id if available, else firestore auto-generates
        const idString = p.id ? p.id.toString() : Date.now().toString();
        return setDoc(doc(db, "products", idString), p);
      });
      await Promise.all(batchPromises);
      return true;
    } catch (e) {
      console.error("Firebase write error:", e);
      return false;
    }
  } else {
    let existing = [];
    if (fs.existsSync(postsFile)) {
      existing = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
    }
    const all = [...newProducts, ...existing].slice(0, 50);
    fs.writeFileSync(postsFile, JSON.stringify(all, null, 4));
    return true;
  }
}

export async function deleteProduct(id: string | number) {
  if (db) {
    try {
      await deleteDoc(doc(db, "products", id.toString()));
      return true;
    } catch (e) {
      console.error("Firebase delete error:", e);
      return false;
    }
  } else {
    if (!fs.existsSync(postsFile)) return false;
    let products = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
    products = products.filter((p: any) => p.id !== id);
    fs.writeFileSync(postsFile, JSON.stringify(products, null, 4));
    return true;
  }
}
