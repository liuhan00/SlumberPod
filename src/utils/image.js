// 图片工具函数 - 处理图片加载失败和占位图

// 默认占位图（使用 base64 编码的简单占位图）
// 这是一个 1x1 的透明像素，实际使用时会被替换为有意义的占位图
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mHPC90ZXh0Pjwvc3ZnPg=='

// 头像占位图
const AVATAR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2U1ZTVlNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+55So5oi3PC90ZXh0Pjwvc3ZnPg=='

// 封面占位图
const COVER_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Zyo5pyJ6ZKxPC90ZXh0Pjwvc3ZnPg=='

/**
 * 获取默认占位图
 * @param {string} type - 占位图类型: 'avatar' | 'cover' | 'default'
 * @returns {string} 占位图 URL
 */
export function getPlaceholder(type = 'default') {
  switch (type) {
    case 'avatar':
      return AVATAR_PLACEHOLDER
    case 'cover':
      return COVER_PLACEHOLDER
    default:
      return DEFAULT_PLACEHOLDER
  }
}

/**
 * 处理图片 URL，如果为空或无效则返回占位图
 * @param {string} url - 图片 URL
 * @param {string} type - 占位图类型
 * @returns {string} 处理后的图片 URL
 */
export function safeImageUrl(url, type = 'default') {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getPlaceholder(type)
  }
  
  // 如果是 picsum.photos 的 URL，在小程序环境中可能无法访问
  // 可以考虑直接返回占位图，或者让调用方处理错误
  if (url.includes('picsum.photos')) {
    // 在开发环境可以尝试加载，生产环境建议使用占位图
    // 这里先返回原 URL，让 @error 事件处理
    return url
  }
  
  return url
}

/**
 * 创建图片错误处理函数
 * @param {string} type - 占位图类型
 * @returns {Function} 错误处理函数
 */
export function createImageErrorHandler(type = 'default') {
  return function(e) {
    // 在微信小程序中，可以通过修改 src 来显示占位图
    if (e && e.target) {
      const placeholder = getPlaceholder(type)
      if (e.target.src !== placeholder) {
        e.target.src = placeholder
      }
    }
  }
}


























