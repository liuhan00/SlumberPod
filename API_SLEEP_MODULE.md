# 小屋模块 API 文档

说明
- BASE: 前端通过环境变量 `VITE_API_BASE` 配置（示例 `http://192.168.1.162:3003`）。
- 鉴权: 使用 HTTP Header `Authorization: Bearer <token>`（用户相关接口需鉴权）。
- 返回格式建议: `{ success?: boolean, data?: ..., items?: ..., total?: number, message?: string }`。前端可容错解析 `{ data }` / `{ items }` / 直接数组。
- 支持 `application/json` 与 `application/x-www-form-urlencoded`（部分前端以 form 发送，且字段名可能包含空格）。

优先级说明
- 高优先级（先实现）: 故事列表/详情、晚安邮箱列表/投递、音频列表/详情、播放历史、收藏接口。
- 中优先级: TTS 触发 / play-report、上传、场景 presets。

---

## 目录
1. Mailbox（晚安邮箱）
2. Stories（睡眠故事）
3. Study（学习/专注音）
4. Common（通用：audios, favorites, play-history, upload）

---

## 1. Mailbox（晚安邮箱）
1. GET `/api/mailbox/threads?tab=send|receive|mybox&offset=&limit=`
   - 描述: 获取投递/接收/我的信箱列表
   - Auth: 需要
   - 返回: 列表或分页对象

2. GET `/api/mailbox/:threadId`
   - 描述: 信件详情
   - Auth: 需要
   - 返回: `{ id, title, content, sender, createdAt, status, attachments? }`

3. POST `/api/mailbox`
   - 描述: 投递晚安（创建信件）
   - Auth: 需要
   - Body: `{ title, content, toUserId? , attachments?: [url] }`
   - 返回: 创建结果

4. POST `/api/mailbox/:threadId/receive` 或 POST `/api/mailbox/pick`
   - 描述: 在“接收晚安”面板上领取一封公开的、未被领取的晚安（后端随机分配）
   - Auth: 需要
   - Body: 无（或空对象）
   - 返回:
     - 成功领取 -> `200` + `{ data: { id, content, senderUserId, pickedByUserId, pickedAt } }`
     - 无可领取 -> `204` 或 `200` + `{ data: null, message: '暂无可领取的晚安' }`
   - 要求（后端实现）: 原子操作，必须保证在并发场景下同一封信不会被多人领取（可通过数据库事务/行锁或 UPDATE ... RETURNING 实现）

5. （可选）GET `/api/mailbox/mybox`
   - 描述: 我的信箱快捷接口
   - Auth: 需要

---

## 2. Stories（睡眠故事）
1. GET `/api/stories?category=&page=&limit=`
   - 描述: 故事列表（分类、分页）
   - Auth: 可选
   - 返回: 列表（id, title, excerpt, coverUrl, duration）

2. GET `/api/stories/:id`
   - 描述: 故事详情（用于 `StoryDetail` 页面）
   - Auth: 可选
   - 返回: `{ id, title, content, coverUrl, audioUrl?, duration? }`

3. POST `/api/stories/:id/tts`（可选）
   - 描述: 点击“听”时由后端创建/返回 TTS 音频 URL（若使用后端 TTS）
   - Auth: 可选
   - Body: `{ voice?, speed? }`
   - 返回: `{ audioUrl, duration }`

4. POST `/api/stories/:id/play-report`（可选）
   - 描述: 上报播放行为（统计/历史）
   - Auth: 可选/推荐
   - Body: `{ playDuration, device? }`
   - 返回: 状态

---

## 3. Study（学习 / 专注音）
1. GET `/api/study/audios?category=&limit=&offset=`
   - 描述: 学习场景专用音频列表
   - Auth: 可选
   - 返回: 列表

2. GET `/api/study/audios/:id`
   - 描述: 单条音频详情（audioUrl, duration, description）
   - Auth: 可选

3. POST `/api/study/play-history`
   - 描述: 记录播放时长
   - Auth: 推荐
   - Body: `{ audio_id, play_duration }`

4. POST `/api/study/favorite` 或 使用通用 `/api/favorites`
   - 描述: 收藏学习音频
   - Auth: 需要
   - Body: `{ audio_id }`

---

## 4. Common（通用接口）
1. GET `/api/audios?category_id=&limit=&offset=`
   - 描述: 通用音频列表（小屋、学习、故事均可使用）
   - Auth: 可选

2. GET `/api/audios/:id` 或 `/api/creations/:id`
   - 描述: 音频详情（供播放使用）
   - Auth: 可选

3. GET `/api/favorites?offset=&limit=`
   - 描述: 获取用户收藏
   - Auth: 需要

4. POST `/api/favorites`
   - 描述: 收藏音频
   - Auth: 需要
   - Body: `{ audio_id }`

5. DELETE `/api/favorites/:id`
   - 描述: 取消收藏（id 可能为 audioId 或收藏记录 id）
   - Auth: 需要

6. GET `/api/play-history?page=&limit=`
   - 描述: 获取播放历史
   - Auth: 推荐

7. POST `/api/play-history`
   - 描述: 新增播放记录
   - Auth: 推荐
   - Body: `{ audio_id, play_duration }`

8. POST `/api/upload`
   - 描述: 文件上传（multipart/form-data），返回 `{ url }`（用于附件/封面）
   - Auth: 可选/推荐

9. GET `/api/health`
   - 描述: 健康检查
   - 返回: 简单状态

---

## 实现与对接注意事项（给后端）
- 微信小程序环境必须使用 HTTPS 并在微信后台配置合法域名，前端会在 MP 环境走 `uni.request` 分支。
- 对于可能使用 `application/x-www-form-urlencoded` 的接口（如表单提交或带空格键名的场景），请同时支持 JSON。
- 返回结构尽量统一为 `{ data: ... }` 或 `{ items: ..., total: n }`，但前端已做容错处理。
- 错误码约定：401 -> 重新登录；404 -> 资源不存在（前端在某些列表接口会当空数组处理）；500 -> 内部错误（请避免返回大量堆栈信息）。

---

如需我把每个接口生成 curl 示例和返回样例，请回复 `示例`；要我把该文件放入特定路径或修改格式（例如 OpenAPI），回复说明。
