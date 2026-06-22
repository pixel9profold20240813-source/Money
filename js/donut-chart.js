/* =====================================================================
   donut-chart.js — 手繪風甜甜圈圖
   ---------------------------------------------------------------------
   用 SVG path 畫圓弧，刻意加入「手抖擾動」與雙層描邊，
   呼應整體蠟筆手繪風格，而非精緻平滑的現代圖表。

   藍色 = 收入佔比，黃色 = 支出佔比（以收入為總量基準：
   支出佔收入的比例越高，黃色區段就吃掉越多原本的藍色）。
===================================================================== */

const DonutChart = {
  /** 簡單但穩定的偽隨機數產生器（給定 seed 每次結果一致，避免重繪時線條跳動） */
  _rand(seed) {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  },

  /** 把角度(degree)轉成圓上座標 */
  _point(cx, cy, r, deg) {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  },

  /**
   * 畫一段「手繪感」弧線：把整段弧拆成多個小段，
   * 每個小段的半徑加上微小隨機擾動，讓線條看起來像手畫的，而非機器平滑。
   * 回傳 SVG path 的 d 字串。
   */
  _wobblyArcPath(cx, cy, r, startDeg, endDeg, wobble, seedBase) {
    const steps = Math.max(8, Math.round((endDeg - startDeg) / 6));
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const deg = startDeg + (endDeg - startDeg) * (i / steps);
      const n = this._rand(seedBase + i * 0.37);
      const rr = r + (n - 0.5) * wobble;
      const p = this._point(cx, cy, rr, deg);
      d += (i === 0 ? 'M' : 'L') + p.x.toFixed(2) + ',' + p.y.toFixed(2) + ' ';
    }
    return d;
  },

  /**
   * 渲染甜甜圈圖到指定的 <svg> 元素
   * @param {SVGElement} svgEl
   * @param {number} incomePct  收入佔比 0-100（通常固定當作滿圈基準）
   * @param {number} expensePct 支出佔比 0-100（佔收入的比例，吃掉藍色區域）
   */
  render(svgEl, expensePct) {
    const cx = 80, cy = 80;
    const rOuter = 62;
    const ringWidth = 22;
    const pct = Math.max(0, Math.min(100, expensePct));
    const expenseDeg = (pct / 100) * 360;

    // 起點固定在正上方（12點鐘方向），黃色（支出）從正上方開始往右佔據
    const expenseStart = 0;
    const expenseEnd = expenseDeg;
    const incomeStart = expenseDeg;
    const incomeEnd = 360;

    let svgContent = '';

    // 兩個色段都用「填色路徑」（厚圓環段）+ 手繪描邊雙層
    const buildRingSegment = (startDeg, endDeg, color, seed) => {
      if (endDeg - startDeg <= 0.5) return '';
      const rIn = rOuter - ringWidth;
      const outerPath = this._wobblyArcPath(cx, cy, rOuter, startDeg, endDeg, 1.6, seed);
      const innerPath = this._wobblyArcPath(cx, cy, rIn, endDeg, startDeg, 1.6, seed + 50);
      const pStart = this._point(cx, cy, rOuter, startDeg);
      const pInStart = this._point(cx, cy, rIn, startDeg);

      const fillD = `${outerPath} L${this._point(cx, cy, rIn, endDeg).x.toFixed(2)},${this._point(cx, cy, rIn, endDeg).y.toFixed(2)} ${innerPath} Z`;

      // 雙層描邊：第二層用淡墨色、些微位移半徑，模擬蠟筆來回畫
      const strokeOuter1 = this._wobblyArcPath(cx, cy, rOuter, startDeg, endDeg, 1.8, seed + 1);
      const strokeOuter2 = this._wobblyArcPath(cx, cy, rOuter + 1.4, startDeg, endDeg, 1.8, seed + 2);

      return `
        <path d="${fillD}" fill="${color}" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
        <path d="${strokeOuter2}" fill="none" stroke="var(--ink)" stroke-width="1.2" opacity="0.18" stroke-linecap="round" />
      `;
    };

    // 先畫支出（黃色），再畫收入（藍色），讓視覺上黃色像「吃掉」一塊藍色圓環
    svgContent += buildRingSegment(incomeStart, incomeEnd, 'var(--crayon-blue)', 7);
    if (pct > 0) {
      svgContent += buildRingSegment(expenseStart, expenseEnd, 'var(--crayon-yellow)', 23);
    }

    // 整體外框再加一圈很淡的手抖線，增加蠟筆感的「重複描繪」痕跡
    const outerGhost = this._wobblyArcPath(cx, cy, rOuter + 2.2, 0, 360, 2.2, 99);
    svgContent += `<path d="${outerGhost}" fill="none" stroke="var(--ink)" stroke-width="1.4" opacity="0.12" stroke-linecap="round" />`;

    svgEl.innerHTML = svgContent;
  },
};

window.DonutChart = DonutChart;
