/* ========================================
   關卡資料
   #：牆壁　.：一般豆子　o：大力丸
   f：水果　T：玩家專用傳送門
======================================== */

const MAPS = [
  [
    "###############",
    "#o...........o#",
    "#.###.###.###.#",
    "#.....#.#.....#",
    "#.###.#.#.###.#",
    "T.............T",
    "#.###.#.#.###.#",
    "#.....#.#.....#",
    "#.###.###.###.#",
    "#o....f......o#",
    "###############",
  ],
  [
    "###############",
    "#o....#.#....o#",
    "#.##..#.#..##.#",
    "#.....#.#.....#",
    "###.#.....#.###",
    "T...#..f..#...T",
    "###.#.....#.###",
    "#.....#.#.....#",
    "#.##..#.#..##.#",
    "#o....#.#....o#",
    "###############",
  ],
  [
    "###############",
    "#o..#.....#..o#",
    "#.#.#.###.#.#.#",
    "#.#.........#.#",
    "#.#####.#####.#",
    "T.....f.......T",
    "#.#####.#####.#",
    "#.#.........#.#",
    "#.#.#.###.#.#.#",
    "#o..#.....#..o#",
    "###############",
  ],
  [
    "###############",
    "#o.....#.....o#",
    "#.###..#..###.#",
    "#...#.....#...#",
    "###.#.###.#.###",
    "T.....f.......T",
    "###.#.###.#.###",
    "#...#.....#...#",
    "#.###..#..###.#",
    "#o.....#.....o#",
    "###############",
  ],
  [
    "###############",
    "#o...#...#...o#",
    "#.#.#.#.#.#.#.#",
    "#.............#",
    "#.###.###.###.#",
    "T...#..f..#...T",
    "#.###.###.###.#",
    "#.............#",
    "#.#.#.#.#.#.#.#",
    "#o...#...#...o#",
    "###############",
  ],
];

const PLAYER_START = { row: 9, col: 2 };
const GHOST_STARTS = [
  { row: 5, col: 7 },
  { row: 5, col: 6 },
  { row: 5, col: 8 },
  { row: 3, col: 7 },
];

/* 每關逐步增加鬼魂數量、移動速度與追擊玩家的機率。 */
const LEVEL_SETTINGS = [
  { map: 0, ghosts: 1, ghostDelay: 500, chaseChance: 0.25, frightenedTime: 7000 },
  { map: 1, ghosts: 1, ghostDelay: 450, chaseChance: 0.3, frightenedTime: 6800 },
  { map: 2, ghosts: 2, ghostDelay: 420, chaseChance: 0.35, frightenedTime: 6400 },
  { map: 3, ghosts: 2, ghostDelay: 390, chaseChance: 0.4, frightenedTime: 6100 },
  { map: 4, ghosts: 2, ghostDelay: 360, chaseChance: 0.45, frightenedTime: 5800 },
  { map: 1, ghosts: 3, ghostDelay: 335, chaseChance: 0.5, frightenedTime: 5500 },
  { map: 2, ghosts: 3, ghostDelay: 310, chaseChance: 0.55, frightenedTime: 5200 },
  { map: 3, ghosts: 3, ghostDelay: 285, chaseChance: 0.6, frightenedTime: 4900 },
  { map: 4, ghosts: 4, ghostDelay: 260, chaseChance: 0.65, frightenedTime: 4600 },
  { map: 0, ghosts: 4, ghostDelay: 235, chaseChance: 0.7, frightenedTime: 4300 },
];

export const LEVELS = LEVEL_SETTINGS.map((settings, index) => ({
  number: index + 1,
  map: MAPS[settings.map],
  ghostCount: settings.ghosts,
  ghostDelay: settings.ghostDelay,
  chaseChance: settings.chaseChance,
  frightenedTime: settings.frightenedTime,
  playerStart: PLAYER_START,
  ghostStarts: GHOST_STARTS,
}));

/* 載入時先檢查每張地圖，提早發現列數或欄數不一致的錯誤。 */
export function validateLevels() {
  LEVELS.forEach((level) => {
    const columnCount = level.map[0].length;
    const hasWrongWidth = level.map.some((row) => row.length !== columnCount);

    if (hasWrongWidth) {
      throw new Error(`第 ${level.number} 關的地圖欄數不一致。`);
    }
  });
}
