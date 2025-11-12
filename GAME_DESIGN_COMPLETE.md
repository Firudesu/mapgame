# Complete Game Design Breakdown

## 🎮 Core Game Loop

### Player's Daily Cycle
1. **Login** → Check News Terminal (daily hints about future work orders)
2. **Check Work Orders** → View 4 active orders, see recipes, choose which to pursue
3. **Plan Strategy** → 
   - Gather resources needed
   - OR buy from market (speculation)
   - OR craft items in advance
4. **Gather Resources** → Click resource node → See types (Oak, Beech, etc.) → Extract with timers
5. **Craft Items** → Travel to crafting station → Queue recipes → Wait or speed up with Energy Cells
6. **Plan Route** → Consider stamina, rest stops, equipment, hazards, taxes
7. **Travel** → Manage stamina, use equipment (boots, ropes, water), rest at hotels/campsites/land
8. **Deliver** → Arrive at designated depot → Enter delivery queue
9. **Queue Management** → Wait for processing OR spend Energy Cells to speed up position
10. **Get Paid** → Receive SAND per item delivered
11. **Reinvest** → 
    - Buy equipment (boots, ropes, water, etc.)
    - Purchase Energy Cells from NPCs
    - Fund GDP in regions
    - Power your land
    - Rent additional avatar slots
12. **Repeat** → With multiple avatars in parallel if unlocked

---

## 🗺️ World Structure

### Maps
- **Multiple 20×20 tile maps** (current map is one of them)
- Players own **1 land square** per player (total, not per map)
- Inter-map travel costs Energy Cells

### Regions (4 per map)
- **Neon Sector** (Alpha) - Tech upgrades, digital hazards
- **Green Zone** (Beta) - Environmental boosts, nature resources
- **Steel Sector** (Gamma) - Mechanical improvements, industrial zone
- **Plaza Sector** (Delta) - Social bonuses, social hub

### Buildings (1 per region)
- **Megacorp HQ** (4×8 tiles) - Controls region, provides work orders
- **Delivery Depot** (4×4) - Accepts deliveries for work orders
- **Crafting Station** (4×4) - Fixed location, crafting with queues
- **Market Hub** (5×5) - Trading, buy/sell items

---

## 📦 Resource System

### Resource Nodes
- **Visual**: One asset per resource type (e.g., `tile_wood.png` for all wood types)
- **Interaction**: Click resource node → Modal shows available types
- **Types**: Each resource has variants (Wood → Oak, Beech, Pine, etc.)
- **Rarity**: Some types are rare and don't always show

### Resource Generation
- **Current Stock**: Shows available amount (e.g., "100 Oak available")
- **Regeneration**: Generates over time (e.g., +15 Oak every 2 minutes)
- **Max Limit**: Caps at maximum (e.g., 500 Oak max)
- **Flexible**: All values configurable for balancing

### Extraction
- **Time-based**: Each resource type has extraction time per item
- **Click to Extract**: Player clicks resource type → Timer starts → Item added to inventory
- **Queue**: Can queue multiple extractions

### Example Resource Node
```
Wood Resource Node (tile_wood.png)
├── Oak (100 available, +15/2min, max 500) - 5s per item
├── Beech (50 available, +10/3min, max 300) - 4s per item
└── Pine (RARE - 10 available, +2/5min, max 50) - 8s per item
```

---

## 🏭 Crafting System

### Recipe Structure
- **Always Visible**: Recipes shown on work orders
- **Ingredients**: Can be resources OR items (or both)
- **Categories**:
  - Resource → Item (15 seconds)
  - Item → Rare Item (30 seconds)
  - Rare → Legendary (60 seconds)

### Crafting Stations
- **Fixed Locations**: 1 per region
- **Queue System**: 
  - Base: 3 recipe slots
  - Can queue up to 99 items per recipe
  - Can unlock temporary slots with Energy Cells
- **Speed-up**: 
  - Energy Cells reduce time (max 85% speed increase, never instant)
  - More Energy Cells = faster
- **Requirements**: Some recipes need Energy Cells to complete

### Queue Mechanics
- **Multiple Recipes**: Can queue up to 3 different recipes simultaneously
- **One at a Time**: Crafts items sequentially
- **Batch Withdrawal**: Can only withdraw when ALL queued items of that recipe are complete

### Example Recipe
```
Computer
├── Ingredients:
│   ├── Circuit Board (resource) × 1
│   ├── Power Battery (resource) × 1
│   └── CPU (resource) × 1
├── Output: Computer (item) × 1
├── Time: 15 seconds
├── Category: Resource → Item
└── Energy Cell Required: No
```

