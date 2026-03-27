// 内存数据库 - 简化版本
class Database {
  constructor() {
    this.users = new Map();
    this.gameScores = new Map(); // key: "userId:gameId"
    this.gameHistory = [];
    this.notifications = new Map();
    this.messages = [];
    this.nextId = 1;
    
    // 创建默认管理员
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    this.users.set(1, {
      id: 1,
      username: 'admin',
      password: hashedPassword,
      nickname: '管理员',
      avatar: null,
      role: 'admin',
      level: 1,
      exp: 0,
      created_at: new Date().toISOString(),
      last_login: null
    });
    this.nextId = 2;
  }

  // 用户相关方法
  async createUser(user) {
    const id = this.nextId++;
    const newUser = {
      id,
      username: user.username,
      password: user.password,
      nickname: user.nickname || user.username,
      avatar: null,
      role: user.role || 'user',
      level: 1,
      exp: 0,
      created_at: new Date().toISOString(),
      last_login: null
    };
    this.users.set(id, newUser);
    return id;
  }

  async getUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return { ...user };
      }
    }
    return null;
  }

  async getUserById(id) {
    const user = this.users.get(Number(id));
    return user ? { ...user } : null;
  }

  async updateLastLogin(id) {
    const user = this.users.get(Number(id));
    if (user) {
      user.last_login = new Date().toISOString();
    }
  }

  async updateUserProfile(id, profile) {
    const user = this.users.get(Number(id));
    if (user) {
      if (profile.nickname) user.nickname = profile.nickname;
      if (profile.avatar) user.avatar = profile.avatar;
    }
  }

  async addUserExp(userId, exp) {
    const user = this.users.get(Number(userId));
    if (user) {
      user.exp += exp;
      const expNeeded = user.level * 100;
      if (user.exp >= expNeeded) {
        user.level++;
        user.exp -= expNeeded;
        return { leveledUp: true, newLevel: user.level };
      }
    }
    return { leveledUp: false };
  }

  // 游戏分数相关方法
  async saveGameScore(userId, gameId, score) {
    const key = `${userId}:${gameId}`;
    
    // 保存历史记录
    this.gameHistory.push({
      id: this.gameHistory.length + 1,
      user_id: userId,
      game_id: gameId,
      score,
      created_at: new Date().toISOString()
    });
    
    // 更新最高分
    const existing = this.gameScores.get(key);
    if (!existing || score > existing.score) {
      this.gameScores.set(key, {
        user_id: userId,
        game_id: gameId,
        score,
        created_at: new Date().toISOString()
      });
    }
  }

  async getGameLeaderboard(gameId, limit = 10) {
    const scores = [];
    for (const [key, data] of this.gameScores) {
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
    return this.gameScores.get(key) || null;
  }

  async getUserGameRank(userId, gameId) {
    const leaderboard = await this.getGameLeaderboard(gameId, 1000);
    const rank = leaderboard.findIndex(s => s.user_id === Number(userId));
    return rank >= 0 ? rank + 1 : 0;
  }

  async getGameStats(gameId) {
    let players = 0;
    let games = 0;
    let bestScore = 0;
    
    for (const [key, data] of this.gameScores) {
      if (data.game_id === gameId) {
        players++;
        if (data.score > bestScore) bestScore = data.score;
      }
    }
    
    for (const h of this.gameHistory) {
      if (h.game_id === gameId) games++;
    }
    
    return { players, games, best_score: bestScore };
  }

  // 通知相关方法
  async getUserNotifications(userId) {
    const notifs = [];
    for (const n of this.notifications.values()) {
      if (n.user_id === Number(userId)) {
        notifs.push({ ...n });
      }
    }
    return notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async markNotificationRead(notificationId, userId) {
    const n = this.notifications.get(Number(notificationId));
    if (n && n.user_id === Number(userId)) {
      n.is_read = 1;
    }
  }

  async deleteNotification(notificationId, userId) {
    const n = this.notifications.get(Number(notificationId));
    if (n && n.user_id === Number(userId)) {
      this.notifications.delete(Number(notificationId));
    }
  }

  async createNotification(userId, type, title, content) {
    const id = this.notifications.size + 1;
    this.notifications.set(id, {
      id,
      user_id: Number(userId),
      type,
      title,
      content,
      is_read: 0,
      created_at: new Date().toISOString()
    });
    return id;
  }

  // 获取所有用户
  async getAllUsers() {
    return Array.from(this.users.values()).map(u => ({
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
