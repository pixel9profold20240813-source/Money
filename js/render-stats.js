/* =====================================================================
   render-stats.js — 統計頁渲染
   ---------------------------------------------------------------------
   目前階段先用文字 placeholder 呈現資料是否備妥，
   下一階段會替換成 roughViz 的圓餅圖 / 折線圖。
===================================================================== */

async function renderStats() {
  await AppState.reload();

  const pieMount = document.getElementById('pieChartMount');
  const lineMount = document.getElementById('lineChartMount');

  const byCategory = AppState.expenseByCategory();
  const trend = AppState.trendByMonth(6);

  if (byCategory.length === 0) {
    pieMount.innerHTML = `
      <div class="empty-state">
        <span class="emoji">🥧</span>
        <div class="hand">本月還沒有支出紀錄，圖表暫時是空的</div>
      </div>`;
  } else {
    pieMount.innerHTML = `
      <div style="font-size:0.85rem; color:var(--ink-soft); margin-bottom:10px;">
        🖍️ 手繪圓餅圖將於下一階段接入 roughViz，目前先列出統計資料：
      </div>
      ${byCategory.map((c) => `
        <div class="setting-list-item">
          <span>${escapeHtml(c.name)}</span>
          <span class="amount expense">NT$ ${Utils.formatMoney(c.value)}</span>
        </div>`).join('')}`;
  }

  lineMount.innerHTML = `
    <div style="font-size:0.85rem; color:var(--ink-soft); margin-bottom:10px;">
      🖍️ 手繪折線圖將於下一階段接入 roughViz，目前先列出統計資料：
    </div>
    ${trend.map((m) => `
      <div class="setting-list-item">
        <span>${m.label}</span>
        <span>
          <span class="amount income" style="font-size:0.95rem;">+${Utils.formatMoney(m.income)}</span>
          &nbsp;
          <span class="amount expense" style="font-size:0.95rem;">-${Utils.formatMoney(m.expense)}</span>
        </span>
      </div>`).join('')}`;
}

window.renderStats = renderStats;
