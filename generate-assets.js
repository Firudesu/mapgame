#!/usr/bin/env node

/**
 * PixelLab Asset Generator
 * Dev tool to generate pixel art assets for the game
 * 
 * Usage:
 *   node generate-assets.js tile road
 *   node generate-assets.js avatar warrior
 *   node generate-assets.js ui button
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PIXELLAB_API = 'https://api.pixellab.ai/mcp';
const API_TOKEN = 'f31dfd06-f503-4a19-8fe2-f6de22e2c7d0';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Cache for available tools
let availableToolsCache = null;

/**
 * Save image to file
 */
function saveImage(buffer, type, name, resolve) {
    // Use megacorp_ prefix for mega corp buildings
    const prefix = type === 'megacorp' ? 'megacorp' : type;
    const filename = `${prefix}_${name}.png`;
    const filepath = path.join(ASSETS_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`✅ Generated: ${filename}`);
    console.log(`   Saved to: ${filepath}`);
    resolve(filepath);
}

/**
 * Scale an image buffer using canvas (simple nearest-neighbor scaling for pixel art)
 */
async function scaleImage(imageBuffer, srcWidth, srcHeight, dstWidth, dstHeight) {
    // Try to use sharp if available, otherwise use canvas
    try {
        const sharp = await import('sharp');
        return await sharp.default(imageBuffer)
            .resize(dstWidth, dstHeight, { 
                kernel: 'nearest', // Preserve pixel art style
                withoutEnlargement: true 
            })
            .png()
            .toBuffer();
    } catch (e) {
        // Fallback: use canvas if available
        try {
            const { createCanvas, loadImage } = await import('canvas');
            const img = await loadImage(imageBuffer);
            const canvas = createCanvas(dstWidth, dstHeight);
            const ctx = canvas.getContext('2d');
            
            // Disable image smoothing for pixel art
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, dstWidth, dstHeight);
            
            return canvas.toBuffer('image/png');
        } catch (e2) {
            // If neither is available, return original (user can scale manually)
            console.warn('⚠️  No image scaling library available. Install "sharp" or "canvas" for automatic scaling.');
            console.warn('   Generated image is 32x32, needs manual scaling to 16x16');
            return imageBuffer;
        }
    }
}

/**
 * Poll for map object completion and download when ready
 */
