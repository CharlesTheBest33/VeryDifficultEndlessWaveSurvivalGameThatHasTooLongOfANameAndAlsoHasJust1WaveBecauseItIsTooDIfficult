// Game State
const gameState = {
    currentScreen: 'menu',
    paused: false,
    gameTime: 0,
    lastTime: 0,
    mouse: { x: 0, y: 0 },
    keys: {},
    player: {
        x: 0,
        y: 0,
        width: 40,
        height: 60,
        speed: 5,
        health: 100,
        maxHealth: 100,
        laserEnergy: 100,
        maxLaserEnergy: 100,
        laserEnergyRegen: 0.5,
        laserDamage: 10,
        fireRate: 500, // ms between shots
        lastShot: 0,
        miningSpeed: 1,
        resources: 0,
        score: 0,
        resourcesMinedThisBreak: 0,
        upgrades: {
            health: 0,
            damage: 0,
            fireRate: 0,
            mining: 0,
            energy: 0
        }
    },
    resources: {
        iron: { value: 1, color: '#ccc', rarity: 0.5 },
        copper: { value: 2, color: '#b87333', rarity: 0.4 },
        gold: { value: 3, color: '#ffd700', rarity: 0.3 },
        platinum: { value: 4, color: '#e5e4e2', rarity: 0.2 },
        titanium: { value: 3, color: '#878681', rarity: 0.25 },
        uranium: { value: 5, color: '#7cfc00', rarity: 0.15 }
    },
    upgrades: [
        {
            id: 'health1',
            name: 'Reinforced Hull',
            description: 'Increase maximum health by 25%',
            price: 5,
            effect: { health: 25 },
            maxLevel: 5
        },
        {
            id: 'damage1',
            name: 'Laser Amplifier',
            description: 'Increase laser damage by 20%',
            price: 5,
            effect: { damage: 20 },
            maxLevel: 5
        },
        {
            id: 'firerate1',
            name: 'Cooling System',
            description: 'Increase fire rate by 15%',
            price: 5,
            effect: { fireRate: 15 },
            maxLevel: 5
        },
        {
            id: 'mining1',
            name: 'Mining Laser',
            description: 'Increase mining speed by 25%',
            price: 5,
            effect: { mining: 25 },
            maxLevel: 4
        },
        {
            id: 'energy1',
            name: 'Energy Core',
            description: 'Increase laser energy capacity and regen by 20%',
            price: 8,
            effect: { energy: 20 },
            maxLevel: 3
        }
    ],
    asteroids: [],
    enemies: [],
    projectiles: [],
    particles: [],
    miningTarget: null,
    miningProgress: 0,
    messageQueue: [],
    wave: 1,
    waveActive: false,
    lastEnemySpawnTime: 0,
    enemySpawnDelay: 3000,
    highScores: {
        global: [],
        local: []
    },
    serverConnected: false
};

// Server Configuration
const serverConfig = {
    url: "https://your-highscore-server.com/api", // Replace with your actual server URL
    endpoints: {
        submitScore: "/scores",
        getScores: "/scores"
    },
    maxRetries: 3,
    retryDelay: 2000
};

// DOM Elements
const screens = {
    menu: document.getElementById('menu-screen'),
    howto: document.getElementById('howto-screen'),
    scores: document.getElementById('scores-screen'),
    game: document.getElementById('game-screen'),
    upgrade: document.getElementById('upgrade-screen'),
    gameover: document.getElementById('gameover-screen')
};

const buttons = {
    startGame: document.getElementById('start-game'),
    howToPlay: document.getElementById('how-to-play'),
    highScores: document.getElementById('high-scores'),
    backFromHowto: document.getElementById('back-from-howto'),
    backFromScores: document.getElementById('back-from-scores'),
    backFromUpgrades: document.getElementById('back-from-upgrades'),
    resumeGame: document.getElementById('resume-game'),
    quitGame: document.getElementById('quit-game'),
    restartGame: document.getElementById('restart-game'),
    submitScore: document.getElementById('submit-score')
};

const hudElements = {
    wave: document.getElementById('wave-count'),
    health: document.getElementById('health-count'),
    resources: document.getElementById('resource-count'),
    laser: document.getElementById('laser-count'),
    score: document.getElementById('score-count')
};

const waveComplete = document.getElementById('wave-complete');
const resourcesMined = document.getElementById('resources-mined');
const gameMessages = document.getElementById('game-messages');
const pauseMenu = document.getElementById('pause-menu');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const upgradesGrid = document.getElementById('upgrades-grid');
const playerStats = {
    health: document.getElementById('stat-health'),
    damage: document.getElementById('stat-damage'),
    firerate: document.getElementById('stat-firerate'),
    mining: document.getElementById('stat-mining'),
    resources: document.getElementById('stat-resources')
};
const gameOverElements = {
    wave: document.getElementById('final-wave'),
    score: document.getElementById('final-score'),
    name: document.getElementById('player-name')
};
const serverStatus = document.getElementById('server-status');
const submitStatus = document.getElementById('submit-status');
const scoreTabs = document.querySelectorAll('.score-tab');

