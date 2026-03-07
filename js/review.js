function buildReview() {
  const status  = document.getElementById('review-status');
  const content = document.getElementById('review-content');
  content.innerHTML = '';

  // ── Module Stats ──
  const statsHtml = modulesData.map(mod => {
    const s = userData.moduleStats[String(mod.id)];
    if (!s || !s.attempts) return '';
    const avg = Math.round(s.scores.reduce((a,b)=>a+b,0)/s.scores.length);
    const best = Math.max(...s.scores);
    const trend = s.scores.length > 1
      ? (s.scores[s.scores.length-1] >= s.scores[s.scores.length-2] ? '📈' : '📉')
      : '';
    const barColor = avg >= 80 ? 'var(--primary)' : avg >= 60 ? 'var(--accent)' : 'var(--error)';
    return `
      <div style="background:var(--card);border-radius:10px;padding:12px 16px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:13px;font-weight:600;">${mod.title.replace('Módulo ','M').split(':')[0]+':'+mod.title.split(':')[1]}</span>
          <span style="font-size:12px;color:var(--muted);">${trend} ${s.attempts}x · melhor ${best}%</span>
        </div>
        <div style="height:5px;background:var(--border);border-radius:3px;">
          <div style="height:5px;background:${barColor};border-radius:3px;width:${avg}%;transition:width 0.5s;"></div>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px;">Média: ${avg}%</div>
      </div>`;
  }).join('');

  const hasStats = Object.keys(userData.moduleStats).length > 0;
  const hasCompleted = userData.completedModules.length > 0;

  status.innerHTML = `
    ${hasStats ? `<h3 style="margin-bottom:12px;color:var(--accent);">📊 Estatísticas por Módulo</h3>${statsHtml}` : ''}

    <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
      ${hasCompleted ? `
        <button class="btn" onclick="startReviewSession('quick')" style="flex:1;min-width:140px;">
          ⚡ Revisão Rápida<br><small style="font-weight:400;font-size:12px;">10 questões aleatórias</small>
        </button>` : ''}
      ${userData.errorBank.length > 0 ? `
        <button class="btn btn-outline" onclick="startReviewSession('spaced')" style="flex:1;min-width:140px;">
          🧠 Central de Erros<br><small style="font-weight:400;font-size:12px;">${userData.errorBank.length} questões · por prioridade</small>
        </button>` : `
        <div style="text-align:center;padding:20px;color:var(--primary);font-size:14px;">🎉 Nenhum erro pendente!</div>`}
    </div>`;
}

function startReviewSession(mode) {
  let pool;
  if (mode === 'quick') {
    // Quick review: random from completed modules
    const completedIds = userData.completedModules;
    const allCached = Object.entries(questionCache)
      .filter(([k]) => completedIds.includes(parseInt(k.split('_')[0])))
      .flatMap(([,qs]) => qs);
    const saved = JSON.parse(localStorage.getItem('russo_questions') || '[]');
    const combined = [...allCached, ...saved].filter((q,i,a) => a.findIndex(x=>x.text===q.text)===i);
    pool = combined.length >= 5 ? shuffle(combined).slice(0, 10)
      : shuffle(userData.errorBank.map(e => e.qObj)).slice(0, 10);
  } else {
    // Spaced: sort by priority score (most wrong + oldest = highest priority)
    const now = Date.now();
    const sorted = [...userData.errorBank].sort((a, b) => {
      const scoreA = (a.wrongCount || 1) * 1000 + (now - (a.lastWrong || 0)) / 60000;
      const scoreB = (b.wrongCount || 1) * 1000 + (now - (b.lastWrong || 0)) / 60000;
      return scoreB - scoreA;
    });
    pool = sorted.slice(0, 10);
  }
  reviewSession.questions = pool;
  reviewSession.mode = mode || 'spaced';
  reviewSession.qIndex = 0;
  reviewSession.score = 0;
  document.getElementById('review-status').style.display = 'none';
  renderReviewQuestion();
}

