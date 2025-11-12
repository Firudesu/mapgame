import * as THREE from 'three';
import { MapManager } from './map/MapManager.js';
import { PlayerManager } from './player/PlayerManager.js';
import { NetworkManager } from './network/NetworkManager.js';
import { UIManager } from './ui/UIManager.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            -1024, 1024, 926, -926, 0.1, 1000
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();

        // Initialize managers
        this.mapManager = new MapManager(this.scene);
        this.playerManager = new PlayerManager(this.scene);
        this.networkManager = new NetworkManager();
        this.uiManager = new UIManager();

        // Game state
        this.currentWallet = null;
        this.isGridVisible = true;

        this.init();
    }

    async init() {
        // Setup renderer
        const container = document.getElementById('canvas-container');
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x1a1a1a);
        container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.z = 1000;
        this.camera.lookAt(0, 0, 0);

        // Load map (file should be in public/ folder for Vite)
        await this.mapManager.loadMap('/mapsize.png');
        this.mapManager.createGrid(16, 14, 128);

        // Setup event listeners
        this.setupEventListeners();

        // Start render loop
        this.animate();

        // Initialize network
        this.networkManager.onPlayerUpdate = (players) => {
            this.playerManager.updatePlayers(players);
            this.uiManager.updatePlayerCount(Object.keys(players).length);
        };

        this.networkManager.onPlayerJoined = (playerData) => {
            if (playerData.walletID === this.currentWallet) {
                this.uiManager.updateWallet(playerData.walletID);
                this.uiManager.updateStamina(playerData.stamina);
            }
        };
    }

    setupEventListeners() {
        // MetaMask connection
        document.getElementById('connect-btn').addEventListener('click', () => {
            this.connectMetaMask();
        });

        // Grid toggle
        document.getElementById('grid-toggle').addEventListener('click', () => {
            this.toggleGrid();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    async connectMetaMask() {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask is not installed. Please install MetaMask to continue.');
            return;
        }

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                alert('No accounts found. Please unlock MetaMask.');
                return;
            }

            this.currentWallet = accounts[0];
            await this.spawnPlayer(this.currentWallet);
        } catch (error) {
            console.error('MetaMask connection error:', error);
            alert('Failed to connect MetaMask: ' + error.message);
        }
    }

    async spawnPlayer(walletID) {
        // Get available tiles from map manager
        const occupiedTiles = this.playerManager.getOccupiedTiles();
        const availableTile = this.mapManager.getRandomAvailableTile(occupiedTiles);

        if (!availableTile) {
            alert('No available tiles. Maximum players reached.');
            return;
        }

        // Generate random color for player
        const color = new THREE.Color().setHSL(
            Math.random(),
            0.7,
            0.5
        );

        // Create player data
        const playerData = {
            walletID: walletID,
            x: availableTile.x,
            y: availableTile.y,
            color: `#${color.getHexString()}`,
            stamina: 100,
            inventory: []
        };

        // Spawn locally
        this.playerManager.addPlayer(playerData);

        // Send to network
        await this.networkManager.joinGame(playerData);

        this.uiManager.updateWallet(walletID);
        this.uiManager.updateStamina(100);
    }

    toggleGrid() {
        this.isGridVisible = !this.isGridVisible;
        this.mapManager.setGridVisibility(this.isGridVisible);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Game();
    });
} else {
    new Game();
}