// Initialize Game
function init() {
    setupCanvas();
    setupEventListeners();
    loadLocalHighScores();
    checkServerConnection();
    switchScreen('menu');
    
    // Preload some assets
    const bg = new Image();
    bg.src = 'assets/space-bg.jpg';
}

// Canvas Setup
function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gameState.player.x = canvas.width / 2;
    gameState.player.y = canvas.height / 2;
}

// Event Listeners
function setupEventListeners() {
    // Window events
    window.addEventListener('resize', setupCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    
    // Button events
    buttons.startGame.addEventListener('click', startGame);
    buttons.howToPlay.addEventListener('click', () => switchScreen('howto'));
    buttons.highScores.addEventListener('click', () => switchScreen('scores'));
    buttons.backFromHowto.addEventListener('click', () => switchScreen('menu'));
    buttons.backFromScores.addEventListener('click', () => switchScreen('menu'));
    buttons.backFromUpgrades.addEventListener('click', () => switchScreen('game'));
    buttons.resumeGame.addEventListener('click', togglePause);
    buttons.quitGame.addEventListener('click', quitToMenu);
    buttons.restartGame.addEventListener('click', startGame);
    buttons.submitScore.addEventListener('click', submitHighScore);
    
    // Score tab events
    scoreTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            scoreTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderHighScores(tab.dataset.type);
        });
    });
    
    // Disable context menu on canvas
    canvas.addEventListener('contextmenu', e => e.preventDefault());
}

// Input Handling
function handleKeyDown(e) {
    gameState.keys[e.key.toLowerCase()] = true;
    
    // Global key commands
    switch (e.key) {
        case 'Escape':
            if (gameState.currentScreen === 'game') {
                togglePause();
            } else if (gameState.currentScreen === 'upgrade') {
                switchScreen('game');
            }
            break;
        case 'Tab':
            if (gameState.currentScreen === 'game' && !gameState.paused) {
                switchScreen('upgrade');
                e.preventDefault();
            }
            break;
    }
}

function handleKeyUp(e) {
    gameState.keys[e.key.toLowerCase()] = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    gameState.mouse.x = e.clientX - rect.left;
    gameState.mouse.y = e.clientY - rect.top;
}

function handleMouseDown(e) {
    if (e.button === 0 && gameState.currentScreen === 'game' && !gameState.paused) {
        fireLaser();
    }
}

// Screen Management
function switchScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.remove('visible');
    });
    
    // Show the requested screen
    screens[screenName].classList.add('visible');
    gameState.currentScreen = screenName;
    
    // Special cases
    if (screenName === 'game') {
        if (!gameState.paused) {
            requestAnimationFrame(gameLoop);
        }
        canvas.focus();
    } else if (screenName === 'upgrade') {
        renderUpgradeScreen();
    } else if (screenName === 'scores') {
        renderHighScores('global');
    }
}

// Game State Management
function startGame() {
    resetGameState();
    setupCanvas();
    generateAsteroids(15);
    switchScreen('game');
    requestAnimationFrame(gameLoop);
    addMessage('Welcome to Galactic Miner! Defend against endless waves and mine asteroids.', 'info');
    startNextWave();
}

function resetGameState() {
    // Reset player state
    gameState.player = {
        ...gameState.player,
        x: canvas.width / 2,
        y: canvas.height / 2,
        health: 100,
        maxHealth: 100,
        laserEnergy: 100,
        maxLaserEnergy: 100,
        laserDamage: 10,
        fireRate: 500,
        miningSpeed: 1,
        resources: 0,
        score: 0,
        resourcesMinedThisBreak: 0,
        upgrades: {
            health: 0,
            damage: 0,
            fireRate: 0,
            mining: 0,
            energy: 0
        }
    };
    
    // Reset wave state
    gameState.wave = 1;
    gameState.waveActive = false;
    
    // Clear game objects
    gameState.asteroids = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.miningTarget = null;
    gameState.miningProgress = 0;
    gameState.messageQueue = [];
    gameState.paused = false;
    gameState.gameTime = 0;
    
    // Clear HUD
    updateHUD();
    gameMessages.innerHTML = '';
    waveComplete.style.display = 'none';
}

function togglePause() {
    gameState.paused = !gameState.paused;
    pauseMenu.classList.toggle('hidden', !gameState.paused);
    
    if (!gameState.paused) {
        requestAnimationFrame(gameLoop);
    }
}

