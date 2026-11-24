/* SkillTrack core: auth, Bayesian Knowledge Tracing, resource recommender (browser/localStorage) */
const ST = (() => {
  const K = {users:'st_users', session:'st_session', data:'st_data_'};
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  /* ---------- Auth ---------- */
  async function hash(pw, salt) {
    const s = salt + '::' + pw;
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    } catch { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'x' + h; }
  }
  const salt = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const users = () => read(K.users, []);
  const findUser = e => users().find(u => u.email === e.trim().toLowerCase());

  async function signUp({name, email, password, role, program, year}) {
    email = email.trim().toLowerCase();
    if (!name.trim()) throw new Error('Please enter your full name.');
    if (findUser(email)) throw new Error('An account with this email already exists. Try logging in.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new Error('Password must contain letters and numbers.');
    const s = salt();
    const u = {id:'u' + Date.now(), name:name.trim(), email, role:role || 'student', program:program || '', year:year || '', salt:s, hash:await hash(password, s), created:new Date().toISOString()};
    const all = users(); all.push(u); write(K.users, all);
    return u;
  }
  async function logIn(email, password, remember) {
    const u = findUser(email || '');
    if (!u || u.hash !== await hash(password, u.salt)) throw new Error('Incorrect email or password.');
    (remember ? localStorage : sessionStorage).setItem(K.session, u.id);
    (remember ? sessionStorage : localStorage).removeItem(K.session);
    return u;
  }
  async function resetPassword(email, newPw) {
    const all = users(), u = all.find(x => x.email === email.trim().toLowerCase());
    if (!u) throw new Error('No account found with that email.');
    if (newPw.length < 8 || !/[A-Za-z]/.test(newPw) || !/\d/.test(newPw)) throw new Error('New password needs 8+ characters with letters and numbers.');
    u.salt = salt(); u.hash = await hash(newPw, u.salt); write(K.users, all);
  }
  const sid = () => sessionStorage.getItem(K.session) || localStorage.getItem(K.session);
  const current = () => users().find(u => u.id === sid()) || null;
  function logOut() { sessionStorage.removeItem(K.session); localStorage.removeItem(K.session); }
  function require(role) {
    const u = current();
    if (!u) { location.href = 'login.html'; return null; }
    if (role && u.role !== role) { location.href = u.role === 'teacher' ? 'teacher.html' : 'dashboard.html'; return null; }
    return u;
  }

  /* ---------- Learner data & Knowledge Tracing (BKT) ---------- */
  const P = {init:.3, learn:.15, slip:.1, guess:.2};
  const MASTERED = .8, WEAK = .6;
  const blank = () => ({mastery:{}, attempts:[], done:{}, answered:{}});
  const dataFor = id => Object.assign(blank(), read(K.data + id, {}));
  const save = (id, d) => write(K.data + id, d);

  function bkt(prior, correct) {
    const post = correct
      ? prior * (1 - P.slip) / (prior * (1 - P.slip) + (1 - prior) * P.guess)
      : prior * P.slip / (prior * P.slip + (1 - prior) * (1 - P.guess));
    return Math.min(.99, Math.max(.01, post + (1 - post) * P.learn));
  }
  function recordAnswer(uid, topic, correct) {
    const d = dataFor(uid);
    const prior = d.mastery[topic] ?? P.init;
    d.mastery[topic] = bkt(prior, correct);
    d.answered[topic] = (d.answered[topic] || 0) + 1;
    save(uid, d); return d.mastery[topic];
  }
  function recordAttempt(uid, topic, score, total, mode) {
    const d = dataFor(uid);
    d.attempts.push({topic, score, total, mode, at:Date.now(), mastery:d.mastery[topic]});
    save(uid, d);
  }
  const status = m => m == null ? 'new' : m >= MASTERED ? 'mastered' : m < WEAK ? 'weak' : 'developing';

  /* ---------- Recommender ----------
     Scores every unfinished resource for the student's weakest topics:
     score = topicNeed*0.5 + difficultyFit*0.3 + typePreference*0.2
     typePreference is learned from the resource types the student has completed. */
  function recommend(uid, limit = 6) {
    const d = dataFor(uid), pref = {video:1, read:1, practice:1}, doneIds = Object.keys(d.done);
    doneIds.forEach(id => { const r = ST_RESOURCES.find(x => x.id === id); if (r) pref[r.type]++; });
    const tot = pref.video + pref.read + pref.practice;
    const out = [];
    ST_TOPICS.forEach(t => {
      const m = d.mastery[t.id]; if (m == null || m >= MASTERED) return;
      const need = 1 - m;
      ST_RESOURCES.filter(r => r.topic === t.id && !d.done[r.id]).forEach(r => {
        const fit = 1 - Math.abs(r.d - Math.min(.9, m + .15));
        const score = need * .5 + fit * .3 + (pref[r.type] / tot) * .2;
        out.push({...r, topicName:t.name, mastery:m, score,
          why:`${t.name} mastery is ${Math.round(m * 100)}% — this ${r.type === 'read' ? 'reading' : r.type} fits your current level.`});
      });
    });
    return out.sort((a, b) => b.score - a.score).slice(0, limit);
  }
  function markDone(uid, rid, on = true) { const d = dataFor(uid); on ? d.done[rid] = Date.now() : delete d.done[rid]; save(uid, d); }

  function summary(uid) {
    const d = dataFor(uid), ms = Object.entries(d.mastery);
    const avg = d.attempts.length ? d.attempts.reduce((s, a) => s + a.score / a.total, 0) / d.attempts.length : null;
    return {d, avg, mastered:ms.filter(([, m]) => m >= MASTERED).length, weak:ms.filter(([, m]) => m < WEAK).length, assessed:ms.length};
  }
  const students = () => users().filter(u => u.role === 'student');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return {signUp, logIn, logOut, resetPassword, current, require, dataFor, recordAnswer, recordAttempt, recommend, markDone, summary, students, status, esc, MASTERED, WEAK};
})();

