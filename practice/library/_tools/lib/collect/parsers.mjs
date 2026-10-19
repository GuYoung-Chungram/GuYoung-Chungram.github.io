// RSS와 기관별 목록 페이지를 { title, url, date, excerpt } 배열로 바꾼다. 외부 패키지 없이 쓴다.

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', hellip: '…' };
const EXCERPT_MAX = 400;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function decodeEntities(text) {
  return String(text ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

function unwrapCdata(text) {
  return String(text ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

// 이중 인코딩된 본문(&amp;lt;span&amp;gt; …)까지 풀기 위해 태그 제거와 디코딩을 두 번 반복한다.
export function stripHtml(text) {
  let out = unwrapCdata(text);
  for (let pass = 0; pass < 2; pass += 1) {
    out = decodeEntities(out.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' '));
  }
  return out.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleCaseWords(text) {
  return text.replace(/[A-Za-z]{3,}/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

// 날짜를 한국 시간 기준 YYYY-MM-DD로 바꾼다. 읽을 수 없으면 빈 문자열.
export function toIsoDate(raw) {
  const text = unwrapCdata(raw).trim();
  const simple = text.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\.?$/);
  if (simple) return `${simple[1]}-${simple[2].padStart(2, '0')}-${simple[3].padStart(2, '0')}`;
  // 행정안전부 RSS는 요청에 따라 '금, 16 10월 2026 10:00:00 KST' 같은 한국어 날짜를 보낸다.
  const korean = text.match(/(\d{1,2})\s+(\d{1,2})월\s+(\d{4})/);
  if (korean) return `${korean[3]}-${korean[2].padStart(2, '0')}-${korean[1].padStart(2, '0')}`;
  const normalized = titleCaseWords(text.replace(/\bKST\b/i, '+0900'))
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
    .replace(/(\d{2}:\d{2}:\d{2}) ([+-]\d{2}:\d{2})$/, '$1 GMT$2');
  const time = Date.parse(normalized);
  if (Number.isNaN(time)) return '';
  return new Date(time + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function readTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? match[1] : '';
}

export function parseRss(xml) {
  const blocks = String(xml ?? '').match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) ?? [];
  return blocks.map((block) => ({
    title: stripHtml(readTag(block, 'title')),
    url: decodeEntities(unwrapCdata(readTag(block, 'link'))).trim(),
    date: toIsoDate(readTag(block, 'pubDate') || readTag(block, 'dc:date')),
    excerpt: stripHtml(readTag(block, 'description') || readTag(block, 'content:encoded')).slice(0, EXCERPT_MAX),
  })).filter((item) => item.title && item.url);
}

const NIA_VIEW = 'https://www.nia.or.kr/site/nia_kor/ex/bbs/View.do';

// NIA 게시판 목록: <a onclick="doBbsFView('cbIdx','bcIdx','메뉴','parentSeq')" title="제목…"> … <em>YYYY.MM.DD</em>
export function parseNiaBbs(html) {
  const text = String(html ?? '');
  const pattern = /doBbsFView\('(\d+)','(\d+)','[^']*','(\d+)'\)[^>]*?title="([^"]*)"/g;
  const matches = [...text.matchAll(pattern)];
  return matches.map((match, index) => {
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    const dateMatch = text.slice(match.index, end).match(/<em>\s*(\d{4}\.\d{2}\.\d{2})\s*<\/em>/);
    const [, cbIdx, bcIdx, parentSeq, rawTitle] = match;
    return {
      title: decodeEntities(rawTitle).replace(/\(새 글\)/g, '').replace(/-첨부파일 있음$/, '').trim(),
      url: `${NIA_VIEW}?cbIdx=${cbIdx}&bcIdx=${bcIdx}&parentSeq=${parentSeq}`,
      date: dateMatch ? toIsoDate(dateMatch[1]) : '',
      excerpt: '',
    };
  }).filter((item) => item.title);
}

const LIST_PARSER_FUNCTIONS = { 'nia-bbs': parseNiaBbs };

export function parseSource(source, text) {
  if (source.method === 'rss') return parseRss(text);
  const parser = LIST_PARSER_FUNCTIONS[source.parser];
  if (!parser) throw new Error(`알 수 없는 목록 파서: ${source.parser}`);
  return parser(text);
}
