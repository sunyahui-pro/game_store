// 用户认证管理
let currentUser = null;

// 同步当前用户（从localStorage）
function syncCurrentUser() {
  const userJson = localStorage.getItem('game-center-user');
  const token = localStorage.getItem('game-center-token');
  
  if (userJson && token) {
    try {
      currentUser = JSON.parse(userJson);
      return true;
    } catch (e) {
      console.error('解析用户信息失败:', e);
      logout();
      return false;
    }
  }
  
  currentUser = null;
  return false;
}

// 获取当前用户
function getCurrentUser() {
  return currentUser;
}

// 检查是否登录
function isLoggedIn() {
  return !!currentUser;
}

// 检查是否是管理员
function isAdmin(user) {
  return user?.role === 'admin';
}

// 登录
async function login(username, password) {
  try {
    const response = await authAPI.login(username, password);
    
    if (response.success) {
      currentUser = response.data;
      localStorage.setItem('game-center-user', JSON.stringify(currentUser));
      localStorage.setItem('game-center-token', currentUser.token);
      
      showNotification('登录成功！', 'success');
      return true;
    }
  } catch (error) {
    showNotification(error.message || '登录失败', 'error');
    return false;
  }
}

// 注册
async function register(username, password, nickname) {
  try {
    const response = await authAPI.register(username, password, nickname);
    
    if (response.success) {
      currentUser = response.data;
      localStorage.setItem('game-center-user', JSON.stringify(currentUser));
      localStorage.setItem('game-center-token', currentUser.token);
      
      showNotification('注册成功！', 'success');
      return true;
    }
  } catch (error) {
    showNotification(error.message || '注册失败', 'error');
    return false;
  }
}

// 登出
function logout() {
  currentUser = null;
  localStorage.removeItem('game-center-user');
  localStorage.removeItem('game-center-token');
  showNotification('已退出登录', 'info');
  
  // 如果在需要登录的页面，重定向到首页
  const protectedPages = ['/games.html', '/profile.html'];
  if (protectedPages.some(page => location.pathname.includes(page))) {
    location.href = '/';
  } else {
    updateNav();
  }
}

// 更新导航栏
function updateNav() {
  const navDesktop = document.getElementById('navLinksDesktop');
  const navMobile = document.getElementById('navLinksMobile');
  
  if (!navDesktop && !navMobile) return;
  
  let html = '';
  
  if (currentUser) {
    // 已登录
    const adminLink = isAdmin(currentUser) ? 
      '<a href="/admin.html" class="btn btn-secondary">🛡️ 管理</a>' : '';
    
    html = `
      ${adminLink}
      <a href="/profile.html" class="btn btn-secondary">👤 ${escapeHtml(currentUser.nickname || currentUser.username)}</a>
      <a href="/games.html" class="btn btn-secondary">🎮 游戏</a>
      <button onclick="logout()" class="btn btn-secondary">退出</button>
    `;
  } else {
    // 未登录
    html = `
      <a href="/auth.html" class="btn btn-secondary">登录 / 注册</a>
    `;
  }
  
  if (navDesktop) navDesktop.innerHTML = html;
  if (navMobile) navMobile.innerHTML = html;
}

// HTML转义
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 暴露到全局
window.currentUser = currentUser;
window.syncCurrentUser = syncCurrentUser;
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.isAdmin = isAdmin;
window.login = login;
window.register = register;
window.logout = logout;
window.updateNav = updateNav;
window.escapeHtml = escapeHtml;