/* ---------- Shared app shell (sidebar + topbar) ---------- */
function renderShell(user, active, title) {
  const nav = user.role === 'teacher'
    ? [['teacher.html','bi-people','Class overview','teacher']]
    : [['dashboard.html','bi-grid-1x2-fill','Overview','dashboard'],['quiz.html','bi-clipboard-check','Take a quiz','quiz'],['resources.html','bi-journals','My resources','resources']];
  const links = nav.map(n => `<li><a class="nav-link ${active === n[3] ? 'active' : ''}" href="${n[0]}"><i class="bi ${n[1]} me-2"></i>${n[2]}</a></li>`).join('');
  document.body.innerHTML = `
  <div class="container-fluid dashboard-shell"><div class="row g-0">
    <aside class="col-lg-2 d-none d-lg-block sidebar">
      <a class="brand-lockup text-decoration-none" href="../index.html"><span class="brand-logo-wrap"><img class="brand-logo-img" src="../assets/images/brain.jpg" alt=""></span><span>Skill<span class="brand-accent">Track</span></span></a>
      <div class="sidebar-label">Workspace</div><ul class="nav nav-pills flex-column gap-1">${links}</ul>
      <div class="sidebar-label">Account</div><ul class="nav nav-pills flex-column gap-1">
        <li><a class="nav-link" href="../index.html"><i class="bi bi-house me-2"></i>Home</a></li>
        <li><a class="nav-link" href="#" id="logoutBtn"><i class="bi bi-box-arrow-left me-2"></i>Log out</a></li></ul>
    </aside>
    <main class="col-lg-10 dashboard-main">
      <nav class="navbar dashboard-topbar">
        <button class="btn btn-outline-brand d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#mobileMenu" aria-label="Menu"><i class="bi bi-list"></i></button>
        <span class="fw-bold d-none d-sm-inline">${title}</span>
        <div class="ms-auto d-flex align-items-center gap-2"><span class="small text-muted d-none d-sm-inline">${ST.esc(user.name)} · ${user.role}</span>
          <span class="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white" style="width:38px;height:38px;background:var(--brand)">${ST.esc(user.name[0].toUpperCase())}</span></div>
      </nav>
      <div class="dashboard-content" id="page"></div>
    </main></div></div>
  <div class="offcanvas offcanvas-start text-bg-dark" tabindex="-1" id="mobileMenu"><div class="offcanvas-header"><h5 class="offcanvas-title">SkillTrack</h5><button class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button></div>
    <div class="offcanvas-body"><ul class="nav flex-column gap-2">${nav.map(n => `<li><a href="${n[0]}" class="nav-link text-white"><i class="bi ${n[1]} me-2"></i>${n[2]}</a></li>`).join('')}<li><a href="#" class="nav-link text-white" id="logoutBtn2"><i class="bi bi-box-arrow-left me-2"></i>Log out</a></li></ul></div></div>`;
  const out = e => { e.preventDefault(); ST.logOut(); location.href = 'login.html'; };
  document.getElementById('logoutBtn').onclick = out; document.getElementById('logoutBtn2').onclick = out;
  return document.getElementById('page');
}
const pct = m => Math.round(m * 100);
const barClass = m => m >= ST.MASTERED ? 'mint' : m < ST.WEAK ? 'peach' : '';
const typeIcon = {video:'bi-play-circle', read:'bi-file-earmark-text', practice:'bi-pencil-square'};
const typeLabel = {video:'Video', read:'Reading', practice:'Practice'};
function recItem(r, uid) {
  return `<div class="recommendation-item"><span class="recommendation-icon"><i class="bi ${typeIcon[r.type]}"></i></span>
    <div><strong>${ST.esc(r.title)}</strong><small>${typeLabel[r.type]} · ${ST.esc(r.why)}</small></div>
    <div class="ms-auto d-flex gap-1 align-self-center"><a class="btn btn-sm btn-brand" href="${r.url}" ${r.type==='practice'?'':'target="_blank" rel="noopener"'} data-open="${r.id}">Open</a>
    <button class="btn btn-sm btn-outline-brand" data-done="${r.id}" title="Mark as done"><i class="bi bi-check2"></i></button></div></div>`;
}
function wireRecs(root, uid, rerender) {
  root.querySelectorAll('[data-done]').forEach(b => b.onclick = () => { ST.markDone(uid, b.dataset.done); rerender(); });
  root.querySelectorAll('[data-open]').forEach(a => a.addEventListener('click', () => { if (!a.href.includes('quiz.html')) ST.markDone(uid, a.dataset.open); setTimeout(rerender, 300); }));
}
