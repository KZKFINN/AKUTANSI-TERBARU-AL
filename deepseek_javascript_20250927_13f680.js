// cloud-storage.js - Penyimpanan cloud dengan Firebase

class CloudStorage {
    constructor() {
        this.config = {
            apiKey: "AIzaSyDEMO_KEY_HERE",
            authDomain: "your-project.firebaseapp.com",
            projectId: "your-accounting-app",
            storageBucket: "your-accounting-app.appspot.com",
            messagingSenderId: "123456789",
            appId: "1:123456789:web:abcdef123456"
        };
        
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Load Firebase SDK
            await this.loadScript('https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js');
            await this.loadScript('https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js');
            
            // Initialize Firebase
            firebase.initializeApp(this.config);
            this.db = firebase.firestore();
            this.isInitialized = true;
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization failed:', error);
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Simpan data user ke cloud
    async saveUserData(userId, userData) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            await this.db.collection('users').doc(userId).set({
                ...userData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            throw error;
        }
    }

    // Ambil data user dari cloud
    async getUserData(userId) {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        try {
            const doc = await this.db.collection('users').doc(userId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            throw error;
        }
    }

    // Simpan transaksi
    async saveTransaction(userId, transaction) {
        if (!this.isInitialized) return false;

        try {
            await this.db.collection('transactions').add({
                userId: userId,
                ...transaction,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error saving transaction:', error);
            return false;
        }
    }

    // Ambil semua transaksi user
    async getUserTransactions(userId) {
        if (!this.isInitialized) return [];

        try {
            const snapshot = await this.db.collection('transactions')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    }

    // Hapus transaksi
    async deleteTransaction(transactionId) {
        if (!this.isInitialized) return false;

        try {
            await this.db.collection('transactions').doc(transactionId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            return false;
        }
    }
}

// Inisialisasi cloud storage
const cloudStorage = new CloudStorage();