function renderReviewQuestion() {
  isReviewAnswered = false;
  const content = document.getElementById('review-content');
  content.innerHTML = '';

  if (reviewSession.qIndex >= reviewSession.questions.length) {
    const pct = reviewSession.questions.length > 0
      ? Math.round((reviewSession.score||0) / reviewSession.questions.length * 100) : 0;
    content.innerHTML = `
      <div style="text-align:center;padding:30px;">
        <div style="font-size:56px;margin-bottom:12px;">${pct>=80?'🏆':pct>=60?'💪':'📖'}</div>
        <h2 style="color:var(--primary);">Sessão Concluída!</h2>
        <p style="color:var(--muted);margin:8px 0 20px;">${pct}% de acerto nesta sessão</p>
        <button class="btn btn-outline" onclick="navTo('review')">Ver Estatísticas</button>
      </div>`;
    document.getElementById('review-status').style.display = 'block';
    buildReview();
    return;
  }

  const rawItem   = reviewSession.questions[reviewSession.qIndex];
  // Support both errorBank items {qObj, streak} and direct question objects
  const errorItem = rawItem.qObj ? rawItem : { qObj: rawItem, streak: null, id: null };
  const qObj      = errorItem.qObj;

  const isSpaced  = reviewSession.mode === 'spaced' && errorItem.streak !== null;
  const headerText = isSpaced
    ? `<div style="font-size:13px;color:var(--accent);margin-bottom:15px;font-weight:600;">🧠 Erro ${errorItem.wrongCount||1}x · Acertos: ${errorItem.streak}/2</div>`
    : `<div style="font-size:13px;color:var(--accent);margin-bottom:15px;font-weight:600;">⚡ Revisão Rápida · ${reviewSession.qIndex+1}/${reviewSession.questions.length}</div>`;
  const wrapper = document.createElement('div');
  const h3 = document.createElement('h3');
  h3.style.cssText = 'margin-bottom:8px;font-size:22px;line-height:1.6;';
  h3.innerHTML = headerText;
  const qText = document.createElement('div');
  qText.style.cssText = 'font-size:20px;margin-bottom:8px;line-height:1.5;font-weight:600;';
  qText.textContent = qObj.text;
  h3.appendChild(qText);
  wrapper.appendChild(h3);

  // Fixed translation — no API call
  if (qObj.translation || qObj.explain) {
    const ptDiv = document.createElement('div');
    ptDiv.style.cssText = 'font-size:13px;color:var(--muted);margin-bottom:16px;font-style:italic;padding:6px 0;border-bottom:1px solid var(--border);';
    ptDiv.textContent = '🇧🇷 ' + (qObj.translation || qObj.explain);
    wrapper.appendChild(ptDiv);
  }

  // Show hint and explain upfront in review mode
  const cyrRe = /[А-яЁё]/;
  const safeHint = qObj.hint && !cyrRe.test(qObj.hint) ? qObj.hint : null;
  const safeExplain = qObj.explain && !cyrRe.test(qObj.explain) ? qObj.explain : null;
  const safeTr = qObj.translation && !cyrRe.test(qObj.translation) ? qObj.translation : null;
  if (safeHint || safeExplain || safeTr) {
    const hintBox = document.createElement('div');
    hintBox.style.cssText = 'background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);border-radius:10px;padding:12px 14px;margin-bottom:16px;';
    hintBox.innerHTML =
      (safeTr ? '<div style="color:var(--muted);font-size:13px;margin-bottom:4px;">🇧🇷 ' + safeTr + '</div>' : '')
      + (safeHint ? '<div style="color:var(--accent);font-size:13px;font-weight:700;margin-bottom:4px;">💡 ' + safeHint + '</div>' : '')
      + (safeExplain ? '<div style="color:var(--muted);font-size:13px;">' + safeExplain + '</div>' : '');
    wrapper.appendChild(hintBox);
  }

  content.appendChild(wrapper);

  const optsContainer = document.createElement('div');
  optsContainer.id = 'rev-options-container';

  const options = qObj.options.map((opt, idx) => ({ text: opt, isCorrect: idx === qObj.correct }));
  shuffle(options).forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.text;
    btn.onclick = () => checkReviewAnswer(btn, opt.isCorrect, errorItem.id);
    optsContainer.appendChild(btn);
  });
  content.appendChild(optsContainer);

  const fb = document.createElement('div');
  fb.id = 'rev-feedback';
  fb.className = 'feedback-box';
  content.appendChild(fb);

  const nextBtn = document.createElement('button');
  nextBtn.id = 'rev-next-btn';
  nextBtn.className = 'btn';
  nextBtn.style.display = 'none';
  nextBtn.textContent = 'Próxima Questão';
  nextBtn.onclick = () => nextReviewQuestion();
  content.appendChild(nextBtn);

  if (qObj.type === 'cloze') speakRU(qObj.text.replace('____', '...'));
}

