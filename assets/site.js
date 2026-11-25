(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const menu = $('.menu'), nav = $('.nav');
  menu?.addEventListener('click', () => { const o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', o); menu.textContent = o ? 'Close' : 'Menu'; });

  $('.theme')?.addEventListener('click', () => { const r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; r.dataset.theme = dark ? 'light' : 'dark'; try { localStorage.setItem('theme', r.dataset.theme); } catch (e) {} });

  const head = $('header.top'), sc = () => head.classList.toggle('scrolled', scrollY > 60);
  addEventListener('scroll', sc, { passive: true }); sc();

  // Rule playground: allowed cut = billed above the agreed rate; anything more is over-deducted
  const play = $('#play');
  if (play) {
    const inr = n => '₹' + n.toLocaleString('en-IN'), el = id => document.getElementById(id); let say;
    const calc = () => {
      const bill = +el('k-b').value, rate = +el('k-a').value, cut = Math.min(+el('k-c').value, bill), file = el('k-f').checked;
      const allow = Math.max(0, bill - rate), over = Math.max(0, cut - allow), v = !file && cut ? 'w' : over ? 'g' : 'a';
      el('o-b').textContent = inr(bill); el('o-a').textContent = inr(rate); el('o-c').textContent = inr(cut);
      $('.verdict').dataset.v = v;
      el('v-l').textContent = { g: 'Over-deducted', a: cut ? 'Within terms' : 'Nothing was cut', w: 'Needs a person' }[v];
      el('v-n').textContent = inr(v === 'g' ? over : cut);
      el('v-w').textContent = v === 'w' ? 'There is no agreed rate to test this against. The software does not guess.' : !cut ? 'There is no deduction to check.' : allow ? `The bill is ${inr(allow)} above the agreed rate. The payer cut ${inr(cut)}.` : `The bill is within the agreed rate, so no cut was allowed. The payer cut ${inr(cut)}.`;
      el('v-o').style.width = (v === 'g' ? over / cut * 100 : 0) + '%'; el('v-a').style.width = (v === 'g' ? (cut - over) / cut * 100 : cut ? 100 : 0) + '%';
      clearTimeout(say); say = setTimeout(() => el('v-s').textContent = el('v-l').textContent + ' ' + el('v-n').textContent, 600);
    };
    play.addEventListener('input', calc); play.addEventListener('submit', e => e.preventDefault()); calc();
  }

  // Settlement letter: one finding open at a time
  $$('.line').forEach(b => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') === 'true';
    $$('.line').forEach(x => { x.setAttribute('aria-expanded', 'false'); $('#' + x.getAttribute('aria-controls')).hidden = true; });
    if (!open) { b.setAttribute('aria-expanded', 'true'); $('#' + b.getAttribute('aria-controls')).hidden = false; }
  }));

  // Replays the check: a light passes down the letter, then each verdict and the total land. The finished letter is the resting state.
  const L = $('.home .letter');
  if (L) {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches, btn = $('.replay'); let timer = 0;
    if (calm) btn.hidden = true;
    const run = () => {
      $('.scan', L)?.remove(); cancelAnimationFrame(timer);
      const lines = $$('.line', L), end = $('.split', L).offsetTop + 20, T = 2600;
      const bar = document.createElement('i'); bar.className = 'scan'; L.append(bar);
      bar.animate([{ top: 0 }, { top: end + 'px' }], { duration: T, easing: 'linear', fill: 'forwards' }).onfinish = () => bar.remove();
      lines.forEach(l => $('.tag', l).animate([{ opacity: 0, transform: 'scale(1.5) rotate(-5deg)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: T * (l.offsetTop + l.offsetHeight / 2) / end, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'backwards' }));
      $$('.split i', L).forEach((x, i) => { x.style.transformOrigin = 'left'; x.animate([{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: 420, delay: T + i * 160, easing: 'ease-out', fill: 'backwards' }); });
      const dd = $('.win dd', L), t0 = performance.now() + T;
      const tick = t => { const k = Math.max(0, Math.min(1, (t - t0) / 900)); dd.textContent = '₹' + (Math.round(29000 * (1 - (1 - k) ** 3) / 100) * 100).toLocaleString('en-IN'); if (k < 1) timer = requestAnimationFrame(tick); };
      timer = requestAnimationFrame(tick);
    };
    btn.addEventListener('click', run); if (!calm) (document.fonts?.ready || Promise.resolve()).then(run);
  }

  // Tabs (process stepper)
  $$('[role=tablist]').forEach(list => {
    const tabs = $$('[role=tab]', list);
    const pick = t => tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => pick(t));
      t.addEventListener('keydown', e => { const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; pick(n); n.focus(); } });
    });
  });

  // Niryat shipment chain
  const chain = $('.chain');
  if (chain) {
    const data = JSON.parse($('#chain-data').textContent), out = $('.finding');
    const show = i => { const d = data[i]; $$('.link', chain).forEach((l, k) => l.setAttribute('aria-pressed', k === i));
      out.innerHTML = `<h3>${d.title}</h3><p>${d.text}</p><dl class="kv"><div><dt>Compared with</dt><dd>${d.cmp}</dd></div><div><dt>Result</dt><dd>${d.res}</dd></div><div><dt>Next action</dt><dd>${d.next}</dd></div></dl>`; };
    $$('.link', chain).forEach((l, i) => l.addEventListener('click', () => show(i)));
    show(3);
  }

  // Contact form opens an email draft. Nothing is sent or stored by this site.
  $('#contact-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target), to = e.target.dataset.to;
    const body = `Name: ${f.get('name')}\nOrganisation: ${f.get('org')}\nInterested in: ${f.get('product')}\n\n${f.get('msg') || ''}`;
    location.href = `mailto:${to}?subject=${encodeURIComponent('Satyalekh: ' + f.get('product'))}&body=${encodeURIComponent(body)}`;
    $('#form-note').textContent = `Your email app should open with this message. If it doesn't, write to ${to}.`;
  });
})();
