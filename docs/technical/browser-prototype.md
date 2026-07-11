# 浏览器原型技术说明

状态：生效中。使用 Canvas 与原生 ES Modules。`src/combat.js` 保存可测试规则，`src/game.js` 负责输入、状态推进与渲染。

Node.js 20+ 执行 `npm start`，访问 `http://localhost:8080`。验证使用 `npm test` 和 `npm run check`。当前没有地图碰撞、存档、音频、手柄、日志持久化或遥测；出现复杂关卡工具链、动画状态机或多平台发布需求时迁移专业引擎。
