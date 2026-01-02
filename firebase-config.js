// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyDchBdyPxYJ80q5DwVudAA_mjAU8s813bg",
  authDomain: "login-registration-app-1de43.firebaseapp.com",
  projectId: "login-registration-app-1de43",
  storageBucket: "login-registration-app-1de43.firebasestorage.app",
  messagingSenderId: "965878131520",
  appId: "1:965878131520:web:f4606ce020409f1f1228a5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();