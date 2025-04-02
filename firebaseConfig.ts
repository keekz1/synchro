import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBXDeUqkvSrli6q2eLlX14q2Seq2HKItLc",
  authDomain: "synkro-791d3.firebaseapp.com",
  projectId: "synkro-791d3",
  storageBucket: "synkro-791d3.appspot.com",
  messagingSenderId: "942393176811",
  appId: "1:942393176811:web:082133b2caec10df1784ae",
  measurementId: "G-86BXE2LSLC"
};

// Initialize Firebase only once in Next.js
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