function checkReviewAnswer(btnElem, isCorrect, errorItemId) {
  if (isReviewAnswered) return;
  isReviewAnswered = true;

  document.querySelectorAll('#rev-options-container .option-btn').forEach(btn => {
    btn.disabled = true;
    btn.style.pointerEvents = 'none';
  });

  const fb = document.getElementById('rev-feedback');
  fb.style.display = 'block';

  const bankIndex = userData.errorBank.findIndex(e => e.id === errorItemId);
  const qObj      = reviewSession.questions[reviewSession.qIndex].qObj;

  if (isCorrect) {
    reviewSession.score = (reviewSession.score||0) + 1;
    btnElem.classList.add('correct');
    const revExplain = qObj.explain && !/[А-яЁё]/.test(qObj.explain) ? qObj.explain : '';
    fb.innerHTML = '<div class="feedback-title" style="color:var(--primary);">✅ Exato!</div>'
      + (revExplain ? '<p>' + revExplain + '</p>' : '');
    if (bankIndex > -1) {
      userData.errorBank[bankIndex].streak++;
      if (userData.errorBank[bankIndex].streak >= 2) {
        userData.errorBank.splice(bankIndex, 1);
        fb.innerHTML += `<p style="margin-top:5px;color:var(--accent);">Questão dominada e removida da lista.</p>`;
      }
    }
  } else {
    btnElem.classList.add('wrong');
    fb.innerHTML = `<div class="feedback-title" style="color:var(--error);">❌ Incorreto</div><p>${qObj.explain}</p>`;
    if (bankIndex > -1) userData.errorBank[bankIndex].streak = 0;
  }

  saveData();
  const nb = document.getElementById('rev-next-btn');
  if (nb) nb.style.display = 'block';
}

function nextReviewQuestion() {
  reviewSession.qIndex++;
  renderReviewQuestion();
}

// ════════════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ════════════════════════════════════════════════════════════
function showToast(message, duration = 4000) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.cssText = `
      position:fixed; bottom:100px; left:50%; transform:translateX(-50%);
      background:var(--card); color:var(--text); padding:12px 20px;
      border-radius:10px; border:1px solid var(--border); font-size:14px;
      font-weight:600; z-index:300; max-width:90vw; text-align:center;
      box-shadow:0 4px 15px rgba(0,0,0,0.4); opacity:0;
      transition:opacity 0.3s ease;`;
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, duration);
}

// ════════════════════════════════════════════════════════════
//  INICIALIZAÇÃO
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
//  SUBMÓDULOS TEMÁTICOS
// ════════════════════════════════════════════════════════════
let currentSubmod = null;
let subCurrent = { questions: [], qIndex: 0, score: 0 };
let isSubAnswered = false;

