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
        fireRate: 500,
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
            energy: 0,
            movement: 0,
            collection: 0,
            critChance: 0,
            multishot: 0
        }
    },
    resources: {
        iron: { value: 1, color: '#ccc', rarity: 0.5 },
        copper: { value: 2, color: '#b87333', rarity: 0.4 },
        gold: { value: 3, color: '#ffd700', rarity: 0.3 },
        platinum: { value: 4, color: '#e5e4e2', rarity: 0.2 },
        titanium: { value: 3, color: '#878681', rarity: 0.25 },
        uranium: { value: 5, color: '#7cfc00', rarity: 0.15 },
        diamond: { value: 8, color: '#b9f2ff', rarity: 0.1 },
        mythril: { value: 10, color: '#ff00ff', rarity: 0.05 }
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
        },
        {
            id: 'movement1',
            name: 'Thruster Boosters',
            description: 'Increase movement speed by 10%',
            price: 4,
            effect: { movement: 10 },
            maxLevel: 5
        },
        {
            id: 'collection1',
            name: 'Magnetic Field',
            description: 'Increase resource collection range by 20%',
            price: 6,
            effect: { collection: 20 },
            maxLevel: 3
        },
        {
            id: 'crit1',
            name: 'Precision Optics',
            description: 'Increase critical hit chance by 5%',
            price: 10,
            effect: { critChance: 5 },
            maxLevel: 4
        },
        {
            id: 'multishot1',
            name: 'Multi-Laser Array',
            description: 'Chance to fire additional lasers (10%)',
            price: 15,
            effect: { multishot: 10 },
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
    serverConnected: false,
    minAsteroids: 15
};

// Server Configuration
const serverConfig = {
    url: "https://your-highscore-server.com/api",
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
    window.addEventListener('resize', setupCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    
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
    
    scoreTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            scoreTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderHighScores(tab.dataset.type);
        });
    });
    
    canvas.addEventListener('contextmenu', e => e.preventDefault());
}

// Input Handling
function handleKeyDown(e) {
    gameState.keys[e.key.toLowerCase()] = true;
    
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
    Object.values(screens).forEach(screen => {
        screen.classList.remove('visible');
    });
    
    screens[screenName].classList.add('visible');
    gameState.currentScreen = screenName;
    
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
    generateAsteroids(gameState.minAsteroids);
    switchScreen('game');
    requestAnimationFrame(gameLoop);
    addMessage('Welcome to Galactic Miner! Defend against endless waves and mine asteroids.', 'info');
    startNextWave();
}

function resetGameState() {
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
            energy: 0,
            movement: 0,
            collection: 0,
            critChance: 0,
            multishot: 0
        }
    };
    
    gameState.wave = 1;
    gameState.waveActive = false;
    
    gameState.asteroids = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.miningTarget = null;
    gameState.miningProgress = 0;
    gameState.messageQueue = [];
    gameState.paused = false;
    gameState.gameTime = 0;
    
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
    
    gameState.highScores.local.sort((a, b) => {
        if (b.wave !== a.wave) return b.wave - a.wave;
        return b.score - a.score;
    });
    
    if (gameState.highScores.local.length > 10) {
        gameState.highScores.local = gameState.highScores.local.slice(0, 10);
    }
    
    localStorage.setItem('galacticMinerLocalScores', JSON.stringify(gameState.highScores.local));
}

async function submitHighScore() {
    const name = gameOverElements.name.value.trim() || 'Anonymous';
    const wave = gameState.wave - 1;
    const score = gameState.player.score;
    
    buttons.submitScore.disabled = true;
    
    const globalSuccess = await submitGlobalHighScore(name, wave, score);
    saveLocalHighScore(name, wave, score);
    
    switchScreen('scores');
}

