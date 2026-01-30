// Import Firebase SDKs from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, orderBy, query, limit, onSnapshot, doc, setDoc, updateDoc, increment, arrayUnion, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

const firebaseConfig = {
    apiKey: "AIzaSyCr1GJz99pLV2Xqdgh3jRQlbBtPE-lvkkY",
    authDomain: "zepol-2c1b5.firebaseapp.com",
    projectId: "zepol-2c1b5",
    storageBucket: "zepol-2c1b5.firebasestorage.app",
    messagingSenderId: "642066092712",
    appId: "1:642066092712:web:4c25bbb2aabf51df75e89d",
    measurementId: "G-8EBVL8FMD8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, collection, addDoc, getDocs, getDoc, orderBy, query, limit, onSnapshot, doc, setDoc, updateDoc, increment, arrayUnion, where };
