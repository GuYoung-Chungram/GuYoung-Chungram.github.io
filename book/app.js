// 책동무 — 개인 집필 편집자 웹앱 (MVP)
// Firebase Auth(Google) + Firestore + Firebase AI Logic(Gemini). Gemini API 키는 Firebase 쪽에만 있고 이 코드엔 없다.
const FB = 'https://www.gstatic.com/firebasejs/12.12.0/';
const { initializeApp } = await import(FB + 'firebase-app.js');
const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } = await import(FB + 'firebase-auth.js');
const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, writeBatch, deleteField } = await import(FB + 'firebase-firestore.js');
const { getAI, getGenerativeModel, GoogleAIBackend } = await import(FB + 'firebase-ai.js');

const MODEL = 'gemini-flash-lite-latest'; // 고정
const firebaseConfig = {
  apiKey: 'AIzaSyDQ1--EF1iX_UyYdN3zGqP784YafrwSz6A',
  authDomain: 'chaekdongmu.firebaseapp.com',
  projectId: 'chaekdongmu',
  storageBucket: 'chaekdongmu.firebasestorage.app',
  messagingSenderId: '92466986533',
  appId: '1:92466986533:web:b6d697aa0afe31d4f209cc'
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
const ai = getAI(app, { backend: new GoogleAIBackend() });
const mText = getGenerativeModel(ai, { model: MODEL });
const mJson = getGenerativeModel(ai, { model: MODEL, generationConfig: { responseMimeType: 'application/json' } });

/* ───────── 상태·유틸 ───────── */
const S = { user: null, books: [], ideas: [], booksReady: false, ideasReady: false, chapters: {}, chUnsub: {}, decisions: {}, decUnsub: {}, archive: {}, results: {}, chipsOff: new Set(), mode: 'link', leave: null, pending: false, mtab: 'ed' };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const view = $('#view');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const W = { 설계: 10, 초고: 50, 퇴고: 80, 확정: 100 };
const STATUSES = ['설계', '초고', '퇴고', '확정'];
const uid = () => S.user.uid;
const P = {
  user: () => doc(db, 'users', uid()),
  books: () => collection(db, 'users', uid(), 'books'),
  book: b => doc(db, 'users', uid(), 'books', b),
  chapters: b => collection(db, 'users', uid(), 'books', b, 'chapters'),
  chapter: (b, c) => doc(db, 'users', uid(), 'books', b, 'chapters', c),
  body: (b, c) => doc(db, 'users', uid(), 'books', b, 'bodies', c),
  bodies: b => collection(db, 'users', uid(), 'books', b, 'bodies'),
  decisions: b => collection(db, 'users', uid(), 'books', b, 'decisions'),
  decision: (b, d) => doc(db, 'users', uid(), 'books', b, 'decisions', d),
  versions: b => collection(db, 'users', uid(), 'books', b, 'versions'),
  archive: b => collection(db, 'users', uid(), 'books', b, 'archive'),
  archived: (b, c) => doc(db, 'users', uid(), 'books', b, 'archive', c),
  ideas: () => collection(db, 'users', uid(), 'ideas'),
  idea: i => doc(db, 'users', uid(), 'ideas', i),
};
let toastT;
function toast(msg, warn = false, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.className = 'on' + (warn ? ' warn' : '');
  clearTimeout(toastT); toastT = setTimeout(() => t.className = '', ms);
}
const tsDate = ts => ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : (ts ? new Date(ts) : null));
function fmt(ts, withTime = true) {
  const d = tsDate(ts); if (!d) return '방금';
  const s = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return withTime ? `${s} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : s;
}
const hhmm = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const countChars = s => (s || '').replace(/\n/g, '').length; // 공백 포함, 줄바꿈 제외
const num = n => (n || 0).toLocaleString('ko-KR');
const debouncers = {};
function debounce(key, fn, ms) { clearTimeout(debouncers[key]); debouncers[key] = setTimeout(fn, ms); }
const bookById = id => S.books.find(b => b.id === id);
const chaptersOf = id => S.chapters[id] || [];
const titleOf = b => b?.workingTitle || b?.topic || '제목 없는 책';
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('프롬프트를 복사했어요. Claude·ChatGPT에 붙여 넣으세요.'); }
  catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('프롬프트를 복사했어요.'); }
}
function parseJSON(t) {
  try { return JSON.parse(t); } catch { }
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/); if (m) { try { return JSON.parse(m[1]); } catch { } }
  const a = t.indexOf('['), o = t.indexOf('{');
  const st = (a >= 0 && (o < 0 || a < o)) ? a : o; if (st < 0) return null;
  try { return JSON.parse(t.slice(st, t.lastIndexOf(t[st] === '[' ? ']' : '}') + 1)); } catch { return null; }
}
async function callAI(prompt, json = false) {
  const r = await (json ? mJson : mText).generateContent(prompt);
  return r.response.text();
}
function aiErr(e) {
  console.error('[책동무 AI]', e);
  const m = String(e?.message || e);
  if (/quota|429|RESOURCE_EXHAUSTED/i.test(m)) return 'AI 사용 한도에 걸렸어요. 잠시 후 다시 해 주세요. (급하면 [프롬프트 복사]로 다른 AI 사용)';
  return 'AI 요청이 실패했어요: ' + m.slice(0, 120);
}
const FACT_RE = /\d|%|퍼센트|통계|조사에|연구|논문|따르면|의하면|출처|보고서/;

/* ───────── 진척 계산 (저장하지 않고 계산) ───────── */
function progress(book, chs) {
  const goalCh = book.goal?.chapters || 0;
  const n = Math.max(goalCh, chs.length) || 1;
  const statusPct = Math.round(chs.reduce((a, c) => a + (W[c.status] || 0), 0) / n);
  const chars = chs.reduce((a, c) => a + (c.chars || 0), 0);
  const charPct = book.goal?.chars ? Math.min(100, Math.round(chars / book.goal.chars * 100)) : 0;
  let weeks = null, perWeek = null, dday = null;
  if (book.goal?.dueDate) {
    const due = new Date(book.goal.dueDate + 'T23:59:59');
    const days = Math.ceil((due - new Date()) / 86400000); dday = days;
    weeks = Math.max(days / 7, 0);
    const left = Math.max((book.goal.chars || 0) - chars, 0);
    perWeek = weeks > 0 ? Math.ceil(left / Math.max(weeks, 1)) : left;
  }
  return { statusPct, chars, charPct, weeks, perWeek, dday };
}
const sorted = chs => [...chs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
function autoNext(book, chs) {
  const id = book.id;
  if (!book.confirmed?.plan) return { text: '기획서(독자·약속) 쓰고 확정하기', href: `#/book/${id}/plan` };
  if (!book.confirmed?.title) return { text: '제목 후보 받고 가제 정하기', href: `#/book/${id}/title` };
  if (!book.confirmed?.toc) return { text: '목차와 장별 질문 확정하기', href: `#/book/${id}/toc` };
  const list = sorted(chs);
  const i = list.findIndex(c => c.status !== '확정');
  if (i < 0) return { text: '모든 장 확정! 전체 검수는 다음 버전에서', href: `#/book/${id}` };
  const c = list[i], n = i + 1;
  const verb = { 설계: '초고 쓰기', 초고: '퇴고하기', 퇴고: '확정하기' }[c.status] || '초고 쓰기';
  return { text: `${n}장 「${c.title || '제목 없음'}」 ${verb}`, href: `#/book/${id}/write/${c.id}` };
}
function nextAction(book, chs) {
  if (book.nextAction) return { text: book.nextAction, href: `#/book/${book.id}`, manual: true };
  return autoNext(book, chs);
}

/* ───────── 구독 ───────── */
let unsubBooks, unsubIdeas;
function startSubs() {
  unsubBooks = onSnapshot(query(P.books(), orderBy('updatedAt', 'desc')), snap => {
    S.books = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    S.booksReady = true; S.books.forEach(b => watchBook(b.id));
    if (!snap.metadata.hasPendingWrites) snap.docChanges().forEach(c => c.type !== 'removed' && S.chapters[c.doc.id] && queueSync(c.doc.id));
    soft();
  }, denied);
  unsubIdeas = onSnapshot(query(P.ideas(), orderBy('createdAt', 'desc')), snap => {
    S.ideas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    S.ideasReady = true; soft();
  }, denied);
}
function watchBook(id) {
  if (S.chUnsub[id]) return;
  S.chUnsub[id] = onSnapshot(query(P.chapters(id), orderBy('order')), snap => {
    S.chapters[id] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (snap.docChanges().length) queueSync(id);
    soft('chapters', id);
  }, e => console.warn(e));
  S.decUnsub[id] = onSnapshot(query(P.decisions(id), orderBy('createdAt')), snap => {
    S.decisions[id] = snap.docs.map(d => ({ id: d.id, ...d.data() })); if (S.chapters[id]) queueSync(id); soft('decisions', id);
  }, e => console.warn(e));
  onSnapshot(P.archive(id), snap => { S.archive[id] = snap.docs.map(d => ({ id: d.id, ...d.data() })); soft('archive', id); }, e => console.warn(e));
}
function denied(e) {
  console.error(e);
  if (e?.code === 'permission-denied') {
    view.innerHTML = `<div class="auth card"><h2>이 계정은 들어올 수 없어요</h2><p class="muted">책동무는 대표님 계정 전용입니다.</p><button class="btn" id="out">다른 계정으로 로그인</button></div>`;
    $('#out').onclick = () => signOut(auth);
  }
}

/* 입력 중에는 화면을 다시 그리지 않는다 */
let softTimer;
function soft(kind, id) {
  if (S.route?.name === 'write') { if (S.route.bookId === id || !id) writeSideRefresh(kind); return; }
  clearTimeout(softTimer);
  softTimer = setTimeout(() => {
    const a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && view.contains(a)) { S.pending = true; return; }
    render();
  }, 60);
}
document.addEventListener('focusout', () => setTimeout(() => {
  const a = document.activeElement;
  if (S.pending && !(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && view.contains(a))) { S.pending = false; render(); }
}, 150));

/* ───────── 라우터 ───────── */
function parse() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const p = path.split('/').filter(Boolean);
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  if (!p.length) return { name: 'shelf' };
  if (p[0] === 'ideas') return { name: 'ideas' };
  if (p[0] === 'new') return { name: 'new', q };
  if (p[0] === 'book' && p[1]) {
    if (!p[2]) return { name: 'book', bookId: p[1] };
    if (p[2] === 'write') return { name: 'write', bookId: p[1], chId: p[3] };
    return { name: p[2], bookId: p[1] };
  }
  return { name: 'shelf' };
}
window.addEventListener('hashchange', async () => { if (S.leave) { const f = S.leave; S.leave = null; await f(); } render(); });
window.addEventListener('pagehide', () => S.leave && S.leave());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S.flush) S.flush(); });

function setTop(crumbHTML, actionsHTML = '') {
  $('#crumb').innerHTML = crumbHTML || '';
  $('#topActions').innerHTML = actionsHTML;
}
function render() {
  if (!S.user) return;
  const r = S.route = parse();
  document.body.dataset.view = r.name;
  view.className = r.name === 'write' ? 'wide' : '';
  if (!S.booksReady || !S.ideasReady) { view.innerHTML = '<div class="loading"><span class="spin"></span> 불러오는 중…</div>'; return; }
  const fn = { shelf: vShelf, ideas: vIdeas, new: vNew, book: vBook, plan: vPlan, title: vTitle, toc: vToc, write: vWrite }[r.name] || vShelf;
  fn(r);
}