// Wave System
function startNextWave() {
    waveComplete.style.display = 'none';
    gameState.player.resourcesMinedThisBreak = 0;
    gameState.waveActive = true;
    gameState.lastEnemySpawnTime = 0;
    hudElements.wave.textContent = gameState.wave;
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
    
    const baseHealth = 50;
    const baseSpeed = 1;
    const baseDamage = 10;
    const waveScale = 1 + (gameState.wave - 1) * 0.2;
    
    switch (side) {
        case 0: x = Math.random() * canvas.width; y = -50; break;
        case 1: x = canvas.width + 50; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + 50; break;
        case 3: x = -50; y = Math.random() * canvas.height; break;
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
    waveComplete.style.display = 'block';
    resourcesMined.textContent = gameState.player.resourcesMinedThisBreak;
    
    // Maintain minimum asteroids
    while (gameState.asteroids.length < gameState.minAsteroids) {
        spawnAsteroid();
    }
    
    addMessage(`Wave complete! Mined ${gameState.player.resourcesMinedThisBreak} resources.`, 'success');
}

// Mining System
function generateAsteroids(count) {
    for (let i = 0; i < count; i++) {
        spawnAsteroid();
    }
}

function spawnAsteroid() {
    const types = Object.keys(gameState.resources);
    const type = types[Math.floor(Math.random() * types.length)];
    const rarity = gameState.resources[type].rarity;
    
    if (Math.random() > rarity) return false;
    
    const size = 30 + Math.random() * 70;
    
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
    
    return true;
}

function mineAsteroid(asteroid) {
    const p = gameState.player;
    const yieldMultiplier = p.miningSpeed * (1 + p.upgrades.mining * 0.01);
    
    let amountMined = Math.floor(asteroid.resources * yieldMultiplier);
    if (Math.random() < p.upgrades.critChance * 0.01) {
        amountMined *= 2;
        addMessage(`CRITICAL HIT! Mined ${amountMined} ${asteroid.type}`, 'success');
    }
    
    p.resources += amountMined;
    p.resourcesMinedThisBreak += amountMined;
    
    for (let i = 0; i < amountMined; i++) {
        gameState.particles.push({
            x: asteroid.x + (Math.random() - 0.5) * 20,
            y: asteroid.y + (Math.random() - 0.5) * 20,
            size: 5 + Math.random() * 5,
            color: asteroid.color,
            type: 'resource',
            resourceType: asteroid.type,
            life: 10000
        });
    }
    
    asteroid.resources -= amountMined;
    asteroid.size *= 0.8;
    
    if (asteroid.resources <= 0 || asteroid.size < 10) {
        const index = gameState.asteroids.indexOf(asteroid);
        if (index !== -1) {
            gameState.asteroids.splice(index, 1);
            createExplosion(asteroid.x, asteroid.y, asteroid.color);
            
            // Spawn new asteroid to replace this one
            let spawned = false;
            while (!spawned) {
                spawned = spawnAsteroid();
            }
        }
    }
    
    if (!(Math.random() < p.upgrades.critChance * 0.01)) {
        addMessage(`Mined ${amountMined} units of ${asteroid.type}`);
    }
    updateHUD();
}

function collectResource(particle) {
    const p = gameState.player;
    const collectionRange = 30 * (1 + p.upgrades.collection * 0.01);
    
    if (distance(p, particle) < collectionRange) {
        p.resources += 1;
        p.score += 1;
        updateHUD();
        return true;
    }
    return false;
}

// Combat System
function fireLaser() {
    const p = gameState.player;
    const now = Date.now();
    
    if (now - p.lastShot < p.fireRate * (1 - p.upgrades.fireRate * 0.01)) return;
    if (p.laserEnergy <= 0) {
        addMessage('Laser energy depleted! Wait for recharge.', 'warning');
        return;
    }
    
    const dx = gameState.mouse.x - p.x;
    const dy = gameState.mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    createProjectile(p.x, p.y, dx, dy, dist);
    
    if (Math.random() < p.upgrades.multishot * 0.01) {
        const angle1 = Math.atan2(dy, dx) + 0.2;
        const angle2 = Math.atan2(dy, dx) - 0.2;
        
        createProjectile(p.x, p.y, Math.cos(angle1), Math.sin(angle1), 1);
        createProjectile(p.x, p.y, Math.cos(angle2), Math.sin(angle2), 1);
        
        addMessage('Multishot activated!', 'info');
    }
    
    p.lastShot = now;
    p.laserEnergy -= 5;
    if (p.laserEnergy < 0) p.laserEnergy = 0;
    
    createMuzzleFlash(p.x, p.y, dx / dist, dy / dist);
}

function createProjectile(x, y, dx, dy, dist) {
    const p = gameState.player;
    gameState.projectiles.push({
        x: x,
        y: y,
        width: 5,
        height: 5,
        speed: 10,
        dx: dx / dist,
        dy: dy / dist,
        damage: p.laserDamage * (1 + p.upgrades.damage * 0.01),
        color: '#0ff',
        isEnemy: false,
        life: 1000
    });
}

function createMuzzleFlash(x, y, dx, dy) {
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

// Upgrade System
function renderUpgradeScreen() {
    const p = gameState.player;
    
    playerStats.health.textContent = `${p.maxHealth} (+${p.upgrades.health}%)`;
    playerStats.damage.textContent = `${p.laserDamage * (1 + p.upgrades.damage * 0.01).toFixed(1)} (+${p.upgrades.damage}%)`;
    playerStats.firerate.textContent = `${(p.fireRate * (1 - p.upgrades.fireRate * 0.01) / 1000).toFixed(2)}s (+${p.upgrades.fireRate}%)`;
    playerStats.mining.textContent = `${(p.miningSpeed * (1 + p.upgrades.mining * 0.01)).toFixed(1)}x (+${p.upgrades.mining}%)`;
    playerStats.resources.textContent = p.resources;
    
    upgradesGrid.innerHTML = '';
    gameState.upgrades.forEach(upgrade => {
        const stat = Object.keys(upgrade.effect)[0];
        const currentLevel = p.upgrades[stat] || 0;
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
    const currentLevel = p.upgrades[stat] || 0;
    const maxLevel = upgrade.maxLevel || 5;
    const cost = upgrade.price * (currentLevel + 1);
    
    if (currentLevel >= maxLevel) {
        addMessage('Maximum upgrade level reached!', 'warning');
        return;
    }
    
    if (p.resources >= cost) {
        p.resources -= cost;
        p.upgrades[stat] = currentLevel + 1;
        
        switch (stat) {
            case 'health':
                p.maxHealth = 100 * (1 + p.upgrades.health * 0.01);
                p.health = p.maxHealth;
                break;
            case 'damage':
                break;
            case 'fireRate':
                break;
            case 'mining':
                break;
            case 'energy':
                p.maxLaserEnergy = 100 * (1 + p.upgrades.energy * 0.2);
                p.laserEnergyRegen = 0.5 * (1 + p.upgrades.energy * 0.2);
                break;
            case 'movement':
                p.speed = 5 * (1 + p.upgrades.movement * 0.01);
                break;
            case 'collection':
                break;
            case 'critChance':
                break;
            case 'multishot':
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
    gameOverElements.wave.textContent = gameState.wave - 1;
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
    
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Game Loop
function gameLoop(timestamp) {
    if (gameState.paused || gameState.currentScreen !== 'game') return;
    
    const deltaTime = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;
    gameState.gameTime += deltaTime;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    
    updatePlayer(deltaTime);
    updateEnemies(deltaTime);
    updateProjectiles(deltaTime);
    updateParticles(deltaTime);
    updateMining(deltaTime);
    
    gameState.asteroids.forEach(asteroid => {
        asteroid.rotation += asteroid.rotationSpeed * deltaTime / 16;
    });
    
    drawAsteroids();
    drawEnemies();
    drawProjectiles();
    drawParticles();
    drawMiningLaser();
    drawPlayer();
    drawLaserAim();
    
    requestAnimationFrame(gameLoop);
}

function updatePlayer(deltaTime) {
    const p = gameState.player;
    
    let moveX = 0;
    let moveY = 0;
    
    if (gameState.keys['w'] || gameState.keys['arrowup']) moveY -= 1;
    if (gameState.keys['s'] || gameState.keys['arrowdown']) moveY += 1;
    if (gameState.keys['a'] || gameState.keys['arrowleft']) moveX -= 1;
    if (gameState.keys['d'] || gameState.keys['arrowright']) moveX += 1;
    
    if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
    }
    
    p.x += moveX * p.speed;
    p.y += moveY * p.speed;
    
    p.x = Math.max(p.width / 2, Math.min(canvas.width - p.width / 2, p.x));
    p.y = Math.max(p.height / 2, Math.min(canvas.height - p.height / 2, p.y));
    
    if (p.laserEnergy < p.maxLaserEnergy) {
        p.laserEnergy += p.laserEnergyRegen * deltaTime / 16;
        if (p.laserEnergy > p.maxLaserEnergy) p.laserEnergy = p.maxLaserEnergy;
        updateHUD();
    }
    
    if (gameState.keys['e']) {
        gameState.particles.forEach((particle, index) => {
            if (particle.type === 'resource') {
                if (collectResource(particle)) {
                    gameState.particles.splice(index, 1);
                }
            }
        });
    }
}

function updateEnemies(deltaTime) {
    const p = gameState.player;
    const now = Date.now();
    
    if (gameState.waveActive && 
        gameState.enemies.length < 3 + Math.floor(gameState.wave / 2) && 
        now - gameState.lastEnemySpawnTime > gameState.enemySpawnDelay) {
        spawnWaveEnemies();
    }
    
    gameState.enemies.forEach((enemy, index) => {
        const dx = p.x - enemy.x;
        const dy = p.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;
        
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
        
        if (checkCollision(enemy, p)) {
            if (p.health > 0) {
                p.health -= enemy.damage;
                gameState.enemies.splice(index, 1);
                createExplosion(enemy.x, enemy.y, '#f44');
                addMessage('Enemy ship collided with you!', 'warning');
                updateHUD();
                
                if (p.health <= 0) {
                    p.health = 0;
                    gameOver();
                }
            }
        }
    });
    
    if (gameState.waveActive && gameState.enemies.length === 0) {
        endWave();
    }
}

function updateProjectiles(deltaTime) {
    gameState.projectiles.forEach((proj, index) => {
        proj.x += proj.dx * proj.speed;
        proj.y += proj.dy * proj.speed;
        
        if (proj.life) {
            proj.life -= deltaTime;
            if (proj.life <= 0) {
                gameState.projectiles.splice(index, 1);
                return;
            }
        }
        
        if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
            gameState.projectiles.splice(index, 1);
            return;
        }
        
        if (proj.isEnemy) {
            if (checkCollision(proj, gameState.player)) {
                if (gameState.player.health > 0) {
                    gameState.player.health -= proj.damage;
                    gameState.projectiles.splice(index, 1);
                    createExplosion(proj.x, proj.y, '#f44');
                    updateHUD();
                    
                    if (gameState.player.health <= 0) {
                        gameState.player.health = 0;
                        gameOver();
                    }
                }
            }
        } else {
            gameState.enemies.forEach((enemy, enemyIndex) => {
                if (checkCollision(proj, enemy)) {
                    enemy.health -= proj.damage;
                    
                    if (enemy.health <= 0) {
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
    
    if (gameState.keys[' '] && !gameState.paused) {
        if (!gameState.miningTarget) {
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
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 200; i++) {
        const x = (i * canvas.width / 200 + gameState.gameTime * 0.05) % canvas.width;
        const y = Math.sin(i * 0.2) * canvas.height / 4 + canvas.height / 2;
        const size = 0.5 + Math.random();
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
    
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
    
    ctx.save();
    ctx.translate(p.x, p.y);
    const angle = Math.atan2(gameState.mouse.y - p.y, gameState.mouse.x - p.x);
    ctx.rotate(angle + Math.PI / 2);
    
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.moveTo(0, -p.height / 2);
    ctx.lineTo(p.width / 2, p.height / 2);
    ctx.lineTo(-p.width / 2, p.height / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#8cf';
    ctx.beginPath();
    ctx.moveTo(0, -p.height / 4);
    ctx.lineTo(p.width / 4, p.height / 4);
    ctx.lineTo(-p.width / 4, p.height / 4);
    ctx.closePath();
    ctx.fill();
    
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
    
    ctx.restore();
}

function drawLaserAim() {
    const p = gameState.player;
    const dx = gameState.mouse.x - p.x;
    const dy = gameState.mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + dx * 1000 / dist, p.y + dy * 1000 / dist);
    ctx.stroke();
    
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
        
        ctx.fillStyle = asteroid.color;
        ctx.beginPath();
        
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
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const startAngle = Math.random() * Math.PI * 2;
            const endAngle = startAngle + (Math.random() - 0.5) * Math.PI;
            const radius = asteroid.size / 2 * (0.3 + Math.random() * 0.5);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.stroke();
        }
        
        ctx.restore();
        
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
        const p = gameState.player;
        const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
        ctx.rotate(angle + Math.PI / 2);
        
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(0, -enemy.height / 2);
        ctx.lineTo(enemy.width / 2, enemy.height / 2);
        ctx.lineTo(0, enemy.height / 4);
        ctx.lineTo(-enemy.width / 2, enemy.height / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
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
        
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(asteroid.x, asteroid.y);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(asteroid.x, asteroid.y);
        ctx.stroke();
        
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            asteroid.x, 
            asteroid.y, 
            asteroid.size / a + 10, 
            0, 
            Math.PI * 2 * (gameState.miningProgress / 100)
        );
        ctx.stroke();
    }
}

// Start the game when loaded
window.addEventListener('load', init);
