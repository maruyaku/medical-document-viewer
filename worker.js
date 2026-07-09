/**
 * 添文サーチ Phase 2 中継API（Cloudflare Worker）
 *
 * 使い方: GET https://＜あなたのWorker URL＞/?yj=＜YJコード12桁＞&sec=＜セクションキー＞
 *   例: /?yj=1141007F1063&sec=junyu   → カロナール錠200の「9.6 授乳婦」を抽出
 *   デバッグ: &debug=1 を付けると途中経過も返す
 *
 * 仕組み: PMDA公式リダイレクトページ(rdSearch)→電子添文HTML→該当セクション抽出
 * キャッシュ: 24時間（同じ薬の2回目以降はPMDAにアクセスしない）
 */

const SECTIONS = {
  junyu: { no: '9.6', title: '授乳婦' },
  ninpu: { no: '9.5', title: '妊婦' },
  shoni: { no: '9.7', title: '小児等' },
  korei: { no: '9.8', title: '高齢者' },
  jin:   { no: '9.2', title: '腎機能障害患者' },
  kan:   { no: '9.3', title: '肝機能障害患者' },
  kinki: { no: '2',   title: '禁忌' },
  yoho:  { no: '6',   title: '用法及び用量' },
  heiyokinki: { no: '10.1', title: '併用禁忌' },
  heiyochui:  { no: '10.2', title: '併用注意' },
  sogo:  { no: '10',  title: '相互作用' },
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

const UA = { 'User-Agent': 'tenbun-search/2.0 (pharmacy tool; low volume; cached 24h)' };

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const yj = (url.searchParams.get('yj') || '').trim();
    const sec = (url.searchParams.get('sec') || '').trim();
    const debug = url.searchParams.get('debug') === '1';

    if (!/^[0-9A-Z]{12}$/.test(yj)) return json({ ok: false, error: 'YJコードが不正です' }, 400);
    if (!SECTIONS[sec]) return json({ ok: false, error: 'secは ' + Object.keys(SECTIONS).join('/') + ' のいずれか' }, 400);

    // ---- キャッシュ確認（debug時は素通し）----
    const cache = caches.default;
    const cacheKey = new Request('https://cache.tenbun/' + yj + '/' + sec);
    if (!debug) {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    }

    const dbg = {};
    try {
      // ---- ① 公式リダイレクトページを取得 ----
      const rdUrl = 'https://www.pmda.go.jp/PmdaSearch/rdSearch/02/' + yj + '?user=1';
      const r1 = await fetch(rdUrl, { headers: UA, redirect: 'follow' });
      if (!r1.ok) return json({ ok: false, error: 'PMDAページ取得失敗(' + r1.status + ')', rdUrl }, 502);
      const html1 = await r1.text();
      dbg.finalUrl = r1.url;

      // ---- ② 電子添文（HTML版）へのリンクを探す ----
      const links = [];
      const re = /href="([^"]+)"/g;
      let m;
      while ((m = re.exec(html1)) !== null) {
        const href = m[1];
        if (/PmdaSearch\/iyakuDetail\//.test(href)) {
          links.push(new URL(href.replace(/&amp;/g, '&'), r1.url).href);
        }
      }
      dbg.foundLinks = links.slice(0, 10);
      // PDFでないもの（HTML版）を優先。なければ諦める（PDF解析はしない）
      const docUrl = links.find(u => !/PDF/i.test(u) && !/\.pdf/i.test(u));
      if (!docUrl) {
        return json({ ok: false, error: '電子添文HTMLが見つかりません（統一名収載品の可能性）',
                      fallback: rdUrl, ...(debug ? { dbg } : {}) }, 404);
      }

      // ---- ③ 電子添文HTMLを取得してテキスト化 ----
      const r2 = await fetch(docUrl, { headers: UA, redirect: 'follow' });
      if (!r2.ok) return json({ ok: false, error: '電子添文取得失敗(' + r2.status + ')', docUrl }, 502);
      let text = htmlToText(await r2.text());
      dbg.textHead = text.slice(0, 300);

      // ---- ④ セクション切り出し ----
      const { no, title } = SECTIONS[sec];
      const body = sliceSection(text, no, title);
      if (!body) {
        return json({ ok: false, error: '「' + no + ' ' + title + '」の記載が見つかりません（この薬に該当項目がない可能性）',
                      fallback: docUrl, ...(debug ? { dbg } : {}) }, 404);
      }

      const payload = json({
        ok: true, yj, sec, no, title,
        text: body.slice(0, 4000),
        source: docUrl,
        note: '出典: PMDA掲載の電子添文。最終確認は必ず原文で。',
        fetched: new Date().toISOString(),
        ...(debug ? { dbg } : {}),
      });
      if (!debug) {
        const toCache = payload.clone();
        toCache.headers.set('Cache-Control', 'public, max-age=86400');
        ctx.waitUntil(cache.put(cacheKey, toCache));
      }
      return payload;

    } catch (e) {
      return json({ ok: false, error: '内部エラー: ' + e.message, ...(debug ? { dbg } : {}) }, 500);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS } });
}

// HTMLをプレーンテキスト化（改行を保ちながらタグ除去）
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/td|\/th)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t\u3000]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n');
}

// 「9.6 授乳婦」の見出しから、次の同格以上の番号見出しまでを切り出す
// 電子添文ページは冒頭に目次があり同じ見出しが2回出るため、
// 全出現箇所から「中身が最も長いもの」（＝本文側）を採用する
function sliceSection(text, no, title) {
  const noEsc = no.replace('.', '\\.');
  const startRe = new RegExp('(^|\\n)\\s*' + noEsc + '[\\s　.．]*' + title.slice(0, 2), 'g');
  const target = parseNo(no);
  const hasMinor = no.includes('.'); // 「9.6」型か「10」型か
  // 境界見出し: 数字の後がスペース/ピリオドでも、直接カナ・漢字・括弧でもOK（目次形式対応）
  const headRe = /\n\s*(\d{1,2})(?:\.(\d{1,2}))?(?:[\s　.．]|(?=[ぁ-んァ-ヶ一-龠（(]))/g;

  let best = null;
  let sm;
  while ((sm = startRe.exec(text)) !== null) {
    const start = sm.index + sm[1].length;
    headRe.lastIndex = start + 4;
    let end = text.length;
    let hm;
    while ((hm = headRe.exec(text)) !== null) {
      const v = [parseInt(hm[1], 10), hm[2] ? parseInt(hm[2], 10) : 0];
      if (v[0] > 26) continue; // 見出し番号は最大26（電子添文記載要領）
      // 「9.6」型: 9.7や10で終了。「10」型: 10.2は中身として含め、11で終了
      const isBoundary = hasMinor
        ? (v[0] > target[0] || (v[0] === target[0] && v[1] > target[1]))
        : (v[0] > target[0]);
      if (isBoundary) {
        end = hm.index;
        break;
      }
    }
    const cand = text.slice(start, end).trim();
    if (!best || cand.length > best.length) best = cand;
  }
  if (!best) return null;
  // 見出しだけで中身がない（目次しか拾えなかった）場合は記載なし扱い
  if (best.length < 25) return null;
  return best;
}

function parseNo(no) {
  const p = no.split('.');
  return [parseInt(p[0], 10), p[1] ? parseInt(p[1], 10) : 0];
}