async function pollMapObject(objectId, type, name, generateWidth, generateHeight, targetWidth, targetHeight, resolve, reject) {
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    let attempts = 0;
    
    const checkStatus = async () => {
        attempts++;
        
        return new Promise((pollResolve, pollReject) => {
            const requestData = JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: 'get_map_object',
                    arguments: {
                        object_id: objectId
                    }
                }
            });

            const options = {
                hostname: 'api.pixellab.ai',
                path: '/mcp',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream',
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Length': Buffer.byteLength(requestData)
                }
            };

            const req = https.request(options, (res) => {
                let buffer = '';
                let jsonData = null;

                res.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('data: ')) {
                            try {
                                jsonData = JSON.parse(trimmed.substring(6));
                                break;
                            } catch (e) {}
                        }
                    }
                });

                res.on('end', () => {
                    if (!jsonData && buffer.trim()) {
                        const match = buffer.match(/data:\s*({.*})/);
                        if (match) jsonData = JSON.parse(match[1]);
                        else jsonData = JSON.parse(buffer);
                    }
                    
                    if (jsonData && jsonData.result) {
                        const result = jsonData.result;
                        
                        // Check if response has structured data
                        if (result.status === 'completed' && result.image_data) {
                            // Got the image in structured format!
                            const base64Data = result.image_data.replace(/^data:image\/\w+;base64,/, '');
                            let buffer = Buffer.from(base64Data, 'base64');
                            
                            // Scale down if needed (e.g., from 32x32 to 16x16)
                            if (generateWidth > targetWidth || generateHeight > targetHeight) {
                                scaleImage(buffer, generateWidth, generateHeight, targetWidth, targetHeight)
                                    .then(scaledBuffer => {
                                        buffer = scaledBuffer;
                                        console.log(`📐 Scaled from ${generateWidth}x${generateHeight} to ${targetWidth}x${targetHeight}`);
                                        saveImage(buffer, type, name, pollResolve);
                                    })
                                    .catch(scaleError => {
                                        console.warn('⚠️  Scaling failed, saving at original size:', scaleError.message);
                                        saveImage(buffer, type, name, pollResolve);
                                    });
                            } else {
                                saveImage(buffer, type, name, pollResolve);
                            }
                            return;
                        }
                        
                        // Check if response has text content (API sometimes returns text)
                        if (result.content && Array.isArray(result.content)) {
                            const textContent = result.content.find(c => c.type === 'text');
                            if (textContent) {
                                const text = textContent.text;
                                
                                // Check for image data in content
                                const imageContent = result.content.find(c => c.type === 'image');
                                if (imageContent && imageContent.data) {
                                    // Got the image in content format!
                                    const base64Data = imageContent.data.replace(/^data:image\/\w+;base64,/, '');
                                    let buffer = Buffer.from(base64Data, 'base64');
                                    
                                    // Scale down if needed
                                    if (generateWidth > targetWidth || generateHeight > targetHeight) {
                                        scaleImage(buffer, generateWidth, generateHeight, targetWidth, targetHeight)
                                            .then(scaledBuffer => {
                                                buffer = scaledBuffer;
                                                console.log(`📐 Scaled from ${generateWidth}x${generateHeight} to ${targetWidth}x${targetHeight}`);
                                                saveImage(buffer, type, name, pollResolve);
                                            })
                                            .catch(scaleError => {
                                                console.warn('⚠️  Scaling failed, saving at original size:', scaleError.message);
                                                saveImage(buffer, type, name, pollResolve);
                                            });
                                    } else {
                                        saveImage(buffer, type, name, pollResolve);
                                    }
                                    return;
                                }
                                
                                // Check if still processing
                                if (text.includes('still being generated') || text.includes('Processing') || text.includes('ETA:')) {
                                    const etaMatch = text.match(/ETA[:\s~]*(\d+)s/i);
                                    const eta = etaMatch ? parseInt(etaMatch[1]) : 0;
                                    const percentMatch = text.match(/(\d+)% complete/i);
                                    const percent = percentMatch ? parseInt(percentMatch[1]) : 0;
                                    console.log(`⏳ Still processing... ${percent}% complete, ETA: ${eta}s (attempt ${attempts}/${maxAttempts})`);
                                    pollReject(new Error('still_processing'));
                                    return;
                                }
                                
                                // Check if failed
                                if (text.includes('failed') || text.includes('error') || text.includes('Error')) {
                                    pollReject(new Error(`Generation failed: ${text.substring(0, 200)}`));
                                    return;
                                }
                                
                                // If we get here, status is unclear - retry
                                console.log(`⏳ Status unclear, retrying... (attempt ${attempts}/${maxAttempts})`);
                                pollReject(new Error('still_processing'));
                                return;
                            }
                        }
                        
                        // If we get here, response format is unexpected
                        console.log('📋 Unexpected response format:', JSON.stringify(result, null, 2).substring(0, 500));
                        pollReject(new Error('Unexpected response format from get_map_object'));
                    } else {
                        pollReject(new Error('Invalid response from get_map_object'));
                    }
                });
            });

            req.on('error', pollReject);
            req.write(requestData);
            req.end();
        });
    };
    
    // Poll with exponential backoff
    const poll = async () => {
        try {
            const filepath = await checkStatus();
            resolve(filepath);
        } catch (error) {
            if (error.message === 'still_processing' && attempts < maxAttempts) {
                // Wait before retrying (exponential backoff)
                const waitTime = Math.min(5000 * Math.pow(1.2, attempts), 30000); // Max 30 seconds
                setTimeout(poll, waitTime);
            } else {
                reject(error);
            }
        }
    };
    
    // Start polling after initial delay
    setTimeout(poll, 2000); // Wait 2 seconds before first check
}

/**
 * List available MCP tools
 */
async function listTools() {
    return new Promise((resolve, reject) => {
        const requestData = JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/list',
            params: {}
        });

        const options = {
            hostname: 'api.pixellab.ai',
            path: '/mcp',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Length': Buffer.byteLength(requestData)
            }
        };

        const req = https.request(options, (res) => {
            let buffer = '';
            let jsonData = null;

            res.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('data: ')) {
                        try {
                            jsonData = JSON.parse(line.substring(6));
                            break;
                        } catch (e) {}
                    }
                }
            });

            res.on('end', () => {
                if (!jsonData && buffer.trim()) {
                    const dataMatch = buffer.match(/data:\s*({.*})/);
                    if (dataMatch) {
                        jsonData = JSON.parse(dataMatch[1]);
                    } else {
                        jsonData = JSON.parse(buffer);
                    }
                }
                
                if (jsonData && jsonData.result && jsonData.result.tools) {
                    resolve(jsonData.result.tools);
                } else {
                    console.log('Tools list response:', JSON.stringify(jsonData, null, 2));
                    reject(new Error('Could not get tools list'));
                }
            });
        });

        req.on('error', reject);
        req.write(requestData);
        req.end();
    });
}

/**
 * Generate asset using PixelLab MCP
 */
