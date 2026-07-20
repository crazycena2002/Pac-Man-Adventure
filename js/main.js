import { LEVELS, validateLevels } from "./levels.js";

/* ========================================
   遊戲狀態與共用資料
======================================== */

const GAME_STATES = Object.freeze({
  START: "start",
  PLAYING: "playing",
  PAUSED: "paused",
  LEVEL_CLEAR: "level-clear",
  GAME_OVER: "game-over",
  VICTORY: "victory",
});

const DIRECTIONS = Object.freeze({
  up: { row: -1, col: 0, opposite: "down" },
  down: { row: 1, col: 0, opposite: "up" },
  left: { row: 0, col: -1, opposite: "right" },
  right: { row: 0, col: 1, opposite: "left" },
});

const KEY_DIRECTIONS = Object.freeze({
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  s: "down",
  S: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
});

const PLAYER_DELAY = 145;
const HIT_PAUSE_DURATION = 450;
const RESPAWN_INVINCIBLE_DURATION = 1400;
const GHOST_COLORS = ["pink", "red", "cyan", "orange"];
const PACMAN_DIRECTION_CLASSES = [
  "direction-up",
  "direction-down",
  "direction-left",
  "direction-right",
];

const elements = {
  maze: document.querySelector("#mazeGrid"),
  score: document.querySelector("#scoreValue"),
  lives: document.querySelector("#livesValue"),
  level: document.querySelector("#levelValue"),
  notice: document.querySelector("#gameNotice"),
  overlay: document.querySelector("#statusOverlay"),
  statusTitle: document.querySelector("#statusTitle"),
  statusMessage: document.querySelector("#statusMessage"),
  continueButton: document.querySelector("#continueButton"),
  nextLevelButton: document.querySelector("#nextLevelButton"),
  rewardButton: document.querySelector("#rewardButton"),
  restartButton: document.querySelector("#restartButton"),
  homeButton: document.querySelector("#homeButton"),
  rewardVideo: document.querySelector("#rewardVideo"),
  rewardFrame: document.querySelector("#rewardFrame"),
};

let gameState = GAME_STATES.START;
let score = 0;
let lives = 3;
let currentLevelIndex = 0;
let mapCells = [];
let remainingPellets = 0;
let player = null;
let ghosts = [];
let queuedDirection = null;
let animationFrameId = null;
let lastPlayerMove = 0;
let lastGhostMove = 0;
let frightenedUntil = 0;
let invincibleUntil = 0;
let hurtUntil = 0;
let waitingForRespawn = false;
let pendingGameOver = false;
let noticeUntil = 0;
let playerElement = null;

/* ========================================
   啟動新遊戲與載入關卡
======================================== */

function startNewGame() {
  stopGameLoop();
  score = 0;
  lives = 3;
  currentLevelIndex = 0;
  loadLevel();
}

function loadLevel() {
  stopGameLoop();

  const level = LEVELS[currentLevelIndex];
  mapCells = level.map.map((row) => [...row]);
  player = {
    row: level.playerStart.row,
    col: level.playerStart.col,
    direction: "right",
  };
  ghosts = Array.from({ length: level.ghostCount }, (_, index) => {
    const start = level.ghostStarts[index];
    return {
      row: start.row,
      col: start.col,
      startRow: start.row,
      startCol: start.col,
      direction: index % 2 === 0 ? "left" : "right",
      color: GHOST_COLORS[index],
    };
  });

  clearItemAt(player.row, player.col);
  ghosts.forEach((ghost) => clearItemAt(ghost.row, ghost.col));
  remainingPellets = countItems(".");
  queuedDirection = null;
  frightenedUntil = 0;
  invincibleUntil = performance.now() + 1200;
  hurtUntil = 0;
  waitingForRespawn = false;
  pendingGameOver = false;
  gameState = GAME_STATES.PLAYING;

  buildMaze();
  hideOverlay();
  updateHud();
  showNotice(`第 ${level.number} 關開始！`, 1500);
  renderActors();
  startGameLoop();
}