function quitToMenu() {
    gameState.paused = false;
    switchScreen('menu');
}

// Server Communication
async function checkServerConnection() {
    try {
        serverStatus.textContent = "Connecting to server...";
        const response = await fetch(`${serverConfig.url}${serverConfig.endpoints.getScores}?limit=1`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            gameState.serverConnected = true;
            serverStatus.textContent = "Connected to global leaderboard";
            serverStatus.classList.add('connected');
            serverStatus.classList.remove('error');
        } else {
            throw new Error('Server error');
        }
    } catch (error) {
        console.error('Server connection failed:', error);
        gameState.serverConnected = false;
        serverStatus.textContent = "Offline mode - local scores only";
        serverStatus.classList.add('error');
        serverStatus.classList.remove('connected');
    }
}

async function submitGlobalHighScore(name, wave, score) {
    if (!gameState.serverConnected) {
        submitStatus.textContent = "Could not connect to server. Score saved locally.";
        submitStatus.style.color = "#f44";
        return false;
    }

    submitStatus.textContent = "Submitting score...";
    submitStatus.style.color = "#8cf";

    try {
        const response = await fetch(`${serverConfig.url}${serverConfig.endpoints.submitScore}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                wave: wave,
                score: score,
                date: new Date().toISOString().split('T')[0]
            })
        });
        
        if (!response.ok) {
            throw new Error('Server error');
        }
        
        const result = await response.json();
        submitStatus.textContent = "Score submitted to global leaderboard!";
        submitStatus.style.color = "#4f4";
        return true;
    } catch (error) {
        console.error('Failed to submit global score:', error);
        submitStatus.textContent = "Failed to submit score. Saved locally instead.";
        submitStatus.style.color = "#f44";
        return false;
    }
}

async function getGlobalHighScores() {
    if (!gameState.serverConnected) return [];

    try {
        const response = await fetch(`${serverConfig.url}${serverConfig.endpoints.getScores}?limit=10`);
        
        if (!response.ok) {
            throw new Error('Server error');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Failed to get global scores:', error);
        return [];
    }
}

// High Score System
function loadLocalHighScores() {
    const savedScores = localStorage.getItem('galacticMinerLocalScores');
    if (savedScores) {
        gameState.highScores.local = JSON.parse(savedScores);
    } else {
        gameState.highScores.local = [
            { name: 'Local Hero', wave: 5, score: 2500, date: '2023-01-01' },
            { name: 'Space Miner', wave: 4, score: 2000, date: '2023-01-01' },
            { name: 'Rookie Pilot', wave: 3, score: 1500, date: '2023-01-01' },
            { name: 'Novice', wave: 2, score: 1000, date: '2023-01-01' },
            { name: 'Beginner', wave: 1, score: 500, date: '2023-01-01' }
        ];
    }
}

async function renderHighScores(type = 'global') {
    const tableBody = document.querySelector('#high-scores-table tbody');
    tableBody.innerHTML = '';
    
    if (type === 'global' && gameState.serverConnected) {
        gameState.highScores.global = await getGlobalHighScores();
    }
    
    const scoresToShow = type === 'global' ? gameState.highScores.global : gameState.highScores.local;
    
    if (scoresToShow.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" style="text-align: center;">No ${type} scores available</td>`;
        tableBody.appendChild(row);
        return;
    }
    
    scoresToShow.forEach((score, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.name}</td>
            <td>${score.wave}</td>
            <td>${score.score}</td>
            <td>${score.date}</td>
        `;
        tableBody.appendChild(row);
    });
}

function saveLocalHighScore(name, wave, score) {
    gameState.highScores.local.push({
        name: name,
        wave: wave,
        score: score,
        date: new Date().toISOString().split('T')[0]
    });
    
    // Sort by wave descending, then by score descending
    gameState.highScores.local.sort((a, b) => {
        if (b.wave !== a.wave) return b.wave - a.wave;
        return b.score - a.score;
    });
    
    // Keep only top 10
    if (gameState.highScores.local.length > 10) {
        gameState.highScores.local = gameState.highScores.local.slice(0, 10);
    }
    
    // Save to localStorage
    localStorage.setItem('galacticMinerLocalScores', JSON.stringify(gameState.highScores.local));
}

async function submitHighScore() {
    const name = gameOverElements.name.value.trim() || 'Anonymous';
    const wave = gameState.wave - 1; // Subtract 1 because wave increments before game over
    const score = gameState.player.score;
    
    // Disable button to prevent multiple submissions
    buttons.submitScore.disabled = true;
    
    // Try to submit to global leaderboard
    const globalSuccess = await submitGlobalHighScore(name, wave, score);
    
    // Always save locally
    saveLocalHighScore(name, wave, score);
    
    // Show scores
    switchScreen('scores');
}

// Wave System
function startNextWave() {
    // Hide wave complete screen
    waveComplete.style.display = 'none';
    
    // Reset resources mined counter
    gameState.player.resourcesMinedThisBreak = 0;
    
    // Start wave
    gameState.waveActive = true;
    gameState.lastEnemySpawnTime = 0;
    
    // Update HUD
    hudElements.wave.textContent = gameState.wave;
    
    // Spawn initial enemies
    spawnWaveEnemies();
    
    addMessage(`Wave ${gameState.wave} started! Defeat the enemies.`, 'warning');
}

function spawnWaveEnemies() {
    const now = Date.now();
    if (now - gameState.lastEnemySpawnTime < gameState.enemySpawnDelay) return;
    
    const enemiesToSpawn = 2 + Math.floor(gameState.wave / 2);
    
    for (let i = 0; i < enemiesToSpawn; i++) {
        spawnEnemy();
        gameState.lastEnemySpawnTime = now;
    }
}

function spawnEnemy() {
    const p = gameState.player;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    // Base enemy stats
    const baseHealth = 50;
    const baseSpeed = 1;
    const baseDamage = 10;
    
    // Scale with wave
    const waveScale = 1 + (gameState.wave - 1) * 0.2;
    
    switch (side) {
        case 0: // top
            x = Math.random() * canvas.width;
            y = -50;
            break;
        case 1: // right
            x = canvas.width + 50;
            y = Math.random() * canvas.height;
            break;
        case 2: // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 50;
            break;
        case 3: // left
            x = -50;
            y = Math.random() * canvas.height;
            break;
    }
    
    gameState.enemies.push({
        x: x,
        y: y,
        width: 40,
        height: 40,
        speed: baseSpeed * waveScale,
        health: baseHealth * waveScale,
        maxHealth: baseHealth * waveScale,
        damage: baseDamage * waveScale,
        color: '#f44',
        lastShot: 0,
        shotDelay: 2000 + Math.random() * 1000,
        value: 10 * Math.floor(waveScale)
    });
}

function endWave() {
    gameState.waveActive = false;
    gameState.wave++;
    
    // Show wave complete screen
    waveComplete.style.display = 'block';
    resourcesMined.textContent = gameState.player.resourcesMinedThisBreak;
    
    // Generate new asteroids (more in later waves)
    generateAsteroids(5 + Math.floor(gameState.wave / 2));
    
    addMessage(`Wave complete! Mined ${gameState.player.resourcesMinedThisBreak} resources.`, 'success');
}

// Enemy System
function updateEnemies(deltaTime) {
    const p = gameState.player;
    const now = Date.now();
    
    // Spawn enemies if wave is active
    if (gameState.waveActive && 
        gameState.enemies.length < 3 + Math.floor(gameState.wave / 2) && 
        now - gameState.lastEnemySpawnTime > gameState.enemySpawnDelay) {
        spawnWaveEnemies();
    }
    
    // Update existing enemies
    gameState.enemies.forEach((enemy, index) => {
        // Move toward player
        const dx = p.x - enemy.x;
        const dy = p.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;
        
        // Shoot at player
        if (now - enemy.lastShot > enemy.shotDelay && dist < 300) {
            enemy.lastShot = now;
            
            gameState.projectiles.push({
                x: enemy.x,
                y: enemy.y,
                width: 10,
                height: 10,
                speed: 4,
                dx: dx / dist,
                dy: dy / dist,
                damage: enemy.damage,
                color: '#f88',
                isEnemy: true,
                life: 2000
            });
        }
        
        // Check collision with player
        if (checkCollision(enemy, p)) {
            if (p.health > 0) {
                p.health -= enemy.damage;
                
                // Remove enemy on collision
                gameState.enemies.splice(index, 1);
                
                // Create explosion
                createExplosion(enemy.x, enemy.y, '#f44');
                
                addMessage('Enemy ship collided with you!', 'warning');
                updateHUD();
                
                // Check for player death
                if (p.health <= 0) {
                    p.health = 0;
                    gameOver();
                }
            }
        }
    });
    
    // Check if wave is complete (no more enemies)
    if (gameState.waveActive && gameState.enemies.length === 0) {
        endWave();
    }
}

// Combat System
function fireLaser() {
    const p = gameState.player;
    const now = Date.now();
    
    // Check if can fire
    if (now - p.lastShot < p.fireRate * (1 - p.upgrades.fireRate * 0.01)) {
        return;
    }
    
    if (p.laserEnergy <= 0) {
        addMessage('Laser energy depleted! Wait for recharge.', 'warning');
        return;
    }
    
    // Calculate direction to mouse
    const dx = gameState.mouse.x - p.x;
    const dy = gameState.mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Create projectile
    gameState.projectiles.push({
        x: p.x,
        y: p.y,
        width: 5,
        height: 5,
        speed: 10,
        dx: dx / dist,
        dy: dy / dist,
        damage: p.laserDamage * (1 + p.upgrades.damage * 0.01),
        color: '#0ff',
        isEnemy: false,
        life: 1000 // 1 second lifetime
    });
    
    // Update player state
    p.lastShot = now;
    p.laserEnergy -= 5;
    if (p.laserEnergy < 0) p.laserEnergy = 0;
    
    // Create muzzle flash
    createMuzzleFlash(p.x, p.y, dx / dist, dy / dist);
}

function createMuzzleFlash(x, y, dx, dy) {
    // Offset from player center
    const offsetX = dx * 25;
    const offsetY = dy * 25;
    
    for (let i = 0; i < 10; i++) {
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
        const speed = 1 + Math.random() * 3;
        
        gameState.particles.push({
            x: x + offsetX,
            y: y + offsetY,
            size: 2 + Math.random() * 4,
            color: '#0ff',
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            life: 100 + Math.random() * 200,
            type: 'muzzle'
        });
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        
        gameState.particles.push({
            x: x,
            y: y,
            size: 3 + Math.random() * 5,
            color: color,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            life: 500 + Math.random() * 500,
            type: 'explosion'
        });
    }
}

// Mining System
function generateAsteroids(count) {
    const types = Object.keys(gameState.resources);
    
    for (let i = 0; i < count; i++) {
        const size = 30 + Math.random() * 70;
        const type = types[Math.floor(Math.random() * types.length)];
        const rarity = gameState.resources[type].rarity;
        
        // Adjust probability based on rarity
        if (Math.random() > rarity) continue;
        
        gameState.asteroids.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: size,
            type: type,
            resources: Math.floor(size / 10) * (1 + Math.random()),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            color: gameState.resources[type].color
        });
    }
}

function mineAsteroid(asteroid) {
    const p = gameState.player;
    const yieldMultiplier = p.miningSpeed * (1 + p.upgrades.mining * 0.01);
    
    // Calculate amount mined
    const amountMined = Math.floor(asteroid.resources * yieldMultiplier);
    
    // Add to resources
    p.resources += amountMined;
    p.resourcesMinedThisBreak += amountMined;
    
    // Create resource particles
    for (let i = 0; i < amountMined; i++) {
        gameState.particles.push({
            x: asteroid.x + (Math.random() - 0.5) * 20,
            y: asteroid.y + (Math.random() - 0.5) * 20,
            size: 5 + Math.random() * 5,
            color: asteroid.color,
            type: 'resource',
            resourceType: asteroid.type,
            life: 10000 // 10 seconds
        });
    }
    
    // Update asteroid
    asteroid.resources -= amountMined;
    asteroid.size *= 0.8;
    
    if (asteroid.resources <= 0 || asteroid.size < 10) {
        // Asteroid depleted - remove it
        const index = gameState.asteroids.indexOf(asteroid);
        if (index !== -1) {
            gameState.asteroids.splice(index, 1);
            createExplosion(asteroid.x, asteroid.y, asteroid.color);
        }
    }
    
    addMessage(`Mined ${amountMined} units of ${asteroid.type}`);
    updateHUD();
}

function collectResource(particle) {
    const p = gameState.player;
    p.resources += 1;
    p.score += 1;
    
    updateHUD();
}

// Upgrade System
function renderUpgradeScreen() {
    const p = gameState.player;
    
    // Update player stats
    playerStats.health.textContent = `${p.maxHealth} (+${p.upgrades.health}%)`;
    playerStats.damage.textContent = `${p.laserDamage * (1 + p.upgrades.damage * 0.01).toFixed(1)} (+${p.upgrades.damage}%)`;
    playerStats.firerate.textContent = `${(p.fireRate * (1 - p.upgrades.fireRate * 0.01) / 1000).toFixed(2)}s (+${p.upgrades.fireRate}%)`;
    playerStats.mining.textContent = `${(p.miningSpeed * (1 + p.upgrades.mining * 0.01)).toFixed(1)}x (+${p.upgrades.mining}%)`;
    playerStats.resources.textContent = p.resources;
    
    // Render upgrades
    upgradesGrid.innerHTML = '';
    gameState.upgrades.forEach(upgrade => {
        const currentLevel = p.upgrades[Object.keys(upgrade.effect)[0]];
        const maxLevel = upgrade.maxLevel || 5;
        const canUpgrade = currentLevel < maxLevel && p.resources >= upgrade.price * (currentLevel + 1);
        
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="upgrade-name">${upgrade.name} (${currentLevel}/${maxLevel})</div>
            <div class="upgrade-desc">${upgrade.description}</div>
            <div class="upgrade-price">Cost: ${upgrade.price * (currentLevel + 1)} resources</div>
            <button class="upgrade-btn" ${!canUpgrade ? 'disabled' : ''}>
                ${currentLevel >= maxLevel ? 'MAX LEVEL' : canUpgrade ? 'Upgrade' : 'Need More Resources'}
            </button>
        `;
        
        const btn = card.querySelector('button');
        if (btn && canUpgrade) {
            btn.addEventListener('click', () => purchaseUpgrade(upgrade));
        }
        
        upgradesGrid.appendChild(card);
    });
}

