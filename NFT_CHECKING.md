# NFT Checking Setup

The game can now check if a wallet contains Sandbox NFTs!

## How It Works

When a player connects their MetaMask wallet, the game automatically:
1. Checks their wallet address
2. Queries OpenSea API for Sandbox NFTs
3. Shows a 🎮 icon next to their wallet if they own Sandbox NFTs
4. Logs the NFT count in the browser console

## Current Setup

- **API Used**: OpenSea API (public, no key needed)
- **Sandbox Contracts Checked**:
  - LAND: `0x5cc5b05a8a13e3fbdb0bb9fccd98d38e50f90c38`
  - ASSET: `0xa342f5d851e866e18ff98f351f2c0b24777648e0`

## Optional: Use Alchemy API (Better Performance)

OpenSea API is rate-limited. For better performance:

1. **Get free Alchemy API key**:
   - Go to https://www.alchemy.com/
   - Sign up (free tier available)
   - Create an app
   - Copy your API key

2. **Add to environment**:
   - Create `.env` file in project root
   - Add: `VITE_ALCHEMY_API_KEY=your_key_here`

3. **Update code** (if needed):
   - The code will automatically use Alchemy if the key is set

## What You Can Do With NFT Data

The `nftResult` object contains:
```javascript
{
    hasSandboxNFTs: true/false,
    nfts: [...], // Array of NFT objects
    count: 5     // Number of NFTs found
}
```

You can use this to:
- Give special spawn locations
- Different avatar colors/styles
- Special abilities or perks
- Display NFT images
- Show NFT names in the HUD

## Testing

1. Connect a wallet with Sandbox NFTs
2. Check browser console (F12) for NFT details
3. Look for 🎮 icon next to wallet address in HUD

## Adding More Sandbox Contracts

Edit `play.html` and add to `sandboxContracts`:
```javascript
this.sandboxContracts = {
    LAND: '0x5cc5b05a8a13e3fbdb0bb9fccd98d38e50f90c38',
    ASSET: '0xa342f5d851e866e18ff98f351f2c0b24777648e0',
    NEW_CONTRACT: '0x...' // Add new contract here
};
```

