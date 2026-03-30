// UI交互
(function() {
  // 初始化移动端菜单
  window.initMobileMenu = function() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
      });
      
      // 点击外部关闭菜单
      document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
          mobileMenu.classList.remove('active');
        }
      });
    }
  }
  
  // 数字动画
  function animateNumber(elementId, targetValue, duration = 800) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (targetValue === 0 || targetValue === '0') {
      el.textContent = '0';
      return;
    }
    
    const startTime = performance.now();
    const startValue = 0;
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (targetValue - startValue) * eased);
      
      el.textContent = currentValue.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }
  
  // 显示确认对话框
  function showConfirm(title, message, onConfirm, onCancel) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    
    if (!modal) return;
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    modal.classList.add('active');
    
    // 清除旧的事件监听
    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newOkBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      if (onConfirm) onConfirm();
    });
    
    newCancelBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      if (onCancel) onCancel();
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        if (onCancel) onCancel();
      }
    });
  }
  
  // 处理模态框背景点击
  window._handleModalBackdrop = function(event) {
    if (event.target === event.currentTarget) {
      event.currentTarget.classList.remove('active');
    }
  };
  
  // 初始化
  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
  });
  
  // 暴露到全局
  window.animateNumber = animateNumber;
  window.showConfirm = showConfirm;
})();
