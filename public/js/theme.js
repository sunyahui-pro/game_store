// 主题管理
(function() {
  const THEME_KEY = 'game-center-theme';
  const COLOR_KEY = 'game-center-color';
  
  const colors = ['purple', 'blue', 'green', 'red', 'orange'];
  let currentColorIndex = 0;
  
  // 初始化主题
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const savedColor = localStorage.getItem(COLOR_KEY);
    
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    if (savedColor) {
      document.documentElement.setAttribute('data-color', savedColor);
      currentColorIndex = colors.indexOf(savedColor);
    }
    
    // 绑定主题切换按钮
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleColor);
    }
  }
  
  // 切换配色
  function toggleColor() {
    currentColorIndex = (currentColorIndex + 1) % colors.length;
    const newColor = colors[currentColorIndex];
    
    document.documentElement.setAttribute('data-color', newColor);
    localStorage.setItem(COLOR_KEY, newColor);
    
    showNotification(`已切换到${getColorName(newColor)}主题`, 'info');
  }
  
  // 获取颜色名称
  function getColorName(color) {
    const names = {
      purple: '紫色',
      blue: '蓝色',
      green: '绿色',
      red: '红色',
      orange: '橙色'
    };
    return names[color] || color;
  }
  
  // 切换深色/浅色模式
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  }
  
  // 显示通知
  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // 暴露到全局
  window.initTheme = initTheme;
  window.toggleTheme = toggleTheme;
  window.toggleColor = toggleColor;
  window.showNotification = showNotification;
  
  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
