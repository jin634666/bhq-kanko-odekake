// BHQ観光おでかけ（公開版）
// このサイトではBHQを計測しない。クイックBHQドックなどで測った結果を入れるか、調子を選ぶと、観光名所をすすめる。
// 決め方（全脳の星で距離、3部位の高め・低めで場所の種類）と根拠の論文は odekake.js にまとめてある（このPC用の版と同じ）
import { PREFS, RANGES, ASPECTS, rangeByStars, pickSpots, distanceLabel, profileOf, REFS, SPOT_TYPES, RANK_RULES, ranksOf } from './odekake.js';
import { SPOTS } from './spots.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const REGION_COLOR = { GM: '#FF9D00', DMN: '#E80074', CEN: '#0058FF', SN: '#5DBA85' };   // クイックBHQの部位の色

// ---------------------------------------------------------------- 点数（クイックBHQドックと同じ計算）
// ΔBHQ = BHQ − 125 + 年齢×0.5、点数 = NORM.DIST(ΔBHQ, 0, 5, TRUE)×100 + 15（100で止める）
function normCdf(x) {
  const z = Math.abs(x) / Math.SQRT2, k = 1 / (1 + 0.3275911 * z);
  const erf = 1 - (((((1.061405429 * k - 1.453152027) * k) + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k * Math.exp(-z * z);
  return x >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}
function brainScore(bhq, age) {
  const d = bhq - 125 + age * 0.5;
  const band = d < -4.2 ? 0 : d < -1.3 ? 1 : d < 1.3 ? 2 : d < 4.2 ? 3 : 4;
  return { score: Math.min(100, Math.round(normCdf(d / 5) * 100 + 15)), stars: band + 1 };
}
const starText = n => '★'.repeat(n) + '☆'.repeat(5 - n);

// ---------------------------------------------------------------- 入力（このブラウザにだけ保存）
const KEY = 'bhq-kanko-public';
const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
const st = Object.assign({ home: '東京', mode: 'manual', stars: 3, lv: { DMN: '', CEN: '', SN: '' }, age: '', v: { GM: '', DMN: '', CEN: '', SN: '' } }, saved);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* 保存できなくても動く */ } };

let current = null;   // { range, ctx }

// 入力から { stars, score, prof, label } を作る。BHQの数値が足りないときは null
function context() {
  if (st.mode === 'bhq') {
    const age = Number(st.age), gm = Number(st.v.GM);
    if (!(age >= 10 && age <= 110) || !(st.v.GM !== '' && gm > 0)) return null;
    const values = {};
    for (const k of ['GM', 'DMN', 'CEN', 'SN']) if (st.v[k] !== '' && Number(st.v[k]) > 0) values[k] = Number(st.v[k]);
    const s = brainScore(gm, age);
    return { stars: s.stars, score: s.score, prof: profileOf(values, age), label: `入力したBHQ：脳の健康点数 <b>${s.score}点</b> <span class="stars">${starText(s.stars)}</span>` };
  }
  const prof = ASPECTS.filter(a => st.lv[a.key]).map(a => { const high = st.lv[a.key] === 'hi'; return { aspect: a, high, side: high ? a.hi : a.lo }; });
  return { stars: st.stars, score: null, prof, label: `選んだ調子：<span class="stars">${starText(st.stars)}</span>` };
}

function initInputs() {
  const home = $('#home');
  home.innerHTML = PREFS.map(p => `<option value="${p}"${p === st.home ? ' selected' : ''}>${p}</option>`).join('');
  home.onchange = () => { st.home = home.value; save(); update(); };

  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { st.mode = b.dataset.mode; save(); syncInputs(); update(); });

  $('#stars').innerHTML = RANGES.slice().reverse().map(r => `<button class="chip" data-stars="${r.stars}"><span class="st">${starText(r.stars)}</span>${esc(r.name)}</button>`).join('');
  $('#stars').onclick = e => { const b = e.target.closest('[data-stars]'); if (!b) return; st.stars = Number(b.dataset.stars); save(); syncInputs(); update(); };

  $('#levels').innerHTML = ASPECTS.map(a => `<div class="lvrow"><span class="rkname" style="--c:${REGION_COLOR[a.key]}">${esc(a.name)}</span>
    <div class="seg" role="group" aria-label="${esc(a.name)}">${[['', 'わからない'], ['hi', '高め'], ['lo', '低め']].map(([v, l]) => `<button data-lv="${a.key}" data-val="${v}">${l}</button>`).join('')}</div></div>`).join('');
  $('#levels').onclick = e => { const b = e.target.closest('[data-lv]'); if (!b) return; st.lv[b.dataset.lv] = b.dataset.val; save(); syncInputs(); update(); };

  const nums = [['age', '年齢', '例 30'], ['GM', '全脳', '例 98.5'], ['DMN', '社会性', '例 101.2'], ['CEN', '認知制御', '例 95.0'], ['SN', 'モニタリング', '例 99.3']];
  $('#nums').innerHTML = nums.map(([k, l, ph]) => `<label class="field" for="n-${k}">${k === 'age' ? l : `<span><i class="dot" style="background:${REGION_COLOR[k]}"></i>${l}（${k}）</span>`}
    <input id="n-${k}" type="number" inputmode="decimal" step="0.1" min="${k === 'age' ? 10 : 0}" max="${k === 'age' ? 110 : 200}" placeholder="${ph}"></label>`).join('');
  nums.forEach(([k]) => {
    const inp = $(`#n-${k}`);
    inp.value = k === 'age' ? st.age : st.v[k];
    inp.oninput = () => { if (k === 'age') st.age = inp.value; else st.v[k] = inp.value; save(); update(); };
  });

  $('#ranges').innerHTML = RANGES.map(r => `<button class="chip" data-range="${r.key}"><span class="st">${starText(r.stars)}</span>${esc(r.name)}</button>`).join('');
  $('#ranges').onclick = e => { const b = e.target.closest('[data-range]'); if (!b) return; renderRecommend(RANGES.find(r => r.key === b.dataset.range), current?.ctx); };

  $('#spotcount').textContent = `観光名所 ${SPOTS.length}か所（47都道府県）`;
  $('#benefits').innerHTML = RANK_RULES.map(r => r.routes.map(rt => `<li><span class="rkname" style="--c:${REGION_COLOR[r.key]}">${esc(r.name)}${r.routes.length > 1 ? `（${esc(rt.label)}）` : ''}</span><span>${esc(rt.why)}（${refLinks(rt.refs)}）</span></li>`).join('')).join('');
  $('#refs').innerHTML = Object.values(REFS).map(r => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.cite)}</a><span>${esc(r.note)}</span></li>`).join('');
  syncInputs();
  initTable();
}

function syncInputs() {
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === st.mode));
  $('#mode-manual').hidden = st.mode !== 'manual';
  $('#mode-bhq').hidden = st.mode !== 'bhq';
  document.querySelectorAll('[data-stars]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.stars) === st.stars));
  document.querySelectorAll('[data-lv]').forEach(b => b.setAttribute('aria-pressed', st.lv[b.dataset.lv] === b.dataset.val));
}

function update() {
  const ctx = context();
  $('#bhq-note').hidden = st.mode !== 'bhq' || !!ctx;
  if (!ctx) return;
  renderRecommend(rangeByStars(ctx.stars), ctx);
}

// ---------------------------------------------------------------- おすすめ
const refLinks = ids => ids.map(id => REFS[id]).filter(Boolean)
  .map(r => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.cite.replace(/\).*/, ')'))}</a>`).join('、');