async function generateAsset(type, name, prompt) {
    return new Promise((resolve, reject) => {
        const defaultPrompts = {
            tile: {
                road: '16x16 pixel art road tile, top-down view, gray asphalt with yellow lines, retro game style',
                hazard: '16x16 pixel art hazard tile, orange warning color, top-down view, retro game style',
                city: '16x16 pixel art city tile, buildings, top-down view, retro game style',
                hospital: '16x16 pixel art hospital tile, red cross, top-down view, retro game style',
                market: '16x16 pixel art market tile, shop building, top-down view, retro game style',
                resource: '16x16 pixel art resource tile, green grass with resources, top-down view, retro game style',
                bridge: '16x16 pixel art bridge tile, blue water bridge, top-down view, retro game style',
                blank: '16x16 pixel art blank tile, simple ground texture, top-down view, retro game style'
            },
            avatar: {
                default: '16x16 pixel art character sprite, facing forward, colorful, retro game style',
                warrior: '16x16 pixel art warrior character, armor, sword, retro game style',
                mage: '16x16 pixel art mage character, robe, staff, retro game style',
                rogue: '16x16 pixel art rogue character, hood, dagger, retro game style'
            },
            ui: {
                button: '32x16 pixel art button, green border, retro game UI style',
                icon: '16x16 pixel art icon, simple design, retro game style'
            }
        };

        const finalPrompt = prompt || (defaultPrompts[type] && defaultPrompts[type][name]) || 
            `16x16 pixel art ${type} ${name}, retro game style, top-down view`;

        // MCP uses JSON-RPC 2.0 format
        // Handle different asset types and sizes
        let width, height, targetWidth, targetHeight;
        
        if (type === 'megacorp') {
            // Mega corps: 4 tiles wide × 8 tiles tall = 64px × 128px
            width = 64;
            height = 128;
            targetWidth = 64;
            targetHeight = 128;
        } else if (type === 'building') {
            // Buildings: Custom size (default 5×5 tiles = 80px × 80px)
            // Can be overridden by name (e.g., "market_5x5" = 80×80)
            const sizeMatch = name.match(/(\d+)x(\d+)/);
            if (sizeMatch) {
                const tilesWide = parseInt(sizeMatch[1]);
                const tilesTall = parseInt(sizeMatch[2]);
                width = tilesWide * 16;
                height = tilesTall * 16;
            } else {
                // Default 5×5
                width = 80;
                height = 80;
            }
            targetWidth = width;
            targetHeight = height;
        } else {
            // Regular tiles/avatars: 16x16 or 32x32
            const targetSize = type === 'tile' || type === 'avatar' ? 16 : 32;
            const generateSize = Math.max(targetSize, 32); // Minimum 32px for API
            width = generateSize;
            height = generateSize;
            targetWidth = targetSize;
            targetHeight = targetSize;
        }
        
        // Determine view: check if prompt mentions isometric, otherwise use defaults
        let viewType = 'high top-down';
        if (type === 'megacorp' || type === 'building') {
            // Check if prompt mentions isometric
            if (finalPrompt.toLowerCase().includes('isometric') || finalPrompt.toLowerCase().includes('iso')) {
                viewType = 'low top-down'; // Low top-down gives more isometric perspective
            } else {
                viewType = 'side';
            }
        } else if (targetWidth === 16 && name !== 'road') {
            viewType = 'side';
        }
        
        // Use create_map_object for game assets (supports side view, etc.)
        const requestId = Date.now();
        const requestData = JSON.stringify({
            jsonrpc: '2.0',
            id: requestId,
            method: 'tools/call',
            params: {
                name: 'create_map_object',
                arguments: {
                    description: finalPrompt,
                    width: width,
                    height: height,
                    view: viewType,
                    outline: 'single color outline',
                    shading: 'medium shading',
                    detail: 'medium detail'
                }
            }
        });
        
        console.log(`🔧 Using tool: create_map_object`);
        
        console.log(`📤 Requesting factory asset with prompt: "${finalPrompt.substring(0, 50)}..."`);

        const options = {
            hostname: 'api.pixellab.ai',
            path: '/mcp',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Length': Buffer.byteLength(requestData)
            }
        };

        const req = https.request(options, (res) => {
            let buffer = '';
            let jsonData = null;

            res.on('data', (chunk) => {
                buffer += chunk.toString();
                
                // Parse Server-Sent Events (SSE) format
                // Format: "event: message\ndata: {...}\n\n"
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.substring(6); // Remove "data: " prefix
                            jsonData = JSON.parse(jsonStr);
                            break; // Got the JSON data
                        } catch (e) {
                            // Continue parsing
                        }
                    }
                }
            });

            res.on('end', () => {
                try {
                    console.log(`📡 Response status: ${res.statusCode}`);
                    
                    if (res.statusCode !== 200) {
                        console.log('Raw response:', buffer);
                        reject(new Error(`HTTP ${res.statusCode}: ${buffer}`));
                        return;
                    }
                    
                    // If we didn't parse SSE, try direct JSON
                    if (!jsonData && buffer.trim()) {
                        // Try to extract JSON from buffer if it's SSE format
                        const dataMatch = buffer.match(/data:\s*({.*})/);
                        if (dataMatch) {
                            jsonData = JSON.parse(dataMatch[1]);
                        } else {
                            // Try parsing as plain JSON
                            jsonData = JSON.parse(buffer);
                        }
                    }
                    
                    if (!jsonData) {
                        reject(new Error('No JSON data found in response'));
                        return;
                    }
                    
                    const response = jsonData;
                    
                    // Handle JSON-RPC 2.0 error response
                    if (response.error) {
                        reject(new Error(`MCP Error: ${response.error.message || JSON.stringify(response.error)}`));
                        return;
                    }
                    
                    // Handle JSON-RPC 2.0 success response
                    // create_map_object returns immediately with object_id, then we need to poll get_map_object
                    if (response.result) {
                        let objectId = null;
                        
                        // Check if we got an object_id directly
                        if (response.result.object_id) {
                            objectId = response.result.object_id;
                        } else if (response.result.content && Array.isArray(response.result.content)) {
                            // Check for object_id in text content (API sometimes returns text with object_id)
                            const textContent = response.result.content.find(c => c.type === 'text');
                            if (textContent) {
                                // Try to extract object_id from text (format: **Object ID:** `uuid`)
                                const idMatch = textContent.text.match(/Object ID[:\*]*\s*`?([a-f0-9-]+)`?/i);
                                if (idMatch) {
                                    objectId = idMatch[1];
                                } else {
                                    // If no object_id found, it might be an error message
                                    reject(new Error(`API Error: ${textContent.text.substring(0, 200)}`));
                                    return;
                                }
                            }
                        }
                        
                        if (objectId) {
                            console.log(`⏳ Generation started! Object ID: ${objectId}`);
                            console.log(`⏳ Processing... (takes ~15-30 seconds)`);
                            
                            // Poll for completion (pass target size for scaling)
                            pollMapObject(objectId, type, name, width, height, targetWidth, targetHeight, resolve, reject);
                            return;
                        }
                    }
                    
                    // If we get here, something unexpected happened
                    console.log('📋 Full response:', JSON.stringify(response, null, 2));
                    reject(new Error('Unexpected response format. Expected object_id.'));
                    
                } catch (error) {
                    console.error('❌ Error parsing response:', error.message);
                    console.log('📋 Raw response:', data.substring(0, 500));
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(requestData);
        req.end();
    });
}

/**
 * Generate multiple assets
 */
async function generateBatch(assets) {
    console.log('🎨 Starting asset generation...\n');
    
    for (const asset of assets) {
        try {
            await generateAsset(asset.type, asset.name, asset.prompt);
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`❌ Failed to generate ${asset.type}/${asset.name}:`, error.message);
        }
    }
    
    console.log('\n✨ Asset generation complete!');
}

