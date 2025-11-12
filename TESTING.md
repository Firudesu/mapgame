# Testing Guide

## Quick Start Testing

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Create public folder and move map file (Windows)
mkdir public
move mapsize.png public\mapsize.png

# Or on Mac/Linux:
# mkdir public
# mv mapsize.png public/
```

### 2. Start the Development Server

```bash
npm run dev
```

This will:
- Start Vite dev server on `http://localhost:3000`
- Automatically open your browser
- Hot-reload on code changes

### 3. Start WebSocket Server (If not using Supabase)

Open a **second terminal** and run:

```bash
npm run server
```

This starts the WebSocket server on `ws://localhost:8080` for multiplayer sync.

**Note**: Keep both terminals running - one for the dev server, one for the WebSocket server.

## Testing Scenarios

### Test 1: Basic Map Loading

1. Open `http://localhost:3000` in your browser
2. You should see:
   - The map image displayed
   - Green grid lines overlaying the map (16×14 grid)
   - HUD in the top-left corner
   - "Connect MetaMask" button

**Expected Result**: Map and grid are visible, no errors in console.

### Test 2: MetaMask Connection (Single Player)

1. Make sure MetaMask is installed in your browser
2. Click "Connect MetaMask" button
3. Approve the connection in MetaMask popup
4. Your wallet address should appear in the HUD
5. A colored cube (avatar) should spawn on a random tile
6. You should see a label above the cube with your shortened wallet address

**Expected Result**: 
- Wallet connected
- Avatar spawned on map
- Stamina bar shows 100/100
- Player count shows 1/8

### Test 3: Grid Toggle

1. Click "Toggle Grid" button
2. Grid lines should disappear
3. Click again - grid should reappear

**Expected Result**: Grid visibility toggles correctly.

### Test 4: Multiplayer Testing (2-8 Players)

To test multiplayer, you need multiple browser windows/tabs or different browsers:

#### Option A: Multiple Browser Windows (Same Wallet)

1. Open `http://localhost:3000` in first window
2. Connect MetaMask
3. Open a **new incognito/private window** (or different browser)
4. Navigate to `http://localhost:3000`
5. Connect MetaMask (same or different wallet)
6. Second avatar should appear

**Note**: If using the same wallet, you might get an error about player already existing (this is expected).

#### Option B: Different Wallets (Recommended)

1. Open first browser window → Connect Wallet 1
2. Open second browser window (or different browser) → Connect Wallet 2
3. Open third browser window → Connect Wallet 3
4. Continue up to 8 players

**Expected Result**:
- Each player sees all other players' avatars
- Each avatar has a different color
- Player count updates in real-time
- All avatars are on different tiles

### Test 5: WebSocket Connection

1. Open browser console (F12)
2. Look for connection messages:
   - "Connected to WebSocket server" (if WebSocket is running)
   - Or "Running in local-only mode" (if WebSocket is not running)

**Expected Result**: Console shows successful connection or fallback message.

### Test 6: Maximum Players Limit

1. Connect 8 different wallets
2. Try to connect a 9th wallet
3. Should see error: "No available tiles. Maximum players reached."

**Expected Result**: 9th player cannot join, error message displayed.

## Troubleshooting

### Map Not Loading

- **Check**: Is `mapsize.png` in the `public/` folder?
- **Check**: Browser console for 404 errors
- **Fix**: Move file to `public/` folder and restart dev server

### MetaMask Not Connecting

- **Check**: Is MetaMask installed?
- **Check**: Is MetaMask unlocked?
- **Check**: Browser console for errors
- **Fix**: Install MetaMask extension, unlock wallet, refresh page

### Players Not Syncing

- **Check**: Is WebSocket server running? (`npm run server`)
- **Check**: Browser console for WebSocket errors
- **Check**: Are both servers running? (dev server + WebSocket server)
- **Fix**: Start WebSocket server in separate terminal

### Avatar Not Spawning

- **Check**: Browser console for errors
- **Check**: Are there available tiles? (max 8 players)
- **Check**: Did MetaMask connection succeed?
- **Fix**: Check console errors, try refreshing page

### Grid Not Visible

- **Check**: Click "Toggle Grid" button
- **Check**: Grid should be semi-transparent green lines
- **Fix**: Grid might be behind map - check z-index in code

## Browser Console Commands

Open browser console (F12) to debug:

```javascript
// Check if game is initialized
window.game // Should show Game instance

// Check current players
// (Access through game.playerManager.players)
```

## Testing Checklist

- [ ] Map loads and displays correctly
- [ ] Grid overlay is visible (16×14 tiles)
- [ ] MetaMask connection works
- [ ] Avatar spawns after connection
- [ ] Grid toggle works
- [ ] HUD displays wallet address
- [ ] Stamina bar shows 100/100
- [ ] Multiple players can connect (2-8)
- [ ] All players see each other's avatars
- [ ] Player count updates correctly
- [ ] Maximum 8 players enforced
- [ ] WebSocket connection established (or local-only mode)
- [ ] No console errors

## Next Steps After Testing

Once basic testing passes:
- Test with Supabase (if configured)
- Test on different devices/browsers
- Test network disconnection/reconnection
- Test with different screen sizes