function renderRecommend(range, ctx) {
  const prof = ctx?.prof || [];
  current = { range, ctx };
  let list = pickSpots({ home: st.home, range, prof });
  let widened = '';
  const idx = RANGES.indexOf(range);
  if (!list.length) {
    const alt = range.prefer === 'far' ? RANGES[idx + 1] : RANGES[idx - 1];
    if (alt) { list = pickSpots({ home: st.home, range: { ...alt, restore: range.restore }, prof }); widened = `この範囲に名所がなかったので、「${alt.name}」の範囲から選びました。`; }
  }
  document.querySelectorAll('#ranges [data-range]').forEach(b => b.setAttribute('aria-pressed', b.dataset.range === range.key));
  const rangeText = range.max === Infinity ? `${esc(st.home)}から${range.min}km以上` : `${esc(st.home)}から${range.min ? range.min + '〜' : ''}${range.max}km`;
  $('#rec-head').innerHTML = `<div class="eyebrow">あなたへのおすすめ</div>
    <h2>${esc(range.title)}</h2>
    <p class="lead">${esc(range.lead)}${range.refs.length ? `<span class="cite">（${refLinks(range.refs)}）</span>` : ''}</p>
    <p class="why">${ctx ? ctx.label + ` → <b>${esc(range.name)}</b>` : ''}<span class="muted"> ・ 範囲：${rangeText}（直線距離）</span></p>
    ${widened ? `<p class="msg">${esc(widened)}</p>` : ''}
    ${prof.length ? `<div class="hints"><div class="hints-ttl">3部位から</div>${prof.map(({ aspect, high, side }) => `<div class="hint"><span class="lv ${high ? 'hi' : 'lo'}">${esc(aspect.name)} ${high ? '高め' : '低め'}</span><span>${esc(side.hint)}<span class="cite">（${refLinks(side.refs)}）</span></span></div>`).join('')}</div>`
      : `<p class="tiny muted">社会性・認知制御・モニタリングの高め・低めを入れると、名所の並び順もそれに合わせて変わります。</p>`}`;
  $('#rec-list').innerHTML = list.length ? list.slice(0, 24).map(card).join('') + (list.length > 24 ? `<p class="tiny muted">ほか${list.length - 24}か所</p>` : '')
    : `<div class="empty">この範囲に名所が見つかりませんでした。上のボタンで範囲を変えてみてください。</div>`;
}

