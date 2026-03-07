function renderMiniStep() {
  isMiniAnswered = false;
  const content = document.getElementById('mini-content');
  const feedback = document.getElementById('mini-feedback');
  const nextBtn = document.getElementById('mini-next-btn');
  feedback.style.display = 'none';
  nextBtn.style.display = 'none';
  content.innerHTML = '';

  const total = miniLesson.questions.length;
  const idx = miniLesson.index;

  // All words done → go to practice quiz
  if (idx >= total) {
    const pct = Math.round(miniLesson.score / total * 100);
    content.innerHTML = `
      <div style="text-align:center;padding:30px;">
        <div style="font-size:60px;margin-bottom:16px;">${pct>=70?'🎉':'💪'}</div>
        <h2 style="color:var(--primary);">Mini aula concluída!</h2>
        <p style="color:var(--muted);margin:8px 0 24px;">Você acertou ${miniLesson.score} de ${total} questões.</p>
        <button class="btn" onclick="startSublesson('${miniLesson.subId}','')" style="width:100%;margin-bottom:12px;">
          📝 Praticar com quiz completo
        </button>
        <button onclick="expandMiniLesson('${miniLesson.subId}')" style="width:100%;background:linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.05));border:1px solid var(--accent);color:var(--accent);padding:12px;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px;">
          ➕ Expandir vocabulário
        </button>
        <button onclick="refreshMiniLesson('${miniLesson.subId}')" style="width:100%;background:var(--surface);border:1px solid var(--border);color:var(--muted);padding:10px;border-radius:12px;font-size:14px;cursor:pointer;">
          🔄 Mesmas palavras, contexto novo
        </button>
      </div>`;
    // Mark submodule as visited for mini lesson
    if (!userData.completedSubmodules) userData.completedSubmodules = [];
    if (!userData.completedSubmodules.includes(miniLesson.subId + '_mini')) {
      userData.completedSubmodules.push(miniLesson.subId + '_mini');
      saveData();
    }
    return;
  }

  const q = miniLesson.questions[idx];
  document.getElementById('mini-step').innerText = `Palavra ${idx + 1} de ${total}`;

  // ── PHASE: PRESENT word ──
  if (miniLesson.phase === 'present' || q.isNew) {
    const wordWrapped = wrapWordsWithTooltip(q.word_ru, false, { [q.word_ru]: q.word_pt });

    // Save word to dictionary immediately when presented
    if (!userData.learnedWords) userData.learnedWords = [];
    const cyrillicRe = /[А-яЁё]/;
    const ruClean = (q.word_ru||'').trim();
    const ptClean = (q.word_pt||'').trim();
    if (ruClean.length > 1 && cyrillicRe.test(ruClean) && !userData.learnedWords.some(x => x.ru === ruClean)) {
      const sub = submodulesData.find(s => s.id === miniLesson.subId);
      userData.learnedWords.push({ ru: ruClean, pt: ptClean, tag: sub ? sub.title : 'mini aula' });
      saveData();
    }
    content.innerHTML = `
      <div style="background:var(--card);border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:24px;border:1px solid var(--accent);">
        <div style="font-size:13px;color:var(--muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">Nova palavra</div>
        <div style="font-size:42px;font-weight:700;color:var(--text);margin-bottom:8px;">${q.word_ru}</div>
        <div style="font-size:22px;color:var(--accent);margin-bottom:20px;">${q.word_pt}</div>
        <button onclick="speakRU('${q.word_ru.replace(/'/g,"\'")}'); this.textContent='🔊 Ouvindo...'; setTimeout(()=>this.textContent='🔊 Ouvir',1500);" 
          style="background:var(--surface);border:1px solid var(--border);color:var(--text);padding:10px 24px;border-radius:10px;font-size:16px;cursor:pointer;">
          🔊 Ouvir
        </button>
      </div>
      <p style="color:var(--muted);font-size:14px;text-align:center;">Memorize esta palavra — você vai precisar dela agora!</p>`;

    // Save word to dictionary when presented
    if (!userData.learnedWords) userData.learnedWords = [];
    const sub = submodulesData.find(s => s.id === miniLesson.subId);
    if (q.word_ru && /[А-яЁё]/.test(q.word_ru) && !userData.learnedWords.some(x => x.ru === q.word_ru)) {
      userData.learnedWords.push({ ru: q.word_ru, pt: q.word_pt, tag: sub ? sub.title : 'mini aula' });
      saveData();
    }

    nextBtn.style.display = 'block';
    if (q.isNew) {
      // New word from expand — no quiz, just advance to next item
      nextBtn.innerText = 'Próxima →';
      nextBtn.onclick = () => {
        miniLesson.index++;
        miniLesson.phase = 'present';
        renderMiniStep();
      };
    } else {
      nextBtn.innerText = 'Entendi, testar! →';
      nextBtn.onclick = () => {
        miniLesson.phase = 'quiz';
        renderMiniStep();
      };
    }
    speakRU(q.word_ru);

  // ── PHASE: QUIZ ──
  } else {
    // Hint box
    content.innerHTML = `
      <div style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--accent);font-weight:600;">
        💡 <strong>${q.word_ru}</strong> = ${q.word_pt}
      </div>`;

    // Question in Russian (plain text)
    const h3 = document.createElement('h3');
    h3.id = 'mini-question-text';
    h3.style.cssText = 'font-size:20px;margin-bottom:6px;line-height:1.5;';
    h3.textContent = q.question;
    content.appendChild(h3);

    // Fixed PT translation below (from Gemini field or fallback)
    const ptDiv = document.createElement('div');
    ptDiv.style.cssText = 'font-size:13px;color:var(--muted);margin-bottom:16px;font-style:italic;padding:6px 0;border-bottom:1px solid var(--border);';
    ptDiv.textContent = q.question_pt ? ('🇧🇷 ' + q.question_pt) : ('🇧🇷 ' + q.word_pt);
    content.appendChild(ptDiv);

    const optsContainer = document.createElement('div');
    const options = q.options.map((opt, idx) => ({ text: opt, isCorrect: idx === q.correct }));
    shuffle(options).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt.text;
      btn.onclick = () => {
        if (isMiniAnswered) return;
        isMiniAnswered = true;
        optsContainer.querySelectorAll('.option-btn').forEach(b => { b.disabled = true; b.style.pointerEvents='none'; });
        const fb = document.getElementById('mini-feedback');
        fb.style.display = 'block';
        if (opt.isCorrect) {
          btn.classList.add('correct');
          miniLesson.score++;
          playSound('correct');
          updateStreak();
          fb.innerHTML = `<div class="feedback-title" style="color:var(--primary);">✅ Correto!</div>
            <p>${q.explain}</p>
            <p style="color:var(--muted);font-size:13px;margin-top:6px;font-style:italic;">📖 "${q.question.replace(/____/g, q.options[q.correct])}"</p>`;
          speakRU(q.word_ru);
        } else {
          btn.classList.add('wrong');
          optsContainer.querySelectorAll('.option-btn').forEach(b => {
            if (b.textContent === q.options[q.correct]) b.classList.add('correct');
          });
          playSound('wrong');
          fb.innerHTML = `<div class="feedback-title" style="color:var(--error);">❌ Incorreto</div>
            <p>${q.explain}</p>
            <p style="color:var(--muted);font-size:13px;margin-top:6px;font-style:italic;">📖 "${q.question.replace(/____/g, q.options[q.correct])}"</p>`;
        }
        nextBtn.style.display = 'block';
        nextBtn.innerText = idx + 1 < miniLesson.questions.length ? 'Próxima palavra →' : 'Ver resultado';
        nextBtn.onclick = () => {
          miniLesson.index++;
          miniLesson.phase = 'present';
          renderMiniStep();
        };
      };
      optsContainer.appendChild(btn);
    });
    content.appendChild(optsContainer);
  }
}

