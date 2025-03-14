// Game Configuration Constants
const CONFIG = {
    // Canvas Settings
    CANVAS: {
        WIDTH: 900,
        HEIGHT: 600,
        BACKGROUND_COLOR: '#1f2937'
    },

    // Player Settings
    PLAYER: {
        // Movement
        BASE_SPEED: 5,
        ACCELERATION: 0.3,  // Time in seconds to reach max speed
        MAX_SPEED: 8,
        
        // Jump Settings
        JUMP_HEIGHT: 2.5,   // In tiles
        JUMP_FORCE: -15,    // Initial vertical velocity
        GRAVITY: 0.8,
        AIR_CONTROL: 0.7,   // Multiplier for air movement
        
        // Wall Interactions
        WALL_SLIDE_SPEED: 2,
        WALL_JUMP_FORCE: {
            X: 12,          // Horizontal force
            Y: -12          // Vertical force (80% of normal jump)
        },
        
        // Size and Hitbox
        WIDTH: 32,          // 1 tile width
        HEIGHT: 64,         // 2 tiles height
        
        // Combat
        MAX_HEALTH: 5,
        INVINCIBILITY_DURATION: 800,  // in milliseconds
        DAMAGE_KNOCKBACK: 8
    },

    // Echo Pulse Settings
    ECHO: {
        SPEED: 10,
        MAX_BOUNCES: 3,
        COOLDOWN: 800,      // in milliseconds
        RADIUS: 16,         // 0.5 tile radius
        COLOR: '#8b5cf6',   // Purple color
        TRAIL_LENGTH: 5,    // Number of trail segments
        BOUNCE_PARTICLES: 8  // Number of particles on bounce
    },

    // Enemy Settings
    ENEMY: {
        BASIC: {
            HEALTH: 2,
            DAMAGE: 1,
            SPEED: 1.5,
            SIZE: 32,
            MIN_DISTANCE: 200,  // Minimum distance to keep from player
            SPAWN_DISTANCE: 300 // Minimum distance to spawn from player
        },
        ELITE: {
            HEALTH: 4,
            DAMAGE: 2,
            SPEED: 2,
            SIZE: 48,
            MIN_DISTANCE: 250,
            SPAWN_DISTANCE: 350
        }
    },

    // Level Generation
    LEVEL: {
        TILE_SIZE: 32,
        ROOM_MIN_WIDTH: 8,   // In tiles
        ROOM_MAX_WIDTH: 15,
        ROOM_MIN_HEIGHT: 6,
        ROOM_MAX_HEIGHT: 12,
        CORRIDOR_WIDTH: 3,
        
        // Cave Generation
        CELLULAR_AUTOMATA: {
            ITERATIONS: 4,
            BIRTH_LIMIT: 4,
            DEATH_LIMIT: 3,
            INITIAL_CHANCE: 0.45
        }
    },

    // Collectibles
    CRYSTALS: {
        HEALTH_CRYSTAL: {
            HEAL_AMOUNT: 1,
            DROP_CHANCE: 0.2,  // 20% chance from enemies
            SIZE: 24
        },
        RESONANT_CRYSTAL: {
            SIZE: 32,
            PULSE_RATE: 1000,  // ms between pulses
            ATTRACTION_RADIUS: 100
        }
    },

    // Visual Effects
    EFFECTS: {
        SCREEN_SHAKE: {
            DURATION: 200,   // ms
            INTENSITY: 5     // pixels
        },
        HIT_FLASH: {
            DURATION: 100,   // ms
            COLOR: '#ffffff'
        }
    },

    // Audio Settings
    AUDIO: {
        MASTER_VOLUME: 0.7,
        MUSIC_VOLUME: 0.5,
        SFX_VOLUME: 0.8,
        ECHO_PITCH_RANGE: {
            MIN: 0.8,
            MAX: 1.2
        }
    },

    // Debug Settings
    DEBUG: {
        SHOW_HITBOXES: false,
        SHOW_FPS: false,
        INVINCIBLE: false,
        UNLIMITED_ECHO: false
    }
};

// Prevent modifications to the config object
Object.freeze(CONFIG);
