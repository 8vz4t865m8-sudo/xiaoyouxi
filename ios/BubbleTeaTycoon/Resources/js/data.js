// =============== 静态数据配置 ===============

// 设施定义（核心数值）
window.FACILITIES = [
  { id: 1,  name: '奶茶机',   desc: '基础饮品设备，咕噜咕噜煮奶茶', img: 'facility_1.png', basePrice: 15,     baseRate: 0.5 },
  { id: 2,  name: '珍珠锅',   desc: 'Q弹珍珠的灵魂来源',           img: 'facility_2.png', basePrice: 100,    baseRate: 2 },
  { id: 3,  name: '水果台',   desc: '新鲜水果现切现卖',             img: 'facility_3.png', basePrice: 600,    baseRate: 8 },
  { id: 4,  name: '甜品柜',   desc: '蛋糕马卡龙配奶茶，绝了',       img: 'facility_4.png', basePrice: 3500,   baseRate: 35 },
  { id: 5,  name: '制冰机',   desc: '冰块产能拉满，夏日救星',       img: 'facility_5.png', basePrice: 18000,  baseRate: 150 },
  { id: 6,  name: '霓虹招牌', desc: '客流滚滚来，拍照打卡点',       img: 'facility_6.png', basePrice: 100000, baseRate: 700 },
  { id: 7,  name: '外卖站',   desc: '外卖订单不断线',               img: 'facility_7.png', basePrice: 600000, baseRate: 3500 },
  { id: 8,  name: '旗舰分店', desc: '连锁扩张，奶茶帝国',           img: 'facility_8.png', basePrice: 4000000,baseRate: 18000 },
];

// 升级价格公式：price = base * 1.15^level
window.facilityPrice = (f, level) => Math.ceil(f.basePrice * Math.pow(1.15, level));

// 当前设施产出
window.facilityRate = (f, level) => f.baseRate * level;

// 成就
window.ACHIEVEMENTS = [
  { id: 'a1', name: '第一桶金',    desc: '累计赚取 1,000 金币',        check: s => s.totalEarned >= 1000,        reward: 5,   ico: '🪙' },
  { id: 'a2', name: '万元户',      desc: '累计赚取 10,000 金币',       check: s => s.totalEarned >= 10000,       reward: 10,  ico: '💰' },
  { id: 'a3', name: '小富翁',      desc: '累计赚取 100,000 金币',      check: s => s.totalEarned >= 100000,      reward: 20,  ico: '💎' },
  { id: 'a4', name: '百万大亨',    desc: '累计赚取 1,000,000 金币',    check: s => s.totalEarned >= 1000000,     reward: 50,  ico: '👑' },
  { id: 'a5', name: '奶茶新手',    desc: '任意设施达到 5 级',          check: s => s.facilities.some(v => v >= 5), reward: 5,  ico: '🍵' },
  { id: 'a6', name: '连锁巨头',    desc: '8 个设施全部解锁',           check: s => s.facilities.length >= 8,     reward: 30,  ico: '🏪' },
  { id: 'a7', name: '点击狂人',    desc: '累计点击 500 次',            check: s => s.totalClicks >= 500,         reward: 10,  ico: '👆' },
  { id: 'a8', name: '离线达人',    desc: '累计离线收益 100,000',       check: s => s.totalOffline >= 100000,    reward: 20,  ico: '💤' },
  { id: 'a9', name: '忠实顾客',    desc: '签到累计 7 天',              check: s => s.dailyStreak >= 7,          reward: 30,  ico: '📅' },
  { id: 'a10',name: '顶级店主',    desc: '所有设施达到 10 级',         check: s => s.facilities.length >= 8 && s.facilities.every(v => v >= 10), reward: 100, ico: '🌟' },
];

// 每日签到奖励（7 天递增）
window.DAILY_REWARDS = [
  { gems: 2 }, { gems: 4 }, { gems: 6 }, { gems: 8 },
  { gems: 10 }, { gems: 12 }, { gems: 20 },
];

// 格式化大数字（0.5 / 1.2K / 3.5M / 1B）
window.formatNum = (n) => {
  if (n < 10 && n % 1 !== 0) return n.toFixed(1);  // 小数 < 10 显示一位
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1e6)  return (n / 1e3).toFixed(1) + 'K';
  if (n < 1e9)  return (n / 1e6).toFixed(2) + 'M';
  if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
  return (n / 1e12).toFixed(2) + 'T';
};

window.formatTime = (sec) => {
  sec = Math.floor(sec);
  if (sec < 60) return sec + '秒';
  if (sec < 3600) return Math.floor(sec / 60) + '分钟';
  if (sec < 86400) return Math.floor(sec / 3600) + '小时' + Math.floor((sec % 3600) / 60) + '分';
  return Math.floor(sec / 86400) + '天' + Math.floor((sec % 86400) / 3600) + '小时';
};

// 默认初始状态
window.defaultState = () => ({
  gold: 0,
  gems: 0,
  clickLevel: 0,           // 点击升级次数
  facilities: [0,0,0,0,0,0,0,0],  // 8 设施等级
  achievements: {},        // {id: true} 已领取
  dailyStreak: 0,          // 连续签到天数
  dailyLastClaim: 0,       // 上次签到时间戳（按天）
  totalClicks: 0,
  totalEarned: 0,
  totalOffline: 0,
  adBoostUntil: 0,         // 广告双倍结束时间戳
  lastSeen: Date.now(),    // 上次保存/访问时间戳（用于离线收益）
  createdAt: Date.now(),
});