function purchaseUpgrade(upgrade) {
    const p = gameState.player;
    const stat = Object.keys(upgrade.effect)[0];
    const currentLevel = p.upgrades[stat];
    const maxLevel = upgrade.maxLevel || 5;
    const cost = upgrade.price * (currentLevel + 1);
    
    if (currentLevel >= maxLevel) {
        addMessage('Maximum upgrade level reached!', 'warning');
        return;
    }
    
    if (p.resources >= cost) {
        p.resources -= cost;
        p.upgrades[stat] += 1;
        
        // Apply upgrade effects
        switch (stat) {
            case 'health':
                p.maxHealth = 100 * (1 + p.upgrades.health * 0.01);
                p.health = p.maxHealth;
                break;
            case 'damage':
                // Damage is calculated when shooting
                break;
            case 'fireRate':
                // Fire rate is calculated when shooting
                break;
            case 'mining':
                // Mining speed is calculated when mining
                break;
            case 'energy':
                p.maxLaserEnergy = 100 * (1 + p.upgrades.energy * 0.2);
                p.laserEnergyRegen = 0.5 * (1 + p.upgrades.energy * 0.2);
                break;
        }
        
        addMessage(`Upgrade purchased: ${upgrade.name} level ${p.upgrades[stat]}`, 'success');
        renderUpgradeScreen();
        updateHUD();
    } else {
        addMessage('Not enough resources for this upgrade!', 'warning');
    }
}

