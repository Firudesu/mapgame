# 🎮 How to Play - Quick Start

## Easiest Way (No npm install needed!)

### Option 1: Double-click START.bat
Just double-click `START.bat` - it will:
- Start a web server
- Open the game in your browser
- You can play immediately!

### Option 2: Manual Start

1. **Open PowerShell in this folder**
   - Right-click in the `mpgme` folder
   - Select "Open in Terminal" or "Open PowerShell here"

2. **Start a simple web server:**
   ```powershell
   python -m http.server 8000
   ```
   (If you don't have Python, install it from python.org)

3. **Open your browser and go to:**
   ```
   http://localhost:8000/play.html
   ```

4. **You should see:**
   - The map image
   - Green grid lines
   - "Connect MetaMask" button

5. **Click "Connect MetaMask"** to play!

## For Multiplayer (Optional)

Open a **second PowerShell window** and run:
```powershell
node server/websocket-server.js
```

This enables multiplayer sync between different browser windows.

## That's it! 🎉

The game is now playable in your web browser!

