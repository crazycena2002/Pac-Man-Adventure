# Developer Log

## Day 1：建立專案環境

- 建立 GitHub Repository
- 建立專案資料夾結構
- 將 Repository Clone 到本機
- 設定 VS Code 與 Git
- 建立 `.gitignore`

## Day 2：完成專案文件

- 完成 README
- 完成遊戲需求規劃
- 完成 Wireframe

## Day 3：製作開始畫面

- 建立開始畫面的 HTML 結構
- 使用 CSS 製作遊戲面板
- 使用 CSS 製作 Pac-Man 圖示
- 加入 Pac-Man 嘴巴動畫
- 加入開始遊戲按鈕
- 加入手機版響應式樣式

## Day 4：製作遊戲主畫面靜態版

- 將開始畫面的 Start Game 改成連結，前往 `game.html`
- 新增 `game.html` 作為遊戲主畫面靜態預覽
- 建立 HUD，顯示 Score、Lives、Level
- 使用 HTML 元素與 CSS Grid 製作示範迷宮
- 使用 CSS 製作牆壁、豆子、大力丸、水果、傳送門、Pac-Man 與鬼魂
- 加入遊戲操作提示與回到首頁連結
- 加入桌機版與手機版響應式樣式

## Day 5：完成 JavaScript 可玩版本

- 將靜態迷宮改成由 JavaScript 關卡資料自動產生，完成 10 關設定
- 加入方向鍵、WASD 與手機畫面方向按鈕操作
- 完成玩家移動、轉向動畫、牆壁阻擋、豆子收集與左右傳送門
- 完成 Score、Lives、Level 即時 HUD，以及豆子、水果、吃鬼與過關計分
- 加入 1 至 4 隻鬼魂、合法道路移動、簡單追擊與避免路口反覆轉向
- 完成大力丸、鬼魂害怕狀態、吃鬼得分與鬼魂返回出生位置
- 完成三條生命、碰撞扣血、角色重置、短暫無敵與 Game Over 流程
- 明確管理 start、playing、paused、level-clear、game-over、victory 六種狀態
- 使用單一 requestAnimationFrame 遊戲迴圈，切換狀態或關卡時先清理舊迴圈
- 完成 Level Clear、Next Level、Try Again、Play Again 與 Back to Home
- 完成第 10 關 Victory，並只在按下 Watch Reward 後載入 Rick Roll 獎勵影片
- 更新手機版迷宮縮放與觸控操作，避免產生水平捲軸
