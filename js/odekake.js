// BHQ の結果から観光名所を選ぶ（論文の知見をもとにした目安）
//
// 注意：ここで挙げる論文は、脳のネットワークの働きや、環境（自然・都市・新しい場所）が人に与える影響を調べたもの。
// 「クイックBHQの値」と「出かける場所の相性」を直接確かめた研究ではないので、知見を当てはめた目安として使う。
//
//  全脳（GM）    … 出かける距離。疲れ・ストレスが重なるとGM-BHQが低い傾向（Kokubun 2018）→ 低いときは近場＋回復しやすい場所。
//                  いろいろな場所に出かけた日は前向きな気分が高い（Heller 2020）→ 高いときは遠く・新しい場所へ
//  社会性（DMN） … DMNは他者の心を推し量る社会的認知と重なる（Mars 2012）→ 高いときは人と楽しむ場所。
//                  低いときはひとりで静かに。自然の中の散歩は反すう（くよくよ考え）を減らした（Bratman 2015）
//  認知制御（CEN）… 実行制御ネットワークは課題の成績と関連（Seeley 2007）→ 高いときは情報量・段取りの多い場所。
//                  低いときは、注意を使い果たした状態を自然が回復させる（注意回復理論：Kaplan 1995、Berman 2008）
//  モニタリング（SN）… 顕著性ネットワークは不安と関連し（Seeley 2007）、内外の刺激の重み付けを担う（Menon 2011）。
//                  高いときはにぎやかな場所も。低いときは刺激の少ない場所。自然はストレスからの回復が早い（Ulrich 1991）、
//                  都市生活は社会的ストレスへの脳の反応を高める（Lederbogen 2011）

import { SPOTS, SPOT_TYPES } from './spots.js';
export { SPOT_TYPES };

export const REFS = {
  nemoto2017: { cite: 'Nemoto et al. (2017) PLoS ONE', url: 'https://doi.org/10.1371/journal.pone.0187137', note: 'BHQ（脳の健康指標）の提案。灰白質量などから算出し、年齢による低下や生活要因の影響を示した' },
  kokubun2018: { cite: 'Kokubun et al. (2018) Frontiers in Behavioral Neuroscience', url: 'https://doi.org/10.3389/fnbeh.2018.00154', note: '一時的な疲労に慢性的なストレスや身体の疲れが重なると、GM-BHQが低い傾向（63人・相関研究）' },
  heller2020: { cite: 'Heller et al. (2020) Nature Neuroscience', url: 'https://doi.org/10.1038/s41593-020-0636-4', note: '日々の行き先が多様な日ほど前向きな気分が高い（GPSと気分の記録、122人）' },
  mars2012: { cite: 'Mars et al. (2012) Frontiers in Human Neuroscience', url: 'https://doi.org/10.3389/fnhum.2012.00189', note: 'デフォルトモードネットワークは、他者の心を推し量る「社会脳」と重なる' },
  bratman2015: { cite: 'Bratman et al. (2015) PNAS', url: 'https://doi.org/10.1073/pnas.1510459112', note: '自然の中を90分歩くと、反すうと膝下部前頭前皮質の活動が下がった（都市の散歩では下がらない）' },
  seeley2007: { cite: 'Seeley et al. (2007) Journal of Neuroscience', url: 'https://doi.org/10.1523/JNEUROSCI.5587-06.2007', note: '顕著性ネットワークは不安と、実行制御ネットワークは課題の成績と、それぞれ関連' },
  menon2011: { cite: 'Menon (2011) Trends in Cognitive Sciences', url: 'https://doi.org/10.1016/j.tics.2011.08.003', note: '顕著性・実行制御・デフォルトモードの3つのネットワークの役割と相互作用（トリプルネットワークモデル）' },
  kokubun2021: { cite: 'Kokubun, Pineda & Yamakawa (2021) PLoS ONE', url: 'https://doi.org/10.1371/journal.pone.0255285', note: 'ひとり暮らしの人は、年齢などを考えに入れてもGM-BHQが低い傾向（142人・相関研究）' },
  kaplan1995: { cite: 'Kaplan (1995) Journal of Environmental Psychology', url: 'https://doi.org/10.1016/0272-4944(95)90001-2', note: '注意回復理論。意図的な注意は使うと疲れ、自然のような環境がその回復を助ける' },
  berman2008: { cite: 'Berman, Jonides & Kaplan (2008) Psychological Science', url: 'https://doi.org/10.1111/j.1467-9280.2008.02225.x', note: '自然の中の散歩（や自然の写真）で、注意の課題の成績が上がった。都市の散歩では上がらない' },
  ulrich1991: { cite: 'Ulrich et al. (1991) Journal of Environmental Psychology', url: 'https://doi.org/10.1016/S0272-4944(05)80184-7', note: 'ストレスのあと、自然の映像のほうが都市の映像より回復が早く大きい（120人）' },
  lederbogen2011: { cite: 'Lederbogen et al. (2011) Nature', url: 'https://doi.org/10.1038/nature10190', note: '都市で暮らす人ほど、社会的ストレスへの扁桃体の反応が大きい' },
};

