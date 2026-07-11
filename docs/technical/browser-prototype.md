# 浏览器原型技术说明

状态：生效中。使用 Canvas 与原生 ES Modules。`src/combat.js` 保存可测试规则，`src/game.js` 负责输入、状态推进与渲染。

Node.js 20+ 执行 `npm start`，访问 `http://localhost:8080`。验证使用 `npm test` 和 `npm run check`。当前没有地图碰撞、存档、音频、手柄、日志持久化或遥测；出现复杂关卡工具链、动画状态机或多平台发布需求时迁移专业引擎。

人工体验统一通过 GitHub Pages 进行；本地服务仅供 Agent 必要的工程诊断，不作为用户验收入口。`main` 分支推送通过 GitHub Actions 自动执行测试并部署 Pages。

GitHub Pages 默认可能缓存静态文件约 10 分钟。发布修改过的 JS/CSS 时必须同步递增 `index.html` 中的资源版本参数；ES Module 的所有传递依赖也必须使用相同版本参数，不能只更新入口脚本。交付链接附加本次 commit 或版本查询参数，以避免人工体验命中旧缓存。
装备生成、背包容量、穿戴交换与属性汇总集中在 `src/inventory.js`，不依赖 Canvas 表现层，可由 Node 单元测试直接验证。`game.js` 只负责掉落接入、交互和绘制。
