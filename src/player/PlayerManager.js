import * as THREE from 'three';

export class PlayerManager {
    constructor(scene) {
        this.scene = scene;
        this.players = new Map();
        this.playerGroup = new THREE.Group();
        this.scene.add(this.playerGroup);
    }

    addPlayer(playerData) {
        if (this.players.has(playerData.walletID)) {
            console.warn(`Player ${playerData.walletID} already exists`);
            return;
        }

        // Create avatar (colored cube)
        const geometry = new THREE.BoxGeometry(60, 60, 60);
        const color = new THREE.Color(playerData.color);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3
        });

        const avatar = new THREE.Mesh(geometry, material);
        avatar.position.set(playerData.x, playerData.y, 30);
        avatar.userData = {
            walletID: playerData.walletID,
            stamina: playerData.stamina,
            inventory: playerData.inventory || []
        };

        // Add label (wallet address short)
        const shortWallet = `${playerData.walletID.slice(0, 6)}...${playerData.walletID.slice(-4)}`;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#ffffff';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.fillText(shortWallet, canvas.width / 2, canvas.height / 2 + 7);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(playerData.x, playerData.y, 100);
        sprite.scale.set(120, 30, 1);

        avatar.userData.label = sprite;
        this.playerGroup.add(avatar);
        this.playerGroup.add(sprite);

        this.players.set(playerData.walletID, avatar);
    }

    updatePlayers(playersData) {
        // Remove players that are no longer in the data
        const currentWalletIDs = new Set(Object.keys(playersData));
        for (const [walletID, avatar] of this.players.entries()) {
            if (!currentWalletIDs.has(walletID)) {
                this.removePlayer(walletID);
            }
        }

        // Add or update players
        for (const walletID in playersData) {
            const playerData = playersData[walletID];
            if (this.players.has(walletID)) {
                this.updatePlayer(walletID, playerData);
            } else {
                this.addPlayer(playerData);
            }
        }
    }

    updatePlayer(walletID, playerData) {
        const avatar = this.players.get(walletID);
        if (!avatar) return;

        // Update position
        avatar.position.set(playerData.x, playerData.y, 30);

        // Update label position
        if (avatar.userData.label) {
            avatar.userData.label.position.set(playerData.x, playerData.y, 100);
        }

        // Update stamina
        avatar.userData.stamina = playerData.stamina;
    }

    removePlayer(walletID) {
        const avatar = this.players.get(walletID);
        if (!avatar) return;

        if (avatar.userData.label) {
            this.playerGroup.remove(avatar.userData.label);
        }
        this.playerGroup.remove(avatar);
        this.players.delete(walletID);
    }

    getOccupiedTiles() {
        const occupied = [];
        const halfWidth = 1024; // mapWidth / 2
        const halfHeight = 926; // mapHeight / 2
        const tileSize = 128;
        
        for (const [walletID, avatar] of this.players.entries()) {
            // Calculate tile coordinates matching MapManager logic
            const col = Math.floor((avatar.position.x + halfWidth) / tileSize);
            const row = Math.floor((halfHeight - avatar.position.y) / tileSize);
            
            occupied.push({
                id: `tile_${col}_${row}`,
                x: avatar.position.x,
                y: avatar.position.y
            });
        }
        return occupied;
    }

    getPlayer(walletID) {
        return this.players.get(walletID);
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }
}

