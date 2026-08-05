// =============== Canvas 渲染层 ===============
window.Renderer = (() => {
  let canvas, ctx;
  const LOGICAL_W = 390;
  let logicalH = 844;
  let dpr = 1;

  // 已加载的图片资源
  const imgs = {};
  const FACILITY_POS = [
    // 8 个设施在主场景中的位置（百分比）
    { x: 0.22, y: 0.36 }, { x: 0.62, y: 0.36 },
    { x: 0.22, y: 0.50 }, { x: 0.62, y: 0.50 },
    { x: 0.22, y: 0.62 }, { x: 0.62, y: 0.62 },
    { x: 0.22, y: 0.72 }, { x: 0.62, y: 0.72 },
  ];

  function loadImage(name) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => { imgs[name] = im; resolve(im); };
      im.onerror = reject;
      im.src = `assets/${name}`;
    });
  }

  async function preload() {
    const all = [
      'bg_shop.png', 'facility_1.png','facility_2.png','facility_3.png','facility_4.png',
      'facility_5.png','facility_6.png','facility_7.png','facility_8.png',
      'coin.png','gem.png','bolt.png','mascot.png'
    ];
    await Promise.all(all.map(loadImage));
  }

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    logicalH = rect.height / rect.width * LOGICAL_W;
  }

  // 逻辑坐标 → 像素坐标
  function lx(p) { return p * canvas.width; }
  function ly(p) { return p * canvas.height; }

  function draw(state) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 背景图（cover 拉伸）
    const bg = imgs['bg_shop.png'];
    if (bg && bg.complete && bg.naturalWidth > 0) {
      const scale = Math.max(canvas.width / bg.width, canvas.height / bg.height);
      const w = bg.width * scale, h = bg.height * scale;
      const x = (canvas.width - w) / 2, y = (canvas.height - h) / 2;
      ctx.drawImage(bg, x, y, w, h);
    }

    // 2. 半透明暗化覆盖（让设施更显眼）
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. 设施 sprite
    state.facilities.forEach((lv, i) => {
      const f = FACILITIES[i];
      const im = imgs[f.img];
      if (!im) return;
      const pos = FACILITY_POS[i];
      const cx = lx(pos.x), cy = ly(pos.y);
      const size = canvas.width * 0.18;
      // 已解锁显示精灵，未解锁显示锁定
      if (lv > 0) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        // 等级 1 显示一个精灵，2-3 显示两个叠加（轻微旋转），4+ 显示三个
        const stack = Math.min(lv, 3);
        for (let s = 0; s < stack; s++) {
          const offsetX = (s - (stack-1)/2) * size * 0.25;
          const offsetY = -s * size * 0.08;
          const rot = (s - (stack-1)/2) * 0.1;
          ctx.save();
          ctx.translate(cx + offsetX, cy + offsetY);
          ctx.rotate(rot);
          ctx.drawImage(im, -size/2, -size/2, size, size);
          ctx.restore();
        }
        ctx.restore();
        // 等级标签
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.arc(cx, cy + size * 0.5, size * 0.13, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${size*0.16}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Lv' + lv, cx, cy + size * 0.5);
      } else {
        // 锁定状态
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.drawImage(im, cx - size/2, cy - size/2, size, size);
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.arc(cx, cy + size * 0.5, size * 0.13, 0, Math.PI*2);
        ctx.fill();
        ctx.fillText('🔒', cx, cy + size * 0.5);
      }
    });

    // 4. 浮动金币动画（HTML 浮动文字层处理）
  }

  // 检测点击命中设施，返回设施索引或 -1
  function hitFacility(px, py, state) {
    // px, py 是相对 canvas 的像素坐标
    const rect = canvas.getBoundingClientRect();
    const lp = { x: px - rect.left, y: py - rect.top };
    // 转成逻辑坐标（相对于 canvas 显示尺寸）
    const ratio = canvas.width / rect.width;
    const lxPx = lp.x * ratio, lyPx = lp.y * ratio;
    for (let i = 0; i < FACILITY_POS.length; i++) {
      const pos = FACILITY_POS[i];
      const cx = lx(pos.x), cy = ly(pos.y);
      const size = canvas.width * 0.18;
      const halfW = size * 0.6, halfH = size * 0.5;
      if (Math.abs(lxPx - cx) < halfW && Math.abs(lyPx - cy) < halfH) return i;
    }
    return -1;
  }

  return { preload, init, draw, hitFacility, resize };
})();