/* ───────── 1. 책장 ───────── */
function vShelf() {
  setTop('', `${fsBadge()}<a class="btn sm" href="#/ideas">💡 글감 서랍</a><a class="btn sm primary" href="#/new">+ 새 책</a><button class="btn sm ghost" id="logout" title="로그아웃">⎋</button>`);
  $('#logout').onclick = () => signOut(auth); bindFsBadge();
  const books = S.books;
  if (!books.length) {
    view.innerHTML = `<div class="empty card"><h1>첫 책을 꽂아 볼까요?</h1><p>주제와 완성선(장 수·분량·목표일)만 정하면, 어디까지 왔는지와 다음 할 일을 책동무가 챙깁니다.</p>
    <div class="row" style="justify-content:center;margin-top:16px"><a class="btn lg primary" href="#/new">+ 새 책 만들기</a><a class="btn lg" href="#/ideas">💡 글감 먼저 담기</a></div></div>`;
    return;
  }
  const focus = books.find(b => b.focus) || books[0];
  const others = books.filter(b => b !== focus);
  const fc = chaptersOf(focus.id), fp = progress(focus, fc), fn = nextAction(focus, fc);
  const last = focus.lastChapterId && fc.find(c => c.id === focus.lastChapterId);
  const drawerN = S.ideas.filter(i => (i.status || 'drawer') === 'drawer').length;
  view.innerHTML = `
  <div class="focus-card">
    <div>
      <div class="eyebrow">지금 집중하는 책</div>
      <h1>${esc(titleOf(focus))}</h1>
      <div class="muted small">${esc(focus.topic || '')}</div>
      <div class="next"><b>다음 할 일</b>${esc(fn.text)}</div>
      <div class="row">
        <a class="btn accent lg" href="${last ? `#/book/${focus.id}/write/${last.id}` : fn.href}">${last ? `이어 쓰기 · ${esc(last.title || '')}` : '바로 하기'} →</a>
        <a class="btn lg" href="#/book/${focus.id}">진척판</a>
      </div>
    </div>
    <div class="stack" style="gap:12px">
      <div><div class="row"><span class="pct">${fp.statusPct}%</span><span class="muted small">장 상태 기준 진척</span></div><div class="bar" style="margin-top:8px"><i style="width:${fp.statusPct}%"></i></div></div>
      <div><div class="row small"><b>분량</b><span class="muted">${num(fp.chars)} / ${num(focus.goal?.chars)}자 (${fp.charPct}%)</span></div><div class="bar green" style="margin-top:6px"><i style="width:${fp.charPct}%"></i></div></div>
      <div class="small muted">${focus.goal?.dueDate ? `목표일 ${esc(focus.goal.dueDate)} · ${fp.dday >= 0 ? `D-${fp.dday}` : `${-fp.dday}일 지남`} · 주당 ${num(fp.perWeek)}자 필요` : '목표일 미정'}</div>
      <div class="small muted">마지막 작업 ${fmt(focus.updatedAt)}</div>
    </div>
  </div>
  <div class="row section"><h2 style="margin:0" class="grow">책장</h2><a class="btn sm" href="#/ideas">💡 글감 서랍 ${drawerN ? `<span class="badge accent">${drawerN}</span>` : ''}</a></div>
  ${others.length ? `<div class="shelf">${others.map(b => {
    const c = chaptersOf(b.id), p = progress(b, c), n = nextAction(b, c);
    return `<div class="card book-card" data-go="#/book/${b.id}">
      <div class="t">${esc(titleOf(b))}</div>
      <div class="bar"><i style="width:${p.statusPct}%"></i></div>
      <div class="small"><b>${p.statusPct}%</b> <span class="muted">· ${num(p.chars)}자 · ${b.goal?.dueDate ? '목표 ' + esc(b.goal.dueDate) : '목표일 미정'}</span></div>
      <div class="small muted grow">다음: ${esc(n.text)}</div>
      <div class="row small"><span class="muted grow">${fmt(b.updatedAt, false)}</span><button class="btn sm" data-focus="${b.id}">집중하기</button></div>
    </div>`;
  }).join('')}</div>` : `<p class="muted small">다른 책은 아직 없어요. 글감은 서랍에 자유롭게 모으고, 마무리는 한 권씩.</p>`}`;
  $$('[data-go]').forEach(el => el.onclick = e => { if (e.target.closest('[data-focus]')) return; location.hash = el.dataset.go; });
  $$('[data-focus]').forEach(el => el.onclick = () => setFocus(el.dataset.focus));
}
async function setFocus(id) {
  const b = writeBatch(db);
  S.books.forEach(x => { if (x.focus && x.id !== id) b.update(P.book(x.id), { focus: false }); });
  b.update(P.book(id), { focus: true, updatedAt: serverTimestamp() });
  await b.commit(); toast('집중하는 책을 바꿨어요.');
}

/* ───────── 2. 글감 서랍 ───────── */
let ideaTab = 'drawer', ideaOpen = null, ideaDel = null;
function vIdeas() {
  setTop(`<a href="#/">책장</a> › 글감 서랍`, `<a class="btn sm" href="#/new">+ 새 책</a>`);
  const list = S.ideas.filter(i => ideaTab === 'all' || (i.status || 'drawer') === ideaTab || (ideaTab === 'used' && i.status !== 'drawer' && i.status));
  const focus = S.books.find(b => b.focus) || S.books[0];
  view.innerHTML = `
  <h1>💡 글감 서랍</h1>
  <p class="muted small" style="margin:0 0 10px">떠오르면 한 줄. 엔터로 저장. 무르익으면 책으로 시작하거나 쓰던 책 자료로 보내세요.</p>
  <form class="idea-input" id="ideaForm"><input id="ideaIn" placeholder="떠오른 글감 한 줄…" autocomplete="off" enterkeyhint="done"><button class="btn primary" style="border-radius:14px">저장</button></form>
  <div class="tabs" id="itabs">${[['drawer', '서랍'], ['used', '보낸·시작한'], ['all', '전체']].map(([k, l]) => `<button data-t="${k}" class="${ideaTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
  <div class="card" style="padding:0;margin-top:12px">${list.length ? list.map(i => {
    const st = i.status || 'drawer';
    const linked = i.linkedBookId && bookById(i.linkedBookId);
    const open = ideaOpen === i.id;
    return `<div class="idea" data-id="${i.id}">
      <div class="tx" data-open="${i.id}">${esc(i.text)}</div>
      <div class="meta">${fmt(i.createdAt)} ${st === 'book' ? `· <span class="badge green">책으로 시작</span>` : ''}${st === 'sent' ? `· <span class="badge blue">자료로 보냄${linked ? ': ' + esc(titleOf(linked)) : ''}</span>` : ''}${i.note ? ' · 메모 있음' : ''}${i.fromBookId ? ' · AI 결과에서 담음' : ''}</div>
      ${open ? `<div class="more">
        <textarea data-note="${i.id}" placeholder="생각이 자라면 여기에 덧붙이기…">${esc(i.note || '')}</textarea>
        <div class="row" style="margin-top:8px">
          <a class="btn sm primary" href="#/new?idea=${i.id}">📗 책으로 시작</a>
          ${S.books.length ? `<select data-sendsel="${i.id}" style="width:auto;padding:5px 8px;font-size:13px">${S.books.map(b => `<option value="${b.id}" ${b === focus ? 'selected' : ''}>${esc(titleOf(b))}</option>`).join('')}</select><button class="btn sm" data-send="${i.id}">이 책 자료로 보내기</button>` : ''}
          ${st !== 'drawer' ? `<button class="btn sm ghost" data-back="${i.id}">서랍으로 되돌리기</button>` : ''}
          <span class="grow"></span>
          <button class="btn sm ghost" data-del="${i.id}">${ideaDel === i.id ? '한 번 더 누르면 삭제' : '삭제'}</button>
        </div></div>` : ''}
    </div>`;
  }).join('') : `<div class="empty small">${ideaTab === 'drawer' ? '서랍이 비었어요. 위에 한 줄 적어 보세요.' : '아직 없어요.'}</div>`}</div>`;
  const inp = $('#ideaIn');
  if (!matchMedia('(max-width:860px)').matches || !S.ideas.length) inp.focus();
  $('#ideaForm').onsubmit = async e => {
    e.preventDefault(); const text = inp.value.trim(); if (!text) return;
    inp.value = '';
    const tags = (text.match(/#[^\s#]+/g) || []).map(t => t.slice(1));
    addDoc(P.ideas(), { text, note: '', tags, status: 'drawer', linkedBookId: null, createdAt: serverTimestamp() });
    toast('서랍에 담았어요 ✓', false, 1400); inp.focus();
  };
  $$('#itabs button').forEach(b => b.onclick = () => { ideaTab = b.dataset.t; vIdeas(); });
  $$('[data-open]').forEach(el => el.onclick = () => { ideaOpen = ideaOpen === el.dataset.open ? null : el.dataset.open; ideaDel = null; vIdeas(); });
  $$('[data-note]').forEach(t => t.oninput = () => debounce('note' + t.dataset.note, () => updateDoc(P.idea(t.dataset.note), { note: t.value }), 800));
  $$('[data-send]').forEach(b => b.onclick = async () => {
    const id = b.dataset.send, bk = $(`[data-sendsel="${id}"]`).value;
    await updateDoc(P.idea(id), { status: 'sent', linkedBookId: bk });
    updateDoc(P.book(bk), { updatedAt: serverTimestamp() });
    toast(`「${titleOf(bookById(bk))}」 자료로 보냈어요. 집필 화면 '펼치기'에 보여요.`);
  });
  $$('[data-back]').forEach(b => b.onclick = () => updateDoc(P.idea(b.dataset.back), { status: 'drawer', linkedBookId: null }));
  $$('[data-del]').forEach(b => b.onclick = () => {
    if (ideaDel === b.dataset.del) { deleteDoc(P.idea(b.dataset.del)); ideaDel = null; ideaOpen = null; toast('삭제했어요.'); }
    else { ideaDel = b.dataset.del; vIdeas(); }
  });
}

/* ───────── 3. 새 책 ───────── */
function vNew(r) {
  setTop(`<a href="#/">책장</a> › 새 책`);
  const idea = r.q?.idea && S.ideas.find(i => i.id === r.q.idea);
  const due = new Date(); due.setMonth(due.getMonth() + 3);
  view.innerHTML = `
  <div class="card" style="max-width:720px;margin:0 auto">
    <h1>새 책 만들기</h1>
    <p class="muted small" style="margin:0">1단계: 주제·글감과 목적. 그리고 '어디까지 가면 완성인지' 완성선을 정합니다.</p>
    ${idea ? `<div class="next small"><b>글감 서랍에서 가져옴</b>${esc(idea.text)}</div>` : ''}
    <label class="label">주제 *</label><input id="nTopic" value="${esc(idea?.text || '')}" placeholder="예: AI 시대의 리더십, 경험→성찰→실천으로 다시 쓰기">
    <label class="label">글감 (떠오르는 이야기·사례·경험, 자유롭게)</label><textarea id="nSeeds" rows="4">${esc(idea?.note || '')}</textarea>
    <label class="label">목적 (이 책을 왜 쓰는가 / 독자가 무엇을 얻는가)</label><textarea id="nPurpose" rows="2"></textarea>
    <h3 style="margin-top:22px">완성선</h3>
    <div class="row" style="align-items:flex-start">
      <div class="grow"><label class="label">장 수</label><input id="nCh" type="number" min="1" value="10"></div>
      <div class="grow"><label class="label">목표 분량 (글자 수, 공백 포함)</label><input id="nChars" type="number" min="1000" step="1000" value="100000"><div class="hint">일반 단행본 약 8만~12만 자</div></div>
      <div class="grow"><label class="label">목표일</label><input id="nDue" type="date" value="${due.toISOString().slice(0, 10)}"></div>
    </div>
    <div class="row end" style="margin-top:22px"><a class="btn" href="#/">취소</a><button class="btn primary lg" id="nGo">책장에 꽂기 →</button></div>
  </div>
  <div class="card" style="max-width:720px;margin:16px auto 0">
    <h3>이미 쓰던 원고로 시작하기</h3>
    <p class="small muted" style="margin:0 0 10px">txt·md 파일 하나 = 한 장. 파일 하나에 여러 장이 들어 있으면 '1장', '# 제목' 같은 구분으로 나눕니다.</p>
    <div class="row">${FS.perm !== 'unsupported' ? `<button class="btn" id="impFolder">📂 작업중_books 폴더에서</button>` : ''}
      <label class="btn">📄 파일 올리기<input type="file" id="impFiles" accept=".txt,.md,.markdown,text/plain" multiple hidden></label></div>
    <div id="impBox" style="margin-top:10px"></div>
  </div>`;
  importUI();
  $('#nTopic').focus();
  $('#nGo').onclick = async () => {
    const topic = $('#nTopic').value.trim(); if (!topic) { toast('주제를 한 줄이라도 적어 주세요.', true); return; }
    $('#nGo').disabled = true;
    const hasFocus = S.books.some(b => b.focus);
    const ref = await addDoc(P.books(), {
      workingTitle: '', titleCandidates: [], topic, seeds: $('#nSeeds').value.trim(), purpose: $('#nPurpose').value.trim(),
      goal: { chapters: +$('#nCh').value || 10, chars: +$('#nChars').value || 100000, dueDate: $('#nDue').value || '' },
      plan: { reader: '', problem: '', promise: '', inScope: '', outScope: '' },
      stageStatus: { topic: 'confirmed' }, confirmed: {}, versionCount: {}, review: {}, focus: !hasFocus, nextAction: '', memo: '',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    if (idea) updateDoc(P.idea(idea.id), { status: 'book', linkedBookId: ref.id });
    toast('책장에 꽂았어요. 이제 기획서부터!');
    location.hash = `#/book/${ref.id}/plan`;
  };
}

/* ───────── 4. 책 홈 (진척판) ───────── */
const STAGES = [
  ['1', '주제·글감', 'topic'], ['2', '기획서', 'plan'], ['3', '제목·가제', 'title'], ['4', '목차', 'toc'],
  ['5', '자료 검증', 'later'], ['6', '집필·퇴고', 'write'], ['7', '전체 검수', 'later'], ['8', '제목·표지·내보내기', 'later']
];
function stageState(book, key, chs) {
  if (key === 'later') return 'later';
  if (key === 'topic') return 'done';
  if (key === 'write') {
    if (!book.confirmed?.toc) return 'locked';
    return chs.length && chs.every(c => c.status === '확정') ? 'done' : 'now';
  }
  const st = book.stageStatus?.[key];
  if (st === 'modified') return 'mod';
  if (book.confirmed?.[key]) return 'done';
  const order = ['plan', 'title', 'toc'], i = order.indexOf(key);
  if (i === 0 || book.confirmed?.[order[i - 1]]) return 'now';
  return 'locked';
}
function stagesHTML(book, chs) {
  return `<div class="stages">${STAGES.map(([n, l, k]) => {
    const s = stageState(book, k, chs);
    const href = { plan: `#/book/${book.id}/plan`, title: `#/book/${book.id}/title`, toc: `#/book/${book.id}/toc`, write: chs[0] ? `#/book/${book.id}/write/${(book.lastChapterId && chs.find(c => c.id === book.lastChapterId) ? book.lastChapterId : sorted(chs)[0].id)}` : '' }[k];
    const tag = { done: '확정', now: '지금', mod: '확정 후 수정됨', locked: '잠김', later: '이후' }[s];
    const inner = `<b>${n}단계 · ${tag}</b>${l}`;
    return href && s !== 'locked' ? `<a class="stage ${s}" href="${href}">${inner}</a>` : `<div class="stage ${s}">${inner}</div>`;
  }).join('')}</div>`;
}
function reviewItems(book, chs) {
  const items = [];
  if (book.review?.title) items.push({ k: 'title', label: '가제', reason: book.review.title });
  if (book.review?.toc) items.push({ k: 'toc', label: '목차', reason: book.review.toc });
  chs.filter(c => c.needsReview).forEach(c => items.push({ k: 'ch:' + c.id, label: `${(sorted(chs).indexOf(c) + 1)}장 ${c.title || ''}`, reason: c.reviewReason || '' }));
  return items;
}
async function clearReviews(book, keys) {
  const b = writeBatch(db);
  keys.forEach(k => {
    if (k === 'title' || k === 'toc') b.update(P.book(book.id), { ['review.' + k]: deleteField() });
    else b.update(P.chapter(book.id, k.slice(3)), { needsReview: false, reviewReason: '' });
  });
  await b.commit(); toast('확인함으로 처리했어요.');
}
function vBook(r) {
  const book = bookById(r.bookId);
  if (!book) { view.innerHTML = '<div class="empty">책을 찾을 수 없어요. <a href="#/">책장으로</a></div>'; return; }
  const chs = sorted(chaptersOf(book.id)), p = progress(book, chs), n = nextAction(book, chs), auto = autoNext(book, chs);
  const revs = reviewItems(book, chs);
  const sent = S.ideas.filter(i => i.status === 'sent' && i.linkedBookId === book.id);
  setTop(`<a href="#/">책장</a> › ${esc(titleOf(book))}`, `${fsBadge()}<button class="btn sm" id="dl">⬇ Markdown 내려받기</button>`);
  view.innerHTML = `
  <div class="row" style="align-items:flex-end">
    <div class="grow"><div class="muted small">${book.focus ? '<span class="badge accent">집중하는 책</span> ' : ''}진척판</div><h1>${esc(titleOf(book))}</h1><div class="muted small">${esc(book.topic)}</div></div>
    ${book.focus ? '' : `<button class="btn sm" id="mkFocus">집중하는 책으로</button>`}
  </div>
  <div class="section">${stagesHTML(book, chs)}</div>
  <div class="cols section">
    <div class="stack">
      <div class="card">
        <div class="row" style="align-items:flex-end"><span class="pct">${p.statusPct}%</span><span class="muted small grow">장 상태 가중치(설계10·초고50·퇴고80·확정100) 평균</span></div>
        <div class="bar" style="margin:10px 0 14px"><i style="width:${p.statusPct}%"></i></div>
        <div class="row small"><b>분량</b><span class="muted">${num(p.chars)} / ${num(book.goal?.chars)}자 · ${p.charPct}%</span></div>
        <div class="bar green" style="margin-top:6px"><i style="width:${p.charPct}%"></i></div>
        <div class="small" style="margin-top:12px">${book.goal?.dueDate ? `<b>남은 길</b> <span class="muted">목표일 ${esc(book.goal.dueDate)} · ${p.dday >= 0 ? `D-${p.dday} · 약 ${Math.max(Math.ceil(p.weeks), 0)}주 남음 · 주당 <b style="color:var(--ink)">${num(p.perWeek)}자</b> 필요` : `${-p.dday}일 지남`}</span>` : '<span class="muted">목표일을 정하면 주당 필요 분량을 계산해 드려요.</span>'}</div>
      </div>
      <div class="card">
        <h3>다음 할 일 ${n.manual ? '<span class="badge amber">직접 정함</span>' : '<span class="badge">자동 제안</span>'}</h3>
        <div class="next" style="margin-top:0">${esc(n.text)}</div>
        <div class="row"><a class="btn primary" href="${n.manual ? auto.href : n.href}">하러 가기 →</a>
          <input id="naIn" placeholder="직접 정하기 (예: 3장 사례 하나 더 찾기)" style="flex:1;min-width:180px;padding:7px 10px" value="${esc(book.nextAction || '')}">
          <button class="btn sm" id="naSave">정하기</button>${n.manual ? `<button class="btn sm ghost" id="naAuto">자동으로</button>` : ''}</div>
      </div>
      <div class="card">
        <div class="row"><h3 class="grow" style="margin:0">장별 상태</h3>${chs.length ? `<span class="small muted">${STATUSES.map(s => `<span class="st-${s}"><span class="sdot"></span>${s} ${chs.filter(c => c.status === s).length}</span>`).join(' ')}</span>` : ''}</div>
        ${chs.length ? `<div class="chgrid" style="margin-top:12px">${chs.map((c, i) => `<a class="chtile st-${c.status || '설계'}" href="${book.confirmed?.toc ? `#/book/${book.id}/write/${c.id}` : `#/book/${book.id}/toc`}">
          <div class="n">${i + 1}장 ${c.needsReview ? '<span class="badge warn">재검토</span>' : ''}</div><div class="tt">${esc(c.title || '제목 없음')}</div>
          <div class="small"><span class="badge stbadge">${c.status || '설계'}</span> <span class="muted">${num(c.chars)}자</span></div></a>`).join('')}</div>`
      : `<p class="muted small">목차를 확정하면 장이 여기에 깔립니다. <a href="#/book/${book.id}/toc">목차로 →</a></p>`}
      </div>
    </div>
    <div class="stack">
      ${revs.length ? `<div class="card"><div class="row"><h3 class="grow" style="margin:0;color:var(--warn)">재검토 필요 ${revs.length}</h3><button class="btn sm" id="revAll">모두 확인함</button></div>
        ${revs.map(x => `<div class="review" style="margin-top:8px"><b>${esc(x.label)}</b><span class="grow">${esc(x.reason)}</span><button class="btn sm" data-rev="${x.k}">확인함</button></div>`).join('')}</div>` : ''}
      <div class="card">
        <h3>완성선</h3>
        <div class="row" style="align-items:flex-start">
          <div class="grow"><label class="label" style="margin-top:0">장 수</label><input type="number" id="gCh" value="${book.goal?.chapters || ''}"></div>
          <div class="grow"><label class="label" style="margin-top:0">목표 분량(자)</label><input type="number" id="gChars" step="1000" value="${book.goal?.chars || ''}"></div>
        </div>
        <label class="label">목표일</label><input type="date" id="gDue" value="${esc(book.goal?.dueDate || '')}">
      </div>
      <div class="card"><h3>경험 메모 <span class="muted small">(집필 '펼치기'에 함께 보여요)</span></h3><textarea id="memo" rows="5" placeholder="강의 현장 일화, 코칭 장면, 떠오른 비유…">${esc(book.memo || '')}</textarea></div>
      <div class="card"><h3>이 책 자료 <span class="muted small">(서랍에서 보낸 글감 ${sent.length})</span></h3>
        ${sent.length ? sent.map(i => `<div class="small" style="padding:6px 0;border-bottom:1px solid var(--line2)">• ${esc(i.text)}${i.note ? `<div class="muted">${esc(i.note.slice(0, 120))}</div>` : ''}</div>`).join('') : '<p class="muted small" style="margin:0">글감 서랍에서 [이 책 자료로 보내기]를 누르면 여기로 옵니다.</p>'}</div>
      ${FS.perm !== 'unsupported' ? publishCardHTML(book, chs) : ''}
      <div class="card small muted">주제: ${esc(book.topic)}<br>목적: ${esc(book.purpose || '—')}<br><a href="#/book/${book.id}/plan">주제·글감·목적 고치기 →</a>
        ${book.folder ? `<br>📁 ${WORK}/${esc(book.folder)}` : ''}${book.published ? `<br>📚 books/${esc(book.published.name)}` : ''}</div>
    </div>
  </div>`;
  $('#dl').onclick = () => exportMarkdown(book); bindFsBadge(); bindPublish(book);
  $('#mkFocus') && ($('#mkFocus').onclick = () => setFocus(book.id));
  $('#naSave').onclick = () => { updateDoc(P.book(book.id), { nextAction: $('#naIn').value.trim() }); toast('다음 할 일을 정했어요.'); };
  $('#naAuto') && ($('#naAuto').onclick = () => updateDoc(P.book(book.id), { nextAction: '' }));
  const g = () => updateDoc(P.book(book.id), { goal: { chapters: +$('#gCh').value || 0, chars: +$('#gChars').value || 0, dueDate: $('#gDue').value || '' }, updatedAt: serverTimestamp() });
  ['#gCh', '#gChars', '#gDue'].forEach(s => $(s).onchange = () => { g(); toast('완성선을 바꿨어요.'); });
  $('#memo').oninput = () => debounce('memo', () => updateDoc(P.book(book.id), { memo: $('#memo').value }), 900);
  $$('[data-rev]').forEach(b => b.onclick = () => clearReviews(book, [b.dataset.rev]));
  $('#revAll') && ($('#revAll').onclick = () => clearReviews(book, revs.map(x => x.k)));
}

/* ───────── 확정·재검토 (6장 규칙) ───────── */
function tocSnapshot(chs) { return sorted(chs).map((c, i) => ({ id: c.id, order: i, title: c.title || '', question: c.question || '', message: c.message || '' })); }
async function confirmStage(book, target) {
  const chs = chaptersOf(book.id);
  const snap = target === 'plan' ? { topic: book.topic, seeds: book.seeds || '', purpose: book.purpose || '', ...book.plan }
    : target === 'title' ? book.workingTitle : tocSnapshot(chs);
  const prev = book.confirmed?.[target];
  const number = (book.versionCount?.[target] || 0) + 1;
  const b = writeBatch(db);
  b.set(doc(P.versions(book.id)), { target, targetId: book.id, number, snapshot: snap, createdAt: serverTimestamp() });
  const up = { ['confirmed.' + target]: snap, ['stageStatus.' + target]: 'confirmed', ['versionCount.' + target]: number, updatedAt: serverTimestamp() };
  if (prev) { // 다시 확정 → 지우지 않고 '재검토 필요'만
    if (target === 'plan') {
      const changed = ['reader', 'problem', 'promise', 'inScope', 'outScope', 'topic', 'purpose'].filter(k => (prev[k] || '') !== (snap[k] || ''));
      const why = '기획서 변경(' + (changed.map(k => ({ reader: '독자', problem: '독자의 문제', promise: '핵심 약속', inScope: '다룰 범위', outScope: '다루지 않을 것', topic: '주제', purpose: '목적' }[k])).join('·') || '세부') + ')';
      if (changed.length) {
        if (book.confirmed?.title) up['review.title'] = why + ' — 가제가 여전히 맞는지';
        if (book.confirmed?.toc) up['review.toc'] = why + ' — 목차가 여전히 맞는지';
        chs.forEach(c => b.update(P.chapter(book.id, c.id), { needsReview: true, reviewReason: why + ' — 이 장의 질문·메시지 확인' }));
      }
    }
    if (target === 'toc') {
      const pm = Object.fromEntries((prev || []).map(x => [x.id, x]));
      snap.forEach(x => {
        const o = pm[x.id]; const c = chs.find(y => y.id === x.id);
        if (!o || !c || !c.chars) return;
        const diffs = [];
        if (o.title !== x.title) diffs.push(`제목 「${o.title}」→「${x.title}」`);
        if (o.question !== x.question) diffs.push(`질문 「${o.question}」→「${x.question}」`);
        if (o.message !== x.message) diffs.push(`메시지 「${o.message}」→「${x.message}」`);
        if (o.order !== x.order) diffs.push(`순서 ${o.order + 1}장→${x.order + 1}장`);
        if (diffs.length) b.update(P.chapter(book.id, x.id), { needsReview: true, reviewReason: '목차 변경: ' + diffs.join(', ') });
      });
    }
  }
  b.update(P.book(book.id), up);
  await b.commit(); queueSync(book.id);
  toast(`${{ plan: '기획서', title: '가제', toc: '목차' }[target]} v${number} 확정! ${prev ? '영향받는 곳에 재검토 표시를 붙였어요.' : '다음 단계가 열렸어요.'}`, false, 3500);
}
function markModified(book, target) {
  if (book.stageStatus?.[target] === 'confirmed') updateDoc(P.book(book.id), { ['stageStatus.' + target]: 'modified' });
}
function statusBadge(book, target) {
  const st = book.stageStatus?.[target], v = book.versionCount?.[target];
  if (st === 'confirmed') return `<span class="badge green">확정 v${v}</span>`;
  if (st === 'modified') return `<span class="badge amber">확정 후 수정됨 · 다시 확정 전까지 v${v} 사용</span>`;
  return `<span class="badge">작성 중</span>`;
}
function stageHead(book, target, title, who) {
  return `<div class="stagehead"><div class="grow"><div class="muted small"><a href="#/book/${book.id}">← 진척판</a> · ${who}</div><h2>${title} ${statusBadge(book, target)}</h2></div></div>`;
}
const planBrief = p => p ? `대표 독자: ${p.reader || '-'}\n독자의 문제: ${p.problem || '-'}\n책의 핵심 약속: ${p.promise || '-'}\n다룰 범위: ${p.inScope || '-'}\n다루지 않을 것: ${p.outScope || '-'}` : '';
const AUTHOR = '저자는 정구영(청람) 박사 — 22년 차 기업교육·HRD/OD 컨설턴트, KAIST 겸임교수(리더십), ICF PCC 코치. 교육 철학은 "경험→성찰→실천".';

/* ───────── 5. 기획서 ───────── */
function vPlan(r) {
  const book = bookById(r.bookId); if (!book) return vBook(r);
  setTop(`<a href="#/">책장</a> › <a href="#/book/${book.id}">${esc(titleOf(book))}</a> › 기획서`);
  const p = book.plan || {};
  const F = [['reader', '대표 독자', '한 사람을 떠올리듯 구체적으로 (예: 팀장 3년 차, AI 도입을 떠안은 중간관리자)'], ['problem', '독자의 문제', '독자가 지금 막혀 있는 지점'], ['promise', '책의 핵심 약속', '이 책을 다 읽으면 독자가 얻는 것, 한두 문장'], ['inScope', '다룰 범위', ''], ['outScope', '다루지 않을 것', '']];
  view.innerHTML = `${stageHead(book, 'plan', '2단계 · 한 장짜리 기획서', '독자와 책의 약속')}
  <div class="cols">
    <div class="card">
      <h3>1단계 · 주제·글감·목적</h3>
      <label class="label" style="margin-top:0">주제</label><input data-f="topic" value="${esc(book.topic)}">
      <label class="label">글감</label><textarea data-f="seeds" rows="3">${esc(book.seeds || '')}</textarea>
      <label class="label">목적</label><textarea data-f="purpose" rows="2">${esc(book.purpose || '')}</textarea>
      <h3 style="margin-top:24px">기획서</h3>
      ${F.map(([k, l, h]) => `<label class="label">${l}</label><textarea data-p="${k}" rows="${k === 'promise' ? 3 : 2}" placeholder="${esc(h)}">${esc(p[k] || '')}</textarea>`).join('')}
      <div class="row end" style="margin-top:18px"><span class="small muted grow" id="pSave"></span><button class="btn primary lg" id="pConfirm">기획서 확정 →</button></div>
    </div>
    <div class="stack">
      <div class="card"><h3>AI 초안 <span class="muted small">(딕·카미)</span></h3>
        <p class="small muted" style="margin:0 0 10px">주제·글감·목적을 보고 기획서 다섯 칸의 초안을 씁니다. 받은 뒤 대표님이 고치고 확정하세요.</p>
        <div class="row"><button class="btn accent" id="pAI">✦ AI 초안 받기</button><button class="btn" id="pCopy">프롬프트 복사</button></div>
        <div id="pOut"></div></div>
      <div class="card small muted">확정하면 이 시점의 사본이 버전으로 남고 3단계(제목)가 열립니다. 확정 뒤 고치면 '확정 후 수정됨'이 되고, 다시 확정할 때까지 AI와 다음 단계는 이전 확정본을 씁니다.</div>
    </div>
  </div>`;
  const prompt = () => `${AUTHOR}\n너희는 저자의 출판 편집팀(딕: 기획·독자, 카미: 정리)이다. 아래 재료로 '한 장짜리 책 기획서' 초안을 한국어로 써라.\n\n[주제] ${book.topic}\n[글감] ${book.seeds || '-'}\n[목적] ${book.purpose || '-'}\n\n반드시 JSON 하나만 출력: {"reader":"대표 독자(한 사람처럼 구체적으로)","problem":"독자의 문제","promise":"책의 핵심 약속 1~2문장","inScope":"다룰 범위(쉼표로 4~6개)","outScope":"다루지 않을 것(2~4개)"}\n사실·통계를 지어내지 마라.`;
  $$('[data-f]').forEach(el => el.oninput = () => debounce('f' + el.dataset.f, () => { updateDoc(P.book(book.id), { [el.dataset.f]: el.value, updatedAt: serverTimestamp() }); markModified(book, 'plan'); $('#pSave').textContent = '저장됨 ' + hhmm(); }, 700));
  $$('[data-p]').forEach(el => el.oninput = () => debounce('p' + el.dataset.p, () => { updateDoc(P.book(book.id), { ['plan.' + el.dataset.p]: el.value, updatedAt: serverTimestamp() }); markModified(book, 'plan'); $('#pSave').textContent = '저장됨 ' + hhmm(); }, 700));
  $('#pCopy').onclick = () => copy(prompt());
  $('#pAI').onclick = async () => {
    const b = $('#pAI'); b.disabled = true; b.innerHTML = '<span class="spin"></span> 딕·카미가 쓰는 중…';
    try {
      const j = parseJSON(await callAI(prompt(), true)); if (!j) throw new Error('응답 형식을 읽지 못했어요');
      S.planDraft = j;
      $('#pOut').innerHTML = `<div class="ai-box"><div class="who">초안 · 딕·카미</div>${F.map(([k, l]) => `<div class="small" style="margin-top:6px"><b>${l}</b><br>${esc(j[k] || '')}</div>`).join('')}
        <div class="row" style="margin-top:10px"><button class="btn sm primary" id="pApplyEmpty">빈 칸에만 넣기</button><button class="btn sm" id="pApplyAll">전부 덮어쓰기</button></div></div>`;
      const apply = all => { const up = { updatedAt: serverTimestamp() }; F.forEach(([k]) => { if (j[k] && (all || !(book.plan?.[k] || '').trim())) up['plan.' + k] = j[k]; }); updateDoc(P.book(book.id), up); markModified(book, 'plan'); toast('초안을 넣었어요. 대표님 말로 고쳐 주세요.'); };
      $('#pApplyEmpty').onclick = () => apply(false); $('#pApplyAll').onclick = () => apply(true);
    } catch (e) { toast(aiErr(e), true, 5000); }
    b.disabled = false; b.textContent = '✦ AI 초안 받기';
  };
  $('#pConfirm').onclick = async () => {
    const fresh = bookById(book.id);
    if (!['reader', 'promise'].every(k => (fresh.plan?.[k] || '').trim())) { toast('최소한 대표 독자와 핵심 약속은 채워 주세요.', true); return; }
    await confirmStage(fresh, 'plan'); location.hash = `#/book/${book.id}/title`;
  };
}

/* ───────── 6. 제목 후보·가제 ───────── */
function vTitle(r) {
  const book = bookById(r.bookId); if (!book) return vBook(r);
  setTop(`<a href="#/">책장</a> › <a href="#/book/${book.id}">${esc(titleOf(book))}</a> › 제목`);
  if (!book.confirmed?.plan) { view.innerHTML = lockedHTML(book, '기획서', 'plan'); return; }
  const cands = book.titleCandidates || [];
  const list = [...cands.map((c, i) => ({ ...c, i }))].sort((a, b) => (b.star ? 1 : 0) - (a.star ? 1 : 0));
  view.innerHTML = `${stageHead(book, 'title', '3단계 · 제목 후보와 가제', '딕의 제목 제안')}
  <div class="cols">
    <div class="card">
      <div class="next" style="margin-top:0"><b>지금 가제</b><span style="font-family:var(--serif);font-size:20px;font-weight:700">${esc(book.workingTitle || '— 아직 없음 —')}</span></div>
      ${book.review?.title ? `<div class="review"><b>재검토</b><span class="grow">${esc(book.review.title)}</span><button class="btn sm" id="tRev">확인함</button></div>` : ''}
      <h3 style="margin-top:16px">후보 ${cands.length}</h3>
      ${list.length ? list.map(c => `<div class="cand"><button class="star ${c.star ? 'on' : ''}" data-star="${c.i}">★</button><input data-edit="${c.i}" value="${esc(c.text)}">${c.why ? `<span class="small muted" style="max-width:34%">${esc(c.why)}</span>` : ''}<button class="btn sm" data-pick="${c.i}">가제로</button><button class="btn sm ghost" data-rm="${c.i}">✕</button></div>`).join('') : '<p class="muted small">AI 후보를 받거나 직접 적어 보세요.</p>'}
      <form class="row" id="tAddF" style="margin-top:12px"><input id="tAdd" placeholder="직접 떠오른 제목 추가" class="grow" style="flex:1"><button class="btn">추가</button></form>
      <div class="row end" style="margin-top:18px"><button class="btn primary lg" id="tConfirm" ${book.workingTitle ? '' : 'disabled'}>가제 확정 →</button></div>
      <p class="hint">제목은 여기서 '가제'만 정하고, 8단계에서 최종 확정합니다.</p>
    </div>
    <div class="stack"><div class="card"><h3>AI 제목 후보 <span class="muted small">(딕)</span></h3>
      <p class="small muted" style="margin:0 0 10px">확정된 기획서(v${book.versionCount?.plan || 1})의 독자·약속을 보고 10개를 제안합니다.</p>
      <div class="row"><button class="btn accent" id="tAI">✦ 후보 10개 받기</button><button class="btn" id="tCopy">프롬프트 복사</button></div></div>
      <div class="card small muted"><b>기획서 핵심</b><div style="white-space:pre-wrap;margin-top:6px">${esc(planBrief(book.confirmed.plan))}</div></div></div>
  </div>`;
  const save = arr => updateDoc(P.book(book.id), { titleCandidates: arr, updatedAt: serverTimestamp() });
  const prompt = () => `${AUTHOR}\n너는 출판 기획자 '딕'이다. 아래 확정 기획서를 보고 서점 매대에서 눈에 띌 한국어 책 제목 후보 10개를 제안하라. 서로 다른 각도(약속형, 질문형, 은유형, 숫자형, 도발형 등)로.\n\n[주제] ${book.topic}\n${planBrief(book.confirmed.plan)}\n${cands.length ? '\n[이미 있는 후보 — 겹치지 말 것] ' + cands.map(c => c.text).join(' / ') : ''}\n\nJSON 배열만 출력: [{"title":"제목(부제는 ' : ' 뒤에)","why":"한 줄 이유"}]`;
  $('#tCopy').onclick = () => copy(prompt());
  $('#tAI').onclick = async () => {
    const b = $('#tAI'); b.disabled = true; b.innerHTML = '<span class="spin"></span> 딕이 고르는 중…';
    try {
      const j = parseJSON(await callAI(prompt(), true)); if (!Array.isArray(j)) throw new Error('응답 형식을 읽지 못했어요');
      await save([...(bookById(book.id).titleCandidates || []), ...j.filter(x => x.title).map(x => ({ text: x.title, why: x.why || '', star: false, by: 'AI' }))]);
      toast(`후보 ${j.length}개를 받았어요. 마음에 드는 건 ★`);
    } catch (e) { toast(aiErr(e), true, 5000); b.disabled = false; b.textContent = '✦ 후보 10개 받기'; }
  };
  const cur = () => [...(bookById(book.id).titleCandidates || [])];
  $$('[data-star]').forEach(el => el.onclick = () => { const a = cur(); a[+el.dataset.star].star = !a[+el.dataset.star].star; save(a); });
  $$('[data-edit]').forEach(el => el.onchange = () => { const a = cur(); a[+el.dataset.edit].text = el.value; save(a); });
  $$('[data-rm]').forEach(el => el.onclick = () => { const a = cur(); a.splice(+el.dataset.rm, 1); save(a); });
  $$('[data-pick]').forEach(el => el.onclick = () => { const t = cur()[+el.dataset.pick].text; updateDoc(P.book(book.id), { workingTitle: t, updatedAt: serverTimestamp() }); markModified(book, 'title'); toast(`가제: ${t}`); });
  $('#tAddF').onsubmit = e => { e.preventDefault(); const v = $('#tAdd').value.trim(); if (!v) return; save([...cur(), { text: v, why: '', star: true, by: '대표님' }]); };
  $('#tRev') && ($('#tRev').onclick = () => clearReviews(book, ['title']));
  $('#tConfirm').onclick = async () => { await confirmStage(bookById(book.id), 'title'); location.hash = `#/book/${book.id}/toc`; };
}
function lockedHTML(book, prevName, prevKey) {
  return `<div class="card empty"><h2>🔒 아직 잠겨 있어요</h2><p>${prevName}을(를) 먼저 확정하면 열립니다.</p><a class="btn primary" href="#/book/${book.id}/${prevKey}">${prevName}으로 →</a></div>`;
}

/* ───────── 7. 목차 ───────── */
function vToc(r) {
  const book = bookById(r.bookId); if (!book) return vBook(r);
  setTop(`<a href="#/">책장</a> › <a href="#/book/${book.id}">${esc(titleOf(book))}</a> › 목차`);
  if (!book.confirmed?.title) { view.innerHTML = lockedHTML(book, '가제', 'title'); return; }
  const chs = sorted(chaptersOf(book.id)), arch = S.archive[book.id] || [];
  view.innerHTML = `${stageHead(book, 'toc', '4단계 · 목차와 장별 핵심 질문', `가제 「${esc(book.workingTitle)}」`)}
  ${book.review?.toc ? `<div class="review" style="margin-bottom:12px"><b>재검토</b><span class="grow">${esc(book.review.toc)}</span><button class="btn sm" id="ocRev">확인함</button></div>` : ''}
  <div class="cols">
    <div class="card">
      <div class="row"><h3 class="grow" style="margin:0">${chs.length}장 <span class="muted small">/ 완성선 ${book.goal?.chapters || '-'}장</span></h3><span class="small muted" id="oSave"></span></div>
      ${chs.length ? chs.map((c, i) => `<div class="toc-row" data-id="${c.id}">
        <div class="num">${i + 1}</div>
        <div class="fields">
          <input class="ttl" data-k="title" value="${esc(c.title || '')}" placeholder="장 제목">
          <input data-k="question" value="${esc(c.question || '')}" placeholder="핵심 질문 — 이 장이 답하는 질문">
          <input data-k="message" value="${esc(c.message || '')}" placeholder="핵심 메시지 — 독자가 가져갈 한 문장">
          ${c.needsReview ? `<div class="review small"><b>재검토</b> ${esc(c.reviewReason || '')}</div>` : ''}
          ${c.chars ? `<div class="small muted">원고 ${num(c.chars)}자 · ${c.status}</div>` : ''}
        </div>
        <div class="ops"><button class="btn sm ghost" data-up="${i}" ${i ? '' : 'disabled'}>↑</button><button class="btn sm ghost" data-down="${i}" ${i < chs.length - 1 ? '' : 'disabled'}>↓</button><button class="btn sm ghost" data-out="${c.id}" title="목차에서 빼기(보관함)">✕</button></div>
      </div>`).join('') : '<p class="muted small">AI 목차 제안을 받거나 장을 하나씩 추가하세요.</p>'}
      <div class="row" style="margin-top:12px"><button class="btn" id="oAdd">+ 장 추가</button><span class="grow"></span><button class="btn primary lg" id="oConfirm" ${chs.length ? '' : 'disabled'}>목차 확정 →</button></div>
      ${arch.length ? `<div class="section"><h3>보관함 <span class="muted small">(목차에서 뺀 장 — 지우지 않았어요)</span></h3>${arch.map(a => `<div class="row small" style="padding:6px 0;border-bottom:1px solid var(--line2)"><span class="grow">${esc(a.title || '제목 없음')} <span class="muted">· ${num(a.chars)}자</span></span><button class="btn sm" data-restore="${a.id}">목차로 되돌리기</button></div>`).join('')}</div>` : ''}
    </div>
    <div class="stack"><div class="card"><h3>AI 목차 제안 <span class="muted small">(딕·메이린)</span></h3>
      <p class="small muted" style="margin:0 0 10px">확정 기획서와 가제로 ${book.goal?.chapters || 10}장 목차·장별 질문·메시지를 제안합니다.</p>
      <div class="row"><button class="btn accent" id="oAI">✦ 목차 제안 받기</button><button class="btn" id="oCopy">프롬프트 복사</button></div><div id="oOut"></div></div>
      <div class="card small muted">확정하면 장별 집필이 열립니다. 다시 확정하면 내용·순서가 바뀐 장의 원고에만 '재검토 필요'가 붙고, 원고는 그대로 둡니다.</div></div>
  </div>`;
  const n = book.goal?.chapters || 10;
  const prompt = () => `${AUTHOR}\n너희는 출판 편집팀(딕: 독자 관점, 메이린: 논리 흐름)이다. 아래 책의 목차를 정확히 ${n}장으로 설계하라. 장마다 독자가 다음 장을 읽고 싶게 이어지도록, 경험→성찰→실천의 흐름을 살려라.\n\n[가제] ${book.workingTitle}\n[주제] ${book.topic}\n${planBrief(book.confirmed.plan)}\n\nJSON 배열만 출력: [{"title":"장 제목","question":"이 장이 답하는 핵심 질문","message":"독자가 가져갈 핵심 메시지 한 문장"}]`;
  const saveField = (id, k, v) => debounce('o' + id + k, () => { updateDoc(P.chapter(book.id, id), { [k]: v, updatedAt: serverTimestamp() }); markModified(bookById(book.id), 'toc'); $('#oSave') && ($('#oSave').textContent = '저장됨 ' + hhmm()); }, 700);
  $$('.toc-row').forEach(row => $$('input', row).forEach(inp => inp.oninput = () => saveField(row.dataset.id, inp.dataset.k, inp.value)));
  const swap = async (i, j) => { const b = writeBatch(db); b.update(P.chapter(book.id, chs[i].id), { order: j }); b.update(P.chapter(book.id, chs[j].id), { order: i }); await b.commit(); markModified(book, 'toc'); };
  const renumber = async list => { const b = writeBatch(db); list.forEach((c, i) => b.update(P.chapter(book.id, c.id), { order: i })); await b.commit(); };
  $$('[data-up]').forEach(b => b.onclick = () => swap(+b.dataset.up, +b.dataset.up - 1));
  $$('[data-down]').forEach(b => b.onclick = () => swap(+b.dataset.down, +b.dataset.down + 1));
  $('#oAdd').onclick = async () => { await addDoc(P.chapters(book.id), newCh(chs.length, {})); markModified(book, 'toc'); };
  $$('[data-out]').forEach(b => b.onclick = async () => {
    const c = chs.find(x => x.id === b.dataset.out); const bt = writeBatch(db);
    const bsnap = await getDoc(P.body(book.id, c.id)); const text = bsnap.exists() ? bsnap.data().text || '' : '';
    if (text.trim()) bt.set(P.archived(book.id, c.id), { ...c, body: text, archivedAt: serverTimestamp() });
    bt.delete(P.chapter(book.id, c.id)); bt.delete(P.body(book.id, c.id)); await bt.commit();
    await renumber(chs.filter(x => x.id !== c.id)); markModified(book, 'toc'); queueSync(book.id);
    toast(text.trim() ? '보관함으로 옮겼어요. 언제든 되돌릴 수 있어요.' : '빈 장을 뺐어요.');
  });
  $$('[data-restore]').forEach(b => b.onclick = async () => {
    const a = arch.find(x => x.id === b.dataset.restore); const { archivedAt, id, body, ...rest } = a;
    const bt = writeBatch(db); bt.set(P.chapter(book.id, a.id), { ...rest, order: chs.length, needsReview: true, reviewReason: '보관함에서 되돌림 — 자리와 흐름 확인', updatedAt: serverTimestamp() }); bt.set(P.body(book.id, a.id), { text: body || '', updatedAt: serverTimestamp() }); bt.delete(P.archived(book.id, a.id)); await bt.commit(); markModified(book, 'toc'); queueSync(book.id);
  });
  $('#ocRev') && ($('#ocRev').onclick = () => clearReviews(book, ['toc']));
  $('#oCopy').onclick = () => copy(prompt());
  $('#oAI').onclick = async () => {
    const b = $('#oAI'); b.disabled = true; b.innerHTML = '<span class="spin"></span> 목차 짜는 중…';
    try {
      const j = parseJSON(await callAI(prompt(), true)); if (!Array.isArray(j)) throw new Error('응답 형식을 읽지 못했어요');
      S.tocDraft = j;
      const cur = sorted(chaptersOf(book.id));
      $('#oOut').innerHTML = `<div class="ai-box"><div class="who">초안 · 딕·메이린</div>${j.map((x, i) => `<div class="small" style="padding:6px 0;border-bottom:1px solid var(--line2)"><b>${i + 1}. ${esc(x.title)}</b><br><span class="muted">Q. ${esc(x.question)}<br>→ ${esc(x.message)}</span> <button class="btn sm" data-addone="${i}">추가</button></div>`).join('')}
        <div class="row" style="margin-top:10px">${cur.length ? `<span class="small muted">이미 장이 있어서 하나씩 [추가]만 할 수 있어요.</span>` : `<button class="btn sm primary" id="oApply">이 목차로 깔기</button>`}</div></div>`;
      $('#oApply') && ($('#oApply').onclick = async () => { const bt = writeBatch(db); j.forEach((x, i) => bt.set(doc(P.chapters(book.id)), newCh(i, x))); await bt.commit(); markModified(book, 'toc'); toast('목차를 깔았어요. 대표님 말로 다듬어 주세요.'); });
      $$('[data-addone]').forEach(el => el.onclick = async () => { await addDoc(P.chapters(book.id), newCh(chaptersOf(book.id).length, j[+el.dataset.addone])); el.disabled = true; el.textContent = '추가됨'; markModified(book, 'toc'); });
    } catch (e) { toast(aiErr(e), true, 5000); }
    b.disabled = false; b.textContent = '✦ 목차 제안 받기';
  };
  $('#oConfirm').onclick = async () => {
    if (chaptersOf(book.id).some(c => !(c.title || '').trim())) { toast('제목 없는 장이 있어요.', true); return; }
    await confirmStage(bookById(book.id), 'toc'); location.hash = `#/book/${book.id}`;
  };
}
function newCh(order, x) {
  return { order, title: x.title || '', question: x.question || '', message: x.message || '', status: '설계', chars: 0, needsReview: false, reviewReason: '', cursor: 0, updatedAt: serverTimestamp() };
}

/* ───────── 8. 집필 화면 + 맥락 패널 + AI ───────── */
function vWrite(r) {
  const book = bookById(r.bookId); if (!book) return vBook(r);
  if (!book.confirmed?.toc) { setTop(`<a href="#/">책장</a> › ${esc(titleOf(book))}`); view.innerHTML = lockedHTML(book, '목차', 'toc'); return; }
  const chs = sorted(chaptersOf(book.id));
  if (!chs.length) { view.innerHTML = '<div class="loading"><span class="spin"></span></div>'; return; }
  const ch = chs.find(c => c.id === r.chId) || chs[0];
  if (ch.id !== r.chId) { location.replace(`#/book/${book.id}/write/${ch.id}`); return; }
  const idx = chs.indexOf(ch);
  setTop(`<a href="#/">책장</a> › <a href="#/book/${book.id}">${esc(titleOf(book))}</a> › ${idx + 1}장`, `${fsBadge()}<a class="btn sm" href="#/ideas" title="글감 서랍">💡</a>`);
  bindFsBadge();
  const W_ = S.w = { bookId: book.id, chId: ch.id, dirty: false, loaded: false };
  view.innerHTML = `
  <div class="mtabs" id="mtabs"><button data-m="list">목차</button><button data-m="ed">원고</button><button data-m="ctx">맥락·AI</button></div>
  <div class="write">
    <aside class="wpane wleft" id="wl"></aside>
    <section class="wpane wcenter st-${ch.status || '설계'}" id="wc">
      <div class="whead">
        <div class="row"><span class="ttl grow">${idx + 1}장 · ${esc(ch.title || '제목 없음')}</span><span class="savestate" id="ss">불러오는 중…</span></div>
        <div class="q">${ch.question ? `<b>Q.</b> ${esc(ch.question)}` : ''} ${ch.message ? ` <span class="muted">→ ${esc(ch.message)}</span>` : ''}</div>
        <div class="row"><div class="seg" id="seg">${STATUSES.map(s => `<button class="st-${s} ${ch.status === s ? 'on' : ''}" data-st="${s}">${s}</button>`).join('')}</div><span class="grow"></span><span class="small"><b id="cc">${num(ch.chars)}</b><span class="muted">자</span></span></div>
        <div id="revBox">${ch.needsReview ? `<div class="review"><b>재검토 필요</b><span class="grow">${esc(ch.reviewReason || '')}</span><button class="btn sm" id="wRev">확인함</button></div>` : ''}</div>
      </div>
      <textarea id="ed" spellcheck="false" disabled placeholder="여기에 씁니다. Markdown 그대로 저장돼요. (# 소제목, **굵게**)\n막히면 오른쪽 '맥락·AI'에 방향 메모 몇 줄 → 카미가 초안을 씁니다."></textarea>
    </section>
    <aside class="wpane wright" id="wr"></aside>
  </div>`;
  const ed = $('#ed');
  const ss = $('#ss');
  const setSS = (t, err) => { ss.textContent = t; ss.classList.toggle('err', !!err); };
  // 이 장 본문만 읽는다 (책장·진척판은 본문을 읽지 않음)
  getDoc(P.body(book.id, ch.id)).then(snap => {
    if (S.w !== W_) return;
    ed.value = snap.exists() ? (snap.data().text || '') : '';
    ed.disabled = false; W_.loaded = true;
    setSS('저장됨 ' + fmt(ch.updatedAt));
    const pos = Math.min(ch.cursor || 0, ed.value.length);
    if (!matchMedia('(max-width:860px)').matches) ed.focus();
    ed.setSelectionRange(pos, pos);
    requestAnimationFrame(() => {
      if (ch.scrollTop) ed.scrollTop = ch.scrollTop;
      else { const ratio = ed.value.length ? pos / ed.value.length : 0; ed.scrollTop = Math.max(0, ed.scrollHeight * ratio - 160); }
    });
  }).catch(e => { console.error(e); setSS('본문을 불러오지 못했어요 — 새로고침해 주세요', true); });
  if (book.lastChapterId !== ch.id) updateDoc(P.book(book.id), { lastChapterId: ch.id });
  localStorage.setItem('cdm_last', JSON.stringify({ bookId: book.id, chId: ch.id }));
  // 모바일 탭
  const setM = m => { S.mtab = m; $$('#mtabs button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); $('#wl').classList.toggle('mon', m === 'list'); $('#wc').classList.toggle('mon', m === 'ed'); $('#wr').classList.toggle('mon', m === 'ctx'); };
  $$('#mtabs button').forEach(b => b.onclick = () => setM(b.dataset.m)); setM('ed');
  // 자동저장: 본문 문서 1개 + 장 정보(글자 수·커서) 1개, 책 '마지막 작업'은 1분에 한 번
  const save = async () => {
    if (!W_.dirty || !W_.loaded) return; W_.dirty = false;
    const text = ed.value, chars = countChars(text);
    setSS(navigator.onLine ? '저장 중…' : '기기에 저장됨 · 연결되면 올림');
    const b = writeBatch(db);
    b.set(P.body(book.id, ch.id), { text, updatedAt: serverTimestamp() });
    b.update(P.chapter(book.id, ch.id), { chars, cursor: ed.selectionStart, scrollTop: ed.scrollTop, updatedAt: serverTimestamp() });
    if (Date.now() - (S.bookTouch?.[book.id] || 0) > 60000) { (S.bookTouch ||= {})[book.id] = Date.now(); b.update(P.book(book.id), { updatedAt: serverTimestamp(), lastChapterId: ch.id }); }
    const p1 = b.commit();
    S.bodyCache = { key: book.id + '/' + ch.id, text };
    queueSync(book.id, ch.id, text);
    try { await p1; if (S.w === W_) setSS('저장됨 ' + hhmm()); }
    catch (e) { console.error(e); W_.dirty = true; if (S.w === W_) { setSS('저장 실패 — 다시 시도 중', true); debounce('save', save, 4000); } }
  };
  const saveCursor = () => debounce('cursor', () => { if (!W_.dirty && W_.loaded) updateDoc(P.chapter(book.id, ch.id), { cursor: ed.selectionStart, scrollTop: ed.scrollTop }); }, 4000);
  ed.addEventListener('input', () => { W_.dirty = true; $('#cc').textContent = num(countChars(ed.value)); setSS('입력 중…'); debounce('save', save, 2000); });
  ed.addEventListener('keyup', e => { if (!e.key.startsWith('Arrow') && e.key !== 'PageUp' && e.key !== 'PageDown') return; saveCursor(); });
  ed.addEventListener('click', saveCursor);
  S.flush = () => { clearTimeout(debouncers.save); return save(); };
  S.leave = async () => { clearTimeout(debouncers.save); await Promise.race([save(), new Promise(r => setTimeout(r, 1200))]); S.flush = null; };
  // 장 상태
  $$('#seg button').forEach(b => b.onclick = async () => {
    const st = b.dataset.st; await S.flush();
    const up = { status: st, updatedAt: serverTimestamp() };
    if (st === '확정') {
      const n = (ch.versions || 0) + 1; up.versions = n;
      addDoc(P.versions(book.id), { target: 'chapter', targetId: ch.id, number: n, snapshot: { title: ch.title, body: ed.value, chars: countChars(ed.value) }, createdAt: serverTimestamp() });
    }
    await updateDoc(P.chapter(book.id, ch.id), up);
    updateDoc(P.book(book.id), { updatedAt: serverTimestamp() });
    $('#wc').className = `wpane wcenter st-${st}` + (S.mtab === 'ed' ? ' mon' : '');
    $$('#seg button').forEach(x => x.classList.toggle('on', x.dataset.st === st));
    queueSync(book.id);
    toast(st === '확정' ? `${idx + 1}장 확정! 사본을 버전으로 남겼어요.` : `${idx + 1}장 → ${st}`);
  });
  $('#wRev') && ($('#wRev').onclick = () => { clearReviews(book, ['ch:' + ch.id]); $('#revBox').innerHTML = ''; });
  S.ctxDrawn = false; writeSideRefresh();
}
function writeSideRefresh(kind) {
  if (!S.w || S.route?.name !== 'write') return;
  const book = bookById(S.w.bookId), chs = sorted(chaptersOf(S.w.bookId));
  if (!book) return;
  const wl = $('#wl'); if (!wl) return;
  if (kind === 'chapters' || !kind) wl.innerHTML = `<div class="small muted" style="padding:0 6px 8px"><b style="color:var(--ink)">${esc(titleOf(book))}</b><br>${progress(book, chs).statusPct}% · ${num(progress(book, chs).chars)}자</div>` +
    chs.map((c, i) => `<a class="chi st-${c.status || '설계'} ${c.id === S.w.chId ? 'on' : ''}" href="#/book/${book.id}/write/${c.id}"><span class="sdot"></span>${i + 1}. ${esc(c.title || '제목 없음')}${c.needsReview ? ' <span class="badge warn">재검토</span>' : ''}<div class="c">${c.status} · ${num(c.chars)}자</div></a>`).join('') +
    `<div style="padding:10px 6px"><a class="small" href="#/book/${book.id}/toc">목차 고치기 →</a></div>`;
  if (kind === 'chapters' && S.ctxDrawn) return;
  const a = document.activeElement;
  if (a && $('#wr')?.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) { S.ctxPending = true; return; }
  renderCtx(); S.ctxDrawn = true;
}
document.addEventListener('focusout', e => setTimeout(() => {
  if (S.ctxPending && S.route?.name === 'write' && !$('#wr')?.contains(document.activeElement)) { S.ctxPending = false; renderCtx(); }
}, 200));

/* 맥락 패널 */
function ctxItems() {
  const book = bookById(S.w.bookId), chs = sorted(chaptersOf(S.w.bookId)), ch = chs.find(c => c.id === S.w.chId);
  const i = chs.indexOf(ch), prev = chs[i - 1];
  const decs = (S.decisions[book.id] || []).filter(d => !d.chapterId || d.chapterId === ch.id);
  const cp = book.confirmed?.plan || {};
  const link = [
    { k: 'plan', h: '기획서 핵심 (확정본)', t: `독자: ${cp.reader || '-'}\n약속: ${cp.promise || '-'}` },
    { k: 'chq', h: `이 장의 질문·메시지 — ${i + 1}장`, t: `질문: ${ch.question || '-'}\n메시지: ${ch.message || '-'}` },
    { k: 'dec', h: `지난 결정 ${decs.length}`, t: decs.length ? decs.map(d => `• ${d.text}`).join('\n') : '(아직 없음 — AI 결과의 [결정으로 기록])', decs },
    { k: 'prev', h: '앞 장 핵심 메시지', t: prev ? `${i}장 「${prev.title}」: ${prev.message || '-'}` : '(첫 장)' },
    { k: 'around', h: '커서 앞뒤 문단', t: '(요청할 때 커서 위치에서 자동으로 잘라 보냅니다)' },
  ];
  const drawer = S.ideas.filter(x => (x.status || 'drawer') === 'drawer').slice(0, 12);
  const sent = S.ideas.filter(x => x.status === 'sent' && x.linkedBookId === book.id);
  const others = S.books.filter(b => b.id !== book.id);
  const spread = [
    { k: 'chq', h: `이 장의 질문 — ${i + 1}장`, t: `질문: ${ch.question || '-'}\n메시지: ${ch.message || '-'}` },
    { k: 'sent', h: `이 책 자료 ${sent.length}`, t: sent.length ? sent.map(x => `• ${x.text}${x.note ? ' — ' + x.note.slice(0, 100) : ''}`).join('\n') : '(서랍에서 보낸 글감 없음)' },
    { k: 'drawer', h: `글감 서랍 ${drawer.length}`, t: drawer.length ? drawer.map(x => `• ${x.text}`).join('\n') : '(비어 있음)' },
    { k: 'other', h: `다른 책의 글감 ${others.length}`, t: others.length ? others.map(b => `• ${titleOf(b)}: ${(b.seeds || b.topic || '').slice(0, 120)}`).join('\n') : '(다른 책 없음)' },
    { k: 'memo', h: '경험 메모', t: book.memo || '', memo: true },
    { k: 'around', h: '커서 앞뒤 문단', t: '(요청할 때 자동으로)' },
  ];
  return S.mode === 'link' ? link : spread;
}
function renderCtx() {
  const wr = $('#wr'); if (!wr || !S.w) return;
  const keepMemo = document.activeElement?.id === 'dirMemo' ? $('#dirMemo').value : null;
  const memoVal = keepMemo ?? (S.dirMemo || '');
  const items = ctxItems();
  const res = S.results[S.w.chId] || [];
  wr.innerHTML = `
    <div class="tabs" id="modeTabs"><button data-mode="link" class="${S.mode === 'link' ? 'on' : ''}">🔗 잇기</button><button data-mode="spread" class="${S.mode === 'spread' ? 'on' : ''}">🌿 펼치기</button></div>
    <div class="hint">${S.mode === 'link' ? '흐름을 이어 쓸 때 — 확정된 맥락을 함께 보냅니다.' : '막혔을 때 — 글감·경험을 펼쳐 "논리보다 넓게" 요청합니다.'} 칩을 눌러 빼고 넣을 수 있어요.</div>
    <div class="chips">${items.map(x => `<button class="chip ${S.chipsOff.has(S.mode + x.k) ? 'off' : ''}" data-chip="${x.k}">${esc(x.h.split(' —')[0])}</button>`).join('')}</div>
    ${items.map(x => `<div class="ctxbox ${S.chipsOff.has(S.mode + x.k) ? 'off' : ''}"><div class="h">${esc(x.h)}</div>${x.memo ? `<textarea id="memoIn" rows="3" placeholder="강의 현장 일화, 코칭 장면…" style="font-size:13px">${esc(x.t)}</textarea>` : `<div class="body">${esc(x.t)}</div>`}
      ${x.decs?.length ? `<div class="small" style="margin-top:4px">${x.decs.map(d => `<button class="btn sm ghost" data-deldec="${d.id}" title="결정 지우기">✕ ${esc(d.text.slice(0, 14))}…</button>`).join(' ')}</div>` : ''}</div>`).join('')}
    <label class="label">방향 메모 <span class="muted small">(대표님은 방향만 — 몇 줄이면 충분)</span></label>
    <textarea id="dirMemo" rows="3" placeholder="예: 신입 팀장 첫 1:1 실패담으로 시작, 경청이 기술이 아니라 태도라는 쪽으로">${esc(memoVal)}</textarea>
    <div class="row" style="margin-top:8px">
      <button class="btn accent" data-ai="draft">✦ 초안 받기 (카미)</button>
      <button class="btn" data-ai="ideas">다음 문단 아이디어</button>
      <button class="btn" data-ai="easier">더 쉽게</button>
      <button class="btn ghost" id="cpy">프롬프트 복사</button>
    </div>
    <div id="results">${res.map((x, i) => resultHTML(x, i)).join('')}</div>`;
  $$('[data-mode]', wr).forEach(b => b.onclick = () => { S.mode = b.dataset.mode; renderCtx(); });
  $$('[data-chip]', wr).forEach(b => b.onclick = () => { const k = S.mode + b.dataset.chip; S.chipsOff.has(k) ? S.chipsOff.delete(k) : S.chipsOff.add(k); renderCtx(); });
  $('#dirMemo').oninput = e => S.dirMemo = e.target.value;
  $('#memoIn') && ($('#memoIn').oninput = e => debounce('memo', () => updateDoc(P.book(S.w.bookId), { memo: e.target.value }), 900));
  $$('[data-deldec]', wr).forEach(b => b.onclick = () => deleteDoc(P.decision(S.w.bookId, b.dataset.deldec)));
  $$('[data-ai]', wr).forEach(b => b.onclick = () => runAI(b.dataset.ai, b));
  $('#cpy').onclick = () => copy(buildPrompt('draft'));
  bindResults();
}
function aroundText() {
  const ed = $('#ed'); if (!ed) return { text: '', sel: '' };
  const v = ed.value, s = ed.selectionStart, e = ed.selectionEnd;
  const before = v.slice(0, s).split(/\n\s*\n/), after = v.slice(e).split(/\n\s*\n/);
  const b = before.slice(-3).join('\n\n').slice(-1400), a = after.slice(0, 2).join('\n\n').slice(0, 600);
  return { before: b, after: a, sel: v.slice(s, e), s, e, curPara: curParagraph(v, s) };
}
function curParagraph(v, pos) {
  let st = v.lastIndexOf('\n\n', pos - 1); st = st < 0 ? 0 : st + 2;
  let en = v.indexOf('\n\n', pos); en = en < 0 ? v.length : en;
  return { text: v.slice(st, en), st, en };
}
function buildPrompt(kind) {
  const book = bookById(S.w.bookId), ch = chaptersOf(S.w.bookId).find(c => c.id === S.w.chId);
  const on = k => !S.chipsOff.has(S.mode + k);
  const items = ctxItems().filter(x => on(x.k) && x.k !== 'around');
  const ar = aroundText();
  const memo = ($('#dirMemo')?.value || S.dirMemo || '').trim();
  let ctx = `[책] 가제 「${book.confirmed?.title || book.workingTitle}」 · 주제: ${book.topic}\n` + items.map(x => `[${x.h}]\n${x.t}`).join('\n\n');
  if (on('around')) ctx += `\n\n[커서 앞 원고]\n${ar.before || '(장의 처음)'}\n\n[커서 뒤 원고]\n${ar.after || '(없음)'}`;
  const broad = S.mode === 'spread' ? '\n\n※ 펼치기 모드: 논리적으로 바로 이어지는 것보다 넓게 생각하라. 서랍의 글감·다른 책·경험 메모에서 의외의 연결, 비유, 장면을 끌어와 새 각도를 제시하라.' : '';
  const rules = '\n\n[원칙] 저자의 1인칭 목소리, 강의하듯 따뜻하고 명료한 한국어 문어체. 숫자·통계·인용·출처를 지어내지 말 것 — 필요하면 [확인 필요: 무엇]으로 표시. 머리말·설명 없이 결과만.';
  const task = {
    draft: `[할 일 — 카미] 아래 방향 메모를 바탕으로 ${(S.w && ch ? ch.title : '')} 장의 커서 위치에 들어갈 원고 초안을 400~700자로 써라.${ar.before ? ' 커서 앞 원고와 자연스럽게 이어지게.' : ' 장의 도입부로.'}\n[방향 메모] ${memo || '(없음 — 이 장의 질문에 답하는 방향으로)'}`,
    ideas: `[할 일] 커서 다음에 올 문단의 방향을 서로 다른 3가지로 제안하라. 각 2~3문장, 번호 목록. 각 방향에 쓸 수 있는 장면·사례 아이디어를 한 줄 덧붙여라.${memo ? '\n[방향 메모] ' + memo : ''}`,
    easier: `[할 일] 다음 글을 의미는 그대로 두고 더 쉬운 말과 짧은 문장으로 다시 써라. 결과 문단만 출력.\n[다시 쓸 글]\n${ar.sel || ar.curPara.text || '(커서가 있는 문단이 비었음)'}`,
  }[kind];
  return `${AUTHOR}\n너희는 저자의 집필 편집팀이다. 저자는 방향만 주고, 맥락은 아래에 있다.\n\n${ctx}${broad}\n\n${task}${rules}`;
}
async function runAI(kind, btn) {
  const ed = $('#ed'); const ar = aroundText();
  if (kind === 'easier' && !(ar.sel || ar.curPara.text).trim()) { toast('바꿀 문단에 커서를 두거나 글을 선택해 주세요.', true); return; }
  const label = btn.textContent; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> 쓰는 중…';
  const prompt = buildPrompt(kind);
  try {
    const text = (await callAI(prompt)).trim();
    const arr = S.results[S.w.chId] = S.results[S.w.chId] || [];
    arr.unshift({ kind, text, mode: S.mode, at: new Date(), range: kind === 'easier' ? (ar.sel ? { st: ar.s, en: ar.e, orig: ar.sel } : { st: ar.curPara.st, en: ar.curPara.en, orig: ar.curPara.text }) : null });
    $('#results').innerHTML = arr.map((x, i) => resultHTML(x, i)).join(''); bindResults();
    if (matchMedia('(max-width:860px)').matches) $('#results').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { toast(aiErr(e), true, 5000); }
  btn.disabled = false; btn.textContent = label;
}
function resultHTML(x, i) {
  const name = { draft: '초안 · 카미', ideas: '다음 문단 아이디어', easier: '더 쉽게 · 초안' }[x.kind];
  return `<div class="result"><div class="h"><span class="badge accent">초안</span>${name} <span class="muted" style="font-weight:400">· ${x.mode === 'spread' ? '펼치기' : '잇기'} · ${hhmm(x.at)}</span><span class="grow"></span><button class="btn sm ghost" data-rx="${i}">✕</button></div>
    <div class="txt">${esc(x.text)}</div>
    <div class="row"><button class="btn sm primary" data-ins="${i}">${x.kind === 'easier' ? '원고에서 바꾸기' : '원고에 넣기'}</button><button class="btn sm" data-dec="${i}">결정으로 기록</button><button class="btn sm" data-drw="${i}">글감 서랍</button></div></div>`;
}
function bindResults() {
  const arr = S.results[S.w.chId] || [];
  $$('[data-rx]').forEach(b => b.onclick = () => { arr.splice(+b.dataset.rx, 1); renderCtx(); });
  $$('[data-ins]').forEach(b => b.onclick = () => {
    const x = arr[+b.dataset.ins], ed = $('#ed');
    if (x.kind === 'easier' && x.range && ed.value.slice(x.range.st, x.range.en) === x.range.orig) ed.setRangeText(x.text, x.range.st, x.range.en, 'end');
    else { const s = ed.selectionStart, e = ed.selectionEnd; const pre = ed.value.slice(0, s); const sep = pre && !pre.endsWith('\n\n') ? (pre.endsWith('\n') ? '\n' : '\n\n') : ''; ed.setRangeText(sep + x.text + '\n\n', s, e, 'end'); }
    ed.dispatchEvent(new Event('input')); ed.focus();
    if (matchMedia('(max-width:860px)').matches) $('#mtabs [data-m="ed"]').click();
    if (FACT_RE.test(x.text)) toast('⚠ 숫자·통계·출처가 담긴 문장이 있어요. 원문을 꼭 확인해 주세요.', true, 6000);
    else toast('원고에 넣었어요. "초안"이니 대표님 말로 고쳐 주세요.');
  });
  $$('[data-dec]').forEach(b => b.onclick = () => {
    const x = arr[+b.dataset.dec], row = b.closest('.row');
    const first = (x.text.split('\n').find(l => l.trim()) || '').replace(/^[\d.\-•*\s]+/, '').slice(0, 140);
    row.innerHTML = `<input class="grow" style="flex:1;padding:6px 10px;font-size:13px" value="${esc(first)}" placeholder="결정으로 남길 한 문장"><button class="btn sm primary">기록</button><button class="btn sm ghost">취소</button>`;
    const [inp, ok, no] = [$('input', row), ...$$('button', row)];
    inp.focus(); inp.select();
    const doIt = async () => { const t = inp.value.trim(); if (!t) return; await addDoc(P.decisions(S.w.bookId), { chapterId: S.w.chId, text: t, createdAt: serverTimestamp() }); toast('결정으로 기록했어요. 다음부터 잇기 맥락에 자동으로 들어갑니다.'); };
    ok.onclick = doIt; inp.onkeydown = e => { if (e.key === 'Enter') doIt(); }; no.onclick = () => renderCtx();
  });
  $$('[data-drw]').forEach(b => b.onclick = async () => {
    const x = arr[+b.dataset.drw]; const first = x.text.split('\n').find(l => l.trim()) || x.text;
    await addDoc(P.ideas(), { text: first.replace(/^[\d.\-•*\s]+/, '').slice(0, 80), note: x.text, tags: [], status: 'drawer', linkedBookId: null, fromBookId: S.w.bookId, createdAt: serverTimestamp() });
    toast('글감 서랍에 넣었어요.');
  });
}

/* ───────── 파일 내용 만들기 (내려받기·폴더 공통) ───────── */
const safeName = s => (s || '').replace(/[\\/:*?"<>|\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || '제목없음';
const chFile = (c, i) => `${String(i + 1).padStart(2, '0')}-${safeName(c.title).slice(0, 40)}.md`;
const chMd = (c, i) => `# ${i + 1}장. ${c.title || ''}\n\n${c.body || ''}\n`;
function planMd(book) {
  const p = book.plan || {};
  return `# ${titleOf(book)} — 기획서\n\n- 주제: ${book.topic}\n- 목적: ${book.purpose || ''}\n- 완성선: ${book.goal?.chapters}장 / ${num(book.goal?.chars)}자 / ${book.goal?.dueDate || ''}\n\n## 글감\n${book.seeds || ''}\n\n## 대표 독자\n${p.reader || ''}\n\n## 독자의 문제\n${p.problem || ''}\n\n## 책의 핵심 약속\n${p.promise || ''}\n\n## 다룰 범위\n${p.inScope || ''}\n\n## 다루지 않을 것\n${p.outScope || ''}\n\n## 제목 후보\n${(book.titleCandidates || []).map(c => `- ${c.star ? '★ ' : ''}${c.text}`).join('\n')}\n\n## 경험 메모\n${book.memo || ''}\n`;
}
const tocMd = (book, chs) => `# ${titleOf(book)} — 목차\n\n` + sorted(chs).map((c, i) => `## ${i + 1}장. ${c.title}\n- 질문: ${c.question || ''}\n- 메시지: ${c.message || ''}\n- 상태: ${c.status} · ${num(c.chars)}자\n`).join('\n');
const decMd = (decs, chs) => '# 결정 기록\n\n' + decs.map(d => `- ${d.chapterId ? (sorted(chs).findIndex(c => c.id === d.chapterId) + 1) + '장: ' : ''}${d.text}`).join('\n') + '\n';
async function chaptersWithBodies(bookId) {
  const [cs, bs] = await Promise.all([getDocs(query(P.chapters(bookId), orderBy('order'))), getDocs(P.bodies(bookId))]);
  const bm = Object.fromEntries(bs.docs.map(d => [d.id, d.data().text || '']));
  return cs.docs.map(d => ({ id: d.id, ...d.data(), body: bm[d.id] || '' }));
}

/* ───────── 로컬 폴더 연동 (맥 Chrome, 앱 → 폴더 한 방향) ─────────
   연결 폴더 = '전자책 관리'  ·  작업 중: 작업중_books/<책 폴더>/  ·  출간: books/<책이름>/ (book.json·preview.md·원고/) */
const WORK = '작업중_books', DONE = 'books', MANIFEST = '책동무.json';
const FS = { root: null, perm: 'none', busy: false };
const idb = (() => {
  const open = () => new Promise((res, rej) => { const r = indexedDB.open('chaekdongmu', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  return {
    get: async k => { const d = await open(); return new Promise(res => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); },
    set: async (k, v) => { const d = await open(); return new Promise(res => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = res; }); },
  };
})();
async function fsInit() {
  if (!window.showDirectoryPicker) { FS.perm = 'unsupported'; return; }
  const h = await idb.get('root'); if (!h) return;
  FS.root = h; FS.perm = await h.queryPermission({ mode: 'readwrite' });
}
async function fsConnect() {
  try {
    const h = await window.showDirectoryPicker({ id: 'cdm-root', mode: 'readwrite' });
    const names = []; for await (const [n] of h.entries()) names.push(n.normalize('NFC'));
    if (!names.includes(WORK) && !names.includes(DONE)) toast(`이 폴더엔 '${WORK}'·'${DONE}'가 없어서 새로 만들게요. '전자책 관리' 폴더가 맞는지 확인해 주세요.`, true, 6000);
    await h.getDirectoryHandle(WORK, { create: true }); await h.getDirectoryHandle(DONE, { create: true });
    FS.root = h; FS.perm = 'granted'; await idb.set('root', h);
    toast(`📁 「${h.name.normalize('NFC')}」 연결됨. 이제 앱에서 쓴 내용이 폴더로 내려갑니다.`, false, 4000);
    syncAll(); render();
  } catch (e) { if (e.name !== 'AbortError') toast('폴더 연결 실패: ' + e.message, true); }
}
async function fsRegrant() { if (!FS.root) return fsConnect(); FS.perm = await FS.root.requestPermission({ mode: 'readwrite' }); if (FS.perm === 'granted') { toast('폴더 저장을 다시 켰어요.'); syncAll(); } render(); }
function fsBadge() {
  if (FS.perm === 'unsupported') return '';
  if (FS.perm === 'granted') return `<button class="btn sm ghost" id="fsBtn" title="${esc(FS.root?.name?.normalize('NFC'))} 폴더로 자동 저장 중 — 눌러서 지금 동기화">📁 ${FS.busy ? '<span class="spin"></span>' : '폴더 저장 중'}</button>`;
  if (FS.root) return `<button class="btn sm" id="fsBtn" title="브라우저를 다시 열면 한 번 허용이 필요해요">📁 폴더 저장 다시 켜기</button>`;
  return `<button class="btn sm" id="fsBtn" title="'전자책 관리' 폴더를 연결하면 책마다 작업중_books에 자동 저장">📁 폴더 연결</button>`;
}
function bindFsBadge() { const b = $('#fsBtn'); if (b) b.onclick = () => FS.perm === 'granted' ? syncAll(true) : (FS.root ? fsRegrant() : fsConnect()); }
const getDir = async (dir, name, create = true) => dir.getDirectoryHandle(name, { create });
async function writeText(dir, name, text) { const fh = await dir.getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(text); await w.close(); }
async function readText(dir, name) { try { const fh = await dir.getFileHandle(name); return await (await fh.getFile()).text(); } catch { return null; } }
async function bookDir(book) {
  const work = await getDir(FS.root, WORK);
  let folder = book.folder;
  if (!folder) { folder = safeName(titleOf(book)); updateDoc(P.book(book.id), { folder }); book.folder = folder; }
  return getDir(work, folder);
}
const syncQ = {};
function queueSync(bookId, chId, text) {
  if (FS.perm !== 'granted') return;
  const q = syncQ[bookId] ||= { full: false, ch: {} };
  if (chId) q.ch[chId] = text ?? null; else q.full = true;
  debounce('sync' + bookId, () => { const job = syncQ[bookId]; delete syncQ[bookId]; syncBook(bookId, job).catch(e => console.warn('[sync]', e)); }, chId ? 6000 : 2500);
}
// 바뀐 것만 쓴다: 장 파일은 (updatedAt, 파일명)이 마지막 동기화와 다를 때만 본문을 읽어 씀
async function syncBook(bookId, job = { full: true, ch: {} }) {
  const book = bookById(bookId); if (!book || FS.perm !== 'granted' || book.published?.lock) return;
  const chs = sorted(chaptersOf(bookId));
  const dir = await bookDir(book), wdir = await getDir(dir, '원고');
  const man = JSON.parse(await readText(dir, MANIFEST) || '{}'); man.files ||= {};
  const files = {};
  for (const [i, c] of chs.entries()) {
    const fname = chFile(c, i), t = tsDate(c.updatedAt)?.getTime() || 0, prev = man.files[c.id];
    files[c.id] = { name: fname, t };
    const need = c.id in job.ch || !prev || prev.name !== fname || prev.t < t;
    if (!need) continue;
    let body = job.ch[c.id];
    if (body == null) { const b = await getDoc(P.body(bookId, c.id)); body = b.exists() ? b.data().text || '' : ''; }
    await writeText(wdir, fname, chMd({ ...c, body }, i));
    if (prev && prev.name !== fname) { try { await wdir.removeEntry(prev.name); } catch { } }
  }
  for (const [id, f] of Object.entries(man.files)) if (!files[id]) { try { await wdir.removeEntry(f.name); } catch { } } // 목차에서 뺀 장(보관함에 남아 있음)
  if (job.full || Object.keys(job.ch).length) {
    await writeText(dir, '기획서.md', planMd(book));
    await writeText(dir, '목차.md', tocMd(book, chs));
    const decs = S.decisions[bookId] || []; if (decs.length) await writeText(dir, '결정기록.md', decMd(decs, chs));
  }
  await writeText(dir, MANIFEST, JSON.stringify({ app: '책동무', bookId, title: titleOf(book), syncedAt: new Date().toISOString(), files }, null, 2));
}
async function syncAll(manual) {
  if (FS.perm !== 'granted' || FS.busy || !S.booksReady) return;
  FS.busy = true; $('#fsBtn') && ($('#fsBtn').innerHTML = '📁 <span class="spin"></span>');
  try {
    for (const b of S.books) { if (!S.chapters[b.id]) await new Promise(r => setTimeout(r, 800)); await syncBook(b.id, { full: true, ch: {} }); }
    if (manual) toast(`📁 ${S.books.length}권을 '${WORK}'에 동기화했어요.`);
  } catch (e) { console.error(e); toast('폴더 저장 실패: ' + e.message, true, 5000); if (e.name === 'NotAllowedError') FS.perm = 'prompt'; }
  FS.busy = false; $('#fsBtn') && ($('#fsBtn').outerHTML = fsBadge()); bindFsBadge();
}

/* ───────── 출간: books/<책이름>/ (ChungRam Library 형식) ───────── */
const COLORS = ['blue', 'emerald', 'purple', 'slate', 'amber', 'rose', 'teal', 'indigo', 'orange', 'cyan'];
async function publishBook(book, meta) {
  if (FS.perm !== 'granted') { toast('먼저 📁 폴더 연결(또는 다시 켜기)을 해 주세요.', true); return false; }
  const name = safeName(meta.name);
  const done = await getDir(FS.root, DONE);
  const dir = await getDir(done, name), wdir = await getDir(dir, '원고');
  const chs = await chaptersWithBodies(book.id);
  await writeText(dir, 'book.json', JSON.stringify({ description: meta.description, category: meta.category, author: '정구영', date: meta.date, color: meta.color, tags: meta.tags }, null, 2) + '\n');
  await writeText(dir, 'preview.md', meta.preview.trim() + '\n');
  for (const [i, c] of sorted(chs).entries()) await writeText(wdir, chFile(c, i), chMd(c, i));
  // 작업 폴더는 지우지 않고 '✅완료_' 표시
  let doneFolder = book.folder;
  try {
    await syncBook(book.id, { full: true, ch: {} });
    const wd = await bookDir(book);
    if (!book.folder.startsWith('✅완료_') && wd.move) { await wd.move('✅완료_' + book.folder); doneFolder = '✅완료_' + book.folder; }
    else await writeText(wd, '✅완료.txt', `${meta.date} 출간 → books/${name}\n`);
  } catch (e) { console.warn('[완료 표시]', e); try { await writeText(await bookDir(book), '✅완료.txt', `${meta.date} 출간 → books/${name}\n`); } catch { } }
  await updateDoc(P.book(book.id), { published: { name, at: serverTimestamp(), meta }, folder: doneFolder, updatedAt: serverTimestamp() });
  return name;
}
function publishCardHTML(book, chs) {
  const pub = book.published, m = pub?.meta || {};
  const allDone = chs.length && chs.every(c => c.status === '확정');
  const d = new Date(), today = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return `<div class="card" id="pubCard"><h3>📚 출간하기 <span class="muted small">(books/ 폴더 · ChungRam Library)</span></h3>
    ${pub ? `<div class="next" style="margin-top:0"><b>출간됨</b>books/${esc(pub.name)} · ${fmt(pub.at, false)}</div>` : ''}
    ${!allDone ? `<p class="small" style="color:var(--amber);margin:0 0 6px">아직 확정 안 된 장이 ${chs.filter(c => c.status !== '확정').length}개 있어요. 그래도 내보낼 수는 있어요.</p>` : ''}
    <div id="pubForm" class="${S.pubOpen === book.id ? '' : 'hidden'}">
      <label class="label" style="margin-top:0">책 이름 (= 폴더 이름)</label><input id="pbName" value="${esc(m.name || book.confirmed?.title || titleOf(book))}">
      <label class="label">소개 한두 문장</label><input id="pbDesc" value="${esc(m.description || book.confirmed?.plan?.promise || '')}">
      <div class="row" style="align-items:flex-start"><div class="grow"><label class="label">카테고리</label><input id="pbCat" value="${esc(m.category || '')}" placeholder="교육학 / 리더십 / 생산성…"></div>
        <div class="grow"><label class="label">날짜</label><input id="pbDate" value="${esc(m.date || today)}"></div>
        <div class="grow"><label class="label">색</label><select id="pbColor">${COLORS.map(c => `<option ${c === (m.color || 'blue') ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
      <label class="label">태그 (쉼표로)</label><input id="pbTags" value="${esc((m.tags || []).join(', '))}">
      <label class="label">미리보기 (사이트엔 앞 600자) <span class="muted" id="pbCount"></span></label><textarea id="pbPrev" rows="6" placeholder="불러오는 중…">${esc(m.preview || '')}</textarea>
      <div class="row end" style="margin-top:10px"><button class="btn primary" id="pbGo">books/ 폴더로 출간</button></div>
    </div>
    ${S.pubOpen === book.id ? '' : `<button class="btn" id="pbOpen">${pub ? '다시 내보내기' : '출간 정보 채우기'}</button>`}
  </div>`;
}
async function bindPublish(book) {
  $('#pbOpen') && ($('#pbOpen').onclick = () => { S.pubOpen = book.id; render(); });
  if (S.pubOpen !== book.id) return;
  const pv = $('#pbPrev'), cnt = () => $('#pbCount').textContent = `${pv.value.length}자`;
  pv.oninput = cnt;
  if (!pv.value) {
    const c1 = sorted(chaptersOf(book.id))[0];
    if (c1) { const b = await getDoc(P.body(book.id, c1.id)); pv.value = ((b.exists() && b.data().text) || '').replace(/^#.*\n+/, '').slice(0, 600); }
  }
  cnt();
  $('#pbGo').onclick = async () => {
    const meta = { name: $('#pbName').value.trim(), description: $('#pbDesc').value.trim(), category: $('#pbCat').value.trim() || '기타', date: $('#pbDate').value.trim(), color: $('#pbColor').value, tags: $('#pbTags').value.split(',').map(t => t.trim()).filter(Boolean), preview: pv.value };
    if (!meta.name) return toast('책 이름을 적어 주세요.', true);
    $('#pbGo').disabled = true; $('#pbGo').innerHTML = '<span class="spin"></span> 내보내는 중…';
    try { const n = await publishBook(bookById(book.id), meta); if (n) { S.pubOpen = null; toast(`📚 books/${n} 에 출간했어요. 라이브러리에 바로 반영됩니다.`, false, 5000); render(); } }
    catch (e) { console.error(e); toast('출간 실패: ' + e.message, true, 6000); $('#pbGo').disabled = false; $('#pbGo').textContent = 'books/ 폴더로 출간'; }
  };
}

/* ───────── 가져오기: 폴더(작업중_books) 또는 파일(txt·md) ───────── */
const SKIP = new Set(['기획서.md', '목차.md', '결정기록.md', MANIFEST, '✅완료.txt']);
const CH_RE = /^(#{1,2}\s+.+|제\s*\d+\s*장.*|\d+\s*장[\s.:].*|chapter\s*\d+.*|프롤로그.*|에필로그.*|들어가며.*|나가며.*)$/im;
function splitChapters(files) {
  // 파일 하나 = 한 장. 단, 파일이 하나뿐이고 안에 장 구분이 여러 개면 나눈다.
  const clean = t => t.replace(/\r\n/g, '\n').replace(/^﻿/, '');
  if (files.length === 1) {
    const t = clean(files[0].text), lines = t.split('\n');
    const idx = lines.map((l, i) => CH_RE.test(l.trim()) && !/^###/.test(l) ? i : -1).filter(i => i >= 0);
    if (idx.length >= 2) {
      const out = []; if (idx[0] > 0 && lines.slice(0, idx[0]).join('').trim()) out.push({ title: '들어가며', body: lines.slice(0, idx[0]).join('\n').trim() });
      idx.forEach((st, k) => { const en = idx[k + 1] ?? lines.length; out.push({ title: lines[st].replace(/^#+\s*/, '').trim(), body: lines.slice(st + 1, en).join('\n').trim() }); });
      return out;
    }
  }
  return files.sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true })).map(f => {
    let t = clean(f.text).trim(); let title = f.name.replace(/\.(txt|md|markdown)$/i, '').replace(/^\d+[\s._-]*/, '').trim();
    const m = t.match(/^#{1,2}\s+(.+)\n/); if (m) { title = m[1].replace(/^\d+장\.?\s*/, '').trim(); t = t.slice(m[0].length).trim(); }
    return { title: title || f.name, body: t };
  });
}
async function readFolderFiles(dir, prefix = '') {
  const out = [];
  for await (const [n, h] of dir.entries()) {
    const name = n.normalize('NFC');
    if (name.startsWith('.') || SKIP.has(name)) continue;
    if (h.kind === 'directory') { if (['원고', 'manuscript', 'chapters'].includes(name)) out.push(...await readFolderFiles(h, name + '/')); continue; }
    if (/\.(txt|md|markdown)$/i.test(name)) out.push({ name: prefix + name, text: await (await h.getFile()).text() });
  }
  return out;
}
async function importBook({ title, chapters, folder }) {
  const hasFocus = S.books.some(b => b.focus);
  const toc = chapters.map((c, i) => ({ title: c.title, question: '', message: '', order: i }));
  const ref = await addDoc(P.books(), {
    workingTitle: title, titleCandidates: [{ text: title, why: '기존 원고 제목', star: true, by: '대표님' }], topic: title, seeds: '', purpose: '',
    goal: { chapters: Math.max(chapters.length, 1), chars: Math.max(100000, Math.ceil(chapters.reduce((a, c) => a + countChars(c.body), 0) / 10000) * 10000), dueDate: '' },
    plan: { reader: '', problem: '', promise: '', inScope: '', outScope: '' },
    stageStatus: { topic: 'confirmed', title: 'confirmed', toc: 'confirmed' }, confirmed: { title, toc: [] }, versionCount: { title: 1, toc: 1 }, review: {},
    focus: !hasFocus, nextAction: '', memo: '', folder: folder || safeName(title), imported: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  const ids = [];
  for (let i = 0; i < chapters.length; i += 200) {
    const bt = writeBatch(db);
    chapters.slice(i, i + 200).forEach((c, k) => {
      const cref = doc(P.chapters(ref.id)); ids.push(cref.id);
      const chars = countChars(c.body);
      bt.set(cref, { ...newCh(i + k, c), status: chars ? '초고' : '설계', chars });
      bt.set(P.body(ref.id, cref.id), { text: c.body || '', updatedAt: serverTimestamp() });
    });
    await bt.commit();
  }
  await updateDoc(P.book(ref.id), { 'confirmed.toc': toc.map((x, i) => ({ ...x, id: ids[i] })) });
  return ref.id;
}
async function importUI() {
  const box = $('#impBox'); if (!box) return;
  const showPreview = (title, chapters, folder) => {
    box.innerHTML = `<div class="ai-box"><div class="who">가져올 원고 미리보기</div>
      <label class="label">책 제목</label><input id="impTitle" value="${esc(title)}">
      <div class="small" style="margin-top:8px">${chapters.length}장 · 총 ${num(chapters.reduce((a, c) => a + countChars(c.body), 0))}자</div>
      ${chapters.map((c, i) => `<div class="small" style="padding:4px 0;border-bottom:1px solid var(--line2)"><b>${i + 1}.</b> ${esc(c.title)} <span class="muted">· ${num(countChars(c.body))}자</span></div>`).join('')}
      <p class="hint">글이 있는 장은 '초고'로 들어갑니다. 기획서는 들어간 뒤 채우시면 돼요.</p>
      <div class="row end"><button class="btn" id="impCancel">취소</button><button class="btn primary" id="impGo">책장에 꽂기</button></div></div>`;
    $('#impCancel').onclick = () => render();
    $('#impGo').onclick = async () => {
      $('#impGo').disabled = true; $('#impGo').innerHTML = '<span class="spin"></span> 옮기는 중…';
      const id = await importBook({ title: $('#impTitle').value.trim() || title, chapters, folder });
      toast(`${chapters.length}장을 가져왔어요.`); location.hash = `#/book/${id}`;
    };
  };
  $('#impFiles').onchange = async e => {
    const fs = [...e.target.files]; if (!fs.length) return;
    const files = await Promise.all(fs.map(async f => ({ name: f.name.normalize('NFC'), text: await f.text() })));
    const chapters = splitChapters(files);
    showPreview(files.length === 1 ? files[0].name.replace(/\.(txt|md)$/i, '') : '가져온 원고', chapters, null);
  };
  $('#impFolder') && ($('#impFolder').onclick = async () => {
    if (FS.perm !== 'granted') { await (FS.root ? fsRegrant() : fsConnect()); if (FS.perm !== 'granted') return; }
    const work = await getDir(FS.root, WORK); const linked = new Set(S.books.map(b => b.folder));
    const dirs = []; for await (const [n, h] of work.entries()) if (h.kind === 'directory' && !n.startsWith('.') && !linked.has(n.normalize('NFC'))) dirs.push([n.normalize('NFC'), h]);
    if (!dirs.length) { box.innerHTML = `<p class="small muted">'${WORK}' 안에 아직 책동무에 없는 폴더가 없어요.</p>`; return; }
    box.innerHTML = `<div class="small" style="margin-bottom:6px">${WORK} 안의 폴더 — 고르면 txt·md 원고를 읽습니다</div>` + dirs.map(([n], i) => `<button class="btn sm" data-dir="${i}" style="margin:3px">📂 ${esc(n)}</button>`).join('');
    $$('[data-dir]').forEach(b => b.onclick = async () => {
      const [n, h] = dirs[+b.dataset.dir]; const files = await readFolderFiles(h);
      if (!files.length) { toast('이 폴더엔 txt·md 원고가 없어요. (docx·pdf는 아직 못 읽어요)', true, 5000); return; }
      showPreview(n, splitChapters(files), n);
    });
  });
}

/* ───────── Markdown 내려받기 ───────── */
async function exportMarkdown(book) {
  toast('Markdown 묶는 중…');
  const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
  const chs = await chaptersWithBodies(book.id);
  const decs = (await getDocs(P.decisions(book.id))).docs.map(d => d.data());
  const root = safeName(titleOf(book));
  const zip = new JSZip(), f = zip.folder(root);
  f.file('기획서.md', planMd(book));
  f.file('목차.md', tocMd(book, chs));
  if (decs.length) f.file('결정기록.md', decMd(decs, chs));
  const g = f.folder('원고');
  chs.forEach((c, i) => g.file(chFile(c, i), chMd(c, i)));
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  const d = new Date(); a.download = `${root}_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.zip`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('내려받았어요 ✓');
}

/* ───────── 로그인 ───────── */
function vAuth() {
  setTop('');
  view.className = '';
  view.innerHTML = `<div class="auth"><h1>책동무</h1><p class="muted">책이 어디까지 왔는지, 다음에 뭘 쓸지.<br>대표님 전용 집필 편집자.</p>
    <button class="btn primary lg" id="gin" style="margin-top:18px">Google 계정으로 시작</button><p class="hint" style="margin-top:14px">본인 계정 외에는 들어올 수 없습니다.</p></div>`;
  $('#gin').onclick = async () => {
    const pr = new GoogleAuthProvider(); pr.setCustomParameters({ prompt: 'select_account' });
    try { await signInWithPopup(auth, pr); }
    catch (e) { if (/popup/.test(e.code || '')) await signInWithRedirect(auth, pr); else toast('로그인 실패: ' + (e.code || e.message), true, 5000); }
  };
}
getRedirectResult(auth).catch(e => console.warn(e));
onAuthStateChanged(auth, u => {
  if (unsubBooks) { unsubBooks(); unsubIdeas(); Object.values(S.chUnsub).forEach(f => f()); Object.values(S.decUnsub).forEach(f => f()); S.chUnsub = {}; S.decUnsub = {}; }
  S.user = u; S.booksReady = S.ideasReady = false;
  if (!u) { vAuth(); return; }
  setDoc(P.user(), { email: u.email, name: u.displayName || '', lastSeen: serverTimestamp() }, { merge: true }).catch(denied);
  fsInit().catch(e => console.warn(e)).finally(() => { startSubs(); render(); });
});
window.__cdm = { S, MODEL }; // 디버그용