function openSubmodules(modId, modTitle) {
  currentSubmod = modId;
  document.getElementById('submod-parent-title').innerText = '📚 ' + modTitle;
  const list = document.getElementById('submodules-list');
  list.innerHTML = '';

  // ── Grammar summary ──
  const grammar = grammarDB[String(modId)];
  if (grammar) {
    list.innerHTML += `<div class="grammar-section" style="margin-bottom:24px;">${grammar}</div>`;
  }

  // ── Submodule cards ──
  list.innerHTML += `<h3 style="color:var(--accent);margin-bottom:12px;font-size:15px;">📖 Submódulos — aprenda e pratique</h3>`;
  const modSubs = submodulesData.filter(s => s.modId === modId);
  modSubs.forEach(sub => {
    const miniDone = (userData.completedSubmodules||[]).includes(sub.id + '_mini');
    const quizDone = (userData.completedSubmodules||[]).includes(sub.id);
    const status = quizDone ? 'completed' : 'unlocked';
    list.innerHTML += `
      <div class="module-card ${status}" style="flex-direction:column;align-items:stretch;gap:8px;cursor:default;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <p style="color:var(--muted);font-size:12px;margin-bottom:2px;">${sub.words.length} palavras · ${sub.grammar}</p>
            <h3 style="font-size:16px;">${sub.title}</h3>
          </div>
          <div style="font-size:20px;">${quizDone ? '✅' : miniDone ? '📝' : '📖'}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button onclick="startMiniLesson('${sub.id}')" style="flex:1;background:var(--accent);color:var(--bg);border:none;padding:8px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">
            ${miniDone ? '🔄 Rever aula' : '📖 Mini aula'}
          </button>
          <button onclick="startSublesson('${sub.id}','${sub.title.replace(/'/g,"\\'")}')" style="flex:1;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">
            ${quizDone ? '🔄 Praticar' : '📝 Quiz'}
          </button>
        </div>
      </div>`;
  });

  // ── Final exam button ──
  const minisDone = modSubs.filter(s => (userData.completedSubmodules||[]).includes(s.id + '_mini')).length;
  const examUnlocked = minisDone >= Math.ceil(modSubs.length / 2);
  const modDone = userData.completedModules.includes(modId);
  list.innerHTML += `
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border);">
      ${modDone
        ? `<div style="text-align:center;padding:16px;color:var(--primary);font-weight:700;">✅ Módulo concluído!</div>`
        : examUnlocked
          ? `<button class="btn" onclick="startFinalExam(${modId})" style="width:100%;">🎓 Prova Final do Módulo</button>
             <p style="text-align:center;color:var(--muted);font-size:12px;margin-top:8px;">Precisa de 70% para passar · Só palavras que você estudou</p>`
          : `<button class="btn" disabled style="width:100%;opacity:0.4;cursor:not-allowed;">🎓 Prova Final — faça ${Math.ceil(modSubs.length/2) - minisDone} mini aula(s) para liberar</button>`
      }
    </div>`;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-submodules').classList.add('active');
}

