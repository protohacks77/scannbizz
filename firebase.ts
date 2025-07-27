import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDPKKzLZjoSLL4TLPxVXeK74uVfHeUShJ4",
  authDomain: "scanbizz-9b430.firebaseapp.com",
  projectId: "scanbizz-9b430",
  storageBucket: "scanbizz-9b430.appspot.com",
  messagingSenderId: "591821988303",
  appId: "1:591821988303:web:a650f8582971b8af7f32ba"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
