// =============== DOM UI 控制 ===============
window.UI = (() => {
  const $ = (id) => document.getElementById(id);
  let onClickFacility = null;   // 点击设施回调（传入 idx）
  let onBuyFacility = null;     // 购买回调
  let onAdClick = null;         // 广告按钮回调
  let onAchieveClaim = null;    // 成就领取回调
  let onDailyClaim = null;      // 签到领取回调
  let onSettingChange = null;   // 设置变更回调
  let onStartNew = null;        // 新游戏回调
  let onStartContinue = null;   // 继续游戏回调

  function init(handlers) {
    onClickFacility = handlers.onClickFacility;
    onBuyFacility = handlers.onBuyFacility;
    onAdClick = handlers.onAdClick;
    onAchieveClaim = handlers.onAchieveClaim;
    onDailyClaim = handlers.onDailyClaim;
    onSettingChange = handlers.onSettingChange;
    onStartNew = handlers.onStartNew;
    onStartContinue = handlers.onStartContinue;

    // 开始页
    $('btn-start').addEventListener('click', () => onStartNew && onStartNew(false));
    $('btn-start-continue').addEventListener('click', () => onStartContinue && onStartContinue());

    // 设施卡片点击 → 打开升级弹窗（传入 idx）
    $('facility-list').addEventListener('click', (e) => {
      const card = e.target.closest('.facility-card');
      if (card) {
        const idx = parseInt(card.dataset.idx, 10);
        onClickFacility && onClickFacility(idx);
      }
    });

    // 设施弹窗按钮
    $('facility-buy').addEventListener('click', () => {
      const idx = parseInt($('facility-buy').dataset.idx, 10);
      onBuyFacility && onBuyFacility(idx);
    });
    $('facility-close').addEventListener('click', () => hide('modal-facility'));

    // 顶部按钮
    $('btn-achieve').addEventListener('click', () => showAchievements());
    $('btn-daily').addEventListener('click', () => showDaily());
    $('btn-settings').addEventListener('click', () => showSettings());

    // 弹窗关闭（所有 modal-close 按钮）
    document.querySelectorAll('.modal-close').forEach(b => {
      b.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) modal.classList.add('hidden');
      });
    });
    // 点击遮罩关闭
    document.querySelectorAll('.modal').forEach(m => {
      m.addEventListener('click', (e) => {
        if (e.target === m) m.classList.add('hidden');
      });
    });

    // 广告按钮
    $('btn-ad').addEventListener('click', () => onAdClick && onAdClick());

    // 签到
    $('daily-claim').addEventListener('click', () => onDailyClaim && onDailyClaim());

    // 设置
    $('set-sound').addEventListener('change', (e) => onSettingChange && onSettingChange({ sound: e.target.checked }));
    $('set-bgm').addEventListener('change', (e) => onSettingChange && onSettingChange({ bgm: e.target.checked }));
    $('set-export').addEventListener('click', () => exportSave());
    $('set-import').addEventListener('click', () => importSave());
    $('set-reset').addEventListener('click', () => {
      if (confirm('确定要清空所有进度吗？此操作不可恢复！')) {
        Save.reset();
        location.reload();
      }
    });

    // 离线收益弹窗
    $('offline-claim').addEventListener('click', () => {
      const gain = parseInt($('offline-claim').dataset.gain, 10);
      onOfflineClaim && onOfflineClaim(gain, false);
      hide('modal-offline');
    });
    $('offline-double').addEventListener('click', () => {
      const gain = parseInt($('offline-claim').dataset.gain, 10);
      onOfflineClaim && onOfflineClaim(gain, true);
      hide('modal-offline');
    });

    // 暴露给 main 用的离线回调
    window.UI_onOfflineClaim = (cb) => { onOfflineClaim = cb; };
  }

  function show(id) { $(id).classList.remove('hidden'); }
  function hide(id) { $(id).classList.add('hidden'); }

  // 屏幕切换
  function showStartScreen(hasSave) {
    show('screen-start');
    hide('screen-game');
    $('btn-start-continue').classList.toggle('hidden', !hasSave);
  }
  function showGameScreen() {
    hide('screen-start');
    show('screen-game');
  }

  // 顶部 HUD
  function updateHud(state) {
    $('hud-gold').textContent = formatNum(state.gold);
    $('hud-gems').textContent = formatNum(state.gems);
    $('hud-rate').textContent = formatNum(computeRate(state));
  }

  // 计算总每秒产出
  function computeRate(state) {
    let r = 0;
    state.facilities.forEach((lv, i) => r += facilityRate(FACILITIES[i], lv));
    if (state.adBoostUntil > Date.now()) r *= 2;
    return r;
  }

  // 设施卡片列表（底部抽屉）
  function renderFacilityList(state) {
    const list = $('facility-list');
    list.innerHTML = '';
    state.facilities.forEach((lv, i) => {
      const f = FACILITIES[i];
      const cost = facilityPrice(f, lv);
      const owned = lv > 0;
      const affordable = state.gold >= cost;
      const card = document.createElement('div');
      card.className = 'facility-card' + (owned ? '' : ' locked') + (affordable ? ' affordable' : '');
      card.dataset.idx = i;
      const rate = facilityRate(f, lv);
      const nextRate = facilityRate(f, lv + 1);
      card.innerHTML = `
        <img class="facility-icon" src="assets/${f.img}" alt="${f.name}" />
        <div class="facility-name">${f.name}</div>
        <div class="facility-level">Lv${lv} · ${formatNum(rate)}/s</div>
        <div class="facility-cost">
          <img src="assets/coin.png" />${formatNum(cost)}
        </div>
      `;
      list.appendChild(card);
    });
  }

  // 设施详情弹窗
  function showFacilityDetail(state, idx) {
    const f = FACILITIES[idx];
    const lv = state.facilities[idx];
    const cost = facilityPrice(f, lv);
    const rate = facilityRate(f, lv);
    const nextRate = facilityRate(f, lv + 1);
    const affordable = state.gold >= cost;

    $('facility-detail-img').src = `assets/${f.img}`;
    $('facility-detail-name').textContent = f.name + (lv > 0 ? ' Lv' + lv : ' (未解锁)');
    $('facility-detail-desc').textContent = f.desc;
    $('facility-detail-level').textContent = 'Lv ' + lv;
    $('facility-detail-rate').textContent = formatNum(rate) + '/s';
    $('facility-detail-bought').textContent = lv;

    const buyBtn = $('facility-buy');
    buyBtn.dataset.idx = idx;
    $('facility-buy-text').textContent = lv === 0 ? '解锁 (+' + formatNum(f.baseRate) + '/s)' : `升级 → Lv${lv+1} (+${formatNum(nextRate - rate)}/s)`;
    $('facility-cost').innerHTML = `价格: <img src="assets/coin.png"/>${formatNum(cost)}`;
    buyBtn.disabled = !affordable;
    buyBtn.style.opacity = affordable ? '1' : '0.5';
    show('modal-facility');
  }

  // 成就弹窗
  function showAchievements() {
    const state = Game.state();
    const list = $('achievement-list');
    list.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
      const reached = a.check(state);
      const claimed = !!state.achievements[a.id];
      const div = document.createElement('div');
      div.className = 'achievement-item' + (claimed ? ' claimed' : (reached ? ' unclaimed' : ''));
      div.innerHTML = `
        <div class="ach-ico">${a.ico}</div>
        <div class="ach-info">
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
        </div>
        <div class="ach-reward">
          <img src="assets/gem.png" />${a.reward}
          ${reached && !claimed ? '<button class="ach-claim-btn">领取</button>' : ''}
        </div>
      `;
      if (reached && !claimed) {
        const btn = div.querySelector('.ach-claim-btn');
        if (btn) btn.addEventListener('click', () => onAchieveClaim && onAchieveClaim(a.id));
      }
      list.appendChild(div);
    });
    show('modal-achievement');
  }

  // 签到弹窗
  function showDaily() {
    const state = Game.state();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDay = state.dailyLastClaim ? new Date(state.dailyLastClaim) : null;
    if (lastDay) lastDay.setHours(0, 0, 0, 0);
    const claimedToday = lastDay && lastDay.getTime() === today.getTime();
    const canClaim = !claimedToday;

    // 计算 streak：若上次签到是昨天则继续，否则断
    let streak = state.dailyStreak;
    if (lastDay) {
      const diff = (today - lastDay) / 86400000;
      if (diff > 1) streak = 0;
    } else {
      streak = 0;
    }

    const grid = $('daily-grid');
    grid.innerHTML = '';
    DAILY_REWARDS.forEach((r, i) => {
      const day = i + 1;
      const div = document.createElement('div');
      div.className = 'daily-day';
      if (i < streak) div.classList.add('claimed');
      if (day === streak + 1 && canClaim) div.classList.add('today');
      div.innerHTML = `
        <div class="day-num">第${day}天</div>
        <div class="day-reward">
          <img src="assets/gem.png" />${r.gems}
        </div>
      `;
      grid.appendChild(div);
    });

    const claimBtn = $('daily-claim');
    claimBtn.disabled = !canClaim;
    claimBtn.style.opacity = canClaim ? '1' : '0.5';
    claimBtn.textContent = canClaim ? '领取今日奖励' : '今日已签到';
    show('modal-daily');
  }

  // 设置弹窗
  function showSettings() {
    const s = Game.state();
    $('set-sound').checked = !!s.settings?.sound;
    $('set-bgm').checked = !!s.settings?.bgm;
    show('modal-settings');
  }

  // 离线收益弹窗
  function showOffline(gain, sec) {
    $('offline-time').textContent = formatTime(sec);
    $('offline-gain').textContent = formatNum(gain);
    $('offline-claim').dataset.gain = gain;
    $('offline-double').dataset.gain = gain;
    $('offline-double').style.display = state_adcooldown_left() > 0 ? 'none' : 'inline-block';
    show('modal-offline');
  }

  // 广告按钮状态
  function updateAdBtn(state) {
    const btn = $('btn-ad');
    const left = state.adBoostUntil - Date.now();
    const _gs = (typeof Game !== 'undefined') ? Game.state() : state;
    const cdLeft = (_gs.adCooldown || 0) - Date.now();
    if (left > 0) {
      btn.classList.add('active');
      btn.classList.remove('cooldown');
      btn.querySelector('span').textContent = Math.ceil(left / 1000) + 's';
    } else if (cdLeft > 0) {
      btn.classList.remove('active');
      btn.classList.add('cooldown');
      btn.querySelector('span').textContent = Math.ceil(cdLeft / 1000) + 's';
    } else {
      btn.classList.remove('active', 'cooldown');
      btn.querySelector('span').textContent = '2x';
    }
  }

  function state_adcooldown_left() {
    const s = Game.state();
    if (!s.adCooldown) return 0;
    return Math.max(0, s.adCooldown - Date.now());
  }

  // 浮动金币文字
  function floatText(x, y, text) {
    const layer = $('float-layer');
    const el = document.createElement('div');
    el.className = 'float-coin';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  // Combo 显示
  function showCombo(combo) {
    const el = $('combo-display');
    if (combo > 1) {
      el.textContent = `Combo x${combo}!`;
      el.classList.add('show');
      clearTimeout(showCombo._t);
      showCombo._t = setTimeout(() => el.classList.remove('show'), 800);
    }
  }

  // Toast
  function toast(msg, dur = 1500) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), dur);
  }

  // 导出/导入
  function exportSave() {
    const data = Save.exportStr(Game.state);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bubble_tea_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('存档已导出');
  }
  function importSave() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const obj = Save.importStr(reader.result);
        if (obj) {
          if (confirm('确定要替换当前存档吗？')) {
            Game.replaceState(obj);
            Save.save(obj);
            location.reload();
          }
        } else toast('存档格式错误');
      };
      reader.readAsText(f);
    };
    input.click();
  }

  return {
    init, showStartScreen, showGameScreen,
    updateHud, renderFacilityList, showFacilityDetail,
    showAchievements, showDaily, showSettings, showOffline,
    updateAdBtn, floatText, showCombo, toast, hide, show
  };
})();