// ---------------------------------------------------------------- 距離
export const PREF_LATLON = {
  北海道: [43.06, 141.35], 青森: [40.82, 140.74], 岩手: [39.70, 141.15], 宮城: [38.27, 140.87], 秋田: [39.72, 140.10],
  山形: [38.24, 140.36], 福島: [37.75, 140.47], 茨城: [36.34, 140.45], 栃木: [36.57, 139.88], 群馬: [36.39, 139.06],
  埼玉: [35.86, 139.65], 千葉: [35.61, 140.12], 東京: [35.69, 139.69], 神奈川: [35.45, 139.64], 新潟: [37.90, 139.02],
  富山: [36.70, 137.21], 石川: [36.59, 136.63], 福井: [36.07, 136.22], 山梨: [35.66, 138.57], 長野: [36.65, 138.18],
  岐阜: [35.39, 136.72], 静岡: [34.98, 138.38], 愛知: [35.18, 136.91], 三重: [34.73, 136.51], 滋賀: [35.00, 135.87],
  京都: [35.02, 135.76], 大阪: [34.69, 135.52], 兵庫: [34.69, 135.18], 奈良: [34.69, 135.83], 和歌山: [34.23, 135.17],
  鳥取: [35.50, 134.24], 島根: [35.47, 133.05], 岡山: [34.66, 133.93], 広島: [34.40, 132.46], 山口: [34.19, 131.47],
  徳島: [34.07, 134.56], 香川: [34.34, 134.04], 愛媛: [33.84, 132.77], 高知: [33.56, 133.53], 福岡: [33.61, 130.42],
  佐賀: [33.25, 130.30], 長崎: [32.74, 129.87], 熊本: [32.79, 130.74], 大分: [33.24, 131.61], 宮崎: [31.91, 131.42],
  鹿児島: [31.56, 130.56], 沖縄: [26.21, 127.68],
};
export const PREFS = Object.keys(PREF_LATLON);