---

## 💼 Work Orders System

### Structure
- **4 Active Orders**: One per megacorp
- **No Expiration**: Stay active until quota filled
- **First Come First Served**: Pay per item delivered
- **Competition**: Faster delivery = more earnings
- **Closure**: Order closes when quota met

### Work Order Display
- **Megacorp**: Which corp (Alpha, Beta, Gamma, Delta)
- **Item Requested**: What they need
- **Recipe**: Always shown (so players know what to gather)
- **Quota**: Total needed (e.g., "500 Computers")
- **Progress**: How many delivered so far
- **Payout**: SAND per item
- **Depot Location**: Which depot accepts (region + coordinates)

### Example Work Order
```
Corp Alpha - Work Order #42
├── Request: Quantum Computer
├── Recipe: Computer + Cryogenic Cooling + Quantum Control
├── Quota: 1,000 units
├── Progress: 342/1,000 (34%)
├── Payout: 50 SAND per item
└── Depot: Neon Sector - Delivery Depot (64, 32)
```

---

## 🚚 Delivery System

### Delivery Queue
- **FIFO**: First In, First Out processing
- **Base Rate**: Free processing (slower when depot is busy)
- **Speed-up**: Spend Energy Cells to move up in queue
- **Max Speed**: Can make delivery instant with enough Energy Cells
- **Fees**: Some high-tier orders charge Energy Cell fee per delivery (same fee for 1 or 50 items)

### Delivery Process
1. Player arrives at designated depot
2. Opens delivery interface
3. Selects items from inventory
4. Confirms delivery → Enters queue
5. Waits OR spends Energy Cells to speed up
6. Gets paid SAND when processed

---

## 💰 Economy Systems

### SAND Currency
- **Earn**: Work orders, trading profits, events
- **Spend**: 
  - Craft rush (skip queue)
  - Inns/hotels (fast rest)
  - Hub fees (trading taxes)
  - Tolls (fast roads)
  - Gear leases (boots, ropes, water)
  - Avatar slot rentals
  - NPC Energy Cells
  - GDP contributions
  - Routing tools
- **No Payout Boosts**: Spending saves time/friction, not per-item rates

### Energy Cells
- **Uses**:
  - Power land's passive production (1 cell = several days)
  - Speed up delivery queue
  - Speed up crafting (max 85% faster)
  - Inter-map travel costs
  - Recipe requirements
  - Item carrying requirements
  - Unlock crafting queue slots
- **Sources**:
  - Crafting bonuses (chance)
  - Found while gathering (chance)
  - Megacorp rewards
  - NPC vendors (fluctuating price)
  - Sandbox store (SAND/fiat)
  - Daily free amount (per account, capped)
- **Restrictions**: Not tradable or sellable
- **Balance Dials**: Daily free finds, NPC prices, queue speed, land power duration, drop rates

---

## 🏪 Trading System

### Market Hubs
- **Location**: 1 per region
- **Physical Requirement**: Must travel to hub to buy/sell
- **Visibility**: Only see orders at hub you're at

### Trading Features
- **Search**: By name or category
- **Sales History**: Last 15 sales for price discovery
- **Buy**: Browse listings, select quantity, pay tax
- **Sell**: Select items from inventory, set price/quantity, pay placement fee
- **Order Management**: Cancel orders, view active listings
- **Expiration**: Items expire after 48 hours (must relist)

### Tax System
- **Currency**: SAND
- **Split**: 50/50 between buyer and seller
- **Rate**: GDP-based, capped at 10%
- **Placement Fee**: 15% of tax amount (charged when listing, not refunded if expires)
- **Example**: 10% tax on 100 SAND = 5 SAND from buyer, 5 SAND from seller

### Speculative Trading
- **News Hints**: Daily news may hint at future work orders
- **Buy Low**: Purchase resources before demand spikes
- **Craft in Advance**: Prepare items before orders post
- **Pure Trading**: Some players focus only on trading, not gathering/crafting

---

## 🏘️ GDP System

### Mechanics
- **Spend SAND**: Raise GDP in a region
- **Benefits**: 
  - Faster roads
  - Lower stamina drain
  - More rest/repair options
- **Trade-off**: Higher hub fees/taxes in that region
- **Decay**: GDP falls over time if not funded
- **Tolls**: Some fast roads charge small SAND tolls