async function startSublesson(subId, subTitle) {
  const sub = submodulesData.find(s => s.id === subId);
  if (!sub) return;
  subCurrent = { subId, questions: [], qIndex: 0, score: 0 };
  document.getElementById('sublesson-title').innerText = sub.title;
  document.getElementById('sublesson-step').innerText = 'Carregando...';
  document.getElementById('sublesson-content').innerHTML = `<div style="text-align:center;padding:40px;"><div class="spinner"></div><p style="color:var(--muted);margin-top:16px;">Gerando questões com IA...</p></div>`;
  document.getElementById('sublesson-feedback').style.display = 'none';
  document.getElementById('sublesson-next-btn').style.display = 'none';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-sublesson').classList.add('active');

  // Rotating cache: pool grows each visit, rotates every 3 visits
  const cacheKey = `sub_pool_${subId}`;
  const visitKey = `sub_visits_${subId}`;
  let pool = [], visits = 0;
  try { pool = JSON.parse(localStorage.getItem(cacheKey) || '[]'); visits = parseInt(localStorage.getItem(visitKey) || '0'); } catch(e) {}

  const shouldGenerate = pool.length < 8;  // only generate if pool is empty/small

  if (shouldGenerate) {
    const wordList = sub.words.map(w => `${w.ru} = ${w.pt}`).join(', ');
    const prompt = `Professor de russo. Aula: "${sub.title}" (${sub.grammar}). Vocabulário: ${wordList}

Retorne APENAS array JSON com 8 questões. Cada objeto: {type, text, translation, options:[4 strings], correct:0-3, explain, hint}
- translation: tradução completa da frase em PT (com resposta no lugar do ____).
- correct variado entre 0-3. explain, hint e translation em PORTUGUÊS — NUNCA em russo.
- cloze: frase com ____. translate: "Como se diz: ..."

[{"type":"cloze","text":"____ меня кофе.","translation":"Dá-me um café.","options":["Дай","Дать","Даю","Дал"],"correct":0,"explain":"Дай = imperativo informal de dar.","hint":"R: Дай"}]

JSON:`;
    try {
      const newQs = await callGeminiWithRetry(prompt, 2);
      if (newQs && newQs.length >= 4) {
        const merged = [...pool];
        newQs.forEach(q => { if (!merged.some(m => m.text === q.text)) merged.push(q); });
        pool = merged;
        try { localStorage.setItem(cacheKey, JSON.stringify(pool)); } catch(e) {}
      }
    } catch(e) {}
  }

  try { localStorage.setItem(visitKey, String(visits + 1)); } catch(e) {}

  let questions = pool.length >= 4 ? shuffle(pool).slice(0, 8) : buildSubFallback(sub.words);
  subCurrent.questions = questions;
  const stopwords = new Set(['a','e','o','de','do','da','em','na','no','para','por','com','um','uma','e,','ou','mas','que','se']);
  sub.words.forEach(w => {
    const ruClean = (w.ru||'').trim();
    const ptClean = (w.pt||'').trim();
    // Skip stopwords, single chars, and entries where ru looks like Portuguese
    if (ruClean.length <= 1) return;
    if (stopwords.has(ruClean.toLowerCase())) return;
    if (stopwords.has(ptClean.toLowerCase())) return;
    // Ensure ru field actually contains Cyrillic
    if (!/[А-яЁё]/u.test(ruClean)) return;
    if (!userData.learnedWords.some(x => x.ru === ruClean))
      userData.learnedWords.push({ ru: ruClean, pt: ptClean, tag: sub.title });
  });
  questions.forEach(q => {
    if (!generatedQuestionsHistory.some(h => h.text === q.text))
      generatedQuestionsHistory.push(q);
  });
  saveData();
  renderSubQuestion();
}



function buildSubFallback(words) {
  const shuffled = shuffle([...words]);
  return shuffled.slice(0, 8).map(w => {
    const distractors = shuffle(words.filter(x => x.ru !== w.ru)).slice(0, 3);
    const opts = shuffle([w, ...distractors]);
    const correctIdx = opts.findIndex(o => o.ru === w.ru);
    return {
      type: 'cloze',
      text: `Como se traduz "${w.ru}"?`,
      options: opts.map(o => `${o.ru} (${o.pt})`),
      correct: correctIdx,
      explain: `${w.ru} significa "${w.pt}".`,
      hint: `R: ${w.ru} (${w.pt})`
    };
  });
}