// ════════════════════════════════════════════════════════════
//  PROVA FINAL DO MÓDULO
// ════════════════════════════════════════════════════════════
let finalExam = { modId: null, questions: [], qIndex: 0, score: 0 };
let isExamAnswered = false;

async function startFinalExam(modId) {
  finalExam = { modId, questions: [], qIndex: 0, score: 0 };
  isExamAnswered = false;

  const mod = modulesData.find(m => m.id === modId);
  document.getElementById('exam-title').innerText = '🎓 ' + mod.title;
  document.getElementById('exam-step').innerText = 'Carregando...';
  document.getElementById('exam-content').innerHTML = `<div style="text-align:center;padding:40px;"><div class="spinner"></div><p style="color:var(--muted);margin-top:16px;">Gerando prova final com IA...</p></div>`;
  document.getElementById('exam-feedback').style.display = 'none';
  document.getElementById('exam-next-btn').style.display = 'none';

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-finalexam').classList.add('active');

  // Collect all words seen in mini lessons for this module
  const modSubs = submodulesData.filter(s => s.modId === modId);
  const allWords = modSubs.flatMap(s => s.words);
  const wordList = allWords.slice(0, 25).map(w => `${w.ru} (${w.pt})`).join(', ');

  const prompt = `Você é professor de russo. Gere 15 questões de múltipla escolha para a PROVA FINAL do módulo "${mod.title}" (nível ${mod.cefr}).

REGRAS OBRIGATÓRIAS:
- Use APENAS estas palavras que o aluno estudou: ${wordList}
- Nível ESTRITO ${mod.cefr}: ${mod.cefr==='A1'?'presente+imperativo, SEM aspectos':mod.cefr==='A2'?'passado+futuro budu+inf':mod.cefr==='B1'?'aspectos+genitivo plural':'condicional+voz passiva'}
- Misture cloze e translate
- correct variado entre 0-3
- explain, hint e translation em PORTUGUÊS BRASILEIRO — NUNCA em russo
- translation: tradução completa da frase com a resposta correta no lugar do ____

Retorne APENAS array JSON. Cada objeto: {type,text,translation,options:[4],correct:0-3,explain,hint}

JSON:`;

  try {
    await _waitForRateLimit(document.getElementById('exam-content'));
    const resp = await fetch(`${GEMINI_PRO_URL}?key=${userData.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
      })
    });
    if (resp.ok) {
      const data = await resp.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const raw = parts.map(p => p.text || '').join('');
      const cleaned = raw.replace(/\`\`\`json|\`\`\`/g, '').trim();
      const start = cleaned.indexOf('['), end = cleaned.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(cleaned.slice(start, end + 1));
        const valid = parsed.filter(q => q.type && q.text && Array.isArray(q.options) && q.options.length >= 4 && typeof q.correct === 'number');
        if (valid.length >= 8) {
          finalExam.questions = valid.slice(0, 15);
          renderExamQuestion();
          return;
        }
      }
    }
  } catch(e) { console.warn('Prova final API falhou:', e); }

  // Fallback: use module fallback questions
  finalExam.questions = shuffle(getFallbackQuestions(3, modId).concat(getFallbackQuestions(4, modId))).slice(0, 15);
  renderExamQuestion();
}

function renderExamQuestion() {
  isExamAnswered = false;
  const content = document.getElementById('exam-content');
  const feedback = document.getElementById('exam-feedback');
  const nextBtn = document.getElementById('exam-next-btn');
  feedback.style.display = 'none';
  nextBtn.style.display = 'none';
  content.innerHTML = '';

  const total = finalExam.questions.length;
  const idx = finalExam.qIndex;

  if (idx >= total) {
    const pct = Math.round(finalExam.score / total * 100);
    const passed = pct >= 70;
    content.innerHTML = `
      <div style="text-align:center;padding:30px;">
        <div style="font-size:64px;margin-bottom:16px;">${passed ? '🏆' : '📖'}</div>
        <h2 style="color:${passed ? 'var(--primary)' : 'var(--error)'};">${pct}% de Acerto</h2>
        <p style="color:var(--muted);margin:8px 0 24px;">Você acertou ${finalExam.score} de ${total} questões. ${passed ? 'Módulo concluído!' : 'Precisa de 70% para passar.'}</p>
        ${passed ? `<button class="btn" onclick="completeModule(${finalExam.modId})">✅ Concluir Módulo</button>` :
          `<button class="btn btn-outline" onclick="startFinalExam(${finalExam.modId})">🔄 Refazer Prova</button>`}
      </div>`;

    // Record stats
    const mid = String(finalExam.modId);
    if (!userData.moduleStats[mid]) userData.moduleStats[mid] = { attempts: 0, scores: [], lastAttempt: 0 };
    userData.moduleStats[mid].attempts++;
    userData.moduleStats[mid].scores.push(pct);
    userData.moduleStats[mid].lastAttempt = Date.now();
    saveData();
    return;
  }

  const q = finalExam.questions[idx];
  document.getElementById('exam-step').innerText = `Questão ${idx + 1} / ${total}`;

  const wrapper = document.createElement('div');

  // Hint (if available from Gemini)
  if (q.hint) {
    const hintDiv = document.createElement('div');
    hintDiv.style.cssText = 'background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:var(--accent);font-weight:600;';
    hintDiv.textContent = '💡 ' + q.hint;
    wrapper.appendChild(hintDiv);
  }

  // Question in Russian
  const qH3 = document.createElement('h3');
  qH3.style.cssText = 'font-size:20px;margin-bottom:6px;line-height:1.6;';
  qH3.textContent = q.text;
  wrapper.appendChild(qH3);

  // Fixed PT translation (no API call)
  if (q.translation || q.explain) {
    const ptDiv = document.createElement('div');
    ptDiv.style.cssText = 'font-size:13px;color:var(--muted);margin-bottom:16px;font-style:italic;padding:6px 0;border-bottom:1px solid var(--border);';
    ptDiv.textContent = '🇧🇷 ' + (q.translation || q.explain);
    wrapper.appendChild(ptDiv);
  }

  content.appendChild(wrapper);

  const optsContainer = document.createElement('div');
  optsContainer.id = 'exam-options';
  const options = q.options.map((opt, i) => ({ text: opt, isCorrect: i === q.correct }));
  shuffle(options).forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      if (isExamAnswered) return;
      isExamAnswered = true;
      optsContainer.querySelectorAll('.option-btn').forEach(b => { b.disabled = true; b.style.pointerEvents = 'none'; });
      const fb = document.getElementById('exam-feedback');
      fb.style.display = 'block';
      if (opt.isCorrect) {
        btn.classList.add('correct');
        finalExam.score++;
        fb.innerHTML = `<div class="feedback-title" style="color:var(--primary);">✅ Correto!</div><p>${q.explain}</p>`;
        if (q.type === 'cloze') speakRU(q.text.replace('____', q.options[q.correct]));
      } else {
        btn.classList.add('wrong');
        optsContainer.querySelectorAll('.option-btn').forEach(b => {
          if (b.textContent === q.options[q.correct]) b.classList.add('correct');
        });
        fb.innerHTML = `<div class="feedback-title" style="color:var(--error);">❌ Incorreto</div><p>${q.explain}</p><p style="color:var(--accent);font-size:13px;margin-top:6px;">💡 ${q.hint||''}</p>`;
      }
      const nb = document.getElementById('exam-next-btn');
      if (nb) { nb.style.display = 'block'; nb.textContent = idx + 1 < total ? 'Próxima →' : 'Ver resultado'; nb.onclick = () => { finalExam.qIndex++; renderExamQuestion(); }; }
    };
    optsContainer.appendChild(btn);
  });
  content.appendChild(optsContainer);

  if (q.type === 'cloze') speakRU(q.text.replace('____', '...'));
}

function updateStreak() {
  const today = new Date().toISOString().slice(0,10);
  const last = userData.lastStudyDate;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
  if (last === today) return; // already studied today
  userData.streak = (last === yesterday) ? (userData.streak || 0) + 1 : 1;
  userData.lastStudyDate = today;
  saveData();
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'correct') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'complete') {
      const notes = [523,659,784,1047];
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.3, ctx.currentTime + i*0.12);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i*0.12 + 0.3);
        o.start(ctx.currentTime + i*0.12);
        o.stop(ctx.currentTime + i*0.12 + 0.3);
      });
    }
  } catch(e) {}
}

function launchConfetti() {
  const colors = ['#d4af37','#4caf50','#2196f3','#e91e63','#ff9800'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 6;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = Math.random() * 2 + 2;
    piece.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:${color};left:${left}%;top:-20px;border-radius:${Math.random()>0.5?'50%':'2px'};animation:confettiFall ${duration}s ${delay}s ease-in forwards;opacity:0.9;transform:rotate(${Math.random()*360}deg);`;
    container.appendChild(piece);
  }
  if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = '@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}';
    document.head.appendChild(style);
  }
  setTimeout(() => container.remove(), 3500);
}

