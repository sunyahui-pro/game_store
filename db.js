// JSON 文件数据库 - 数据持久化存储
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, 'data.json');

class Database {
  constructor() {
    this.data = this.loadData();
    this.nextId = this.data.nextId || 1;
    this.createDefaultAdmin();
  }

  // 加载数据
  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('加载数据失败:', e);
    }
    
    // 默认数据结构
    return {
      users: {},
      gameScores: {},
      gameHistory: [],
      notifications: {},
      nextId: 1
    };
  }

  // 保存数据
  saveData() {
    try {
      this.data.nextId = this.nextId;
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  }

  // 创建默认管理员
  async createDefaultAdmin() {
    const existing = await this.getUserByUsername('admin');
    if (!existing) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await this.createUser({
        username: 'admin',
        password: hashedPassword,
        nickname: '管理员',
        role: 'admin'
      });
    }
  }

  // 用户相关方法
  async createUser(user) {
    const id = this.nextId++;
    const newUser = {
      id,
      username: user.username,
      password: user.password,
      nickname: user.nickname || user.username,
      avatar: user.avatar || null,
      role: user.role || 'user',
      level: 1,
      exp: 0,
      created_at: new Date().toISOString(),
      last_login: null
    };
    this.data.users[id] = newUser;
    this.saveData();
    return id;
  }

  async getUserByUsername(username) {
    for (const user of Object.values(this.data.users)) {
      if (user.username === username) {
        return { ...user };
      }
    }
    return null;
  }

  async getUserById(id) {
    const user = this.data.users[id];
    return user ? { ...user } : null;
  }

  async updateLastLogin(id) {
    const user = this.data.users[id];
    if (user) {
      user.last_login = new Date().toISOString();
      this.saveData();
    }
  }

  async updateUserProfile(id, profile) {
    const user = this.data.users[id];
    if (user) {
      if (profile.nickname) user.nickname = profile.nickname;
      if (profile.avatar) user.avatar = profile.avatar;
      this.saveData();
    }
  }

  async addUserExp(userId, exp) {
    const user = this.data.users[userId];
    if (!user) return { leveledUp: false };
    
    user.exp += exp;
    const expNeeded = user.level * 100;
    
    if (user.exp >= expNeeded) {
      user.level++;
      user.exp -= expNeeded;
      this.saveData();
      return { leveledUp: true, newLevel: user.level };
    }
    
    this.saveData();
    return { leveledUp: false };
  }

  // 游戏分数相关方法
  async saveGameScore(userId, gameId, score) {
    const key = `${userId}:${gameId}`;
    
    // 保存历史记录
    this.data.gameHistory.push({
      id: this.data.gameHistory.length + 1,
      user_id: userId,
      game_id: gameId,
      score,
      created_at: new Date().toISOString()
    });
    
    // 更新最高分
    const existing = this.data.gameScores[key];
    if (!existing || score > existing.score) {
      this.data.gameScores[key] = {
        user_id: userId,
        game_id: gameId,
        score,
        created_at: new Date().toISOString()
      };
    }
    
    this.saveData();
  }

  async getGameLeaderboard(gameId, limit = 10) {
    const scores = [];
    for (const data of Object.values(this.data.gameScores)) {
      if (data.game_id === gameId) {
        const user = await this.getUserById(data.user_id);
        if (user) {
          scores.push({
            user_id: data.user_id,
            score: data.score,
            username: user.username,
            nickname: user.nickname,
            level: user.level
          });
        }
      }
    }
    
    // 排序并限制
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit).map((s, i) => ({ ...s, rank: i + 1 }));
  }

  async getUserGameScore(userId, gameId) {
    const key = `${userId}:${gameId}`;
    return this.data.gameScores[key] || null;
  }

  async getUserGameRank(userId, gameId) {
    const leaderboard = await this.getGameLeaderboard(gameId, 1000);
    const rank = leaderboard.findIndex(s => s.user_id === userId);
    return rank >= 0 ? rank + 1 : 0;
  }

  async getGameStats(gameId) {
    let players = 0;
    let games = 0;
    let bestScore = 0;
    
    for (const data of Object.values(this.data.gameScores)) {
      if (data.game_id === gameId) {
        players++;
        if (data.score > bestScore) bestScore = data.score;
      }
    }
    
    for (const h of this.data.gameHistory) {
      if (h.game_id === gameId) games++;
    }
    
    return { players, games, best_score: bestScore };
  }

  // 通知相关方法
  async getUserNotifications(userId) {
    const notifs = [];
    for (const n of Object.values(this.data.notifications)) {
      if (n.user_id === userId) {
        notifs.push({ ...n });
      }
    }
    return notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async markNotificationRead(notificationId, userId) {
    const n = this.data.notifications[notificationId];
    if (n && n.user_id === userId) {
      n.is_read = 1;
      this.saveData();
    }
  }

  async deleteNotification(notificationId, userId) {
    const n = this.data.notifications[notificationId];
    if (n && n.user_id === userId) {
      delete this.data.notifications[notificationId];
      this.saveData();
    }
  }

  async createNotification(userId, type, title, content) {
    const id = Object.keys(this.data.notifications).length + 1;
    this.data.notifications[id] = {
      id,
      user_id: userId,
      type,
      title,
      content,
      is_read: 0,
      created_at: new Date().toISOString()
    };
    this.saveData();
    return id;
  }

  // 获取所有用户
  async getAllUsers() {
    return Object.values(this.data.users).map(u => ({
      id: u.id,
      username: u.username,
      nickname: u.nickname,
      role: u.role,
      level: u.level,
      exp: u.exp,
      created_at: u.created_at,
      last_login: u.last_login
    }));
  }
}

module.exports = Database;