// Game Over
function gameOver() {
    gameState.paused = true;
    gameOverElements.wave.textContent = gameState.wave - 1; // Subtract 1 because wave increments before game over
    gameOverElements.score.textContent = gameState.player.score;
    gameOverElements.name.value = '';
    submitStatus.textContent = '';
    buttons.submitScore.disabled = false;
    switchScreen('gameover');
}

// HUD and UI
function updateHUD() {
    const p = gameState.player;
    hudElements.health.textContent = `${Math.floor(p.health)}%`;
    hudElements.resources.textContent = p.resources;
    hudElements.laser.textContent = `${Math.floor(p.laserEnergy)}%`;
    hudElements.score.textContent = p.score;
}

function addMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    gameMessages.appendChild(message);
    
    // Remove after animation
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Game Loop
function gameLoop(timestamp) {
    if (gameState.paused || gameState.currentScreen !== 'game') return;
    
    // Calculate delta time
    const deltaTime = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;
    gameState.gameTime += deltaTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Update game state
    updatePlayer(deltaTime);
    updateEnemies(deltaTime);
    updateProjectiles(deltaTime);
    updateParticles(deltaTime);
    updateMining(deltaTime);
    
    // Rotate asteroids
    gameState.asteroids.forEach(asteroid => {
        asteroid.rotation += asteroid.rotationSpeed * deltaTime / 16;
    });
    
    // Draw game objects
    drawAsteroids();
    drawEnemies();
    drawProjectiles();
    drawParticles();
    drawMiningLaser();
    drawPlayer();
    drawLaserAim();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

function updatePlayer(deltaTime) {
    const p = gameState.player;
    
    // Movement
    let moveX = 0;
    let moveY = 0;
    
    if (gameState.keys['w'] || gameState.keys['arrowup']) moveY -= 1;
    if (gameState.keys['s'] || gameState.keys['arrowdown']) moveY += 1;
    if (gameState.keys['a'] || gameState.keys['arrowleft']) moveX -= 1;
    if (gameState.keys['d'] || gameState.keys['arrowright']) moveX += 1;
    
    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
    }
    
    // Apply movement
    p.x += moveX * p.speed;
    p.y += moveY * p.speed;
    
    // Boundary check
    p.x = Math.max(p.width / 2, Math.min(canvas.width - p.width / 2, p.x));
    p.y = Math.max(p.height / 2, Math.min(canvas.height - p.height / 2, p.y));
    
    // Laser energy regen
    if (p.laserEnergy < p.maxLaserEnergy) {
        p.laserEnergy += p.laserEnergyRegen * deltaTime / 16;
        if (p.laserEnergy > p.maxLaserEnergy) p.laserEnergy = p.maxLaserEnergy;
        updateHUD();
    }
    
    // Collect resources
    if (gameState.keys['e']) {
        gameState.particles.forEach((particle, index) => {
            if (particle.type === 'resource' && distance(p, particle) < 30) {
                collectResource(particle);
                gameState.particles.splice(index, 1);
            }
        });
    }
}