function completeModule(modId) {
  if (!userData.completedModules.includes(modId)) {
    userData.completedModules.push(modId);
    updateStreak();
    saveData();
    playSound('complete');
    launchConfetti();
  }
  navTo('home');
}

function startLesson(modId, isLocked) {
  if (isLocked) return;
  currentLesson = { modId, step: 1, questions: [], qIndex: 0, score: 0 };
  document.getElementById('screen-home').classList.remove('active');
  document.getElementById('screen-lesson').classList.add('active');
  renderLessonStep();
}

function goBackLesson() {
  if ((currentLesson.step === 3 || currentLesson.step === 4) && currentLesson.qIndex > 0) {
    currentLesson.qIndex = 0;
    currentLesson.score = 0;
    renderLessonStep();
  } else if (currentLesson.step > 1) {
    currentLesson.step--;
    currentLesson.qIndex = 0;
    currentLesson.score = 0;
    currentLesson.questions = [];
    renderLessonStep();
  } else {
    navTo('home');
  }
}

function nextLessonStep() { /* delegado para botões inline */ }

async function renderLessonStep() {
  isQuestionAnswered = false;

  const mod = modulesData.find(m => m.id === currentLesson.modId);
  document.getElementById('lesson-title').innerText = mod.title;

  const content  = document.getElementById('lesson-content');
  const feedback = document.getElementById('lesson-feedback');
  const nextBtn  = document.getElementById('lesson-next-btn');

  feedback.style.display = 'none';
  nextBtn.style.display   = 'none';
  content.innerHTML       = '';

  // ── ETAPA 1: Imersão ──
  if (currentLesson.step === 1) {
    document.getElementById('lesson-step').innerText = "Etapa 1/4: Imersão";
    showLoadingInContent("Gerando exemplos com IA...");

    let phrases;
    // Tenta pegar do cache da etapa 3 (já gerada) ou do fallback
    const cached3 = questionCache[`${currentLesson.modId}_3`];
    if (cached3 && cached3.length >= 5) {
      phrases = shuffle(cached3).slice(0, 5);
    } else {
      // Pré-gera as questões da etapa 3 em background enquanto exibe fallback
      phrases = shuffle(getFallbackQuestions(3)).slice(0, 5);
      generateQuestions(currentLesson.modId, 3); // pre-fetch silencioso
    }

    content.innerHTML = `<p style="color:var(--muted); margin-bottom:20px; font-size:16px;">Ouça as frases e absorva os padrões do módulo.</p>`;
    phrases.forEach(p => {
      const cleanRU = p.text.replace('____', p.options[p.correct] || '...').replace(/\(.*?\)/, '').trim();
      content.innerHTML += `
        <div class="phrase-box">
          <div class="flex-col" style="flex:1;">
            <div class="ru-text">${cleanRU}</div>
            <div class="pt-text">${p.explain}</div>
          </div>
          <button class="audio-btn" onclick="speakRU('${cleanRU.replace(/'/g, "\\'")}')">🔊</button>
        </div>`;
    });

    nextBtn.style.display = 'block';
    nextBtn.innerText = "Ir para Teoria Gramatical";
    nextBtn.onclick = () => { currentLesson.step = 2; renderLessonStep(); };
  }

  // ── ETAPA 2: Teoria ──
  else if (currentLesson.step === 2) {
    document.getElementById('lesson-step').innerText = "Etapa 2/4: Teoria";
    const theoryHTML = grammarDB[currentLesson.modId];
    content.innerHTML = `<div class="grammar-section">${theoryHTML}</div>`;

    nextBtn.style.display = 'block';
    nextBtn.innerText = "Começar Quiz de Mecânica";
    nextBtn.onclick = () => {
      currentLesson.step = 3;
      currentLesson.qIndex = 0;
      currentLesson.score = 0;
      currentLesson.questions = [];
      renderLessonStep();
    };
  }

  // ── ETAPA 3 e 4: Quizzes ──
  else if (currentLesson.step === 3 || currentLesson.step === 4) {
    const stepName = currentLesson.step === 3 ? "Mecânica (Lacunas)" : "Desafio Final";

    // Carrega questões se ainda não foram carregadas para esta etapa
    if (currentLesson.questions.length === 0) {
      showLoadingInContent(`Gerando questões com IA...<br><small style="font-size:12px;">Isso pode levar alguns segundos.</small>`);
      nextBtn.style.display = 'none';

      const cacheKey = `${currentLesson.modId}_${currentLesson.step}`;
      const hadCache = !!questionCache[cacheKey];
      const questions = await generateQuestions(currentLesson.modId, currentLesson.step);
      currentLesson.questions = shuffle(questions).slice(0, 10);
      currentLesson.score = 0;
      currentLesson.qIndex = 0;

      // Avisa fallback apenas se a API realmente falhou
      if (!userData.apiKey) {
        showToast('⚠️ Sem API Key — configure em ⚙️');
      } else if (!hadCache && !questionCache[cacheKey]) {
        showToast('⚠️ API indisponível — usando questões de fallback.');
      }
    }

    if (currentLesson.qIndex >= currentLesson.questions.length) {
      showResultScreen();
      return;
    }

    document.getElementById('lesson-step').innerText =
      `Etapa ${currentLesson.step}/4: ${stepName} (${currentLesson.qIndex + 1}/${currentLesson.questions.length})`;
    renderQuestion(currentLesson.questions[currentLesson.qIndex]);
  }
}

