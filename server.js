const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const http = require('http');
const Database = require('./db');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'game-center-secret-key';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 数据库实例
const db = new Database();

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

// 检查管理员权限
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
};

// ============ 用户认证API ============

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    // 检查用户是否已存在
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ success: false, message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const userId = await db.createUser({
      username,
      password: hashedPassword,
      nickname: nickname || username,
      role: 'user'
    });

    // 生成JWT
    const token = jwt.sign(
      { id: userId, username, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        id: userId,
        username,
        nickname: nickname || username,
        role: 'user',
        token
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    // 查找用户
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 更新最后登录时间
    await db.updateLastLogin(user.id);

    // 生成JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        level: user.level,
        exp: user.exp,
        token
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        level: user.level,
        exp: user.exp,
        avatar: user.avatar,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新用户信息
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    await db.updateUserProfile(req.user.id, { nickname, avatar });
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============ 游戏分数API ============

// 提交游戏分数
app.post('/api/games/:gameId/score', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { score } = req.body;
    const userId = req.user.id;

    if (typeof score !== 'number') {
      return res.status(400).json({ success: false, message: '分数必须是数字' });
    }

    // 保存分数
    await db.saveGameScore(userId, gameId, score);

    // 增加用户经验值
    const expGain = Math.floor(score / 100) + 1;
    await db.addUserExp(userId, expGain);

    // 获取用户排名
    const rank = await db.getUserGameRank(userId, gameId);

    // 广播排行榜更新
    broadcastLeaderboardUpdate(gameId);

    res.json({
      success: true,
      data: {
        score,
        rank,
        expGain
      }
    });
  } catch (error) {
    console.error('保存分数失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取游戏排行榜
app.get('/api/games/:gameId/leaderboard', async (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await db.getGameLeaderboard(gameId, limit);

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取我的游戏排名
app.get('/api/games/:gameId/me', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    const myScore = await db.getUserGameScore(userId, gameId);
    const rank = await db.getUserGameRank(userId, gameId);

    res.json({
      success: true,
      data: {
        score: myScore?.score || 0,
        rank: rank || 0
      }
    });
  } catch (error) {
    console.error('获取我的排名失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取游戏统计
app.get('/api/games/:gameId/stats', async (req, res) => {
  try {
    const { gameId } = req.params;
    const stats = await db.getGameStats(gameId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取游戏统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============ 通知API ============

// 获取用户通知
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await db.getUserNotifications(req.user.id);
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('获取通知失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 标记通知为已读
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await db.markNotificationRead(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('标记通知失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除通知
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await db.deleteNotification(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============ WebSocket ============

const clients = new Map();

wss.on('connection', (ws, req) => {
  console.log('WebSocket连接已建立');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'auth' && data.token) {
        // 验证token
        jwt.verify(data.token, JWT_SECRET, (err, user) => {
          if (!err) {
            clients.set(ws, user.id);
            ws.send(JSON.stringify({ type: 'auth', success: true }));
          }
        });
      }
    } catch (e) {
      console.error('WebSocket消息解析失败:', e);
    }
  });
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// 广播排行榜更新
function broadcastLeaderboardUpdate(gameId) {
  const message = JSON.stringify({
    type: 'leaderboard_update',
    gameId
  });
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// ============ 启动服务器 ============

server.listen(PORT, () => {
  console.log(`🎮 游戏中心服务器运行在 http://localhost:${PORT}`);
});