function updateProjectiles(deltaTime) {
    gameState.projectiles.forEach((proj, index) => {
        proj.x += proj.dx * proj.speed;
        proj.y += proj.dy * proj.speed;
        
        // Check lifetime
        if (proj.life) {
            proj.life -= deltaTime;
            if (proj.life <= 0) {
                gameState.projectiles.splice(index, 1);
                return;
            }
        }
        
        // Remove if out of bounds
        if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
            gameState.projectiles.splice(index, 1);
            return;
        }
        
        // Check for hits
        if (proj.isEnemy) {
            // Player hit
            if (checkCollision(proj, gameState.player)) {
                if (gameState.player.health > 0) {
                    gameState.player.health -= proj.damage;
                    
                    gameState.projectiles.splice(index, 1);
                    createExplosion(proj.x, proj.y, '#f44');
                    updateHUD();
                    
                    // Check for player death
                    if (gameState.player.health <= 0) {
                        gameState.player.health = 0;
                        gameOver();
                    }
                }
            }
        } else {
            // Enemy hit
            gameState.enemies.forEach((enemy, enemyIndex) => {
                if (checkCollision(proj, enemy)) {
                    enemy.health -= proj.damage;
                    
                    if (enemy.health <= 0) {
                        // Enemy destroyed
                        gameState.enemies.splice(enemyIndex, 1);
                        gameState.player.score += enemy.value;
                        
                        addMessage(`Enemy destroyed! +${enemy.value} score`, 'success');
                    }
                    
                    gameState.projectiles.splice(index, 1);
                    createExplosion(proj.x, proj.y, '#f88');
                    updateHUD();
                }
            });
        }
    });
}

