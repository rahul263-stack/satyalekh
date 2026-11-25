/* Interactive ClaimSetu dashboard. Every record is generated here from a fixed seed: no real hospital, payer or patient. */
(() => {
  let seed = 20261125; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const pick = a => a[Math.floor(rnd() * a.length)], $ = s => document.querySelector(s);
  const PAYERS = ['Demo Insurer A', 'Demo Insurer B', 'Demo Insurer C', 'Demo Insurer D', 'Demo Insurer E', 'Demo Insurer F'];
  const OVER = [.22, .34, .18, .45, .27, .12];
  const SPEC = [['Orthopaedics', 'Total knee replacement', 280000], ['Cardiac', 'Coronary angioplasty', 240000], ['General surgery', 'Laparoscopic cholecystectomy', 95000], ['Maternity', 'Caesarean section', 85000]];
  const REASONS = [['Above agreed rate', 'the signed tariff'], ['Stay not justified', 'the discharge summary'], ['Room rent limit', 'the policy schedule'], ['Missing document', 'the claim file'], ['Non-payable items', 'the list of non-payable items'], ['Co-payment', 'the policy schedule']];
  const MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const C = { g: 'var(--c-g)', w: 'var(--c-w)', a: 'var(--c-a)', grid: 'var(--grid)' };
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const short = n => n >= 1e7 ? '₹' + (n / 1e7).toFixed(2) + ' cr' : n >= 1e5 ? '₹' + (n / 1e5).toFixed(1) + ' L' : n >= 1e3 ? '₹' + (n / 1e3).toFixed(0) + 'k' : '₹' + Math.round(n);

  const claims = Array.from({ length: 400 }, (_, i) => {
    const p = Math.floor(rnd() * 6), s = pick(SPEC), m = Math.floor(rnd() * 12), claimed = Math.round(s[2] * (.75 + rnd() * .6) / 100) * 100;
    const n = 1 + Math.floor(rnd() * 3), used = new Set(), cuts = [];
    while (cuts.length < n) { const r = Math.floor(rnd() * 6); if (used.has(r)) continue; used.add(r);
      const amt = Math.max(500, Math.round(claimed * (.015 + rnd() * .07) / 100) * 100), t = rnd();
      let g = 0, w = 0; if (r < 4) { if (t < OVER[p] + .2) g = Math.round(amt * (.45 + rnd() * .55) / 100) * 100; else if (t > .88) w = amt; } else if (t < OVER[p] * .3) g = amt; else if (t > .92) w = amt;
      g = Math.min(g, amt); cuts.push({ r, amt, g, w, a: amt - g - w }); }
    const cut = cuts.reduce((x, c) => x + c.amt, 0), g = cuts.reduce((x, c) => x + c.g, 0), w = cuts.reduce((x, c) => x + c.w, 0);
    const appealed = g > 0 && rnd() < .72, decided = appealed && rnd() < .7, won = decided && rnd() < .66 ? Math.round(g * (.6 + rnd() * .4) / 100) * 100 : 0;
    return { id: 'DC-2026-' + (104200 + i * 7), p, s, m, claimed, cuts, cut, g, w, a: cut - g - w, appealed, decided, won };
  });

  const f = { payer: 'all', spec: 'all', period: 12 }, tip = $('#tip');
  const rows = () => claims.filter(c => (f.payer === 'all' || c.p === +f.payer) && (f.spec === 'all' || c.s[0] === f.spec) && c.m >= 12 - f.period);
  const sum = (a, k) => a.reduce((x, c) => x + (typeof k === 'function' ? k(c) : c[k]), 0);

  function bindTips(root) { root.querySelectorAll('[data-tip]').forEach(el => {
    const on = e => { tip.innerHTML = el.dataset.tip; tip.style.opacity = 1; const b = el.getBoundingClientRect(), x = e.clientX || b.left + b.width / 2, y = e.clientY || b.top; tip.style.left = Math.max(8, Math.min(innerWidth - 270, x + 14)) + 'px'; tip.style.top = Math.max(8, y - 70) + 'px'; };
    const off = () => tip.style.opacity = 0;
    el.addEventListener('pointermove', on); el.addEventListener('pointerleave', off); el.addEventListener('focus', on); el.addEventListener('blur', off); }); }
  const nice = v => { const p = 10 ** Math.floor(Math.log10(v || 1)); return [1, 2, 2.5, 5, 10].map(x => x * p).find(x => x >= v) || p; };
  const tbl = (h, r) => `<div class="tablebox"><table><thead><tr>${h.map((x, i) => `<th class="${i ? 'n' : ''}">${x}</th>`).join('')}</tr></thead><tbody>${r.map(x => `<tr>${x.map((y, i) => `<td class="${i ? 'n' : ''}">${y}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const asTable = new Set();

  function monthly(R) {
    const idx = MONTHS.map((_, i) => i).slice(12 - f.period), d = idx.map(i => { const q = R.filter(c => c.m === i); return { n: MONTHS[i], g: sum(q, 'g'), w: sum(q, 'w'), a: sum(q, 'a') }; });
    if (asTable.has('m')) return tbl(['Month', 'Over-deducted', 'Needs a person', 'Within terms'], d.map(x => [x.n, inr(x.g), inr(x.w), inr(x.a)]));
    const W = Math.max(330, $('#c-month').clientWidth || 640), H = 280, L = 58, B = 28, max = nice(Math.max(1, ...d.map(x => x.g + x.w + x.a))), bw = Math.min(34, (W - L) / d.length * .58), y = v => 10 + (H - B - 10) * (1 - v / max);
    let s = ''; [0, .25, .5, .75, 1].forEach(t => s += `<line x1="${L}" x2="${W}" y1="${y(max * t)}" y2="${y(max * t)}" stroke="${C.grid}"/><text x="${L - 8}" y="${y(max * t) + 4}" text-anchor="end">${short(max * t)}</text>`);
    d.forEach((x, i) => { const step = (W - L) / d.length, cx = L + step * (i + .5); let base = 0;
      ['g', 'w', 'a'].forEach(k => { if (!x[k]) return; const y0 = y(base), y1 = y(base + x[k]), h = Math.max(1, y0 - y1 - 2); s += `<rect x="${cx - bw / 2}" y="${y1}" width="${bw}" height="${h}" rx="2" fill="${C[k]}"/>`; base += x[k]; });
      s += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${x.n}</text><rect class="hit" tabindex="0" role="img" aria-label="${x.n}: ${inr(x.g)} over-deducted, ${inr(x.w)} needs a person, ${inr(x.a)} within terms" x="${cx - step / 2}" y="0" width="${step}" height="${H - B}" data-tip="<b>${x.n}</b>Over-deducted ${inr(x.g)}<br>Needs a person ${inr(x.w)}<br>Within terms ${inr(x.a)}"/>`; });
    return `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Deductions by month">${s}</svg>`;
  }
  function bars(id, d, color, fmt) {
    if (asTable.has(id)) return tbl(['Name', 'Amount'], d.map(x => [x.n, inr(x.v)]));
    const W = Math.max(300, $('#c-' + id).clientWidth || 420), L = 142, RH = 42, max = Math.max(1, ...d.map(x => x.v)), w = W - L - 78; let s = '';
    d.forEach((x, i) => { const y = i * RH, bw = Math.max(2, w * x.v / max); s += `<text x="0" y="${y + 25}">${x.n}</text><rect x="${L}" y="${y + 11}" width="${bw}" height="20" rx="4" fill="${color}"/><text x="${L + bw + 8}" y="${y + 26}">${fmt(x)}</text><rect class="hit" tabindex="0" role="img" aria-label="${x.n} ${inr(x.v)}" x="0" y="${y}" width="${W}" height="${RH}" data-tip="<b>${x.n}</b>${inr(x.v)}${x.t ? '<br>' + x.t : ''}"/>`; });
    return `<svg viewBox="0 0 ${W} ${d.length * RH}" role="group">${s}</svg>`;
  }

  let sortKey = 'g', page = 0;
  function draw() {
    const R = rows(), cut = sum(R, 'cut'), g = sum(R, 'g'), won = sum(R, 'won'), cl = sum(R, 'claimed'), dec = R.filter(c => c.decided), wins = dec.filter(c => c.won).length;
    $('#kpis').innerHTML = [['Claimed', short(cl), R.length + ' claims'], ['Deducted by payers', short(cut), cl ? (cut / cl * 100).toFixed(1) + '% of claimed' : ''], ['Over-deducted', short(g), cut ? (g / cut * 100).toFixed(0) + '% of deductions' : ''], ['Won back', short(won), dec.length ? `${wins} of ${dec.length} decided appeals won` : 'No decided appeals']].map(k => `<div><dt>${k[0]}</dt><dd>${k[1]}</dd><small>${k[2]}</small></div>`).join('');
    $('#c-month').innerHTML = monthly(R);
    $('#c-payer').innerHTML = bars('payer', PAYERS.map((n, i) => { const q = R.filter(c => c.p === i), v = sum(q, 'g'), k = sum(q, 'cut'); return { n, v, t: k ? (v / k * 100).toFixed(0) + '% of its deductions' : '' }; }).filter(x => f.payer === 'all' || x.n === PAYERS[f.payer]).sort((a, b) => b.v - a.v), C.g, x => short(x.v));
    $('#c-reason').innerHTML = bars('reason', REASONS.map((r, i) => ({ n: r[0], v: sum(R, c => sum(c.cuts.filter(k => k.r === i), 'amt')) })).sort((a, b) => b.v - a.v), C.a, x => short(x.v));
    const ap = R.filter(c => c.appealed);
    $('#c-funnel').innerHTML = bars('funnel', [{ n: 'Over-deducted', v: g, t: R.filter(c => c.g).length + ' claims' }, { n: 'Appealed', v: sum(ap, 'g'), t: ap.length + ' claims' }, { n: 'Decided', v: sum(dec, 'g'), t: dec.length + ' claims' }, { n: 'Won back', v: won, t: wins + ' claims' }], C.g, x => short(x.v));
    const Q = R.filter(c => c.g + c.w > 0 && !c.appealed).sort((a, b) => sortKey === 'id' ? a.id.localeCompare(b.id) : b[sortKey] - a[sortKey]), pages = Math.max(1, Math.ceil(Q.length / 8)); page = Math.min(page, pages - 1);
    $('#q-sub').textContent = Q.length + ' claims not yet appealed. Open one to see the evidence.';
    $('#q-body').innerHTML = Q.slice(page * 8, page * 8 + 8).map(c => `<tr data-id="${c.id}"><td><button type="button">${c.id}</button></td><td>${PAYERS[c.p]}</td><td>${c.s[1]}</td><td class="n">${inr(c.cut)}</td><td class="n">${inr(c.g)}</td><td>${c.w ? '<span class="tag w">Needs a person</span>' : '<span class="tag g">Ready to appeal</span>'}</td></tr>`).join('') || '<tr><td colspan="6">No claims match these filters. Choose a longer period or another payer.</td></tr>';
    $('#q-page').textContent = `Page ${page + 1} of ${pages}`; $('#prev').disabled = page === 0; $('#next').disabled = page >= pages - 1;
    bindTips(document);
  }
  function open(id) {
    const c = claims.find(x => x.id === id); if (!c) return;
    const lines = c.cuts.map(k => { const v = k.g ? ['g', k.g === k.amt ? 'Over-deducted' : 'Partly over'] : k.w ? ['w', 'Needs a person'] : ['a', 'Within terms']; return `<tr><td>${REASONS[k.r][0]}<br><span class="small">Checked against ${REASONS[k.r][1]}</span></td><td class="n">${inr(k.amt)}</td><td class="n">${inr(k.g)}</td><td><span class="tag ${v[0]}">${v[1]}</span></td></tr>`; }).join('');
    const ap = c.cuts.filter(k => k.g);
    $('#dw').innerHTML = `<div class="dw-h"><div><h2 style="font-size:26px">${c.id}</h2><p class="small">${PAYERS[c.p]}, ${c.s[1]}</p></div><button class="x" aria-label="Close claim" type="button">×</button></div><dl class="kv"><div><dt>Claimed</dt><dd>${inr(c.claimed)}</dd></div><div><dt>Deducted</dt><dd>${inr(c.cut)}</dd></div><div><dt>Over-deducted</dt><dd>${inr(c.g)}</dd></div></dl><div class="tablebox"><table><thead><tr><th>Deduction</th><th class="n">Cut</th><th class="n">Over</th><th>Finding</th></tr></thead><tbody>${lines}</tbody></table></div>${ap.length ? `<h3>Draft appeal</h3><div class="appeal">To: ${PAYERS[c.p]}\nRe: Claim ${c.id}\n\nWe ask you to review the deductions below.\n\n${ap.map((k, i) => `${i + 1}. ${REASONS[k.r][0]}\n   Deducted ${inr(k.amt)}. Your terms support ${inr(k.amt - k.g - k.w)}.\n   Please release ${inr(k.g)}. Evidence: ${REASONS[k.r][1]}.`).join('\n\n')}\n\nTotal requested: ${inr(c.g)}</div><p class="small">A draft. The hospital edits, approves and files it.</p>` : '<p>No clear over-deduction. A reviewer needs to check this claim before anyone appeals.</p>'}`;
    const d = $('#drawer'); d.showModal(); $('.x').onclick = () => d.close();
  }
  $('#f-payer').innerHTML += PAYERS.map((p, i) => `<option value="${i}">${p}</option>`).join(''); $('#f-spec').innerHTML += SPEC.map(s => `<option>${s[0]}</option>`).join('');
  [['payer', 'payer'], ['spec', 'spec'], ['period', 'period']].forEach(([i, k]) => $('#f-' + i).addEventListener('change', e => { f[k] = k === 'period' ? +e.target.value : e.target.value; page = 0; draw(); }));
  $('#reset').onclick = () => { Object.assign(f, { payer: 'all', spec: 'all', period: 12 }); $('#f-payer').value = 'all'; $('#f-spec').value = 'all'; $('#f-period').value = '12'; page = 0; draw(); };
  document.querySelectorAll('.tv').forEach(b => b.onclick = () => { const k = b.dataset.k; asTable.has(k) ? asTable.delete(k) : asTable.add(k); b.textContent = asTable.has(k) ? 'Show chart' : 'Show table'; draw(); });
  $('#sort').onchange = e => { sortKey = e.target.value; page = 0; draw(); }; $('#prev').onclick = () => { page--; draw(); }; $('#next').onclick = () => { page++; draw(); };
  $('#q-body').addEventListener('click', e => { const r = e.target.closest('tr[data-id]'); if (r) open(r.dataset.id); });
  $('#drawer').addEventListener('click', e => { if (e.target.id === 'drawer') e.target.close(); });
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 120); }); draw();
})();
