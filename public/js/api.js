// API 请求封装
const API_BASE = '';

// 获取token
function getToken() {
  return localStorage.getItem('game-center-token');
}

// 通用请求函数
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  // 添加认证token
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // 处理body
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

// GET请求
function get(endpoint) {
  return fetchAPI(endpoint, { method: 'GET' });
}

// POST请求
function post(endpoint, body) {
  return fetchAPI(endpoint, { method: 'POST', body });
}

// PUT请求
function put(endpoint, body) {
  return fetchAPI(endpoint, { method: 'PUT', body });
}

// DELETE请求
function del(endpoint) {
  return fetchAPI(endpoint, { method: 'DELETE' });
}

// 认证相关API
const authAPI = {
  register: (username, password, nickname) => 
    post('/api/auth/register', { username, password, nickname }),
  
  login: (username, password) => 
    post('/api/auth/login', { username, password }),
  
  me: () => get('/api/auth/me'),
  
  updateProfile: (profile) => put('/api/auth/profile', profile)
};

// 游戏相关API
const gameAPI = {
  submitScore: (gameId, score) => 
    post(`/api/games/${gameId}/score`, { score }),
  
  getLeaderboard: (gameId, limit = 10) => 
    get(`/api/games/${gameId}/leaderboard?limit=${limit}`),
  
  getMyRank: (gameId) => 
    get(`/api/games/${gameId}/me`),
  
  getStats: (gameId) => 
    get(`/api/games/${gameId}/stats`)
};

// 通知相关API
const notificationAPI = {
  getAll: () => get('/api/notifications'),
  markRead: (id) => put(`/api/notifications/${id}/read`, {}),
  delete: (id) => del(`/api/notifications/${id}`)
};

// 暴露到全局
window.fetchAPI = fetchAPI;
window.get = get;
window.post = post;
window.put = put;
window.del = del;
window.authAPI = authAPI;
window.gameAPI = gameAPI;
window.notificationAPI = notificationAPI;
