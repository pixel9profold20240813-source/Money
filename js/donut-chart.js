/* =====================================================================
   donut-chart.js — 甜甜圈圖（標準平滑圓環）
   ---------------------------------------------------------------------
   藍色 = 收入佔比（基準滿圈），黃色 = 支出佔收入的比例，
   從 12 點鐘方向開始吃掉對應角度的藍色區域。
   用 stroke-dasharray 技巧畫圓環段，線條乾淨平滑。
===================================================================== */

const DonutChart = {
  /**
   * 渲染甜甜圈圖到指定的 <svg> 元素
   * @param {SVGElement} svgEl
   * @param {number} expensePct 支出佔收入的比例 0-100
   */
  render(svgEl, expensePct) {
    const cx = 80, cy = 80;
    const r = 58;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, expensePct));

    const expenseLen = (pct / 100) * circumference;

    // 兩段圓弧都從同一個圓上疊加，用 stroke-dasharray 控制顯示長度，
    // rotate(-90) 讓起點固定在 12 點鐘方向
    svgEl.innerHTML = `
      <g transform="rotate(-90 ${cx} ${cy})">
        <circle
          cx="${cx}" cy="${cy}" r="${r}"
          fill="none"
          stroke="var(--crayon-blue)"
          stroke-width="${strokeWidth}"
        />
        ${pct > 0 ? `
        <circle
          cx="${cx}" cy="${cy}" r="${r}"
          fill="none"
          stroke="var(--crayon-yellow)"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${expenseLen} ${circumference - expenseLen}"
          stroke-dashoffset="0"
        />` : ''}
      </g>
    `;
  },
};

window.DonutChart = DonutChart;
