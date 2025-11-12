# Quick Start - How to Play the WebGL Game

## This is a Web Browser Game!

You **cannot** just double-click `index.html` - it needs to run through a web server.

## Simple Steps to Play:

### Step 1: Install Node.js (if you haven't)
- Download from: https://nodejs.org/
- Install it
- Restart your terminal/PowerShell

### Step 2: Open PowerShell/Terminal in this folder
- Right-click in the `mpgme` folder
- Select "Open in Terminal" or "Open PowerShell here"

### Step 3: Install the game dependencies
```powershell
npm install
```

### Step 4: Move the map file
```powershell
mkdir public
move mapsize.png public\mapsize.png
```

### Step 5: Start the game server
```powershell
npm run dev
```

This will:
- Start a web server
- Open your browser automatically to `http://localhost:3000`
- **The game will be playable in your browser!**

### Step 6: (Optional) Start multiplayer server
Open a **second PowerShell window** and run:
```powershell
npm run server
```

## That's it! The game runs in your web browser at http://localhost:3000

You'll see:
- The map
- Grid overlay
- "Connect MetaMask" button
- Click to connect your wallet and play!

