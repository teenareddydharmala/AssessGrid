
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyC0wDgfZV-DUqWxNdLnv1uOWiyOMCgveoI",
    authDomain: "access-grid.firebaseapp.com",
    projectId: "access-grid",
    storageBucket: "access-grid.firebasestorage.app",
    messagingSenderId: "29498260900",
    appId: "1:29498260900:web:1acbeccb2e211309965531",
    measurementId: "G-QWG60Q4DDN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);;
const db = getFirestore(app);

export{db};