// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDX9Li1vPNdgcDS8e39RbRatSfLQvnWJAo",
    authDomain: "coffee-bf1ed.firebaseapp.com",
    databaseURL: "https://coffee-bf1ed-default-rtdb.firebaseio.com",
    projectId: "coffee-bf1ed",
    storageBucket: "coffee-bf1ed.firebasestorage.app",
    messagingSenderId: "982863094946",
    appId: "1:982863094946:web:0de7ba198cc7e733ce63fb",
    measurementId: "G-0SPKY4LVJ4"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export Firestore instance
export { db };