/* ========================================
   迷宮與角色畫面
======================================== */

function buildMaze() {
  const columnCount = mapCells[0].length;
  elements.maze.style.setProperty("--maze-columns", columnCount);
  elements.maze.replaceChildren();

  mapCells.forEach((row, rowIndex) => {
    row.forEach((cellType, colIndex) => {
      const cell = document.createElement("div");
      cell.className = "maze-cell";
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;
      cell.setAttribute("role", "gridcell");
      applyCellClass(cell, cellType);
      elements.maze.append(cell);
    });
  });
}

function applyCellClass(cell, cellType) {
  cell.classList.remove("wall", "pellet", "power-pellet", "fruit", "portal");

  const classNames = {
    "#": "wall",
    ".": "pellet",
    o: "power-pellet",
    f: "fruit",
    T: "portal",
  };

  if (classNames[cellType]) {
    cell.classList.add(classNames[cellType]);
  }
}

function renderActors() {
  elements.maze.querySelectorAll(".maze-ghost").forEach((ghost) => ghost.remove());

  const now = performance.now();
  if (!playerElement) {
    playerElement = document.createElement("span");
    playerElement.classList.add("maze-pacman");
    playerElement.setAttribute("aria-label", "Pac-Man");
  }

  /* 移動時沿用同一個元素，只替換方向與暫時狀態 class。 */
  playerElement.classList.remove(...PACMAN_DIRECTION_CLASSES, "hurt", "invincible");
  playerElement.classList.add(`direction-${player.direction}`);

  if (now < hurtUntil) {
    playerElement.classList.add("hurt");
  } else if (now < invincibleUntil) {
    playerElement.classList.add("invincible");
  }

  getCellElement(player.row, player.col).append(playerElement);

  ghosts.forEach((ghost) => {
    const ghostElement = document.createElement("span");
    ghostElement.className = `maze-ghost ghost-${ghost.color}`;
    ghostElement.setAttribute("aria-label", "鬼魂");

    if (now < frightenedUntil) {
      ghostElement.classList.add("frightened");
    }

    getCellElement(ghost.row, ghost.col).append(ghostElement);
  });
}