function updateParticles(deltaTime) {
    gameState.particles.forEach((particle, index) => {
        particle.x += particle.dx || 0;
        particle.y += particle.dy || 0;
        particle.life -= deltaTime;
        
        if (particle.life <= 0) {
            gameState.particles.splice(index, 1);
        }
    });
}

function updateMining(deltaTime) {
    const p = gameState.player;
    
    // Check if mining key is pressed
    if (gameState.keys[' '] && !gameState.paused) {
        if (!gameState.miningTarget) {
            // Find closest asteroid in front of player
            let closestDist = Infinity;
            let closestAsteroid = null;
            
            gameState.asteroids.forEach(asteroid => {
                const dist = distance(p, asteroid);
                if (dist < 150 && dist < closestDist) {
                    closestDist = dist;
                    closestAsteroid = asteroid;
                }
            });
            
            if (closestAsteroid) {
                gameState.miningTarget = closestAsteroid;
            }
        }
        
        if (gameState.miningTarget) {
            gameState.miningProgress += 0.5 * p.miningSpeed * (1 + p.upgrades.mining * 0.01) * deltaTime / 16;
            
            if (gameState.miningProgress >= 100) {
                // Asteroid mined
                mineAsteroid(gameState.miningTarget);
                gameState.miningTarget = null;
                gameState.miningProgress = 0;
            }
        }
    } else {
        if (gameState.miningTarget) {
            gameState.miningProgress = Math.max(0, gameState.miningProgress - 1 * deltaTime / 16);
            
            if (gameState.miningProgress <= 0) {
                gameState.miningTarget = null;
            }
        }
    }
}

// Collision Detection
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

