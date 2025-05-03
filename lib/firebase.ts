import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth'; 

 export const firebaseConfig = {
  apiKey: "AIzaSyBXDeUqkvSrli6q2eLlX14q2Seq2HKItLc",
  authDomain: "synkro-791d3.firebaseapp.com",
  projectId: "synkro-791d3",
  storageBucket: "synkro-791d3.firebasestorage.app", 
 messagingSenderId: "942393176811",
  appId: "1:942393176811:web:082133b2caec10df1784ae",
  measurementId: "G-86BXE2LSLC"
};

 const app = initializeApp(firebaseConfig);

 export const db = getFirestore(app);
export const functions = getFunctions(app, "europe-west2");   
export const storage = getStorage(app);  
export const auth = getAuth(app);  

 export { app };
