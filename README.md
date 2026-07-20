# 🟡 Pac-Man Adventure

Pac-Man Adventure 是一款使用 **原生 HTML、CSS 與 JavaScript（ES6）** 製作的網頁吃豆人遊戲，不需要 npm、框架或外部套件。迷宮與角色使用 DOM、CSS Grid 及 CSS 圖形呈現，可直接透過 Live Server 遊玩。

## 🎮 已完成功能

- 10 個可完成關卡，迷宮配置、鬼魂數量與速度會逐步提升
- 初始 3 條生命，以及即時更新的 Score、Lives、Level HUD
- 方向鍵、WASD、手機畫面方向按鈕
- Pac-Man 嘴巴動畫、移動方向與牆壁碰撞
- 1 至 4 隻合法走迷宮的鬼魂，以及碰撞後重生與短暫無敵時間
- 一般豆子（+10）、水果（+100）、害怕狀態鬼魂（+200）、過關（+1000）
- 大力丸、鬼魂害怕狀態與玩家吃鬼機制
- 左右傳送門（僅玩家使用）
- P 鍵暫停／繼續、Level Clear、Game Over、Victory 畫面
- 第 10 關完成後，由玩家按下 Watch Reward 才載入獎勵影片
- 手機版縮放與觸控方向鍵，避免水平捲軸

## 🕹️ 操作方式

| 動作 | 鍵盤 | 手機 |
| --- | --- | --- |
| 向上 | `ArrowUp` 或 `W` | ▲ |
| 向下 | `ArrowDown` 或 `S` | ▼ |
| 向左 | `ArrowLeft` 或 `A` | ◀ |
| 向右 | `ArrowRight` 或 `D` | ▶ |
| 暫停／繼續 | `P` | 暫停視窗的 Continue Game |

Pac-Man 會沿目前方向持續移動；可以提早按下下一個方向，走到合法路口時便會轉彎。吃完該關所有一般豆子後會獲得 1000 分，按下 Next Level 進入下一關。

## 🚀 如何啟動

1. 使用 VS Code 開啟專案資料夾。
2. 安裝並啟動 Live Server。
3. 對 `index.html` 選擇 **Open with Live Server**。
4. 在開始畫面按下 **Start Game**。

本專案使用 JavaScript ES Module，因此建議透過 Live Server 開啟，不要直接雙擊 HTML 檔案。

## 🧪 測試模式

一般遊玩不會載入測試工具。若要快速檢查後期流程，可用 Live Server 開啟：

```text
game.html?debug=1
```

接著在瀏覽器開發者工具 Console 使用：

```js
pacmanDebug.loseLife();       // 扣一條生命，可連續執行三次測試 Game Over
pacmanDebug.loadLevel(10);    // 直接載入第 10 關
pacmanDebug.completeLevel();  // 模擬吃完一般豆子，顯示 Victory
pacmanDebug.getState();       // 查看目前狀態、分數、生命與剩餘豆子
```

## 📂 專案結構

```text
Pac-Man-Adventure/
├── css/
│   └── style.css          # 首頁、迷宮、角色、狀態視窗與響應式樣式
├── docs/
│   ├── developer-log.md   # 開發紀錄
│   ├── game-design.md     # 遊戲設計文件
│   └── wireframe.md       # 畫面線框稿
├── js/
│   ├── levels.js          # 十關地圖與難度設定
│   └── main.js            # 遊戲狀態、移動、碰撞、計分與畫面流程
├── game.html              # 遊戲頁面
├── index.html             # 開始畫面
└── README.md
```

## 🛠️ 使用技術

- HTML5
- CSS3、CSS Grid、CSS 動畫
- 原生 JavaScript ES6 Modules

## 👨‍💻 Author

Developed by 育嘉
