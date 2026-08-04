// =============== 游戏主入口 ===============
window.Game = (() => {
  let state = null;
  let lastTick = Date.now();
  let lastSave = Date.now();
  let comboCount = 0;
  let comboLastTime = 0;
  let clickTotal = 0; // 本会话点击计数

  async function init() {
    state = Save.load() || defaultState();
    if (!state.settings) state.settings = { sound: true, bgm: false };

    await Renderer.preload();
    Renderer.init(document.getElementById('canvas'));

    UI.init({
      onStartNew: (reset) => { startGame(reset); },
      onStartContinue: () => { startGame(false); },
      onClickFacility: onClickFacility,
      onBuyFacility: onBuyFacility,
      onAdClick: onAdClick,
      onAchieveClaim: onAchieveClaim,
      onDailyClaim: onDailyClaim,
      onSettingChange: onSettingChange,
    });
    window.UI_onOfflineClaim(onOfflineClaim);

    // 检查存档
    if (Save.exists()) {
      UI.showStartScreen(true);
    } else {
      UI.showStartScreen(false);
    }

    // canvas 点击/触摸事件
    const canvas = document.getElementById('canvas');
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      onCanvasClick({ clientX: t.clientX, clientY: t.clientY });
    });

    // 页面隐藏时保存
    window.addEventListener('beforeunload', () => Save.save(state));
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') Save.save(state);
    });

    // 设置音频
    Audio.setEnabled({ sound: !!state.settings.sound, bgm: !!state.settings.bgm });

    requestAnimationFrame(loop);
  }

  function startGame(reset) {
    if (reset || !Save.exists()) {
      state = defaultState();
      Save.save(state);
    }
    lastTick = Date.now();
    // 计算离线收益
    const now = Date.now();
    const elapsed = Math.min(8 * 3600, (now - (state.lastSeen || now)) / 1000);
    if (elapsed > 30 && state.gold > 0) {
      const rate = computeRate(state);
      const gain = Math.floor(rate * elapsed * 0.5);
      if (gain > 0) {
        UI.showOffline(gain, elapsed);
      }
    }
    state.lastSeen = now;
    Save.save(state);
    UI.showGameScreen();
    Renderer.resize(); // 重要：屏幕可见后 canvas 才有真实尺寸
    refreshAll();
    Audio.toast();
  }

  function loop() {
    const now = Date.now();
    const dt = Math.min(2, (now - lastTick) / 1000); // 秒，最多 2s/帧
    lastTick = now;

    // 应用离线收益结算（如果用户已确认）
    // 每秒产出金币
    const rate = computeRate(state);
    if (rate > 0 && UI._screenGameShown !== false) {
      state.gold += rate * dt;
      state.totalEarned += rate * dt;
      UI.updateHud(state);
    }

    // 渲染 Canvas
    Renderer.draw(state);

    // 广告按钮倒计时
    UI.updateAdBtn(state);

    // 自动保存（每 5s）
    if (now - lastSave > 5000) {
      Save.save(state);
      lastSave = now;
    }

    requestAnimationFrame(loop);
  }

  function computeRate(s) {
    let r = 0;
    s.facilities.forEach((lv, i) => { r += facilityRate(FACILITIES[i], lv); });
    if (s.adBoostUntil > Date.now()) r *= 2;
    return r;
  }

  function refreshAll() {
    UI.updateHud(state);
    UI.renderFacilityList(state);
    UI.updateAdBtn(state);
  }

  // ============ 交互：Canvas 点击 ============
  function onCanvasClick(e) {
    if (!state) return;
    const idx = Renderer.hitFacility(e.clientX, e.clientY, state);
    if (idx >= 0) {
      onClickFacility(idx);
    } else {
      doTapCounter(e.clientX, e.clientY);
    }
  }

  function doTapCounter(x, y) {
    const now = Date.now();
    // combo
    if (now - comboLastTime < 600) comboCount++;
    else comboCount = 1;
    comboLastTime = now;
    clickTotal++;

    const per = 1 + state.clickLevel;
    state.gold += per;
    state.totalEarned += per;
    state.totalClicks++;

    Audio.click();
    UI.floatText(x, y, '+' + per);
    UI.updateHud(state);

    if (comboCount >= 3) UI.showCombo(comboCount);

    checkAchievements();
    UI.renderFacilityList(state); // 升级后可能影响价格
  }

  // ============ 交互：设施 ============
  function onClickFacility(idx) {
    if (state.facilities[idx] === 0) {
      // 未解锁 → 也显示详情
    }
    UI.showFacilityDetail(state, idx);
  }

  function onBuyFacility(idx) {
    const f = FACILITIES[idx];
    const lv = state.facilities[idx];
    const cost = facilityPrice(f, lv);
    if (state.gold < cost) { Audio.error(); UI.toast('金币不足'); return; }
    state.gold -= cost;
    state.facilities[idx] = lv + 1;
    if (lv + 1 === 1) Audio.buy(); else Audio.upgrade();
    UI.updateHud(state);
    UI.renderFacilityList(state);
    // 刷新详情弹窗
    UI.showFacilityDetail(state, idx);
    checkAchievements();
    Save.save(state);
  }

  // ============ 广告双倍 ============
  function onAdClick() {
    if (state.adBoostUntil > Date.now()) { UI.toast('加成进行中'); return; }
    if (state.adCooldown && state.adCooldown > Date.now()) {
      UI.toast('冷却中 ' + Math.ceil((state.adCooldown - Date.now())/1000) + 's');
      return;
    }
    // 模拟广告：直接生效（实际接入时此处调用广告 SDK）
    state.adBoostUntil = Date.now() + 30000;
    state.adCooldown = Date.now() + 90000;
    Audio.upgrade();
    UI.toast('30秒内双倍产出！');
  }

  // ============ 签到 ============
  function onDailyClaim() {
    const today = new Date(); today.setHours(0,0,0,0);
    const lastDay = state.dailyLastClaim ? new Date(state.dailyLastClaim) : null;
    if (lastDay) lastDay.setHours(0,0,0,0);
    if (lastDay && lastDay.getTime() === today.getTime()) {
      UI.toast('今日已签到'); return;
    }
    // 判断 streak
    let streak = state.dailyStreak;
    if (lastDay) {
      const diff = (today - lastDay) / 86400000;
      if (diff > 1) streak = 0;
    } else {
      streak = 0;
    }
    streak++;
    if (streak > 7) streak = 1;
    const reward = DAILY_REWARDS[streak - 1];
    state.gems += reward.gems;
    state.dailyStreak = streak;
    state.dailyLastClaim = today.getTime();
    Audio.achieve();
    UI.toast('签到成功！获得 ' + reward.gems + ' 💎');
    UI.showDaily(); // 刷新
    UI.updateHud(state);
    checkAchievements();
    Save.save(state);
  }

  // ============ 成就 ============
  function onAchieveClaim(id) {
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    if (state.achievements[id]) return;
    if (!a.check(state)) { UI.toast('尚未达成'); return; }
    state.gems += a.reward;
    state.achievements[id] = true;
    Audio.achieve();
    UI.toast(`成就「${a.name}」+${a.reward}💎`);
    UI.showAchievements();
    UI.updateHud(state);
    Save.save(state);
  }

  function checkAchievements() {
    // 仅用于通知（toast）新达成
    ACHIEVEMENTS.forEach(a => {
      if (!state.achievements[a.id] && a.check(state)) {
        // 不弹 toast（避免频繁），用户打开成就页时会看到
      }
    });
  }

  // ============ 离线收益 ============
  function onOfflineClaim(gain, double) {
    const finalGain = double ? gain * 2 : gain;
    state.gold += finalGain;
    state.totalEarned += finalGain;
    state.totalOffline += finalGain;
    if (double) Audio.upgrade();
    else Audio.offline();
    UI.toast(`离线收益 +${formatNum(finalGain)}`);
    UI.updateHud(state);
    Save.save(state);
  }

  // ============ 设置 ============
  function onSettingChange(opts) {
    state.settings = { ...state.settings, ...opts };
    Audio.setEnabled({ sound: !!state.settings.sound, bgm: !!state.settings.bgm });
    Save.save(state);
  }

  function replaceState(s) { state = s; }

  return { init, state: () => state, replaceState };
})();

// DOMContentLoaded 启动
window.addEventListener('DOMContentLoaded', () => Game.init());