// cloud-storage-jsonbin.js - Penyimpanan cloud sederhana dengan JSONBin.io

class JSONBinStorage {
    constructor() {
        this.apiKey = '$2a$10$DEMO_KEY_HERE'; // Ganti dengan API key gratis dari jsonbin.io
        this.binId = null;
    }

    // Buat bin baru untuk user
    async createUserBin(userData) {
        try {
            const response = await fetch('https://api.jsonbin.io/v3/bins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey,
                    'X-Bin-Private': 'true'
                },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            this.binId = result.metadata.id;
            return this.binId;
        } catch (error) {
            console.error('Error creating bin:', error);
            throw error;
        }
    }

    // Baca data dari bin
    async readUserBin(binId) {
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/bins/${binId}`, {
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });
            
            const result = await response.json();
            return result.record;
        } catch (error) {
            console.error('Error reading bin:', error);
            throw error;
        }
    }

    // Update data di bin
    async updateUserBin(binId, userData) {
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/bins/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(userData)
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error updating bin:', error);
            throw error;
        }
    }
}