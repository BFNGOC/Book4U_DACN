import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: 'AIzaSyCB_8aYZEA8dNlkLBQKyT3WDM48bDQZI08',
    authDomain: 'book4u-41d1f.firebaseapp.com',
    databaseURL: 'https://book4u-41d1f-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'book4u-41d1f',
    storageBucket: 'book4u-41d1f.firebasestorage.app',
    messagingSenderId: '518777416123',
    appId: '1:518777416123:web:a80f08fac48c34d03dbc9e',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