function distance(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Rendering
function drawBackground() {
    // Draw starfield
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 200; i++) {
        const x = (i * canvas.width / 200 + gameState.gameTime * 0.05) % canvas.width;
        const y = Math.sin(i * 0.2) * canvas.height / 4 + canvas.height / 2;
        const size = 0.5 + Math.random();
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
    
    // Draw nebula effects
    const gradient1 = ctx.createRadialGradient(
        canvas.width / 3, canvas.height / 3, 0,
        canvas.width / 3, canvas.height / 3, 300
    );
    gradient1.addColorStop(0, 'rgba(68, 170, 255, 0.1)');
    gradient1.addColorStop(1, 'rgba(68, 170, 255, 0)');
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const gradient2 = ctx.createRadialGradient(
        canvas.width * 2 / 3, canvas.height * 2 / 3, 0,
        canvas.width * 2 / 3, canvas.height * 2 / 3, 400
    );
    gradient2.addColorStop(0, 'rgba(255, 68, 170, 0.05)');
    gradient2.addColorStop(1, 'rgba(255, 68, 170, 0)');
    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    const p = gameState.player;
    
    // Save context
    ctx.save();
    ctx.translate(p.x, p.y);
    
    // Rotate toward mouse
    const angle = Math.atan2(gameState.mouse.y - p.y, gameState.mouse.x - p.x);
    ctx.rotate(angle + Math.PI / 2);
    
    // Draw ship body
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.moveTo(0, -p.height / 2);
    ctx.lineTo(p.width / 2, p.height / 2);
    ctx.lineTo(-p.width / 2, p.height / 2);
    ctx.closePath();
    ctx.fill();
    
    // Draw ship details
    ctx.fillStyle = '#8cf';
    ctx.beginPath();
    ctx.moveTo(0, -p.height / 4);
    ctx.lineTo(p.width / 4, p.height / 4);
    ctx.lineTo(-p.width / 4, p.height / 4);
    ctx.closePath();
    ctx.fill();
    
    // Draw engine glow when moving
    if (gameState.keys['w'] || gameState.keys['a'] || gameState.keys['s'] || gameState.keys['d'] || 
        gameState.keys['arrowup'] || gameState.keys['arrowdown'] || gameState.keys['arrowleft'] || gameState.keys['arrowright']) {
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.moveTo(-p.width / 4, p.height / 2);
        ctx.lineTo(0, p.height / 2 + 20);
        ctx.lineTo(p.width / 4, p.height / 2);
        ctx.closePath();
        ctx.fill();
    }
    
    // Restore context
    ctx.restore();
}

function drawLaserAim() {
    const p = gameState.player;
    
    // Calculate direction to mouse
    const dx = gameState.mouse.x - p.x;
    const dy = gameState.mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Draw aim line
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + dx * 1000 / dist, p.y + dy * 1000 / dist);
    ctx.stroke();
    
    // Draw aim circle at mouse
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gameState.mouse.x, gameState.mouse.y, 10, 0, Math.PI * 2);
    ctx.stroke();
}

function drawAsteroids() {
    gameState.asteroids.forEach(asteroid => {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);
        
        // Draw asteroid
        ctx.fillStyle = asteroid.color;
        ctx.beginPath();
        
        // Create rocky shape
        const points = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = asteroid.size / 2 * (0.8 + Math.random() * 0.4);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Draw cracks/details
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const startAngle = Math.random() * Math.PI * 2;
            const endAngle = startAngle + (Math.random() * 0.5 - 0.25) * Math.PI;
            const radius = asteroid.size / 2 * (0.3 + Math.random() * 0.5);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Draw resource count
        if (asteroid.resources > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(asteroid.resources.toFixed(0), asteroid.x, asteroid.y + asteroid.size / 2 + 15);
        }
    });
}

function drawEnemies() {
    gameState.enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        
        // Calculate angle toward player
        const p = gameState.player;
        const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
        ctx.rotate(angle + Math.PI / 2);
        
        // Draw enemy ship
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(0, -enemy.height / 2);
        ctx.lineTo(enemy.width / 2, enemy.height / 2);
        ctx.lineTo(0, enemy.height / 4);
        ctx.lineTo(-enemy.width / 2, enemy.height / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Draw health bar
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#f00';
        ctx.fillRect(
            enemy.x - enemy.width / 2, 
            enemy.y - enemy.height / 2 - 10, 
            enemy.width * healthPercent, 
            3
        );
    });
}

function drawProjectiles() {
    gameState.projectiles.forEach(proj => {
        ctx.fillStyle = proj.color;
        ctx.fillRect(proj.x - proj.width / 2, proj.y - proj.height / 2, proj.width, proj.height);
    });
}

function drawParticles() {
    gameState.particles.forEach(particle => {
        ctx.globalAlpha = Math.min(1, particle.life / 500);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function drawMiningLaser() {
    if (gameState.miningTarget && (gameState.keys[' '] || gameState.miningProgress > 0)) {
        const p = gameState.player;
        const asteroid = gameState.miningTarget;
        
        // Draw mining laser
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(asteroid.x, asteroid.y);
        ctx.stroke();
        
        // Add glow
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(asteroid.x, asteroid.y);
        ctx.stroke();
        
        // Draw progress circle around asteroid
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            asteroid.x, 
            asteroid.y, 
            asteroid.size / 2 + 10, 
            0, 
            Math.PI * 2 * (gameState.miningProgress / 100)
        );
        ctx.stroke();
    }
}

// Start the game when loaded
window.addEventListener('load', init);