### GDP Effects
- **Roads**: Higher GDP = faster movement
- **Stamina**: Lower drain in high-GDP regions
- **Services**: More rest spots, repair stations
- **Taxes**: Higher GDP = higher trading taxes (up to 10%)

---

## 🏡 Land Ownership

### Features
- **Ownership**: 1 land square per player (total)
- **Passive Production**: Generates resources over time (only while powered by Energy Cells)
- **Crafting**: Can craft on your land (acts as crafting station)
- **Rest**: Fast stamina recovery when on your land
- **Storage**: Store resources/items
- **Power Requirement**: Production stops if Energy Cell runs out
- **Risk**: Unstored resources become claimable by others if land loses power

### Land Production
- **Timer-based**: Generates resources over real-world time
- **Power Required**: Only produces while Energy Cell is active
- **Storage**: Must move resources to storage or avatar
- **Daily Yield**: Fixed amount per day (when powered)

---

## 👤 Avatar System

### Multi-Avatar Play
- **Shared Inventory**: All avatars share inventory
- **Parallel Operations**: Run multiple avatars simultaneously
- **Slot Limits**: Extra slots are time-limited rentals (SAND cost)
- **Soft Caps**: Prevents pure scale brute force

### Avatar Properties
- **Stamina**: Depletes while moving/gathering, recovers over time
- **Gear Slots**: Equipment (boots, ropes, water, etc.)
- **Carry Capacity**: Inventory size (slot-based, 99 per stack)
- **Movement**: Grid-based, terrain affects speed/stamina

### Equipment
- **Types**: Boots (faster), Ropes (climb), Water (desert), etc.
- **Purchase**: From megacorps (region-specific)
- **Effects**: Movement speed, terrain access, stamina reduction

---

## 🚶 Movement & Stamina

### Movement System
- **Grid-based**: Tile-by-tile movement
- **Route Planning**: Critical for efficiency
- **Terrain Effects**: Different tiles affect speed/stamina
- **Equipment**: Required for some terrain (mountains, deserts)

### Stamina System
- **Recovery Rates**:
  - **Slow**: Default recovery
  - **Fast**: Hotels, campsites, your land
- **Drain**: Moving, gathering, carrying heavy loads
- **Rest Stops**: Plan routes with rest locations

### Route Planning
- **Click Avatar**: Start route planning
- **Draw Path**: Visual path with waypoints
- **Stamina Math**: System calculates ETA based on terrain, load, rest stops
- **Gear Check**: Wrong gear = higher drain, more stops
- **Hazards**: Avoid or prepare for (equipment, Energy Cells)

---

## ⚡ Energy Cell Requirements

### Crafting Requirements
- **Some Recipes**: Need Energy Cells to complete
- **Display**: Recipe UI shows requirement
- **Example**: "Requires 2 Energy Cells to craft"

### Carrying Requirements
- **Delicate Items**: Need Energy Cell in inventory to carry safely
- **Degradation**: Items degrade faster without Energy Cell
- **Emergency Protection**: 
  - If carrying delicate item without Energy Cell
  - Item can consume Energy Cell from inventory
  - Breaks Energy Cell but powers item for 15 minutes
  - Gives time to reach destination

### Display
- **Recipe UI**: Shows all requirements
- **Inventory**: Shows which items need Energy Cells
- **Warnings**: Alert if trying to carry delicate item without Energy Cell

---

## 📰 Corporate News System

### Daily News
- **Timing**: Once per real-world day per megacorp
- **Simultaneous**: All players see at same time (no timezone advantage)
- **Delivery**: News Terminal UI + optional push notifications

### News Types
1. **Operational Announcements** (Possible Hint)
   - May increase chance of related items in future orders
2. **Supply Reports** (Possible Hint)
   - May slightly increase demand for mentioned resources
3. **Market Trends** (Flavor Only/Bluff)
   - No gameplay effect, throws off patterns
4. **R&D Updates** (Possible Hint)
   - May tie into future orders
5. **Emergency Events** (Definite Hint)
   - Strong probability (60-80% correlation) for related items

### Correlation System
- **Hidden Scores**: 0%-80% correlation with next work order
- **High Correlation** (60-80%): Rare, every 10-14 days
- **Low Correlation** (10-30%): Common
- **False Flags** (0%): Pure flavor, no effect

### Speculation Loop
1. Morning news drops
2. Traders analyze and decide:
   - Buy resources now (anticipate price rise)
   - Craft items in advance
   - Sell high now (expect drop)