// CLI interface
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`
🎨 PixelLab Asset Generator

Usage:
  node generate-assets.js <type> <name> [prompt]
  node generate-assets.js batch

Examples:
  node generate-assets.js tile road
  node generate-assets.js avatar warrior
  node generate-assets.js tile city "16x16 pixel art city with buildings"

Types: tile, avatar, ui
    `);
    process.exit(0);
}

if (args[0] === 'batch') {
    // Generate all default assets
    const defaultAssets = [
        { type: 'tile', name: 'road' },
        { type: 'tile', name: 'hazard' },
        { type: 'tile', name: 'city' },
        { type: 'tile', name: 'hospital' },
        { type: 'tile', name: 'market' },
        { type: 'tile', name: 'resource' },
        { type: 'tile', name: 'bridge' },
        { type: 'tile', name: 'blank' },
        { type: 'avatar', name: 'default' },
        { type: 'avatar', name: 'warrior' },
        { type: 'avatar', name: 'mage' },
        { type: 'avatar', name: 'rogue' }
    ];
    
    generateBatch(defaultAssets);
} else if (args.length >= 2) {
    const [type, name, ...promptParts] = args;
    const prompt = promptParts.join(' ') || null;
    
    generateAsset(type, name, prompt)
        .then(() => {
            console.log('✨ Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
} else {
    console.error('❌ Invalid arguments. Use: node generate-assets.js <type> <name> [prompt]');
    process.exit(1);
}