function showLoadingInContent(message = "Carregando...") {
  const content = document.getElementById('lesson-content');
  content.innerHTML = `
    <div class="loading-overlay">
      <div class="spinner"></div>
      <div class="loading-text">${message}</div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
//  RENDERIZAÇÃO DE QUESTÃO
// ════════════════════════════════════════════════════════════
function renderQuestion(qObj) {
  const content = document.getElementById('lesson-content');
  content.innerHTML = '';

  const wrappedQText = wrapWordsWithTooltip(qObj.text, true, qObj.words||{});
  const titleEl = document.createElement('h3');
  titleEl.style.cssText = "margin-bottom:12px; font-size:22px; line-height:1.6;";
  titleEl.innerHTML = wrappedQText;
  content.appendChild(titleEl);

  // Static PT translation (no API call)
  if (qObj.translation || qObj.hint) {
    const revPt = document.createElement('div');
    revPt.style.cssText = 'font-size:13px;color:var(--muted);margin-bottom:16px;font-style:italic;padding:6px 0;border-bottom:1px solid var(--border);';
    revPt.textContent = '🇧🇷 ' + (qObj.translation || qObj.hint);
    content.appendChild(revPt);
  }
  // Auto-speak question on load
  setTimeout(() => speakRU(qObj.text.replace('____', '...')), 300);

  const optsContainer = document.createElement('div');
  optsContainer.id = 'options-container';

  const options = qObj.options.map((opt, idx) => ({ text: opt, isCorrect: idx === qObj.correct }));
  let selectedOpt = null;

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn';
  confirmBtn.textContent = 'Confirmar Resposta';
  confirmBtn.style.cssText = 'margin-top:16px;display:none;';
  confirmBtn.onclick = () => {
    if (selectedOpt) checkAnswer(selectedOpt.btn, selectedOpt.isCorrect, qObj.explain, qObj.text, selectedOpt.text, qObj);
  };

  shuffle(options).forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      if (isQuestionAnswered) return;
      // Deselect previous
      optsContainer.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedOpt = { btn, isCorrect: opt.isCorrect, text: opt.text };
      // Play audio of selected option (Russian part only)
      const ruOnly = opt.text.replace(/\(.*?\)/g, '').trim();
      speakRU(ruOnly);
      confirmBtn.style.display = 'block';
    };
    optsContainer.appendChild(btn);
  });

  content.appendChild(optsContainer);
  content.appendChild(confirmBtn);

  if (qObj.hint) {
    const hintContainer = document.createElement('div');
    hintContainer.style.textAlign = 'right';
    const hintBtn = document.createElement('button');
    hintBtn.className = 'btn-hint';
    hintBtn.textContent = '💡 Precisa de uma dica?';
    hintBtn.onclick = () => alert(qObj.hint);
    hintContainer.appendChild(hintBtn);
    content.appendChild(hintContainer);
  }

  if (qObj.type === 'cloze') {
    speakRU(qObj.text.replace('____', '...'));
  }
}

function checkAnswer(btnElem, isCorrect, explanation, qText, optText, qObj) {
  if (isQuestionAnswered) return;
  isQuestionAnswered = true;

  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true;
    btn.style.pointerEvents = 'none';
  });

  const fb = document.getElementById('lesson-feedback');
  fb.style.display = 'block';
  const fullSentence = qText.replace('____', optText);

  if (isCorrect) {
    btnElem.classList.add('correct');
    fb.style.borderLeftColor = "var(--primary)";
    fb.innerHTML = `<div class="feedback-title" style="color:var(--primary);">✅ Resposta Correta!</div><p>${explanation}</p>`;
    currentLesson.score++;
    speakRU(fullSentence);
  } else {
    btnElem.classList.add('wrong');
    fb.style.borderLeftColor = "var(--error)";
    fb.innerHTML = `<div class="feedback-title" style="color:var(--error);">❌ Resposta Incorreta</div><p>${explanation}</p>`;

    const existingIdx = userData.errorBank.findIndex(e => e.qObj.text === currentLesson.questions[currentLesson.qIndex].text);
    if (existingIdx > -1) {
      userData.errorBank[existingIdx].wrongCount = (userData.errorBank[existingIdx].wrongCount || 1) + 1;
      userData.errorBank[existingIdx].lastWrong = Date.now();
      saveData();
    } else {
      const errorItem = {
        id: Date.now(),
        modId: currentLesson.modId,
        qObj: currentLesson.questions[currentLesson.qIndex],
        streak: 0,
        wrongCount: 1,
        lastWrong: Date.now()
      };
      userData.errorBank.push(errorItem);
      saveData();
    }
  }

  const nextBtn = document.getElementById('lesson-next-btn');
  nextBtn.style.display = 'block';
  nextBtn.innerText = "Próxima Pergunta";
  nextBtn.onclick = () => nextQuestion();
}

function nextQuestion() {
  currentLesson.qIndex++;
  if (currentLesson.qIndex >= currentLesson.questions.length) {
    showResultScreen();
    return;
  }
  renderLessonStep();
}

function showResultScreen() {
  const content = document.getElementById('lesson-content');
  document.getElementById('lesson-step').innerText = "Resultado";
  document.getElementById('lesson-feedback').style.display = 'none';

  const total = currentLesson.questions.length;
  const pct   = Math.round((currentLesson.score / total) * 100);

  // Stats now recorded in finalExam

  content.innerHTML = `
    <h2 style="text-align:center; font-size:30px;">${pct}% de Acerto</h2>
    <p style="text-align:center; color:var(--muted); font-size:18px;">
      Você acertou ${currentLesson.score} de ${total} perguntas.
    </p>`;

  const nextBtn = document.getElementById('lesson-next-btn');
  nextBtn.style.display = 'block';
  nextBtn.className = 'btn';

  if (pct >= 80) {
    content.innerHTML += `<div style="text-align:center; font-size:60px; margin:30px 0;">🏆</div>`;
    if (currentLesson.step === 4) {
      nextBtn.innerText = "Concluir Módulo";
      nextBtn.onclick = () => {
        if (!userData.completedModules.includes(currentLesson.modId)) {
          userData.completedModules.push(currentLesson.modId);
          saveData();
        }
        navTo('home');
      };
    } else {
      nextBtn.innerText = "Avançar para Etapa 4 — Desafio Final";
      nextBtn.onclick = () => {
        currentLesson.step = 4;
        currentLesson.qIndex = 0;
        currentLesson.questions = [];
        currentLesson.score = 0;
        renderLessonStep();
      };
    }
  } else {
    content.innerHTML += `
      <div style="text-align:center; font-size:60px; margin:30px 0;">😔</div>
      <p style="text-align:center; color:var(--error); font-weight:600;">
        A nota de aprovação é 80%. Refaça a etapa para fixar o conteúdo.
      </p>`;
    nextBtn.innerText = "Refazer esta Etapa";
    nextBtn.className = "btn btn-outline";
    nextBtn.onclick = () => {
      nextBtn.className = "btn";
      currentLesson.qIndex = 0;
      currentLesson.score = 0;
      currentLesson.questions = []; // força nova chamada à API
      renderLessonStep();
    };
  }
}

// ════════════════════════════════════════════════════════════
//  DICIONÁRIO (busca no histórico gerado)
// ════════════════════════════════════════════════════════════
function searchDict() {
  const q      = document.getElementById('dict-search').value.toLowerCase().trim();
  const resDiv = document.getElementById('dict-results');
  resDiv.innerHTML = '';
  if (q.length < 2) return;

  const results = [];
  const allQuestions = [...generatedQuestionsHistory, ...fallbackQuestions];
  allQuestions.forEach(item => {
    const ruText = (item.text || '').replace('____', '').replace(/[\(\)?"'.,:;]/g, '').toLowerCase();
    const ptText = (item.explain || '').toLowerCase();
    const optsText = (item.options || []).join(' ').toLowerCase();
    if (ruText.includes(q) || ptText.includes(q) || optsText.includes(q)) {
      if (!results.some(r => r.ru === item.text)) {
        results.push({ ru: item.text.replace('____', '...'), pt: item.explain });
      }
    }
  });
  // Add Anki words not already in results
  ankiDictionary.filter(w => w.ru.toLowerCase().includes(q) || w.pt.toLowerCase().includes(q))
    .forEach(w => { if (!results.some(r => r.ru === w.ru)) results.push({ru: w.ru, pt: w.pt}); });

  if (results.length === 0) {
    resDiv.innerHTML = '<p style="color:var(--muted); text-align:center; margin-top:20px;">Nenhum resultado. Questões são adicionadas ao dicionário conforme você pratica.</p>';
    return;
  }

  results.slice(0, 15).forEach(item => {
    const cleanText = item.ru.replace(/'/g, "\\'");
    resDiv.innerHTML += `
      <div class="phrase-box" style="padding:15px;">
        <div class="flex-col">
          <div class="ru-text" style="font-size:18px;">${item.ru}</div>
          <div class="pt-text" style="font-size:14px;">${item.pt}</div>
        </div>
        <button class="audio-btn" style="width:35px;height:35px;font-size:14px;" onclick="speakRU('${cleanText}')">🔊</button>
      </div>`;
  });
}

// ════════════════════════════════════════════════════════════
//  BIBLIOTECA GRAMATICAL
// ════════════════════════════════════════════════════════════
function buildGrammarLib() {
  const lib = document.getElementById('grammar-list');
  lib.innerHTML = '';
  modulesData.forEach(mod => {
    lib.innerHTML += `
      <div class="grammar-section">
        <h3 style="color:var(--accent);">${mod.title}</h3>
        <p style="color:var(--muted);font-size:13px;margin-bottom:15px;font-weight:600;text-transform:uppercase;">
          ${mod.phase} · ${mod.cefr}
        </p>
        ${grammarDB[mod.id]}
      </div>`;
  });
}

// ════════════════════════════════════════════════════════════
//  CENTRAL DE ERROS (Revisão)
// ════════════════════════════════════════════════════════════
let reviewSession = { questions: [], qIndex: 0 };
let isReviewAnswered = false;
