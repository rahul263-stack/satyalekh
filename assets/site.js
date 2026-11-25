(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const menu = $('.menu'), nav = $('.nav');
  menu?.addEventListener('click', () => { const o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', o); menu.textContent = o ? 'Close' : 'Menu'; });

  $('.theme')?.addEventListener('click', () => { const r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; r.dataset.theme = dark ? 'light' : 'dark'; try { localStorage.setItem('theme', r.dataset.theme); } catch (e) {} });

  // Settlement letter: one finding open at a time
  $$('.line').forEach(b => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') === 'true';
    $$('.line').forEach(x => { x.setAttribute('aria-expanded', 'false'); $('#' + x.getAttribute('aria-controls')).hidden = true; });
    if (!open) { b.setAttribute('aria-expanded', 'true'); $('#' + b.getAttribute('aria-controls')).hidden = false; }
  }));

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
