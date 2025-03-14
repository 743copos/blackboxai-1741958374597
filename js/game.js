// Game Class - Main game controller
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Game state
        this.gameState = 'START'; // START, PLAYING, PAUSED, GAME_OVER
        this.score = 0;
        this.depth = 0;
        
        // Initialize game objects
        this.player = new Player(CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2);
        this.echoPulses = [];
        this.enemies = [];
        this.crystals = [];
        
        // Input handling
        this.keys = new Set();
        this.setupEventListeners();
        
        // Start the game loop
        this.lastTime = 0;
        this.accumulator = 0;
        this.timestep = 1000 / 60; // 60 FPS
        
        // Start screen elements
        this.startScreen = document.getElementById('startScreen');
        this.gameUI = document.getElementById('gameUI');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        
        // Initialize UI handlers
        this.initializeUI();
    }

    setupCanvas() {
        this.canvas.width = CONFIG.CANVAS.WIDTH;
        this.canvas.height = CONFIG.CANVAS.HEIGHT;
        // Enable image smoothing for better visual quality
        this.ctx.imageSmoothingEnabled = true;
    }

    initializeUI() {
        // Start button handler
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });

        // Restart button handler
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });

        // Resume button handler
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.resumeGame();
        });

        // Quit button handler
        document.getElementById('quitButton').addEventListener('click', () => {
            this.quitToMenu();
        });
    }

    setupEventListeners() {
        // Keyboard events with preventDefault to avoid page scrolling
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys.add(e.code);
            if (e.code === 'Escape' && this.gameState === 'PLAYING') {
                this.pauseGame();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });

        // Mouse events for echo pulse direction with improved aiming
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameState === 'PLAYING') {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            }
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'PLAYING') {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.player.shootEchoPulse(x, y);
            }
        });
    }

    startGame() {
        this.gameState = 'PLAYING';
        this.startScreen.classList.add('hidden');
        this.gameUI.classList.remove('hidden');
        this.resetGame();
        
        // Give player initial invincibility with visual feedback
        this.player.startInvincibility(3000); // 3 seconds of invincibility
        
        this.gameLoop(0);
    }

    pauseGame() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
            this.pauseScreen.classList.remove('hidden');
        }
    }

    resumeGame() {
        if (this.gameState === 'PAUSED') {
            this.gameState = 'PLAYING';
            this.pauseScreen.classList.add('hidden');
            this.gameLoop(this.lastTime);
        }
    }

    gameOver() {
        this.gameState = 'GAME_OVER';
        this.gameUI.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        document.getElementById('depthScore').textContent = this.depth;
    }

    restartGame() {
        this.gameOverScreen.classList.add('hidden');
        this.startGame();
    }

    quitToMenu() {
        this.gameState = 'START';
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.gameUI.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }

    resetGame() {
        this.score = 0;
        this.depth = 0;
        this.player = new Player(CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2);
        this.echoPulses = [];
        this.enemies = [];
        this.crystals = [];
        // Generate initial level
        this.generateLevel();
    }

    // Helper method to check distance between points
    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Check if a position is too close to the player
    isCloseToPlayer(x, y, minDistance) {
        return this.getDistance(x, y, this.player.x, this.player.y) < minDistance;
    }

    generateLevel() {
        // TODO: Implement procedural level generation
        const spawnPositions = [];
        
        // Generate spawn positions away from player
        while (spawnPositions.length < 2) {
            const x = Math.random() * (CONFIG.CANVAS.WIDTH - CONFIG.ENEMY.BASIC.SIZE);
            const y = Math.random() * (CONFIG.CANVAS.HEIGHT - CONFIG.ENEMY.BASIC.SIZE);
            
            // Check if position is far enough from player and other enemies
            let validPosition = !this.isCloseToPlayer(x, y, CONFIG.ENEMY.BASIC.SPAWN_DISTANCE);
            
            // Check distance from other spawn positions
            for (const pos of spawnPositions) {
                if (this.getDistance(x, y, pos.x, pos.y) < CONFIG.ENEMY.BASIC.SPAWN_DISTANCE) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                spawnPositions.push({ x, y });
            }
        }
        
        // Create enemies at valid positions
        for (const pos of spawnPositions) {
            this.enemies.push(new Enemy(pos.x, pos.y));
        }
    }

    update(deltaTime) {
        if (this.gameState !== 'PLAYING') return;

        // Update player
        this.player.update(deltaTime, this.keys);

        // Update echo pulses
        this.echoPulses.forEach((pulse, index) => {
            pulse.update(deltaTime);
            if (pulse.bounces >= CONFIG.ECHO.MAX_BOUNCES) {
                this.echoPulses.splice(index, 1);
            }
        });

        // Update enemies
        this.enemies.forEach((enemy, index) => {
            enemy.update(deltaTime, this.player);
            // Check collision with echo pulses
            this.echoPulses.forEach((pulse, pulseIndex) => {
                if (this.checkCollision(pulse, enemy)) {
                    enemy.takeDamage(pulse.damage);
                    // Remove pulse on hit
                    this.echoPulses.splice(pulseIndex, 1);
                    // Create hit effect
                    this.createHitEffect(pulse.x, pulse.y);
                    
                    if (enemy.health <= 0) {
                        this.enemies.splice(index, 1);
                        this.score += 100;
                        // Spawn health crystal with improved effect
                        if (Math.random() < CONFIG.CRYSTALS.HEALTH_CRYSTAL.DROP_CHANCE) {
                            const crystal = new Crystal(enemy.x, enemy.y);
                            this.crystals.push(crystal);
                            // Add spawn effect
                            this.createSpawnEffect(crystal.x, crystal.y);
                        }
                    }
                }
            });
        });

        // Update crystals with magnetic effect
        this.crystals.forEach((crystal, index) => {
            crystal.update(deltaTime);
            const distToPlayer = Math.sqrt(
                Math.pow(this.player.x - crystal.x, 2) + 
                Math.pow(this.player.y - crystal.y, 2)
            );
            
            // Magnetic pull towards player when close
            if (distToPlayer < 150) {
                const pullStrength = (150 - distToPlayer) / 150;
                crystal.x += (this.player.x - crystal.x) * pullStrength * 0.1;
                crystal.y += (this.player.y - crystal.y) * pullStrength * 0.1;
            }
            
            if (this.checkCollision(this.player, crystal)) {
                this.player.heal(CONFIG.CRYSTALS.HEALTH_CRYSTAL.HEAL_AMOUNT);
                this.crystals.splice(index, 1);
                // Add heal effect
                this.createHealEffect(this.player.x, this.player.y);
            }
        });

        // Check player collision with enemies with knockback
        this.enemies.forEach((enemy) => {
            if (!enemy.isStunned && this.checkCollision(this.player, enemy)) {
                const knockbackAngle = Math.atan2(
                    this.player.y - enemy.y,
                    this.player.x - enemy.x
                );
                
                this.player.takeDamage(enemy.damage);
                // Apply knockback
                this.player.velocityX += Math.cos(knockbackAngle) * 10;
                this.player.velocityY += Math.sin(knockbackAngle) * 10;
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        });
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = CONFIG.CANVAS.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render game objects
        this.echoPulses.forEach(pulse => pulse.render(this.ctx));
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        this.crystals.forEach(crystal => crystal.render(this.ctx));
        this.player.render(this.ctx);

        // Render UI
        this.renderUI();
    }

    renderUI() {
        if (this.gameState === 'PLAYING') {
            // Update health display
            const healthIcons = document.querySelectorAll('.fa-gem');
            healthIcons.forEach((icon, index) => {
                icon.style.color = index < this.player.health ? '#8b5cf6' : '#4b5563';
            });

            // Update crystal count
            document.querySelector('#gameUI span').textContent = this.score;
        }
    }

    createHitEffect(x, y) {
        const particles = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            particles.push({
                x, y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 20,
                color: '#8b5cf6'
            });
        }
        this.renderParticles(particles);
    }

    createSpawnEffect(x, y) {
        const particles = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            particles.push({
                x, y,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                life: 30,
                color: '#10b981'
            });
        }
        this.renderParticles(particles);
    }

    createHealEffect(x, y) {
        const particles = [];
        for (let i = 0; i < 8; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 2,
                life: 40,
                color: '#10b981'
            });
        }
        this.renderParticles(particles);
    }

    createParticleEffect(x, y, options) {
        const particles = [];
        const particle = {
            x, y,
            vx: options.vx,
            vy: options.vy,
            life: options.life,
            size: options.size || 3,
            color: options.color,
            alpha: 1
        };
        particles.push(particle);

        const render = () => {
            this.ctx.save();
            particles.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                p.alpha = p.life / options.life;
                
                if (p.life <= 0) {
                    particles.splice(index, 1);
                    return;
                }

                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
                this.ctx.fill();

                // Add glow effect
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 10;
                this.ctx.fill();
            });
            this.ctx.restore();

            if (particles.length > 0) {
                requestAnimationFrame(render);
            }
        };
        requestAnimationFrame(render);
    }

    checkCollision(obj1, obj2) {
        // Add small buffer to make collision detection more forgiving
        const buffer = 5;
        return obj1.x < obj2.x + obj2.width + buffer &&
               obj1.x + obj1.width + buffer > obj2.x &&
               obj1.y < obj2.y + obj2.height + buffer &&
               obj1.y + obj1.height + buffer > obj2.y;
    }

    gameLoop(timestamp) {
        if (this.gameState !== 'PLAYING') return;

        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Update game state
        this.accumulator += deltaTime;
        while (this.accumulator >= this.timestep) {
            this.update(this.timestep);
            this.accumulator -= this.timestep;
        }

        // Render frame
        this.render();

        // Request next frame
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Player Class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.isInvincible = false;
        this.canShoot = true;
        this.invincibilityFlashTime = 0;
        this.moveDirection = 0; // -1 for left, 1 for right, 0 for stationary
        this.isJumping = false;
        this.dashCooldown = 0;
        this.echoCooldown = 0;
        this.lastKeys = new Set(); // Store previous frame's keys
    }

    startInvincibility(duration) {
        this.isInvincible = true;
        setTimeout(() => {
            this.isInvincible = false;
        }, duration);
    }

    update(deltaTime, keys) {
        // Update cooldowns
        if (this.dashCooldown > 0) this.dashCooldown -= deltaTime;
        if (this.echoCooldown > 0) this.echoCooldown -= deltaTime;

        // Movement input with improved responsiveness
        this.moveDirection = 0;
        if (keys.has('ArrowLeft') || keys.has('KeyA')) this.moveDirection -= 1;
        if (keys.has('ArrowRight') || keys.has('KeyD')) this.moveDirection += 1;

        // Horizontal movement with better acceleration and deceleration
        const targetVelocityX = this.moveDirection * CONFIG.PLAYER.MAX_SPEED;
        const acceleration = this.isOnGround() ? 0.15 : 0.1;
        const deceleration = this.isOnGround() ? 0.25 : 0.05;
        
        if (this.moveDirection !== 0) {
            // Accelerating
            this.velocityX += (targetVelocityX - this.velocityX) * acceleration;
        } else {
            // Decelerating
            this.velocityX *= (1 - deceleration);
        }

        // Dash ability with improved feedback
        if ((keys.has('ShiftLeft') || keys.has('ShiftRight')) && this.dashCooldown <= 0 && this.moveDirection !== 0) {
            this.velocityX = this.moveDirection * CONFIG.PLAYER.MAX_SPEED * 2;
            this.dashCooldown = 1000;
            this.createDashEffect();
        }

        // Jumping with better control
        const jumpPressed = keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space');
        const wasJumpPressed = this.lastKeys.has('ArrowUp') || this.lastKeys.has('KeyW') || this.lastKeys.has('Space');

        if (jumpPressed && !wasJumpPressed) {
            if (this.isOnGround()) {
                this.velocityY = CONFIG.PLAYER.JUMP_FORCE;
                this.isJumping = true;
                this.addJumpEffect();
            } else if (this.isAtLeftWall() || this.isAtRightWall()) {
                // Wall jump with improved feel
                this.velocityY = CONFIG.PLAYER.WALL_JUMP_FORCE.Y;
                this.velocityX = this.isAtLeftWall() ? 
                    CONFIG.PLAYER.WALL_JUMP_FORCE.X : 
                    -CONFIG.PLAYER.WALL_JUMP_FORCE.X;
                this.addJumpEffect();
            }
        }

        // Store current keys for next frame
        this.lastKeys = new Set(keys);

        // Wall sliding
        if (!this.isOnGround() && (this.isAtLeftWall() || this.isAtRightWall())) {
            if (this.velocityY > CONFIG.PLAYER.WALL_SLIDE_SPEED) {
                this.velocityY = CONFIG.PLAYER.WALL_SLIDE_SPEED;
            }
        }

        // Variable jump height
        if (!keys.has('Space') && !keys.has('ArrowUp') && !keys.has('KeyW') && this.velocityY < 0) {
            this.velocityY *= 0.85; // Cut jump short if button released
        }

        // Apply gravity with terminal velocity
        this.velocityY = Math.min(
            this.velocityY + CONFIG.PLAYER.GRAVITY,
            CONFIG.PLAYER.MAX_SPEED * 2
        );

        // Update position with improved movement feel
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Apply friction when on ground
        if (this.isOnGround()) {
            this.velocityX *= 0.85;
            this.isJumping = false;
        }

        // Keep player in bounds with improved collision
        this.x = Math.max(0, Math.min(this.x, CONFIG.CANVAS.WIDTH - this.width));
        if (this.y > CONFIG.CANVAS.HEIGHT - this.height) {
            this.y = CONFIG.CANVAS.HEIGHT - this.height;
            this.velocityY = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }

        // Update invincibility flash effect
        this.invincibilityFlashTime += deltaTime;
    }

    render(ctx) {
        // Draw player shadow with dynamic size based on height
        const shadowSize = Math.max(5, 15 - (this.y / CONFIG.CANVAS.HEIGHT) * 10);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width/2,
            CONFIG.CANVAS.HEIGHT - shadowSize/2,
            this.width/2,
            shadowSize,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // Invincibility flash effect
        const shouldFlash = this.isInvincible && Math.sin(this.invincibilityFlashTime * 0.01) > 0;

        // Draw player with enhanced visual effects
        ctx.save();
        
        // Movement trail effect
        if (Math.abs(this.velocityX) > 1) {
            ctx.globalAlpha = 0.3;
            for (let i = 1; i <= 3; i++) {
                const trailGradient = ctx.createLinearGradient(
                    this.x - (this.velocityX * i * 0.5), this.y,
                    this.x - (this.velocityX * i * 0.5) + this.width, this.y + this.height
                );
                trailGradient.addColorStop(0, `rgba(147, 51, 234, ${0.3 - i * 0.1})`);
                trailGradient.addColorStop(1, `rgba(126, 34, 206, ${0.3 - i * 0.1})`);
                ctx.fillStyle = trailGradient;
                ctx.fillRect(
                    this.x - (this.velocityX * i * 0.5),
                    this.y,
                    this.width,
                    this.height
                );
            }
            ctx.globalAlpha = 1;
        }

        // Glow effect
        ctx.shadowColor = shouldFlash ? '#ffffff' : (this.isInvincible ? '#ff0000' : '#8b5cf6');
        ctx.shadowBlur = 20;

        // Main body gradient with direction-based coloring
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x + this.width, this.y + this.height
        );

        if (shouldFlash) {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#f0f0f0');
        } else {
            const baseColor = this.isInvincible ? 
                ['#ff6b6b', '#ff0000'] : 
                ['#9333ea', '#7e22ce'];
            
            if (this.moveDirection > 0) {
                gradient.addColorStop(0, baseColor[0]);
                gradient.addColorStop(1, baseColor[1]);
            } else if (this.moveDirection < 0) {
                gradient.addColorStop(0, baseColor[1]);
                gradient.addColorStop(1, baseColor[0]);
            } else {
                gradient.addColorStop(0, baseColor[0]);
                gradient.addColorStop(0.5, baseColor[1]);
                gradient.addColorStop(1, baseColor[0]);
            }
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw cooldown indicators
        if (this.dashCooldown > 0 || this.echoCooldown > 0) {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(this.x, this.y - 8, this.width, 4);

            if (this.dashCooldown > 0) {
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(
                    this.x, 
                    this.y - 8,
                    this.width * (1 - this.dashCooldown/1000),
                    2
                );
            }

            if (this.echoCooldown > 0) {
                ctx.fillStyle = '#8b5cf6';
                ctx.fillRect(
                    this.x,
                    this.y - 6,
                    this.width * (1 - this.echoCooldown/CONFIG.ECHO.COOLDOWN),
                    2
                );
            }
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    createDashEffect() {
        for (let i = 0; i < 10; i++) {
            game.createParticleEffect(
                this.x + this.width/2,
                this.y + this.height/2,
                {
                    vx: -this.moveDirection * (Math.random() * 5 + 5),
                    vy: (Math.random() - 0.5) * 4,
                    life: 20,
                    size: Math.random() * 4 + 2,
                    color: '#8b5cf6'
                }
            );
        }
    }

    shootEchoPulse(targetX, targetY) {
        if (!this.canShoot || this.echoCooldown > 0) return;

        // Calculate angle to target
        const angle = Math.atan2(targetY - (this.y + this.height/2), 
                               targetX - (this.x + this.width/2));
        
        // Show aiming line with particles
        const distance = Math.sqrt(
            Math.pow(targetX - (this.x + this.width/2), 2) +
            Math.pow(targetY - (this.y + this.height/2), 2)
        );

        for (let i = 0; i < distance; i += 20) {
            const x = this.x + this.width/2 + Math.cos(angle) * i;
            const y = this.y + this.height/2 + Math.sin(angle) * i;
            game.createParticleEffect(x, y, {
                vx: 0,
                vy: 0,
                life: 10,
                size: 2,
                color: '#8b5cf6'
            });
        }

        // Create echo pulse with improved spread
        const spreadAngles = [-1, -0.5, 0, 0.5, 1];
        spreadAngles.forEach(spread => {
            const spreadAngle = angle + (spread * Math.PI / 32);
            game.echoPulses.push(new EchoPulse(
                this.x + this.width/2,
                this.y + this.height/2,
                spreadAngle,
                spread === 0 // Main pulse is full damage
            ));
        });

        this.echoCooldown = CONFIG.ECHO.COOLDOWN;
        this.canShoot = false;
        setTimeout(() => {
            this.canShoot = true;
        }, CONFIG.ECHO.COOLDOWN);

        // Add recoil effect with particles
        this.velocityX -= Math.cos(angle) * 3;
        this.velocityY -= Math.sin(angle) * 3;

        // Add recoil particles
        for (let i = 0; i < 5; i++) {
            game.createParticleEffect(
                this.x + this.width/2,
                this.y + this.height/2,
                {
                    vx: Math.cos(angle + Math.PI) * (Math.random() * 5 + 5),
                    vy: Math.sin(angle + Math.PI) * (Math.random() * 5 + 5),
                    life: 15,
                    size: Math.random() * 3 + 2,
                    color: '#8b5cf6'
                }
            );
        }
    }

    takeDamage(amount) {
        if (this.isInvincible) return;
        
        this.health -= amount;
        this.startInvincibility(1000); // 1 second of invulnerability after getting hit
        
        // Create hit effect particles
        for (let i = 0; i < 8; i++) {
            game.createParticleEffect(
                this.x + this.width/2,
                this.y + this.height/2,
                {
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 30,
                    size: Math.random() * 4 + 2,
                    color: '#ef4444'
                }
            );
        }
        this.isInvincible = true;
        setTimeout(() => {
            this.isInvincible = false;
        }, CONFIG.PLAYER.INVINCIBILITY_DURATION);
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, CONFIG.PLAYER.MAX_HEALTH);
    }

    isOnGround() {
        return this.y >= CONFIG.CANVAS.HEIGHT - this.height;
    }

    isAtLeftWall() {
        return this.x <= 0;
    }

    isAtRightWall() {
        return this.x >= CONFIG.CANVAS.WIDTH - this.width;
    }

    addJumpEffect() {
        // Add particles for jump effect
        const particles = [];
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 2 + 1,
                life: 20
            });
        }
        
        // Render particles
        const renderParticles = () => {
            particles.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                
                if (p.life <= 0) {
                    particles.splice(index, 1);
                    return;
                }

                game.ctx.fillStyle = `rgba(147, 51, 234, ${p.life / 20})`;
                game.ctx.beginPath();
                game.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                game.ctx.fill();
            });

            if (particles.length > 0) {
                requestAnimationFrame(renderParticles);
            }
        };

        requestAnimationFrame(renderParticles);
    }
}