3. Next work order posts
4. Traders see if prediction was correct

---

## 🎨 UI Systems Needed

### News Terminal
- Daily news display
- Archive/history
- Correlation hints (not exact %)

### Work Orders Panel
- List all 4 active orders
- Show recipe, quota, progress, payout
- Click to see depot location

### Resource Interaction
- Click resource node → Modal
- Show available types with:
  - Current stock
  - Regeneration rate
  - Max limit
  - Extraction time per item
  - Queue extraction

### Crafting Station UI
- Available recipes (from work orders)
- Queue display (current + queued)
- Progress bar
- Speed-up options (Energy Cells)
- Requirements display

### Market Hub UI
- Search/filter
- Buy interface (browse, select quantity)
- Sell interface (select items, set price/quantity)
- Sales history (last 15)
- Order management (view active, cancel)

### Delivery Interface
- Select items from inventory
- Queue position display
- Speed-up option (Energy Cells)
- Payout preview

### Inventory UI
- Slot-based display
- Stack counts (99 per stack)
- Item details (requirements, delicate items)
- Energy Cell indicators

### Route Planning UI
- Visual path drawing
- Waypoint placement
- Stamina calculation
- ETA display
- Gear requirements
- Rest stop suggestions

### GDP Panel
- Regional GDP levels
- Contribution interface
- Benefits display
- Decay warnings

### Land Management UI
- Production status
- Power indicator (Energy Cell active?)
- Storage display
- Crafting interface
- Resource management

---

## 🔄 Complete Player Journey Example

### Morning Routine
1. Login → Check News Terminal
   - "Corp Alpha announces digital infrastructure upgrade"
   - Trader thinks: "Might need circuits/processors soon"
2. Check Work Orders
   - Alpha: 500 Quantum Computers (342/500 delivered)
   - Beta: 1,000 Irrigation Pumps (50/1,000 delivered)
   - Gamma: 200 Industrial Tools (180/200 delivered)
   - Delta: 300 Crowd Drones (0/300 delivered)
3. Decision: Focus on Beta order (most open, good payout)

### Gathering Phase
4. Travel to Green Zone (Beta region)
5. Click Wood Resource Node
   - See: Oak (100 available), Beech (50), Pine (RARE - 10)
   - Queue: 20 Oak extractions (5s each = 100s total)
6. While waiting, check Market Hub
   - See someone selling Refined Lumber (needed for recipe)
   - Buy 50 units for 200 SAND (speculation paid off)

### Crafting Phase
7. Travel to Crafting Station
8. Check recipe: Irrigation Pump = Refined Lumber + Metal Pipes + Water Filter
9. Queue crafting:
   - 50 Irrigation Pumps (30s each = 25 minutes)
   - Spend 2 Energy Cells → 85% faster = ~4 minutes
10. Wait for completion

### Delivery Phase
11. Plan route to Beta Delivery Depot
   - Check stamina: 80/100
   - Route: 15 tiles, 2 hazard tiles, 1 rest stop
   - ETA: 8 minutes
   - Need: Water equipment for desert hazard
12. Buy Water equipment from Beta shop (50 SAND)
13. Travel route → Rest at campsite → Arrive at depot
14. Deliver 50 Irrigation Pumps
   - Enter queue: Position #12
   - Spend 3 Energy Cells → Move to position #1 (instant)
   - Get paid: 50 × 25 SAND = 1,250 SAND

### Reinvestment
15. Check SAND balance: 1,200 SAND
16. Decisions:
   - Buy Energy Cell from NPC (500 SAND) - for land power
   - Fund GDP in Green Zone (200 SAND) - lower future taxes
   - Save for next delivery

### Evening
17. Check land status
   - Production: 50 Oak generated today
   - Power: Energy Cell expires in 2 days
   - Move resources to storage
18. Plan tomorrow:
   - News hinted at Alpha digital upgrade
   - Might craft circuits in advance
   - Check market for cheap components

---

## 🎯 Implementation Priority

### Phase 1: Core Loop Foundation
1. **Work Orders System** - Foundation for everything
2. **SAND Currency** - Economy backbone
3. **Energy Cells** - Pacing mechanism
4. **Basic Resource System** - Click → Extract with timers
5. **Basic Crafting** - Resource → Item recipes

### Phase 2: Economy & Trading
6. **Trading System** - Market hubs, buy/sell
7. **Delivery Queues** - FIFO with Energy Cell speed-up
8. **GDP System** - Regional upgrades