function km(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function distanceLabel(d) {
  if (d < 30) return `約${d}km・近所`;
  if (d < 60) return `約${d}km・近場`;
  if (d < 150) return `約${d}km・日帰り圏`;
  if (d < 350) return `約${d}km・日帰り〜1泊`;
  return `約${d}km・遠征（新幹線・飛行機）`;
}

// ---------------------------------------------------------------- 範囲（全脳）
// stars は脳の健康点数の星（1〜5）。min/max は出発地（都道府県庁所在地）からの直線距離
export const RANGES = [
  { stars: 5, key: 'far', name: '遠征', title: '遠くの初めての場所へ', min: 300, max: Infinity, prefer: 'far', refs: ['heller2020'],
    lead: '脳のコンディションは好調です。いつもと違う場所に出かけた日は気分が上がりやすいという研究もあります。遠くの名所に足をのばしてみませんか。' },
  { stars: 4, key: 'trip', name: 'ちょっと遠出', title: 'ちょっと遠出がおすすめ', min: 100, max: 600, prefer: 'far', refs: ['heller2020'],
    lead: '調子は上向きです。日帰り〜1泊で行ける、少し遠めの名所を選びました。' },
  { stars: 3, key: 'usual', name: 'いつもの範囲', title: 'いつもの行動範囲で', min: 0, max: 150, prefer: 'near', refs: [],
    lead: '年齢相応の安定したコンディションです。無理のない範囲の名所を選びました。' },
  { stars: 2, key: 'near', name: '近場', title: '近場で回復を', min: 0, max: 60, prefer: 'near', restore: true, refs: ['kokubun2018', 'kaplan1995'],
    lead: '疲れやストレスが重なると下がりやすい指標です。移動を短くして、自然や庭園など回復しやすい場所を上に並べました。' },
  { stars: 1, key: 'home', name: '近所でひと休み', title: '今日は近所でひと休み', min: 0, max: 30, prefer: 'near', restore: true, refs: ['kokubun2018', 'ulrich1991'],
    lead: '今日は遠出より休息を。近くの緑や水辺を少し歩くくらいが、回復にはちょうどよいかもしれません。' },
];
export const rangeByStars = s => RANGES.find(r => r.stars === s) || RANGES[2];

// ---------------------------------------------------------------- 3部位（社会性・認知制御・モニタリング）
// prefer: その部位が高い／低いときに好む特徴 [特徴, 向き]
export const ASPECTS = [
  { key: 'DMN', name: '社会性',
    hi: { prefer: [['social', 1]], tag: '人と楽しむ', refs: ['mars2012'],
      hint: '人と関わる力が出ている日。友達や家族と一緒に楽しめる、にぎわいのある名所を上に並べました。' },
    lo: { prefer: [['social', -1], ['restore', 1]], tag: 'ひとりで静かに', refs: ['mars2012', 'bratman2015'],
      hint: 'ひとりの時間が合いそうな日。自然の中の散歩は、くよくよ考える反すうを減らしたという研究があります。静かな自然の名所を上に並べました。' } },
  { key: 'CEN', name: '認知制御',
    hi: { prefer: [['demand', 1]], tag: 'じっくり・計画的に', refs: ['seeley2007'],
      hint: '集中や段取りに余裕がある日。博物館や山歩き、予約が要る場所など、頭を使う名所も楽しめそうです。' },
    lo: { prefer: [['demand', -1], ['restore', 1]], tag: '頭を休める', refs: ['kaplan1995', 'berman2008'],
      hint: '注意力を休ませたい日。自然の中で過ごすと注意力が回復するという研究（注意回復理論）にもとづき、段取りが少なく緑や水辺のある場所を上に並べました。' } },
  { key: 'SN', name: 'モニタリング',
    hi: { prefer: [['lively', 1]], tag: 'にぎやか', refs: ['menon2011'],
      hint: '周りの刺激を受け止める余裕がありそうな日。人出の多いにぎやかな名所も候補に入れました。' },
    lo: { prefer: [['lively', -1], ['restore', 1]], tag: '刺激少なめ', refs: ['seeley2007', 'ulrich1991', 'lederbogen2011'],
      hint: '刺激は控えめが合いそうな日。自然はストレスからの回復が早く、都市の環境はストレス反応を高めやすいという研究があります。静かな場所を上に並べました。' } },
];

// values: {DMN: 98.1, …}, age → [{ aspect, high, side }]
export function profileOf(values, age) {
  if (!values || !(age > 0)) return [];
  return ASPECTS.filter(a => typeof values[a.key] === 'number').map(a => {
    const high = values[a.key] - 125 + age * 0.5 >= 0;   // 高い・低いはクイックBHQドックの「脳の個性」と同じ判定
    return { aspect: a, high, side: high ? a.hi : a.lo };
  });
}

// 相性：部位ごとに合えば+1、逆なら−1。範囲が「回復」のときは回復しやすい場所に+1
export function matchScore(spot, prof, range) {
  const tr = spot.traits;
  let score = 0; const tags = [];
  const rk = ranksOf(spot);
  for (const { aspect, high, side } of prof) {
    // 高めの部位：その日の得意を活かせる特徴に合うか。低めの部位：その部位のランク（A・B なら+1、D・E なら−1）
    const v = high ? side.prefer.reduce((s, [t, dir]) => s + tr[t] * dir, 0) : RANK_POINT[rk[aspect.key].rank];
    score += Math.sign(v);
    if (v > 0) tags.push(side.tag);
  }
  if (range.restore) {
    score += Math.sign(tr.restore);
    if (tr.restore > 0 && !tags.includes('頭を休める')) tags.push('回復しやすい環境');
  }
  return { score, tags };
}

// 出発地から範囲内の名所を、相性 → 距離（遠征系は遠い順・近場系は近い順）で並べる
export function pickSpots({ home, range, prof = [] }) {
  const h = PREF_LATLON[home];
  if (!h) return [];
  return SPOTS.map(s => ({ ...s, km: km(h[0], h[1], s.lat, s.lon) }))
    .filter(s => s.km >= range.min && s.km <= range.max)
    .map(s => ({ ...s, match: matchScore(s, prof, range) }))
    .sort((a, b) => (b.match.score - a.match.score) || (range.prefer === 'far' ? b.km - a.km : a.km - b.km));
}

// ---------------------------------------------------------------- 名所ごとの A〜E ランク（3部位）
// 名所の特徴（−1／0／+1）を、根拠の研究に沿って重み付けして点数にし、決まった区切りで A〜E にする。
// 研究で示された一般的な傾向を当てはめた目安で、その場所に行くとBHQの値が上がることを確かめたものではない。
//   社会性      … 2つの道筋の高いほう＋低いほうの半分（プラスのときだけ。両方にあてはまる場所ほど高い）。人と過ごす＝人と×1.5＋回復(+のときだけ)×0.5（Kokubun 2021, Mars 2012）
//                                      反すうを減らす＝回復×1.5−にぎやか×0.5−人と(+のときだけ)×0.5（Bratman 2015：静かな自然の散歩）
//   認知制御    … 注意の回復＝回復×2−計画×1−にぎやか×0.5（Kaplan 1995, Berman 2008：自然・段取りの少なさ・都市的な刺激の少なさ）
//   モニタリング … ストレスの回復＝回復×1.5−にぎやか×1.5（Ulrich 1991：自然、Lederbogen 2011：都市の刺激）
const pos = x => Math.max(x, 0);
export const RANK_RULES = [
  { key: 'DMN', name: '社会性', cut: [2, 1.75, 1.5, 0], routes: [
    { label: '人と過ごす', f: t => 1.5 * t.social + 0.5 * pos(t.restore), refs: ['kokubun2021', 'mars2012'],
      why: '人と一緒に楽しむ場所ほど高い。ひとり暮らしの人はGM-BHQが低い傾向があり、人とのつながりの大切さが示唆されています' },
    { label: '反すうを減らす', f: t => 1.5 * t.restore - 0.5 * t.lively - 0.5 * pos(t.social), refs: ['bratman2015'],
      why: '静かな自然の中を歩ける場所ほど高い。自然の中の散歩は、くよくよ考える反すうを減らしました' },
  ] },
  { key: 'CEN', name: '認知制御', cut: [2.5, 1.5, 0.5, -0.5], routes: [
    { label: '注意の回復', f: t => 2 * t.restore - t.demand - 0.5 * t.lively, refs: ['kaplan1995', 'berman2008'],
      why: '自然が多く、段取りや人混みの少ない場所ほど高い。自然の中で過ごすと、使い疲れた注意力が回復するという研究（注意回復理論）にもとづきます' },
  ] },
  { key: 'SN', name: 'モニタリング', cut: [3, 1.5, 0, -1.5], routes: [
    { label: 'ストレスの回復', f: t => 1.5 * t.restore - 1.5 * t.lively, refs: ['ulrich1991', 'lederbogen2011'],
      why: '自然が多く、刺激の少ない場所ほど高い。自然の中ではストレスからの回復が早く、都市の刺激はストレス反応を高めやすいという研究にもとづきます' },
  ] },
];
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
export const RANK_POINT = { A: 2, B: 1, C: 0, D: -1, E: -2 };

// spot → { DMN: { rank, v, label, refs }, CEN: …, SN: … }
export function ranksOf(spot) {
  if (spot._ranks) return spot._ranks;
  const out = {};
  for (const rule of RANK_RULES) {
    const rs = rule.routes.map(r => ({ r, v: r.f(spot.traits) })).sort((a, b) => b.v - a.v);
    const v = rs[0].v + (rs[1] ? 0.5 * pos(rs[1].v) : 0);
    const i = rule.cut.findIndex(c => v >= c);
    out[rule.key] = { rank: LETTERS[i < 0 ? 4 : i], v, label: rs[0].r.label, refs: rs[0].r.refs };
  }
  return (spot._ranks = out);
}