// Echo Pulse Class
class EchoPulse {
    constructor(x, y, angle, isMainPulse = true) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.ECHO.RADIUS * 2;
        this.height = CONFIG.ECHO.RADIUS * 2;
        this.angle = angle;
        this.speed = CONFIG.ECHO.SPEED;
        this.bounces = 0;
        this.trail = [];
        this.particles = [];
        this.pulseSize = CONFIG.ECHO.RADIUS;
        this.pulseGrowth = true;
        this.isMainPulse = isMainPulse;
        this.damage = isMainPulse ? 1 : 0.5;
        this.alpha = isMainPulse ? 1 : 0.6;
    }

    update(deltaTime) {
        // Pulse size animation
        if (this.pulseGrowth) {
            this.pulseSize += 0.5;
            if (this.pulseSize >= CONFIG.ECHO.RADIUS * 1.2) this.pulseGrowth = false;
        } else {
            this.pulseSize -= 0.5;
            if (this.pulseSize <= CONFIG.ECHO.RADIUS * 0.8) this.pulseGrowth = true;
        }

        // Move in direction of angle
        const prevX = this.x;
        const prevY = this.y;
        
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Add current position to trail with interpolation
        const steps = 3;
        for (let i = 1; i <= steps; i++) {
            const interpX = prevX + (this.x - prevX) * (i / steps);
            const interpY = prevY + (this.y - prevY) * (i / steps);
            this.trail.push({
                x: interpX,
                y: interpY,
                size: this.pulseSize * (1 - i/steps)
            });
        }

        if (this.trail.length > CONFIG.ECHO.TRAIL_LENGTH * steps) {
            this.trail.splice(0, steps);
        }

        // Handle wall collisions with particle effects
        let collision = false;
        if (this.x <= 0 || this.x >= CONFIG.CANVAS.WIDTH - this.width) {
            this.angle = Math.PI - this.angle;
            this.x = Math.max(0, Math.min(this.x, CONFIG.CANVAS.WIDTH - this.width));
            collision = true;
        }
        if (this.y <= 0 || this.y >= CONFIG.CANVAS.HEIGHT - this.height) {
            this.angle = -this.angle;
            this.y = Math.max(0, Math.min(this.y, CONFIG.CANVAS.HEIGHT - this.height));
            collision = true;
        }

        if (collision) {
            this.bounces++;
            this.createBounceParticles();
        }

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
    }

    createBounceParticles() {
        for (let i = 0; i < CONFIG.ECHO.BOUNCE_PARTICLES; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = Math.random() * 2 + 2;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20,
                size: Math.random() * 3 + 1
            });
        }
    }

    render(ctx) {
        // Draw trail with enhanced effects
        ctx.save();
        ctx.shadowColor = CONFIG.ECHO.COLOR;
        ctx.shadowBlur = 15;
        
        // Draw connecting line between trail points
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.3 * this.alpha})`;
            ctx.lineWidth = 2;
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            this.trail.forEach(pos => {
                ctx.lineTo(pos.x, pos.y);
            });
            ctx.stroke();
        }

        // Draw trail points with gradient
        this.trail.forEach((pos, index) => {
            const alpha = (index / this.trail.length) * this.alpha;
            const gradient = ctx.createRadialGradient(
                pos.x, pos.y, 0,
                pos.x, pos.y, pos.size
            );
            gradient.addColorStop(0, `rgba(139, 92, 246, ${alpha})`);
            gradient.addColorStop(0.7, `rgba(139, 92, 246, ${alpha * 0.7})`);
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, pos.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw main pulse with enhanced effects
        const pulseGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.pulseSize * 1.2
        );
        pulseGradient.addColorStop(0, `rgba(139, 92, 246, ${this.alpha})`);
        pulseGradient.addColorStop(0.6, `rgba(139, 92, 246, ${this.alpha * 0.8})`);
        pulseGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

        ctx.fillStyle = pulseGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.pulseSize * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.8})`;
        ctx.arc(this.x, this.y, this.pulseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Draw bounce particles
        this.particles.forEach(p => {
            const alpha = p.life / 20;
            ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}

// Enemy Class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.ENEMY.BASIC.SIZE;
        this.height = CONFIG.ENEMY.BASIC.SIZE;
        this.health = CONFIG.ENEMY.BASIC.HEALTH;
        this.damage = CONFIG.ENEMY.BASIC.DAMAGE;
        this.speed = CONFIG.ENEMY.BASIC.SPEED;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isStunned = false;
        this.stunDuration = 0;
        this.flashEffect = 0;
    }

    update(deltaTime, player) {
        if (this.isStunned) {
            this.stunDuration -= deltaTime;
            if (this.stunDuration <= 0) {
                this.isStunned = false;
            }
            // Reduce velocity while stunned
            this.velocityX *= 0.8;
            this.velocityY *= 0.8;
            return;
        }

        // More sophisticated AI with minimum distance and smoother movement
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Add slight randomness to movement to make it more interesting
        const randomAngle = Math.sin(Date.now() * 0.001) * 0.2;
        
        // Keep minimum distance from player
        if (distance > CONFIG.ENEMY.BASIC.MIN_DISTANCE) {
            // Move towards player with smooth acceleration and slight wobble
            const angle = Math.atan2(dy, dx) + randomAngle;
            this.velocityX = Math.cos(angle) * this.speed * 0.5;
            this.velocityY = Math.sin(angle) * this.speed * 0.5;
        } else {
            // Circle around player when close with slight variation
            const angle = Math.atan2(dy, dx) + Math.PI/2 + randomAngle;
            this.velocityX = Math.cos(angle) * this.speed;
            this.velocityY = Math.sin(angle) * this.speed;
        }

        // Add slight friction to make movement smoother
        this.velocityX *= 0.98;
        this.velocityY *= 0.98;

        // Update flash effect
        if (this.flashEffect > 0) {
            this.flashEffect -= deltaTime;
        }

        // Update position with velocity
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Keep enemy in bounds
        this.x = Math.max(0, Math.min(this.x, CONFIG.CANVAS.WIDTH - this.width));
        this.y = Math.max(0, Math.min(this.y, CONFIG.CANVAS.HEIGHT - this.height));
    }

    render(ctx) {
        // Draw enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width/2,
            CONFIG.CANVAS.HEIGHT - 5,
            this.width/2,
            10,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // Draw enemy with gradient
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x + this.width, this.y + this.height
        );
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(1, '#dc2626');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Add glow effect
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.isStunned = true;
        this.stunDuration = 500; // 0.5 seconds of stun
        this.flashEffect = 200; // Flash effect duration
    }
}

// Crystal Class
class Crystal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.CRYSTALS.HEALTH_CRYSTAL.SIZE;
        this.height = CONFIG.CRYSTALS.HEALTH_CRYSTAL.SIZE;
        this.pulsePhase = 0;
    }

    update(deltaTime) {
        this.pulsePhase += deltaTime * 0.005;
        if (this.pulsePhase > Math.PI * 2) {
            this.pulsePhase -= Math.PI * 2;
        }
    }

    render(ctx) {
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.2;
        const size = this.width * pulseScale;
        
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(this.x + size/2, this.y);
        ctx.lineTo(this.x + size, this.y + size/2);
        ctx.lineTo(this.x + size/2, this.y + size);
        ctx.lineTo(this.x, this.y + size/2);
        ctx.closePath();
        ctx.fill();
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    window.game = new Game();
});
