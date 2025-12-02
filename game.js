const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let lastTime = 0;

// Canvas Sizing
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Input Handling
const mouse = { x: 0, y: 0, isDown: false };
let power = 0;
let isCharging = false;
const MAX_POWER = 30;

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', () => {
    if (gameState === 'PLAYING') {
        isCharging = true;
    }
});

window.addEventListener('mouseup', () => {
    if (gameState === 'PLAYING' && isCharging) {
        fireCannon();
        isCharging = false;
        power = 0;
    }
});

// Game Objects
const cannon = {
    x: 100,
    y: 0, // Set in update
    angle: 0,
    length: 60,
    width: 20
};

const projectiles = [];
const targets = [];
const particles = [];

// Physics Constants
const GRAVITY = 0.5;
const GROUND_HEIGHT = 50;

class Projectile {
    constructor(x, y, velocity) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.radius = 8;
        this.active = true;
    }

    update() {
        this.velocity.y += GRAVITY;
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Ground collision
        if (this.y + this.radius > canvas.height - GROUND_HEIGHT) {
            this.active = false;
            createExplosion(this.x, this.y, '#fff');
        }

        // Screen bounds
        if (this.x > canvas.width || this.x < 0) {
            this.active = false;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f472b6';
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f472b6';
        ctx.closePath();
        ctx.shadowBlur = 0;
    }
}

class Target {
    constructor() {
        this.radius = 20 + Math.random() * 20;
        this.x = canvas.width + this.radius;
        this.y = Math.random() * (canvas.height - GROUND_HEIGHT - 100) + 50;
        this.velocity = { x: -(Math.random() * 2 + 1), y: 0 };
        this.active = true;
        this.color = `hsl(${Math.random() * 60 + 180}, 70%, 50%)`;
    }

    update() {
        this.x += this.velocity.x;
        if (this.x + this.radius < 0) {
            this.active = false;
            // Missed target penalty?
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.velocity = {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8
        };
        this.life = 1.0;
        this.color = color;
        this.radius = Math.random() * 3 + 1;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life -= 0.02;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1.0;
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function fireCannon() {
    const angle = Math.atan2(mouse.y - cannon.y, mouse.x - cannon.x);
    const velocity = {
        x: Math.cos(angle) * power,
        y: Math.sin(angle) * power
    };
    
    // Spawn projectile at tip of cannon
    const spawnX = cannon.x + Math.cos(angle) * cannon.length;
    const spawnY = cannon.y + Math.sin(angle) * cannon.length;
    
    projectiles.push(new Projectile(spawnX, spawnY, velocity));
    
    // Recoil effect could go here
}

function checkCollisions() {
    projectiles.forEach(p => {
        targets.forEach(t => {
            const dx = p.x - t.x;
            const dy = p.y - t.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < p.radius + t.radius) {
                p.active = false;
                t.active = false;
                createExplosion(t.x, t.y, t.color);
                score += 100;
                updateScore();
            }
        });
    });
}

function updateScore() {
    document.getElementById('score').innerText = score;
    document.getElementById('final-score').innerText = score;
}

// Game Loop
function update(timestamp) {
    if (gameState !== 'PLAYING') return;

    // Calculate delta time if needed, for now simple steps
    
    // Update Cannon
    cannon.y = canvas.height - GROUND_HEIGHT - 20;
    
    // Charging Logic
    if (isCharging) {
        power += 0.5;
        if (power > MAX_POWER) power = MAX_POWER;
    }
    
    // Update UI Power Bar
    const powerPercent = (power / MAX_POWER) * 100;
    document.getElementById('power-bar-fill').style.width = `${powerPercent}%`;

    // Update Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        if (!projectiles[i].active) projectiles.splice(i, 1);
    }

    // Update Targets
    if (Math.random() < 0.02) {
        targets.push(new Target());
    }
    for (let i = targets.length - 1; i >= 0; i--) {
        targets[i].update();
        if (!targets[i].active) targets.splice(i, 1);
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    checkCollisions();
}

function draw() {
    // Clear Screen
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Ground
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

    if (gameState === 'PLAYING') {
        // Draw Cannon
        const angle = Math.atan2(mouse.y - cannon.y, mouse.x - cannon.x);
        ctx.save();
        ctx.translate(cannon.x, cannon.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(0, -cannon.width / 2, cannon.length, cannon.width);
        ctx.restore();

        // Draw Base
        ctx.beginPath();
        ctx.arc(cannon.x, cannon.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#475569';
        ctx.fill();
        ctx.closePath();

        // Draw Projectiles
        projectiles.forEach(p => p.draw());

        // Draw Targets
        targets.forEach(t => t.draw());

        // Draw Particles
        particles.forEach(p => p.draw());
        
        // Aim Line (Trajectory Prediction - Optional, maybe later)
    }
}

function loop(timestamp) {
    update(timestamp);
    draw();
    requestAnimationFrame(loop);
}

// UI Controls
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    gameState = 'PLAYING';
    score = 0;
    updateScore();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    gameState = 'PLAYING';
    score = 0;
    updateScore();
    projectiles.length = 0;
    targets.length = 0;
    particles.length = 0;
});

// Start Loop
requestAnimationFrame(loop);
