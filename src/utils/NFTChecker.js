/**
 * NFT Checker - Checks for Sandbox NFTs in wallet
 * 
 * Options:
 * 1. Alchemy API (free tier: https://www.alchemy.com/)
 * 2. Moralis API (free tier: https://moralis.io/)
 * 3. OpenSea API (requires API key)
 * 4. Direct blockchain calls (no API needed, but slower)
 */

export class NFTChecker {
    constructor() {
        // Sandbox NFT Contract Addresses (Ethereum Mainnet)
        this.sandboxContracts = {
            // Main Sandbox LAND contract
            LAND: '0x5cc5b05a8a13e3fbdb0bb9fccd98d38e50f90c38',
            // Sandbox ASSET contract
            ASSET: '0xa342f5d851e866e18ff98f351f2c0b24777648e0',
            // Add more Sandbox contracts as needed
        };

        // API configuration - set in .env or use defaults
        this.apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';
        this.useAlchemy = !!this.apiKey;
        this.network = 'eth-mainnet'; // or 'polygon-mainnet' if Sandbox uses Polygon
    }

    /**
     * Check if wallet owns any Sandbox NFTs
     * @param {string} walletAddress - Ethereum wallet address
     * @returns {Promise<{hasSandboxNFTs: boolean, nfts: Array, count: number}>}
     */
    async checkSandboxNFTs(walletAddress) {
        if (!walletAddress) {
            return { hasSandboxNFTs: false, nfts: [], count: 0 };
        }

        try {
            if (this.useAlchemy) {
                return await this.checkWithAlchemy(walletAddress);
            } else {
                // Fallback: Use OpenSea public API (no key needed, but rate limited)
                return await this.checkWithOpenSea(walletAddress);
            }
        } catch (error) {
            console.error('Error checking NFTs:', error);
            return { hasSandboxNFTs: false, nfts: [], count: 0, error: error.message };
        }
    }

    /**
     * Check NFTs using Alchemy API (recommended - free tier available)
     */
    async checkWithAlchemy(walletAddress) {
        const contractAddresses = Object.values(this.sandboxContracts);
        const allNFTs = [];

        for (const contract of contractAddresses) {
            try {
                const url = `https://${this.network}.g.alchemy.com/nft/v2/${this.apiKey}/getNFTs?owner=${walletAddress}&contractAddresses[]=${contract}&withMetadata=true`;
                
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Alchemy API error: ${response.status}`);
                
                const data = await response.json();
                if (data.ownedNfts && data.ownedNfts.length > 0) {
                    allNFTs.push(...data.ownedNfts);
                }
            } catch (error) {
                console.warn(`Error checking contract ${contract}:`, error);
            }
        }

        return {
            hasSandboxNFTs: allNFTs.length > 0,
            nfts: allNFTs,
            count: allNFTs.length
        };
    }

    /**
     * Check NFTs using OpenSea API (public, no key needed but rate limited)
     */
    async checkWithOpenSea(walletAddress) {
        const contractAddresses = Object.values(this.sandboxContracts);
        const allNFTs = [];

        for (const contract of contractAddresses) {
            try {
                // OpenSea API v2 - public endpoint (rate limited)
                const url = `https://api.opensea.io/api/v2/chain/ethereum/account/${walletAddress}/nfts?contract_address=${contract}`;
                
                const response = await fetch(url, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 429) {
                        console.warn('OpenSea API rate limit - consider using Alchemy API');
                    }
                    continue;
                }

                const data = await response.json();
                if (data.nfts && data.nfts.length > 0) {
                    allNFTs.push(...data.nfts);
                }
            } catch (error) {
                console.warn(`Error checking contract ${contract}:`, error);
            }
        }

        return {
            hasSandboxNFTs: allNFTs.length > 0,
            nfts: allNFTs,
            count: allNFTs.length
        };
    }

    /**
     * Check NFTs using direct blockchain calls (no API needed)
     * Requires ethers.js or web3.js
     */
    async checkWithBlockchain(walletAddress) {
        // This would require ethers.js library
        // Implementation would query ERC-721 balanceOf for each contract
        // More complex but no API needed
        throw new Error('Direct blockchain checking not implemented - use API method');
    }

    /**
     * Get Sandbox NFT details (name, image, etc.)
     */
    getNFTDetails(nft) {
        if (this.useAlchemy && nft.metadata) {
            return {
                name: nft.metadata.name || 'Unnamed',
                image: nft.metadata.image || '',
                description: nft.metadata.description || '',
                tokenId: nft.tokenId,
                contract: nft.contract.address
            };
        } else if (nft.name) {
            // OpenSea format
            return {
                name: nft.name || 'Unnamed',
                image: nft.image_url || nft.image || '',
                description: nft.description || '',
                tokenId: nft.identifier || nft.token_id,
                contract: nft.contract || nft.contract_address
            };
        }
        return null;
    }
}

