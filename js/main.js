const FIREBALL_INTERVAL_TICKS = FIREBALL_INTERVAL_S * (1000 / GAME_TICK_MS);
const SAVE_INTERVAL_TICKS = SAVE_INTERVAL_S * (1000 / GAME_TICK_MS);

let gameLoopCounter = 0; // For timed events like saving

function initializeGame() {
    const loaded = loadGame();

    if (!loaded) {
        // Spawn the first monster if no save game
        spawnMonster(0);
        addLogMessage('歡迎來到放置型角色扮演遊戲！你的冒re始了。');
    }

    // Initial UI render which also calls addEventListeners
    updateUI();

    // Start the game loop
    setInterval(gameLoop, GAME_TICK_MS);
}

function gameLoop() {
    gameLoopCounter++;

    // --- State Update Phase ---
    attackMonster();
    handleActiveSkills();

    // --- Conditional Render Call Phase ---
    if (uiNeedsUpdate) {
        updateUI();
        uiNeedsUpdate = false;
    }

    // --- Periodic Save Phase ---
    if (gameLoopCounter % SAVE_INTERVAL_TICKS === 0) {
        saveGame();
        addLogMessage('遊戲進度已儲存。');
    }
}

function handleActiveSkills() {
    // Fireball timer
    gameState.timers.fireball++;
    if (gameState.timers.fireball >= FIREBALL_INTERVAL_TICKS) {
        gameState.timers.fireball = 0;
        castFireball();
    }
}

// Start the game when the window loads
window.onload = initializeGame;