function getCellElement(row, col) {
  return elements.maze.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

/* ========================================
   玩家移動與傳送門
======================================== */

function queuePlayerDirection(direction) {
  if (gameState !== GAME_STATES.PLAYING || !DIRECTIONS[direction]) {
    return;
  }

  queuedDirection = direction;
}

function movePlayer() {
  if (queuedDirection && getNextPosition(player, queuedDirection, true)) {
    player.direction = queuedDirection;
  }

  const nextPosition = getNextPosition(player, player.direction, true);
  if (!nextPosition) {
    return;
  }

  player.row = nextPosition.row;
  player.col = nextPosition.col;
  collectItem();
  checkGhostCollision();

  if (gameState === GAME_STATES.PLAYING) {
    renderActors();
  }
}

function getNextPosition(actor, direction, allowPortal) {
  const movement = DIRECTIONS[direction];
  let nextRow = actor.row + movement.row;
  let nextCol = actor.col + movement.col;

  if (!isInsideMap(nextRow, nextCol)) {
    return null;
  }

  const nextCell = mapCells[nextRow][nextCol];
  if (nextCell === "#" || (!allowPortal && nextCell === "T")) {
    return null;
  }

  if (allowPortal && nextCell === "T") {
    nextCol = nextCol === 0 ? mapCells[0].length - 1 : 0;
  }

  return { row: nextRow, col: nextCol };
}

/* ========================================
   豆子、道具與分數
======================================== */

function collectItem() {
  const item = mapCells[player.row][player.col];

  if (item === ".") {
    score += 10;
    remainingPellets -= 1;
  } else if (item === "f") {
    score += 100;
    showNotice("水果 +100", 1000);
  } else if (item === "o") {
    const level = LEVELS[currentLevelIndex];
    frightenedUntil = performance.now() + level.frightenedTime;
    showNotice("大力丸！現在可以吃鬼魂", 1400);
  } else {
    return;
  }

  clearItemAt(player.row, player.col);
  updateHud();

  if (remainingPellets === 0) {
    finishLevel();
  }
}

function clearItemAt(row, col) {
  if ([".", "o", "f"].includes(mapCells[row][col])) {
    mapCells[row][col] = " ";
  }

  const cell = getCellElement(row, col);
  if (cell) {
    applyCellClass(cell, mapCells[row][col]);
  }
}

function countItems(itemType) {
  return mapCells.reduce(
    (total, row) => total + row.filter((cell) => cell === itemType).length,
    0,
  );
}

/* ========================================
   鬼魂移動
======================================== */

function moveGhosts() {
  ghosts.forEach((ghost) => {
    const legalDirections = Object.keys(DIRECTIONS).filter((direction) =>
      getNextPosition(ghost, direction, false),
    );

    if (legalDirections.length === 0) {
      return;
    }

    const forwardChoices = legalDirections.filter(
      (direction) => direction !== DIRECTIONS[ghost.direction].opposite,
    );
    const choices = forwardChoices.length > 0 ? forwardChoices : legalDirections;
    ghost.direction = chooseGhostDirection(ghost, choices);

    const nextPosition = getNextPosition(ghost, ghost.direction, false);
    ghost.row = nextPosition.row;
    ghost.col = nextPosition.col;
  });

  checkGhostCollision();

  if (gameState === GAME_STATES.PLAYING) {
    renderActors();
  }
}

function chooseGhostDirection(ghost, choices) {
  const level = LEVELS[currentLevelIndex];
  const isFrightened = performance.now() < frightenedUntil;

  if (!isFrightened && Math.random() < level.chaseChance) {
    return [...choices].sort((first, second) => {
      const firstPosition = getNextPosition(ghost, first, false);
      const secondPosition = getNextPosition(ghost, second, false);
      return distanceToPlayer(firstPosition) - distanceToPlayer(secondPosition);
    })[0];
  }

  return choices[Math.floor(Math.random() * choices.length)];
}

function distanceToPlayer(position) {
  return Math.abs(position.row - player.row) + Math.abs(position.col - player.col);
}

/* ========================================
   碰撞、生命與角色重置
======================================== */

function checkGhostCollision() {
  if (waitingForRespawn) {
    return;
  }

  const collidedGhost = ghosts.find(
    (ghost) => ghost.row === player.row && ghost.col === player.col,
  );

  if (!collidedGhost) {
    return;
  }

  if (performance.now() < frightenedUntil) {
    score += 200;
    collidedGhost.row = collidedGhost.startRow;
    collidedGhost.col = collidedGhost.startCol;
    collidedGhost.direction = "left";
    showNotice("吃掉鬼魂 +200", 1000);
    updateHud();
    return;
  }

  if (performance.now() < invincibleUntil) {
    return;
  }

  loseLife();
}

function loseLife() {
  if (waitingForRespawn || gameState !== GAME_STATES.PLAYING) {
    return;
  }

  lives -= 1;
  updateHud();
  queuedDirection = null;
  hurtUntil = performance.now() + HIT_PAUSE_DURATION;
  waitingForRespawn = true;
  pendingGameOver = lives <= 0;
  showNotice(lives > 0 ? `失去一條生命，剩下 ${lives} 條` : "最後一條生命已用完", 1500);
  renderActors();
}

/* 受傷期間沿用主遊戲迴圈暫停移動，結束後才重生或顯示 Game Over。 */
function updateHitSequence(now) {
  if (!waitingForRespawn) {
    return false;
  }

  if (now < hurtUntil) {
    return true;
  }

  waitingForRespawn = false;
  hurtUntil = 0;

  if (pendingGameOver) {
    pendingGameOver = false;
    gameState = GAME_STATES.GAME_OVER;
    animationFrameId = null;
    showOverlay("GAME OVER", `最終分數：${score}`, ["restart", "home"]);
    return true;
  }

  resetActors();
  invincibleUntil = now + RESPAWN_INVINCIBLE_DURATION;
  lastPlayerMove = now;
  lastGhostMove = now;
  renderActors();
  return true;
}

function resetActors() {
  const level = LEVELS[currentLevelIndex];
  player.row = level.playerStart.row;
  player.col = level.playerStart.col;
  player.direction = "right";
  queuedDirection = null;
  frightenedUntil = 0;

  ghosts.forEach((ghost, index) => {
    const start = level.ghostStarts[index];
    ghost.row = start.row;
    ghost.col = start.col;
    ghost.direction = index % 2 === 0 ? "left" : "right";
  });
}

/* ========================================
   過關、勝利與畫面切換
======================================== */

function finishLevel() {
  if (gameState !== GAME_STATES.PLAYING) {
    return;
  }

  score += 1000;
  updateHud();
  stopGameLoop();

  if (currentLevelIndex === LEVELS.length - 1) {
    gameState = GAME_STATES.VICTORY;
    showOverlay("CONGRATULATIONS!", `最終分數：${score}`, ["reward", "restart", "home"]);
    elements.restartButton.textContent = "Play Again";
    return;
  }

  gameState = GAME_STATES.LEVEL_CLEAR;
  showOverlay("LEVEL CLEAR", `目前分數：${score}`, ["next"]);
}

function goToNextLevel() {
  if (gameState !== GAME_STATES.LEVEL_CLEAR) {
    return;
  }

  currentLevelIndex += 1;
  loadLevel();
}

function togglePause() {
  if (gameState === GAME_STATES.PLAYING) {
    gameState = GAME_STATES.PAUSED;
    stopGameLoop();
    showOverlay("PAUSED", "玩家與鬼魂已停止移動", ["continue", "restart", "home"]);
    elements.restartButton.textContent = "Restart Game";
  } else if (gameState === GAME_STATES.PAUSED) {
    continueGame();
  }
}

function continueGame() {
  if (gameState !== GAME_STATES.PAUSED) {
    return;
  }

  gameState = GAME_STATES.PLAYING;
  hideOverlay();
  lastPlayerMove = performance.now();
  lastGhostMove = performance.now();
  startGameLoop();
}

function showOverlay(title, message, visibleButtons) {
  elements.statusTitle.textContent = title;
  elements.statusMessage.textContent = message;
  elements.rewardVideo.hidden = true;
  elements.rewardFrame.removeAttribute("src");
  elements.continueButton.hidden = !visibleButtons.includes("continue");
  elements.nextLevelButton.hidden = !visibleButtons.includes("next");
  elements.rewardButton.hidden = !visibleButtons.includes("reward");
  elements.restartButton.hidden = !visibleButtons.includes("restart");
  elements.homeButton.hidden = !visibleButtons.includes("home");
  elements.overlay.hidden = false;
}

function hideOverlay() {
  elements.overlay.hidden = true;
  elements.rewardVideo.hidden = true;
  elements.rewardFrame.removeAttribute("src");
  elements.restartButton.textContent = "Try Again";
}

function showReward() {
  if (gameState !== GAME_STATES.VICTORY) {
    return;
  }

  elements.rewardFrame.src = "https://www.youtube.com/embed/dQw4w9WgXcQ";
  elements.rewardVideo.hidden = false;
  elements.rewardButton.hidden = true;
}

/* ========================================
   HUD、提示與主遊戲迴圈
======================================== */

function updateHud() {
  elements.score.textContent = String(score).padStart(6, "0");
  elements.level.textContent = String(currentLevelIndex + 1).padStart(2, "0");
  elements.lives.replaceChildren();

  for (let life = 0; life < lives; life += 1) {
    const lifeIcon = document.createElement("span");
    lifeIcon.className = "life-dot";
    elements.lives.append(lifeIcon);
  }

  elements.lives.setAttribute("aria-label", `剩餘 ${lives} 條生命`);
}

function showNotice(message, duration) {
  elements.notice.textContent = message;
  noticeUntil = performance.now() + duration;
}

function updateNotice(now) {
  if (noticeUntil > 0 && now >= noticeUntil) {
    elements.notice.textContent = "方向鍵或 WASD 移動，P 暫停";
    noticeUntil = 0;
  }
}

function startGameLoop() {
  stopGameLoop();
  lastPlayerMove = performance.now();
  lastGhostMove = performance.now();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function gameLoop(now) {
  if (gameState !== GAME_STATES.PLAYING) {
    animationFrameId = null;
    return;
  }

  if (updateHitSequence(now)) {
    updateNotice(now);

    if (gameState === GAME_STATES.PLAYING) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }

    return;
  }

  if (now - lastPlayerMove >= PLAYER_DELAY) {
    movePlayer();
    lastPlayerMove = now;
  }

  const level = LEVELS[currentLevelIndex];
  if (
    gameState === GAME_STATES.PLAYING &&
    !waitingForRespawn &&
    now - lastGhostMove >= level.ghostDelay
  ) {
    moveGhosts();
    lastGhostMove = now;
  }

  updateNotice(now);

  if (gameState === GAME_STATES.PLAYING) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

function isInsideMap(row, col) {
  return row >= 0 && row < mapCells.length && col >= 0 && col < mapCells[0].length;
}

/* ========================================
   鍵盤、手機按鈕與測試工具
======================================== */

document.addEventListener("keydown", (event) => {
  if (KEY_DIRECTIONS[event.key]) {
    event.preventDefault();
    queuePlayerDirection(KEY_DIRECTIONS[event.key]);
  } else if (event.key === "p" || event.key === "P") {
    event.preventDefault();
    togglePause();
  }
});

document.querySelectorAll(".direction-button").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    queuePlayerDirection(button.dataset.direction);
  });
});

