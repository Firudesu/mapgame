import * as THREE from 'three';
import { TextureLoader } from 'three';

export class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.mapTexture = null;
        this.mapMesh = null;
        this.gridLines = [];
        this.gridGroup = new THREE.Group();
        this.tiles = [];
        this.gridVisible = true;

        // Map dimensions
        this.mapWidth = 2048;
        this.mapHeight = 1852;
        this.tileSize = 128;
        this.gridCols = 16;
        this.gridRows = 14;
    }

    async loadMap(imagePath) {
        return new Promise((resolve, reject) => {
            const loader = new TextureLoader();
            loader.load(
                imagePath,
                (texture) => {
                    this.mapTexture = texture;
                    this.createMapMesh();
                    resolve();
                },
                undefined,
                (error) => {
                    console.error('Error loading map texture:', error);
                    reject(error);
                }
            );
        });
    }

    createMapMesh() {
        const geometry = new THREE.PlaneGeometry(this.mapWidth, this.mapHeight);
        const material = new THREE.MeshBasicMaterial({
            map: this.mapTexture,
            transparent: false
        });

        this.mapMesh = new THREE.Mesh(geometry, material);
        this.mapMesh.position.set(0, 0, 0);
        this.scene.add(this.mapMesh);
    }

    createGrid(cols, rows, tileSize) {
        this.gridCols = cols;
        this.gridRows = rows;
        this.tileSize = tileSize;

        // Clear existing grid
        this.gridLines.forEach(line => this.gridGroup.remove(line));
        this.gridLines = [];
        this.tiles = [];

        const halfWidth = (this.mapWidth / 2);
        const halfHeight = (this.mapHeight / 2);

        // Create grid lines
        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            opacity: 0.3,
            transparent: true
        });

        // Vertical lines
        for (let i = 0; i <= cols; i++) {
            const x = -halfWidth + (i * tileSize);
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x, -halfHeight, 1),
                new THREE.Vector3(x, halfHeight, 1)
            ]);
            const line = new THREE.Line(geometry, gridMaterial);
            this.gridLines.push(line);
            this.gridGroup.add(line);
        }

        // Horizontal lines
        for (let i = 0; i <= rows; i++) {
            const y = halfHeight - (i * tileSize);
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-halfWidth, y, 1),
                new THREE.Vector3(halfWidth, y, 1)
            ]);
            const line = new THREE.Line(geometry, gridMaterial);
            this.gridLines.push(line);
            this.gridGroup.add(line);
        }

        // Create tile data structure
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const tileX = -halfWidth + (col * tileSize) + (tileSize / 2);
                const tileY = halfHeight - (row * tileSize) - (tileSize / 2);
                
                this.tiles.push({
                    id: `tile_${col}_${row}`,
                    col: col,
                    row: row,
                    x: tileX,
                    y: tileY,
                    centerX: tileX,
                    centerY: tileY,
                    occupied: false
                });
            }
        }

        this.scene.add(this.gridGroup);
    }

    getRandomAvailableTile(occupiedTiles) {
        // Mark occupied tiles
        const occupiedSet = new Set(occupiedTiles.map(t => t.id));
        const available = this.tiles.filter(tile => !occupiedSet.has(tile.id));

        if (available.length === 0) {
            return null;
        }

        const randomTile = available[Math.floor(Math.random() * available.length)];
        return {
            id: randomTile.id,
            x: randomTile.centerX,
            y: randomTile.centerY
        };
    }

    setGridVisibility(visible) {
        this.gridVisible = visible;
        this.gridGroup.visible = visible;
    }

    getTileAtPosition(x, y) {
        return this.tiles.find(tile => {
            const halfTile = this.tileSize / 2;
            return x >= tile.x - halfTile && x <= tile.x + halfTile &&
                   y >= tile.y - halfTile && y <= tile.y + halfTile;
        });
    }
}

