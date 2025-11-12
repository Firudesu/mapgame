export class UIManager {
    constructor() {
        this.walletElement = document.getElementById('wallet-id');
        this.staminaValueElement = document.getElementById('stamina-value');
        this.staminaFillElement = document.getElementById('stamina-fill');
        this.playerCountElement = document.getElementById('player-count');
    }

    updateWallet(walletID) {
        if (!walletID) {
            this.walletElement.textContent = 'Not connected';
            this.walletElement.style.color = '#aaa';
            return;
        }

        const shortWallet = `${walletID.slice(0, 6)}...${walletID.slice(-4)}`;
        this.walletElement.textContent = shortWallet;
        this.walletElement.style.color = '#4CAF50';
    }

    updateStamina(stamina) {
        const clampedStamina = Math.max(0, Math.min(100, stamina));
        this.staminaValueElement.textContent = clampedStamina;
        this.staminaFillElement.style.width = `${clampedStamina}%`;
    }

    updatePlayerCount(count) {
        this.playerCountElement.textContent = count;
    }
}