function renderSubQuestion() {
  isSubAnswered = false;
  const content = document.getElementById('sublesson-content');
  const fb = document.getElementById('sublesson-feedback');
  const nextBtn = document.getElementById('sublesson-next-btn');
  fb.style.display = 'none';
  nextBtn.style.display = 'none';

  if (subCurrent.qIndex >= subCurrent.questions.length) {
    const pct = Math.round((subCurrent.score / subCurrent.questions.length) * 100);
    content.innerHTML = `
      <div style="text-align:center;padding:30px;">
        <div style="font-size:60px;margin-bottom:16px;">${pct >= 70 ? '🎉' : '📖'}</div>
        <h2>${pct}% de acerto</h2>
        <p style="color:var(--muted);margin-top:8px;">Você acertou ${subCurrent.score} de ${subCurrent.questions.length} questões.</p>
        <p style="color:var(--muted);font-size:13px;margin-top:12px;">Submódulos não têm nota mínima — pratique à vontade!</p>
      </div>`;
    // Mark submodule as completed
    if (subCurrent.subId && !userData.completedSubmodules.includes(subCurrent.subId)) {
      userData.completedSubmodules.push(subCurrent.subId);
      saveData();
    }
    nextBtn.style.display = 'block';
    nextBtn.innerText = 'Voltar aos Submódulos';
    nextBtn.onclick = () => {
      document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
      document.getElementById('screen-submodules').classList.add('active');
      // Refresh submodule list to show checkmarks
      openSubmodules(currentSubmod, document.getElementById('submod-parent-title').innerText.replace('📚 ',''));
    };
    return;
  }

  const q = subCurrent.questions[subCurrent.qIndex];
  document.getElementById('sublesson-step').innerText = `Questão ${subCurrent.qIndex + 1}/${subCurrent.questions.length}`;
  content.innerHTML = '';
  const subH3 = document.createElement('h3');
  subH3.style.cssText = 'font-size:20px;margin-bottom:6px;line-height:1.6;';
  subH3.textContent = q.text || '';
  content.appendChild(subH3);
  if (q.translation || q.hint) {
    const subPt = document.createElement('div');
    subPt.style.cssText = 'font-size:13px;color:var(--muted);margin-bottom:16px;font-style:italic;padding:6px 0;border-bottom:1px solid var(--border);';
    subPt.textContent = '🇧🇷 ' + (q.translation || q.hint);
    content.appendChild(subPt);
  }

  // Auto-speak question on load
  setTimeout(() => speakRU(q.text.replace('____','...')), 300);
  const optsDiv = document.createElement('div');
  const opts = (q.options||[]).map((o,i) => ({text:o, isCorrect: i===q.correct}));
  let selectedSubOpt = null;
  const subConfirmBtn = document.createElement('button');
  subConfirmBtn.className = 'btn';
  subConfirmBtn.textContent = 'Confirmar Resposta';
  subConfirmBtn.style.cssText = 'margin-top:16px;display:none;';
  subConfirmBtn.onclick = () => {
    if (selectedSubOpt) checkSubAnswer(selectedSubOpt.btn, selectedSubOpt.isCorrect, q);
  };
  shuffle(opts).forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      if (isSubAnswered) return;
      optsDiv.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSubOpt = { btn, isCorrect: opt.isCorrect };
      speakRU(opt.text.replace(/\(.*?\)/g,'').trim());
      subConfirmBtn.style.display = 'block';
    };
    optsDiv.appendChild(btn);
  });
  content.appendChild(optsDiv);
  content.appendChild(subConfirmBtn);

  if (q.hint) {
    const hintBtn = document.createElement('button');
    hintBtn.className = 'btn-hint';
    hintBtn.textContent = '💡 Dica';
    hintBtn.onclick = () => alert(q.hint);
    content.appendChild(hintBtn);
  }
}

function checkSubAnswer(btnElem, isCorrect, qObj) {
  if (isSubAnswered) return;
  isSubAnswered = true;
  document.querySelectorAll('#sublesson-content .option-btn').forEach(b => { b.disabled=true; b.style.pointerEvents='none'; });
  const fb = document.getElementById('sublesson-feedback');
  fb.style.display = 'block';
  if (isCorrect) {
    btnElem.classList.add('correct');
    fb.style.borderLeftColor = 'var(--primary)';
    fb.innerHTML = `<div class="feedback-title" style="color:var(--primary);">✅ Correto!</div><p>${qObj.explain||''}</p>`;
    subCurrent.score++;
    const correctRU = (qObj.options[qObj.correct]||'').replace(/\(.*?\)/g,'').trim();
    speakRU(correctRU || qObj.text||'');
  } else {
    btnElem.classList.add('wrong');
    fb.style.borderLeftColor = 'var(--error)';
    fb.innerHTML = `<div class="feedback-title" style="color:var(--error);">❌ Incorreto</div><p>${qObj.explain||''}</p>`;
  }
  const nextBtn = document.getElementById('sublesson-next-btn');
  nextBtn.style.display = 'block';
  nextBtn.innerText = subCurrent.qIndex + 1 >= subCurrent.questions.length ? 'Ver Resultado' : 'Próxima';
  nextBtn.onclick = () => { subCurrent.qIndex++; renderSubQuestion(); };
}