function rankRow(s, lowKeys) {
  const rk = ranksOf(s);
  return `<div class="ranks">${RANK_RULES.map(r => {
    const x = rk[r.key];
    return `<span class="rk${lowKeys.has(r.key) ? ' low' : ''}" style="--c:${REGION_COLOR[r.key]}" title="${esc(r.name)}：${esc(x.label)}"><span class="rkn">${esc(r.name)}</span><b class="g g${x.rank}">${x.rank}</b></span>`;
  }).join('')}</div>`;
}

function card(s) {
  const lowKeys = new Set((current?.ctx?.prof || []).filter(p => !p.high).map(p => p.aspect.key));
  const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${s.name} ${s.pref}`);
  return `<article class="ev">
    <div class="ev-kind"><span class="ktag">${esc(SPOT_TYPES[s.type])}</span></div>
    <h3>${esc(s.name)}</h3>
    <div class="ev-where"><span class="pref">${esc(s.pref)}</span><span>${esc(s.desc)}</span></div>
    <div class="dist">${esc(distanceLabel(s.km))}</div>
    ${rankRow(s, lowKeys)}
    ${s.match.tags.length ? `<div class="mtags">${s.match.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
    <a class="ev-link" href="${esc(map)}" target="_blank" rel="noopener">地図で見る ↗</a>
  </article>`;
}

// ---------------------------------------------------------------- 全名所のランク一覧
const tbl = { sort: 'pref', dir: 1, region: '' };
const GRADE = { A: 0, B: 1, C: 2, D: 3, E: 4 };
const PREF_ORDER = Object.fromEntries(PREFS.map((p, i) => [p, i]));
function initTable() {
  $('#rt-region').innerHTML = `<option value="">すべての都道府県</option>` + PREFS.map(p => `<option value="${p}">${p}</option>`).join('');
  $('#rt-region').onchange = e => { tbl.region = e.target.value; renderTable(); };
  const sortBy = e => {
    const th = e.target.closest('[data-sort]'); if (!th) return;
    tbl.dir = tbl.sort === th.dataset.sort ? -tbl.dir : 1; tbl.sort = th.dataset.sort; renderTable();
  };
  $('#ranktable thead').onclick = sortBy;
  $('#ranktable thead').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sortBy(e); } };
  renderTable();
}
function renderTable() {
  const rows = SPOTS.filter(s => !tbl.region || s.pref === tbl.region).map(s => ({ s, rk: ranksOf(s) }));
  const key = r => tbl.sort === 'pref' ? PREF_ORDER[r.s.pref] * 1000 + SPOTS.indexOf(r.s)
    : tbl.sort === 'name' ? r.s.name : GRADE[r.rk[tbl.sort].rank] * 100 - r.rk[tbl.sort].v;
  rows.sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * tbl.dir; });
  document.querySelectorAll('#ranktable th[data-sort]').forEach(th => th.setAttribute('aria-sort', th.dataset.sort === tbl.sort ? (tbl.dir > 0 ? 'ascending' : 'descending') : 'none'));
  $('#ranktable tbody').innerHTML = rows.map(({ s, rk }) => `<tr><td>${esc(s.pref)}</td><td>${esc(s.name)}<div class="tiny muted">${esc(SPOT_TYPES[s.type])}</div></td>${RANK_RULES.map(r => `<td class="c"><b class="g g${rk[r.key].rank}" title="${esc(rk[r.key].label)}">${rk[r.key].rank}</b></td>`).join('')}</tr>`).join('');
  $('#rt-count').textContent = `${rows.length}か所`;
}

// ---------------------------------------------------------------- 起動
initInputs();
update();
if (!context()) renderRecommend(RANGES[2], null);   // BHQの数値が未入力でも、いつもの範囲で表示しておく
