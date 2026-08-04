// =============== 存档（localStorage + 导入导出） ===============
window.Save = (() => {
  const KEY = 'bubbleTeaTycoon_save_v1';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      // 兼容性：补全缺失字段
      return { ...defaultState(), ...obj };
    } catch (e) {
      console.error('存档读取失败', e);
      return null;
    }
  }

  function save(state) {
    try {
      state.lastSeen = Date.now();
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { console.error('存档失败', e); }
  }

  function reset() { localStorage.removeItem(KEY); }

  function exists() { return !!localStorage.getItem(KEY); }

  function exportStr(state) { return JSON.stringify(state); }
  function importStr(str) {
    try { return JSON.parse(str); } catch (e) { return null; }
  }

  return { load, save, reset, exists, exportStr, importStr };
})();