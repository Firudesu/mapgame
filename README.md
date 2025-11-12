# WebGL Sandbox Multiplayer Prototype

A WebGL-based multiplayer sandbox prototype with MetaMask integration and real-time synchronization.

## Features

- **WebGL Map Rendering**: Loads and displays `mapsize.png` (2048×1852px) with Three.js
- **Grid System**: 128×128px tiles in a 16×14 grid overlay
- **MetaMask Integration**: Connect wallets and spawn player avatars
- **Multiplayer Sync**: Supabase Realtime or WebSocket fallback
- **Player Avatars**: Colored cubes with wallet labels
- **UI HUD**: Wallet info, stamina bar, and grid toggle

## Setup

### Install Dependencies

```bash
npm install
```

### Map File Setup

Move `mapsize.png` to the `public/` folder (or create a `public/` folder and copy it there). Vite serves static assets from the `public/` directory.

```bash
mkdir public
mv mapsize.png public/
```

### Environment Variables (Optional)

For Supabase integration, create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

If Supabase is not configured, the app will automatically fall back to a local WebSocket server.

### Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Run WebSocket Server (Fallback)

If not using Supabase, start the WebSocket server:

```bash
npm run server
```

The WebSocket server runs on `ws://localhost:8080`

## Project Structure

```
├── src/
│   ├── main.js              # Main game initialization
│   ├── map/
│   │   └── MapManager.js    # Map loading and grid system
│   ├── player/
│   │   └── PlayerManager.js # Avatar management
│   ├── network/
│   │   └── NetworkManager.js # Supabase/WebSocket handling
│   └── ui/
│       └── UIManager.js     # UI updates
├── server/
│   └── websocket-server.js  # WebSocket fallback server
├── mapsize.png              # Base map image
└── index.html               # Main HTML file
```

## Usage

1. Open the app in your browser
2. Click "Connect MetaMask" to connect your wallet
3. Your avatar will spawn on a random unoccupied tile
4. Up to 8 players can connect simultaneously
5. Use "Toggle Grid" to show/hide the grid overlay

## Supabase Setup (Optional)

If using Supabase, create a `players` table:

```sql
CREATE TABLE players (
  walletID TEXT PRIMARY KEY,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  color TEXT NOT NULL,
  stamina INTEGER DEFAULT 100,
  inventory JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE players;
```

## Development

- **Three.js**: WebGL rendering
- **Vite**: Build tool and dev server
- **Supabase**: Real-time database (optional)
- **WebSocket**: Fallback multiplayer sync

