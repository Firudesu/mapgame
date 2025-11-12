#!/usr/bin/env node

/**
 * PixelLab Character Generator with Animations
 * Creates a character and animates it with walk and idle animations
 * 
 * Usage:
 *   node generate-character.js factory_worker "futuristic factory worker, industrial outfit, tech gear"
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PIXELLAB_API = 'https://api.pixellab.ai/mcp';
const API_TOKEN = 'f31dfd06-f503-4a19-8fe2-f6de22e2c7d0';
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'characters');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

/**
 * Make MCP API request
 */
function makeRequest(method, params) {
    return new Promise((resolve, reject) => {
        const requestData = JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: method,
            params: params
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
                
                if (jsonData && jsonData.error) {
                    reject(new Error(`API Error: ${jsonData.error.message || JSON.stringify(jsonData.error)}`));
                } else {
                    resolve(jsonData);
                }
            });
        });

        req.on('error', reject);
        req.write(requestData);
        req.end();
    });
}

/**
 * Poll character status until complete
 */
async function pollCharacter(characterId) {
    const maxAttempts = 120; // 10 minutes max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        attempts++;
        
        try {
            const response = await makeRequest('tools/call', {
                name: 'get_character',
                arguments: {
                    character_id: characterId,
                    include_preview: false
                }
            });
            
            if (response.result) {
                const result = response.result;
                
                // Check if character is ready
                if (result.rotations && Object.keys(result.rotations).length > 0) {
                    console.log(`✅ Character ready!`);
                    return result;
                }
                
                // Check for pending jobs
                if (result.pending_jobs && result.pending_jobs.length > 0) {
                    const job = result.pending_jobs[0];
                    console.log(`⏳ Character processing... (attempt ${attempts}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    continue;
                }
            }
            
            // If we get here, wait and retry
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.warn(`⚠️  Error checking character status: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    throw new Error('Character generation timed out');
}

/**
 * Create character
 */
async function createCharacter(name, description) {
    console.log(`🎨 Creating character: ${name}...`);
    console.log(`   Description: ${description}`);
    
    const response = await makeRequest('tools/call', {
        name: 'create_character',
        arguments: {
            description: description,
            name: name,
            n_directions: 4, // 4 directions: south, west, east, north (down, left, right, up)
            size: 32, // 32px tall (2 tiles high), character will be ~60% of canvas = ~19px tall, fits in 2 tiles
            view: 'low top-down', // Top-down view for game
            outline: 'single color black outline',
            shading: 'basic shading',
            detail: 'medium detail'
        }
    });
    
    // Debug: log the response structure
    console.log('📋 Response structure:', JSON.stringify(response, null, 2).substring(0, 1000));
    
    if (response.result) {
        let characterId = null;
        
        // Extract character ID from response - try multiple formats
        if (response.result.character_id) {
            characterId = response.result.character_id;
        } else if (response.result.id) {
            characterId = response.result.id;
        } else if (response.result.content && Array.isArray(response.result.content)) {
            // Check text content for character ID
            const textContent = response.result.content.find(c => c.type === 'text');
            if (textContent) {
                // Try various patterns
                const patterns = [
                    /Character ID[:\*]*\s*`?([a-f0-9-]+)`?/i,
                    /character[_\s]id[:\*]*\s*`?([a-f0-9-]+)`?/i,
                    /id[:\*]*\s*`?([a-f0-9-]{8}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{12})`?/i,
                    /([a-f0-9-]{8}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{12})/i
                ];
                
                for (const pattern of patterns) {
                    const match = textContent.text.match(pattern);
                    if (match) {
                        characterId = match[1];
                        break;
                    }
                }
            }
            
            // Also check for direct data in content
            const dataContent = response.result.content.find(c => c.type === 'data' || c.data);
            if (dataContent && dataContent.data && dataContent.data.character_id) {
                characterId = dataContent.data.character_id;
            }
        }
        
        if (characterId) {
            console.log(`⏳ Character ID: ${characterId}`);
            console.log(`⏳ Processing... (takes 2-3 minutes)`);
            return characterId;
        } else {
            console.log('⚠️  Could not extract character ID. Full response:', JSON.stringify(response.result, null, 2));
        }
    }
    
    throw new Error('Could not get character ID from response');
}

/**
 * Animate character
 */
async function animateCharacter(characterId, animationName, templateAnimationId) {
    console.log(`🎬 Animating character with: ${animationName} (${templateAnimationId})...`);
    
    const response = await makeRequest('tools/call', {
        name: 'animate_character',
        arguments: {
            character_id: characterId,
            template_animation_id: templateAnimationId,
            animation_name: animationName,
            action_description: null
        }
    });
    
    if (response.result) {
        console.log(`⏳ Animation job started... (takes 2-4 minutes)`);
        return true;
    }
    
    throw new Error('Could not start animation');
}

/**
 * Download character assets
 */
async function downloadCharacter(characterId, name) {
    console.log(`📥 Downloading character assets...`);
    
    const characterData = await pollCharacter(characterId);
    
    // Wait a bit more for animations
    console.log(`⏳ Waiting for animations to complete...`);
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute for animations
    
    // Get final character data
    const finalResponse = await makeRequest('tools/call', {
        name: 'get_character',
        arguments: {
            character_id: characterId,
            include_preview: true
        }
    });
    
    if (!finalResponse.result) {
        throw new Error('Could not get character data');
    }
    
    const char = finalResponse.result;
    
    // Download rotations (4 directions)
    console.log(`📥 Downloading rotations...`);
    const rotations = {};
    if (char.rotations) {
        for (const [direction, url] of Object.entries(char.rotations)) {
            const imageData = await downloadImage(url);
            const filename = `${name}_${direction}.png`;
            const filepath = path.join(ASSETS_DIR, filename);
            fs.writeFileSync(filepath, imageData);
            rotations[direction] = filepath;
            console.log(`   ✅ ${filename}`);
        }
    }
    
    // Download animations
    console.log(`📥 Downloading animations...`);
    const animations = {};
    if (char.animations && Array.isArray(char.animations)) {
        for (const anim of char.animations) {
            if (anim.status === 'completed' && anim.frames) {
                const animFrames = {};
                for (const [direction, frames] of Object.entries(anim.frames)) {
                    const frameFiles = [];
                    for (let i = 0; i < frames.length; i++) {
                        const imageData = await downloadImage(frames[i]);
                        const filename = `${name}_${anim.name}_${direction}_${i}.png`;
                        const filepath = path.join(ASSETS_DIR, filename);
                        fs.writeFileSync(filepath, imageData);
                        frameFiles.push(filepath);
                        console.log(`   ✅ ${filename}`);
                    }
                    animFrames[direction] = frameFiles;
                }
                animations[anim.name] = animFrames;
            }
        }
    }
    
    return { rotations, animations };
}

/**
 * Download image from URL
 */
function downloadImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        }).on('error', reject);
    });
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log(`
🎨 PixelLab Character Generator with Animations

Usage:
  node generate-character.js <name> "<description>"

Example:
  node generate-character.js factory_worker "futuristic factory worker, industrial outfit, tech gear, retro game style"
        `);
        process.exit(0);
    }
    
    const [name, ...descParts] = args;
    const description = descParts.join(' ');
    
    try {
        // Step 1: Create character
        const characterId = await createCharacter(name, description);
        
        // Step 2: Wait for character to be ready
        await pollCharacter(characterId);
        
        // Step 3: Add walk animation
        await animateCharacter(characterId, 'walk', 'walk');
        
        // Step 4: Add idle animation
        await animateCharacter(characterId, 'idle', 'breathing-idle');
        
        // Step 5: Wait for animations and download
        console.log(`⏳ Waiting for animations to process... (this may take 4-8 minutes total)`);
        const assets = await downloadCharacter(characterId, name);
        
        console.log(`\n✨ Character generation complete!`);
        console.log(`\n📁 Files saved to: ${ASSETS_DIR}`);
        console.log(`\n📋 Rotations:`);
        for (const [dir, file] of Object.entries(assets.rotations)) {
            console.log(`   ${dir}: ${path.basename(file)}`);
        }
        console.log(`\n🎬 Animations:`);
        for (const [animName, frames] of Object.entries(assets.animations)) {
            console.log(`   ${animName}:`);
            for (const [dir, files] of Object.entries(frames)) {
                console.log(`     ${dir}: ${files.length} frames`);
            }
        }
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

main();