elements.continueButton.addEventListener("click", continueGame);
elements.nextLevelButton.addEventListener("click", goToNextLevel);
elements.rewardButton.addEventListener("click", showReward);
elements.restartButton.addEventListener("click", startNewGame);

/* 在網址加上 ?debug=1 時，提供快速測試 Game Over 與 Victory 的工具。 */
if (new URLSearchParams(window.location.search).has("debug")) {
  window.pacmanDebug = {
    loadLevel(levelNumber) {
      currentLevelIndex = Math.min(Math.max(Number(levelNumber) || 1, 1), LEVELS.length) - 1;
      loadLevel();
    },
    completeLevel: finishLevel,
    loseLife() {
      waitingForRespawn = false;
      pendingGameOver = false;
      hurtUntil = 0;
      invincibleUntil = 0;
      loseLife();
    },
    collideWithGhost(ghostIndex = 0, ignoreInvincibility = false) {
      const ghost = ghosts[ghostIndex];
      if (!ghost || gameState !== GAME_STATES.PLAYING) {
        return;
      }

      ghost.row = player.row;
      ghost.col = player.col;
      if (ignoreInvincibility) {
        invincibleUntil = 0;
      }
      checkGhostCollision();
      renderActors();
    },
    getState() {
      return {
        gameState,
        score,
        lives,
        level: currentLevelIndex + 1,
        remainingPellets,
        player: { row: player.row, col: player.col },
        ghosts: ghosts.map((ghost) => ({ row: ghost.row, col: ghost.col })),
        frightened: performance.now() < frightenedUntil,
        hurt: performance.now() < hurtUntil,
        invincible: performance.now() < invincibleUntil,
      };
    },
  };
}

validateLevels();
startNewGame();
