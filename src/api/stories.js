const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.123:3003'

// 统一的请求函数（基于项目中的 httpFetch 实现）
async function httpFetch(path, opts = {}) {
  const url = BASE + path
  
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject)=> {
    uni.request({
      url,
      method: opts.method || 'GET',
      header: Object.assign({'Content-Type':'application/json'}, opts.headers || {}),
      data: opts.body ? JSON.parse(opts.body) : undefined,
      success: (res) => {
        // uni.request returns { statusCode, data }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: async ()=> res.data })
      },
      fail: (err) => reject(err)
    })
  })
  // #endif

  // #ifndef MP-WEIXIN
  return fetch(url, opts)
  // #endif
}

// 获取故事分类列表
export async function getStoryCategories() {
  try {
    console.log('[stories API] 开始获取故事分类:', `${BASE}/api/stories/categories/list`)
    const response = await httpFetch('/api/stories/categories/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    console.log('[stories API] 分类响应结果:', result)
    
    if (response.ok) {
      return result.data || result
    } else {
      throw new Error(result.message || '获取故事分类失败')
    }
  } catch (error) {
    console.error('[stories API] getStoryCategories error:', error)
    throw error
  }
}

// 获取指定分类的故事列表
export async function getStoriesByCategory(category, page = 1, limit = 20) {
  try {
    console.log('[stories API] 开始获取分类故事列表:', category, page, limit)
    
    let possibleUrls = []
    
    if (category === 'all') {
      // 全部分类 - 尝试获取所有故事的接口
      possibleUrls = [
        `/api/stories/all?page=${page}&limit=${limit}`,
        `/api/stories?page=${page}&limit=${limit}`,
        `/api/stories/list?page=${page}&limit=${limit}`
      ]
    } else {
      // 指定分类 - 尝试多种可能的接口格式
      possibleUrls = [
        `/api/stories/category/${encodeURIComponent(category)}?page=${page}&limit=${limit}`,
        `/api/stories/list/${encodeURIComponent(category)}?page=${page}&limit=${limit}`,
        `/api/stories?category=${encodeURIComponent(category)}&page=${page}&limit=${limit}`,
        `/api/stories/category?name=${encodeURIComponent(category)}&page=${page}&limit=${limit}`
      ]
    }
    
    let lastError = null
    
    for (const url of possibleUrls) {
      console.log('[stories API] 尝试接口:', url)
      try {
        const response = await httpFetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const result = await response.json()
        console.log('[stories API] 接口响应:', url, result)
        
        if (response.ok && (result.data || result)) {
          console.log('[stories API] 成功获取数据，使用接口:', url)
          return result.data || result
        } else {
          console.log('[stories API] 接口无效，尝试下一个:', url, result.message)
          lastError = result.message || '接口无效'
        }
      } catch (error) {
        console.log('[stories API] 接口调用失败，尝试下一个:', url, error.message)
        lastError = error.message
      }
    }
    
    throw new Error(lastError || '获取故事列表失败，所有接口都无效')
    
  } catch (error) {
    console.error('[stories API] getStoriesByCategory error:', error)
    throw error
  }
}

// 获取故事详情
export async function getStoryDetail(storyId) {
  try {
    console.log('[stories API] 开始获取故事详情:', storyId)
    const response = await httpFetch(`/api/stories/${storyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    console.log('[stories API] 故事详情响应结果:', result)
    
    if (response.ok) {
      return result.data || result
    } else {
      throw new Error(result.message || '获取故事详情失败')
    }
  } catch (error) {
    console.error('[stories API] getStoryDetail error:', error)
    throw error
  }
}

