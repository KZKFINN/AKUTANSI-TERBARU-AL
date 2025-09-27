// auth.js - Dengan support cloud storage

class AuthManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('accountingUsers')) || {};
        this.currentUser = localStorage.getItem('currentAccountingUser') || null;
        this.useCloudStorage = localStorage.getItem('useCloudStorage') === 'true';
        this.cloudStorage = cloudStorage;
    }

    // Toggle antara cloud dan local storage
    setStoragePreference(useCloud) {
        this.useCloudStorage = useCloud;
        localStorage.setItem('useCloudStorage', useCloud);
    }

    // Registrasi pengguna baru
    async register(userData) {
        const userRecord = {
            name: userData.name,
            password: userData.password, // Note: Dalam production, gunakan hashing!
            email: userData.email,
            createdAt: new Date().toISOString(),
            transactions: []
        };

        // Simpan di local storage
        this.users[userData.email] = { ...userRecord };
        localStorage.setItem('accountingUsers', JSON.stringify(this.users));

        // Simpan di cloud jika dipilih
        if (this.useCloudStorage && this.cloudStorage.isInitialized) {
            try {
                await this.cloudStorage.saveUserData(userData.email, userRecord);
                console.log('User data saved to cloud');
            } catch (error) {
                console.warn('Failed to save to cloud, using local storage only');
            }
        }

        return true;
    }

    // Login pengguna
    async login(email, password) {
        let userData = null;

        // Coba ambil dari cloud dulu
        if (this.useCloudStorage && this.cloudStorage.isInitialized) {
            try {
                userData = await this.cloudStorage.getUserData(email);
                if (userData && userData.password === password) {
                    // Sync dengan local storage
                    this.users[email] = userData;
                    localStorage.setItem('accountingUsers', JSON.stringify(this.users));
                }
            } catch (error) {
                console.warn('Cloud storage unavailable, using local data');
            }
        }

        // Fallback ke local storage
        if (!userData && this.users[email] && this.users[email].password === password) {
            userData = this.users[email];
        }

        if (userData) {
            this.currentUser = email;
            localStorage.setItem('currentAccountingUser', email);
            
            // Load transactions dari cloud
            if (this.useCloudStorage) {
                await this.syncTransactionsFromCloud();
            }
            
            return true;
        }

        return false;
    }

    // Sync transactions dari cloud
    async syncTransactionsFromCloud() {
        if (!this.cloudStorage.isInitialized || !this.currentUser) return;

        try {
            const cloudTransactions = await this.cloudStorage.getUserTransactions(this.currentUser);
            const localUser = this.users[this.currentUser];
            
            if (localUser) {
                // Merge transactions (prioritaskan cloud data)
                const cloudTransactionMap = new Map();
                cloudTransactions.forEach(t => cloudTransactionMap.set(t.id, t));
                
                // Tambahkan transactions local yang belum ada di cloud
                (localUser.transactions || []).forEach(localTrans => {
                    if (!localTrans.cloudId || !cloudTransactionMap.has(localTrans.cloudId)) {
                        cloudTransactions.push(localTrans);
                    }
                });
                
                localUser.transactions = cloudTransactions;
                localStorage.setItem('accountingUsers', JSON.stringify(this.users));
            }
        } catch (error) {
            console.error('Error syncing transactions from cloud:', error);
        }
    }

    // Sync transactions ke cloud
    async syncTransactionsToCloud() {
        if (!this.cloudStorage.isInitialized || !this.currentUser) return;

        const localUser = this.users[this.currentUser];
        if (!localUser || !localUser.transactions) return;

        try {
            for (const transaction of localUser.transactions) {
                if (!transaction.cloudId) {
                    await this.cloudStorage.saveTransaction(this.currentUser, transaction);
                }
            }
            console.log('Transactions synced to cloud');
        } catch (error) {
            console.error('Error syncing transactions to cloud:', error);
        }
    }
}