### Phase 3: Advanced Features
9. **Land Ownership** - Production, crafting, rest
10. **Multi-Avatar** - Shared inventory, parallel ops
11. **News System** - Daily hints
12. **Equipment System** - Boots, ropes, water, etc.

### Phase 4: Polish & Balance
13. **UI Polish** - All interfaces
14. **Balance Tuning** - Resource rates, prices, timers
15. **Character Sprites** - Replace cubes
16. **Future Features** - Reputation, politics, etc.

---

## 💡 Resource System Design (Your Suggestion)

### Your Approach
- **One Asset Per Type**: `tile_wood.png` for all wood, `tile_metal.png` for all metal
- **Click to Reveal**: Click resource node → Modal shows available types
- **Type Variants**: Oak, Beech, Pine (for Wood)
- **Rarity System**: Some types are rare and don't always show
- **Regeneration**: Resources generate over time (flexible for balancing)
- **Extraction Timers**: Each type has extraction time per item

### Benefits
- **Streamlined Assets**: One asset per resource type (not tons of variants)
- **Flexible Balancing**: All values configurable (stock, regen rate, max, timers)
- **Discovery**: Clicking reveals what's available (adds exploration)
- **Rarity**: Rare resources create excitement and value

### Implementation Structure
```javascript
{
  nodeId: "wood_node_1",
  type: "wood",
  asset: "tile_wood.png",
  variants: [
    {
      name: "Oak",
      currentStock: 100,
      regenRate: 15, // per cycle
      regenTime: 120, // seconds
      maxStock: 500,
      extractionTime: 5, // seconds per item
      rarity: "common"
    },
    {
      name: "Beech",
      currentStock: 50,
      regenRate: 10,
      regenTime: 180,
      maxStock: 300,
      extractionTime: 4,
      rarity: "common"
    },
    {
      name: "Pine",
      currentStock: 10,
      regenRate: 2,
      regenTime: 300,
      maxStock: 50,
      extractionTime: 8,
      rarity: "rare", // Doesn't always show
      spawnChance: 0.3 // 30% chance to appear
    }
  ]
}
```

### UI Flow
1. Player clicks resource node
2. Modal opens showing:
   - Resource type icon
   - Available variants list
   - For each variant:
     - Name
     - Current stock (e.g., "100 Oak")
     - Regeneration info (e.g., "+15 every 2 min")
     - Max limit (e.g., "Max: 500")
     - Extraction time (e.g., "5s per item")
     - Rarity indicator (if rare)
3. Player clicks variant → Queue extraction
4. Timer shows progress
5. Item added to inventory when complete

---

## ✅ My Assessment

### Resource System: Excellent Approach
- **Streamlined**: One asset per type is much cleaner
- **Flexible**: All values configurable for easy balancing
- **Engaging**: Click to discover adds interaction
- **Scalable**: Easy to add new variants without new assets

### UI/Recipes: I Can Handle
- **Modular UI**: Create reusable components
- **Recipe System**: Data-driven, easy to add/modify
- **Consistent Style**: 16-bit pixel art theme throughout
- **Responsive**: Works with existing HUD system

### Implementation Approach
I'll create:
1. **Data structures** for all systems (work orders, recipes, resources, etc.)
2. **UI components** (modals, panels, interfaces)
3. **Game state management** (SAND, Energy Cells, inventory, etc.)
4. **Integration** with existing systems (movement, multiplayer, etc.)

---

## 🚀 My Recommended Start Order

### Week 1: Foundation
1. **Work Orders System** (data structure + UI)
2. **SAND Currency** (tracking + display)
3. **Energy Cells** (tracking + basic uses)
4. **Resource System** (click → modal → extract with timers)

### Week 2: Core Loop
5. **Basic Crafting** (recipes + queue + timers)
6. **Delivery System** (queues + Energy Cell speed-up)
7. **Inventory System** (slots + stacks + shared)

### Week 3: Economy
8. **Trading System** (market hubs + buy/sell + taxes)
9. **GDP System** (regional upgrades + effects)

### Week 4: Advanced
10. **Land Ownership** (production + crafting + rest)
11. **Equipment System** (boots, ropes, water)
12. **News System** (daily hints)

---

## 📝 Next Steps

1. **Backup Current Code** ✅ (I'll do this)
2. **Start with Work Orders System** - Foundation for everything
3. **Build Resource System** - Your streamlined approach
4. **Create Recipe System** - Data-driven, flexible
5. **Implement UI Components** - Modular, reusable

Ready to start implementation! 🎮

