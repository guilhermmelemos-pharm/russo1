function showAllDictWords() {
  const q = (document.getElementById('dict-search').value||'').toLowerCase().trim();
  if (q.length >= 2) return;
  const resDiv = document.getElementById('dict-results');

  const stopwords = new Set(['a','e','o','de','do','da','em','na','no','para','por','com','um','uma','ou','mas','que','se','i','v','s','na','ne','ya']);
  const cyrillicRe = /[А-яЁё]/;

  const seen = new Set();
  const learned = [];
  const ankiBase = [];

  // Learned words from app (submodules, mini aulas)
  (userData.learnedWords||[]).forEach(w => {
    const ru = (w.ru||'').trim();
    if (!ru || !cyrillicRe.test(ru) || ru.length <= 1 || stopwords.has(ru.toLowerCase())) return;
    if (!seen.has(ru)) { seen.add(ru); learned.push({ru, pt: w.pt||'', tag: w.tag||''}); }
  });

  // Sort learned alphabetically by Cyrillic
  learned.sort((a,b) => a.ru.localeCompare(b.ru, 'ru'));

  // Anki base
  ankiDictionary.forEach(w => {
    const ru = (w.ru||'').trim();
    if (!ru || !cyrillicRe.test(ru) || ru.length <= 1 || stopwords.has(ru.toLowerCase())) return;
    if (!seen.has(ru)) { seen.add(ru); ankiBase.push({ru, pt: w.pt||''}); }
  });
  ankiBase.sort((a,b) => a.ru.localeCompare(b.ru, 'ru'));

  const card = (w, showTag) => {
    const safe = (w.ru||'').replace(/'/g,"&#39;");
    return '<div class="phrase-box" style="padding:10px;"><div class="flex-col" style="flex:1;">'
      + '<div class="ru-text" style="font-size:16px;">' + w.ru + '</div>'
      + '<div class="pt-text" style="font-size:12px;">' + w.pt + '</div>'
      + (showTag && w.tag ? '<div style="font-size:11px;color:var(--muted);">&#128193; ' + w.tag + '</div>' : '')
      + '</div><button class="audio-btn" style="width:35px;height:35px;font-size:13px;" onclick="speakRU(this.dataset.w)" data-w="' + safe + '">&#128266;</button></div>';
  };

  resDiv.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:16px;">'
    + '<div style="flex:1;background:var(--card);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:22px;font-weight:700;color:var(--primary);">' + learned.length + '</div><div style="font-size:12px;color:var(--muted);">aprendidas</div></div>'
    + '<div style="flex:1;background:var(--card);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:22px;font-weight:700;color:var(--muted);">' + ankiBase.length + '</div><div style="font-size:12px;color:var(--muted);">base Anki</div></div>'
    + '<div style="flex:1;background:var(--card);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:22px;font-weight:700;color:var(--accent);">' + (learned.length+ankiBase.length) + '</div><div style="font-size:12px;color:var(--muted);">total</div></div>'
    + '</div>'
    + (learned.length > 0
        ? '<h3 style="color:var(--accent);font-size:14px;margin-bottom:8px;">&#128214; Aprendidas no app (' + learned.length + ')</h3>'
          + learned.map(w=>card(w,true)).join('')
          + '<h3 style="color:var(--muted);font-size:14px;margin:16px 0 8px;">&#128218; Base Anki (' + ankiBase.length + ')</h3>'
        : '<p style="color:var(--muted);font-size:13px;margin-bottom:12px;">Faca mini aulas e quizzes — as palavras aparecem aqui.</p>'
          + '<h3 style="color:var(--muted);font-size:14px;margin-bottom:8px;">&#128218; Base Anki (' + ankiBase.length + ')</h3>')
    + ankiBase.map(w=>card(w,false)).join('');
}

const placementBank = [
  // A1
  {level:'A1',score:1,type:'translate',text:'Como se diz "Olá" em russo?',options:['Привет','Спасибо','Пожалуйста','Извините'],correct:0,explain:'Привет = Olá (informal).'},
  {level:'A1',score:1,type:'cloze',text:'Меня ____ Иван.',options:['зовут','зову','зовёт','зовём'],correct:0,explain:'Меня зовут = Meu nome é.'},
  {level:'A1',score:1,type:'translate',text:'Como se diz "obrigado"?',options:['Спасибо','Пожалуйста','Привет','Пока'],correct:0,explain:'Спасибо = obrigado.'},
  {level:'A1',score:1,type:'cloze',text:'Я ____ студент.',options:['—','есть','был','буду'],correct:0,explain:'Russo não usa o verbo ser/estar no presente.'},
  {level:'A1',score:1,type:'translate',text:'O que significa "мама"?',options:['mãe','pai','irmã','avó'],correct:0,explain:'Мама = mãe.'},
  {level:'A1',score:1,type:'cloze',text:'У меня ____ кот.',options:['есть','нет','был','будет'],correct:0,explain:'У меня есть = eu tenho.'},
  {level:'A1',score:1,type:'translate',text:'Como se diz "água"?',options:['вода','молоко','сок','чай'],correct:0,explain:'Вода = água.'},
  // A2
  {level:'A2',score:2,type:'cloze',text:'Вчера я ____ в кино.',options:['ходил','хожу','пойду','иду'],correct:0,explain:'Passado de ходить para ação habitual.'},
  {level:'A2',score:2,type:'cloze',text:'Я каждый день ____ в школу.',options:['хожу','иду','шёл','пойду'],correct:0,explain:'Ходить para ações habituais/repetidas.'},
  {level:'A2',score:2,type:'translate',text:'Como se diz "Eu moro em Moscou"?',options:['Я живу в Москве','Я живу в Москву','Я живу Москва','Я есть Москве'],correct:0,explain:'В + prepositivo: Москва → Москве.'},
  {level:'A2',score:2,type:'cloze',text:'У ____ нет машины.',options:['меня','мне','я','мной'],correct:0,explain:'У меня нет = eu não tenho. Genitivo de я.'},
  {level:'A2',score:2,type:'cloze',text:'Это ____ книга. (minha)',options:['моя','мой','моё','мои'],correct:0,explain:'Моя para substantivos femininos.'},
  {level:'A2',score:2,type:'translate',text:'Como se diz "Ela está trabalhando"?',options:['Она работает','Она работала','Она будет работать','Она работай'],correct:0,explain:'Presente: она работает.'},
  {level:'A2',score:2,type:'cloze',text:'Завтра я ____ работать весь день.',options:['буду','был','будут','будешь'],correct:0,explain:'Futuro imperfeito: буду + infinitivo.'},
  // B1
  {level:'B1',score:3,type:'cloze',text:'Я долго ____ задачу.',options:['решал','решил','решу','буду решать'],correct:0,explain:'NSV решал — foco na duração (долго).'},
  {level:'B1',score:3,type:'cloze',text:'Наконец-то я ____ эту задачу!',options:['решил','решал','решать','решаю'],correct:0,explain:'SV решил — foco no resultado final.'},
  {level:'B1',score:3,type:'cloze',text:'В группе двадцать ____.',options:['студентов','студента','студент','студенты'],correct:0,explain:'Números ≥5 exigem genitivo plural.'},
  {level:'B1',score:3,type:'translate',text:'Como se diz "Eu não tenho problemas"?',options:['У меня нет проблем','У меня нет проблемы','У меня нет проблема','Мне нет проблем'],correct:0,explain:'Нет + genitivo plural: проблем.'},
  {level:'B1',score:3,type:'cloze',text:'Я живу в ____ доме.',options:['новом','новый','нового','новому'],correct:0,explain:'Prepositivo de adjetivos masculinos: -ом.'},
  {level:'B1',score:3,type:'cloze',text:'Мне нужно купить ____ молока.',options:['немного','немногие','немногих','мало'],correct:0,explain:'Немного + genitivo para quantidade parcial.'},
  {level:'B1',score:3,type:'translate',text:'Como se diz "Eu estou indo para casa a pé"?',options:['Я иду домой','Я еду домой','Я ходил домой','Я идти домой'],correct:0,explain:'Иду = ir a pé, direção única, agora.'},
  // B2
  {level:'B2',score:4,type:'cloze',text:'Я хотел ____ кофе.',options:['бы','был','буду','быть'],correct:0,explain:'Condicional: passado + бы.'},
  {level:'B2',score:4,type:'cloze',text:'Он открыл дверь и ____ в комнату.',options:['вошёл','вышел','пришёл','ушёл'],correct:0,explain:'Вошёл: prefixo в- = movimento para dentro.'},
  {level:'B2',score:4,type:'cloze',text:'Если бы я ____ богатым, я купил бы дом.',options:['был','буду','есть','стал'],correct:0,explain:'Condicional irreal: был бы.'},
  {level:'B2',score:4,type:'translate',text:'Como se diz "Quanto mais eu estudo, mais eu aprendo"?',options:['Чем больше я учусь, тем больше знаю','Если я учусь, то знаю','Больше учусь, больше знаю','Я учусь и знаю больше'],correct:0,explain:'Чем...тем = quanto...tanto.'},
  {level:'B2',score:4,type:'cloze',text:'Книга, ____ я читаю, очень интересная.',options:['которую','которая','который','которое'],correct:0,explain:'Которую: pronome relativo acusativo feminino.'},
  {level:'B2',score:4,type:'cloze',text:'Несмотря на дождь, мы ____ гулять.',options:['пошли','пойдём','шли','ходили'],correct:0,explain:'Пошли: SV passado — resultado de ir.'},
  {level:'B2',score:4,type:'translate',text:'Como se traduz "Teria sido melhor ficar em casa"?',options:['Лучше бы я остался дома','Лучше я остаюсь дома','Мне лучше дома','Я бы дома лучше'],correct:0,explain:'Лучше бы + passado = expressão de arrependimento.'},
  {level:'B2',score:4,type:'cloze',text:'Задание ____ студентами вчера.',options:['было выполнено','выполнило','выполняло','выполнял'],correct:0,explain:'Voz passiva: было + particípio curto.'},
  {level:'B2',score:4,type:'cloze',text:'Чем ____ я читаю, тем лучше понимаю.',options:['больше','много','очень','сильно'],correct:0,explain:'Чем больше...тем = quanto mais...tanto mais.'},
];


// ════════════════════════════════════════════════════════════
//  PLACEMENT TEST (Adaptive)
// ════════════════════════════════════════════════════════════
let placement = {
  questions: [],
  current: 0,
  score: 0,
  levelScore: {A1:0,A2:0,B1:0,B2:0},
  levelTotal: {A1:0,A2:0,B1:0,B2:0},
  currentLevel: 'A1',
  consecutiveCorrect: 0,
  consecutiveWrong: 0,
  selectedOpt: null,
  answered: false
};

const LEVEL_ORDER = ['A1','A2','B1','B2'];

function startPlacement() {
  // Reset
  placement = {questions:[],current:0,score:0,
    levelScore:{A1:0,A2:0,B1:0,B2:0},levelTotal:{A1:0,A2:0,B1:0,B2:0},
    currentLevel:'A1',consecutiveCorrect:0,consecutiveWrong:0,
    selectedOpt:null,answered:false};

  // Start with A1 questions, will adapt
  placement.questions = buildAdaptiveSet();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-placement').classList.add('active');
  renderPlacementQuestion();
}

function buildAdaptiveSet() {
  // Start with 3 A1 + 2 A2 to ensure A2 always appears
  const a1 = shuffle([...placementBank.filter(q=>q.level==='A1')]).slice(0,3);
  const a2 = shuffle([...placementBank.filter(q=>q.level==='A2')]).slice(0,2);
  return shuffle([...a1, ...a2]);
}

function getNextQuestion() {
  // Adaptive: pick next question based on current performance
  const lvlIdx = LEVEL_ORDER.indexOf(placement.currentLevel);
  // Try current level first, then adjacent
  const pool = shuffle(placementBank.filter(q =>
    q.level === placement.currentLevel &&
    !placement.questions.some(p => p.text === q.text)
  ));
  if (pool.length > 0) return pool[0];
  // Try higher level if doing well
  if (placement.consecutiveCorrect >= 2 && lvlIdx < 3) {
    const higher = shuffle(placementBank.filter(q =>
      q.level === LEVEL_ORDER[lvlIdx+1] &&
      !placement.questions.some(p => p.text === q.text)
    ));
    if (higher.length > 0) return higher[0];
  }
  return null;
}

function renderPlacementQuestion() {
  placement.answered = false;
  placement.selectedOpt = null;
  const content = document.getElementById('placement-content');
  const fb = document.getElementById('placement-feedback');
  const nextBtn = document.getElementById('placement-next-btn');
  fb.style.display = 'none';
  nextBtn.style.display = 'none';

  const total = 30;
  const idx = placement.current;

  if (idx >= total || idx >= placement.questions.length) {
    showPlacementResult();
    return;
  }

  const q = placement.questions[idx];
  const progress = Math.round((idx / total) * 100);

  const lvlColors = {A1:'#5cb85c',A2:'#5ba3d9',B1:'#c9a84c',B2:'#e05c4a'};
  content.innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:var(--muted);font-size:13px;">Questão ${idx+1} de ${total}</span>
        <span style="background:${lvlColors[q.level]||'var(--accent)'};color:#000;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">${q.level}</span>
      </div>
      <div style="height:4px;background:var(--border);border-radius:2px;">
        <div style="height:4px;background:var(--accent);border-radius:2px;width:${progress}%;transition:width 0.3s;"></div>
      </div>
    </div>
    <h3 style="font-size:20px;margin-bottom:20px;line-height:1.5;">${q.text.replace('____','<span style="color:var(--accent);font-weight:bold;">____</span>')}</h3>
    <div id="placement-options"></div>
    <button id="placement-confirm" class="btn" style="margin-top:16px;display:none;">Confirmar</button>
  `;

  // Auto-speak
  setTimeout(() => speakRU(q.text.replace('____','...')), 300);

  const optsDiv = document.getElementById('placement-options');
  const opts = shuffle(q.options.map((o,i)=>({text:o,isCorrect:i===q.correct})));
  const confirmBtn = document.getElementById('placement-confirm');

  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      if (placement.answered) return;
      optsDiv.querySelectorAll('.option-btn').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      placement.selectedOpt = opt;
      speakRU(opt.text.replace(/\(.*?\)/g,'').trim());
      confirmBtn.style.display = 'block';
    };
    optsDiv.appendChild(btn);
  });

  confirmBtn.onclick = () => {
    if (!placement.selectedOpt || placement.answered) return;
    submitPlacementAnswer(placement.selectedOpt.isCorrect, q);
  };
}

function submitPlacementAnswer(isCorrect, q) {
  placement.answered = true;
  placement.levelTotal[q.level] = (placement.levelTotal[q.level]||0) + 1;

  if (isCorrect) {
    placement.score += q.score;
    placement.levelScore[q.level] = (placement.levelScore[q.level]||0) + 1;
    placement.consecutiveCorrect++;
    placement.consecutiveWrong = 0;

    // Logarithmic level up: needs log2(consecutiveCorrect+1) >= 1 at 1, 2 at 3, 3 at 7...
    const lvlIdx = LEVEL_ORDER.indexOf(placement.currentLevel);
    // Need 2 consecutive correct to advance (log2(3)=1.58 → floor=1, at streak=2)
    const threshold = Math.floor(Math.log2(placement.consecutiveCorrect + 1));
    if (threshold >= 1 && placement.consecutiveCorrect >= 2 && lvlIdx < 3) {
      placement.currentLevel = LEVEL_ORDER[lvlIdx + 1];
      placement.consecutiveCorrect = 0;
    }
  } else {
    placement.consecutiveWrong++;
    placement.consecutiveCorrect = 0;

    // Level down if 2 consecutive wrong
    if (placement.consecutiveWrong >= 2) {
      const lvlIdx = LEVEL_ORDER.indexOf(placement.currentLevel);
      if (lvlIdx > 0) placement.currentLevel = LEVEL_ORDER[lvlIdx - 1];
      placement.consecutiveWrong = 0;
    }
  }

  // Queue next adaptive question if needed
  placement.current++;
  const remaining = 30 - placement.current;
  if (remaining > 0 && placement.current >= placement.questions.length) {
    const next = getNextQuestion();
    if (next) placement.questions.push(next);
  }

  renderPlacementQuestion();
}

function showPlacementResult() {
  const content = document.getElementById('placement-content');

  // Calculate final level based on weighted scores
  const weights = {A1:1,A2:2,B1:3,B2:4};
  let totalWeighted = 0, maxWeighted = 0;
  for (const lv of LEVEL_ORDER) {
    const t = placement.levelTotal[lv]||0;
    const s = placement.levelScore[lv]||0;
    totalWeighted += s * weights[lv];
    maxWeighted += t * weights[lv];
  }
  const pct = maxWeighted > 0 ? totalWeighted / maxWeighted : 0;
  const finalLevel = pct >= 0.75 ? 'B2' : pct >= 0.55 ? 'B1' : pct >= 0.35 ? 'A2' : 'A1';
  const suggestedMod = finalLevel === 'B2' ? 11 : finalLevel === 'B1' ? 8 : finalLevel === 'A2' ? 4 : 1;
  const emoji = finalLevel === 'B2' ? '🏆' : finalLevel === 'B1' ? '⭐' : finalLevel === 'A2' ? '📈' : '🌱';

  const lvlDesc = {
    A1: 'Iniciante — comece pelo Módulo 1 para construir sua base.',
    A2: 'Básico — você já conhece o essencial. Módulo 4 em diante.',
    B1: 'Intermediário — bom domínio da gramática. Módulo 8 em diante.',
    B2: 'Avançado — impressionante! Módulo 11 para dominar os detalhes.'
  };

  content.innerHTML = `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:64px;margin-bottom:16px;">${emoji}</div>
      <h2 style="font-size:28px;color:var(--accent);margin-bottom:8px;">${finalLevel}</h2>
      <p style="color:var(--text);font-size:15px;margin-bottom:20px;line-height:1.6;">${lvlDesc[finalLevel]}</p>
      <div style="background:var(--card);border-radius:12px;padding:16px;margin-bottom:20px;text-align:left;">
        ${LEVEL_ORDER.map(lv => {
          const t = placement.levelTotal[lv]||0;
          if (!t) return '';
          const s = placement.levelScore[lv]||0;
          const p = Math.round((s/t)*100);
          const colors = {A1:'#5cb85c',A2:'#5ba3d9',B1:'#c9a84c',B2:'#e05c4a'};
          return `<div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="color:${colors[lv]};font-weight:700;">${lv}</span>
              <span style="color:var(--muted);font-size:13px;">${s}/${t} — ${p}%</span>
            </div>
            <div style="height:6px;background:var(--border);border-radius:3px;">
              <div style="height:6px;background:${colors[lv]};border-radius:3px;width:${p}%;"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;

  // Auto-complete modules below suggested level
  const modsToComplete = modulesData
    .filter(m => m.id < suggestedMod)
    .map(m => m.id);
  modsToComplete.forEach(id => {
    if (!userData.completedModules.includes(id)) userData.completedModules.push(id);
  });
  if (modsToComplete.length > 0) saveData();

  const nextBtn = document.getElementById('placement-next-btn');
  nextBtn.style.display = 'block';
  nextBtn.textContent = `Ir para Módulo ${suggestedMod} →`;
  if (modsToComplete.length > 0) {
    const notice = document.createElement('p');
    notice.style.cssText = 'color:var(--muted);font-size:13px;text-align:center;margin-top:8px;';
    notice.textContent = `✅ ${modsToComplete.length} módulo(s) anteriores marcados como concluídos.`;
    document.getElementById('placement-content').appendChild(notice);
  }
  nextBtn.onclick = () => {
    navTo('home');
    startLesson(suggestedMod, false);
  };
}


// ════════════════════════════════════════════════════════════
//  WORD TOOLTIP & SENTENCE TRANSLATION
// ════════════════════════════════════════════════════════════

// Build lookup map from ankiDictionary + submodule words
function buildWordMap() {
  const map = {};
  // Anki dictionary
  ankiDictionary.forEach(w => {
    const key = w.ru.toLowerCase().replace(/[.,!?]/g,'').trim();
    map[key] = w.pt;
  });
  // Submodule words
  submodulesData.forEach(s => s.words.forEach(w => {
    const key = w.ru.toLowerCase().replace(/[.,!?]/g,'').trim();
    map[key] = w.pt;
  }));
  // Generated question history — use words field if present
  generatedQuestionsHistory.forEach(q => {
    if (q.words) {
      Object.entries(q.words).forEach(([ru, pt]) => {
        map[ru.toLowerCase().trim()] = pt;
      });
    }
    if (q.options) q.options.forEach(opt => {
      const m = opt.match(/^(.+?)\s*\((.+?)\)/);
      if (m) map[m[1].toLowerCase().trim()] = m[2].trim();
    });
  });
  return map;
}

// Wrap Russian words in a sentence with tooltip spans
// qWords = the words object from the Gemini response (most accurate)
// Tooltip removed — returns plain text with ____ preserved
function wrapWordsWithTooltip(text, excludeBlank, qWords) {
  if (!text) return '';
  return text; // plain text, no word-by-word API calls
}

function _wrapWordsWithTooltip_DISABLED(text, excludeBlank, qWords) {
  const wordMap = Object.assign(buildWordMap(), qWords || {});
  // Split by spaces but preserve punctuation attached to words
  return text.split(/(\s+)/).map(token => {
    if (/^\s+$/.test(token)) return token;
    if (token === '____') return excludeBlank
      ? '<span style="color:var(--accent);font-weight:bold;">____</span>'
      : token;

    const clean = token.toLowerCase().replace(/[.,!?:;«»"'()]/g,'').trim();
    const translation = wordMap[clean];

    const inner = token.replace('____','<span style="color:var(--accent);font-weight:bold;">____</span>');

    if (translation) {
      return `<span class="ru-word" data-word="${clean}">${inner}<span class="word-tooltip">${translation}</span></span>`;
    }
    // Unknown word — no tooltip shown until hovered/touched
    return `<span class="ru-word ru-unknown" data-word="${clean}" title="Clique para traduzir">${inner}<span class="word-tooltip">clique</span></span>`;
  }).join('');
}

// Touch support for mobile
document.addEventListener('touchstart', e => {
  const word = e.target.closest('.ru-word');
  if (!word) {
    document.querySelectorAll('.ru-word.touch-active').forEach(w => w.classList.remove('touch-active'));
    return;
  }
  e.preventDefault();
  document.querySelectorAll('.ru-word.touch-active').forEach(w => w.classList.remove('touch-active'));
  word.classList.add('touch-active');

  // Fetch translation for unknown words (queued)
  if (word.classList.contains('ru-unknown')) {
    if (!_tooltipQueue.includes(word)) _tooltipQueue.push(word);
    _processTooltipQueue();
  }
}, { passive: false });

// Tooltip per-word removed — translation is shown as full sentence below question

// fetchWordTranslation removed — no per-word API calls

// Full sentence translation
async function translateSentence(text, resultEl) {
  // Removed — translations now come embedded in Gemini question fields
}

function loadExpandedVocab() {
  // Re-inject persisted expanded words into submodulesData on load
  submodulesData.forEach(sub => {
    try {
      const expandKey = 'sub_expand_' + sub.id;
      const saved = JSON.parse(localStorage.getItem(expandKey) || '[]');
      saved.forEach(w => {
        if (!sub.words.some(x => x.ru === w.ru)) sub.words.push(w);
      });
    } catch(e) {}
  });
}

function migrateCachedQuestions() {
  // Sanitize cached questions — strip Cyrillic from explain/hint/translation fields
  // without touching any user progress data
  const cyrRe = /[А-яЁё]/;
  try {
    // 1. russo_questions (used in review / errorBank display)
    const raw = localStorage.getItem('russo_questions');
    if (raw) {
      const qs = JSON.parse(raw);
      const cleaned = qs.map(q => ({
        ...q,
        explain:     cyrRe.test(q.explain     || '') ? '' : (q.explain     || ''),
        hint:        cyrRe.test(q.hint        || '') ? '' : (q.hint        || ''),
        translation: cyrRe.test(q.translation || '') ? '' : (q.translation || ''),
      }));
      localStorage.setItem('russo_questions', JSON.stringify(cleaned));
    }
  } catch(e) {}

  try {
    // 1b. russo_qcache_v1 — sanitize explain/hint/translation fields
    const qcRaw = localStorage.getItem('russo_qcache_v1');
    if (qcRaw) {
      const qc = JSON.parse(qcRaw);
      let changed = false;
      Object.keys(qc).forEach(k => {
        qc[k] = qc[k].map(q => {
          const clean = {...q,
            explain:     cyrRe.test(q.explain     || '') ? '' : (q.explain     || ''),
            hint:        cyrRe.test(q.hint        || '') ? '' : (q.hint        || ''),
            translation: cyrRe.test(q.translation || '') ? '' : (q.translation || ''),
          };
          if (clean.explain !== q.explain || clean.hint !== q.hint) changed = true;
          return clean;
        });
      });
      if (changed) localStorage.setItem('russo_qcache_v1', JSON.stringify(qc));
    }
  } catch(e) {}

  try {
    // 2. mini_q_* caches — sanitize explain fields, keep the cache intact
    const miniKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('mini_q_')) miniKeys.push(k);
    }
    miniKeys.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const qs = JSON.parse(raw);
        const cleaned = qs.map(q => ({
          ...q,
          explain:     cyrRe.test(q.explain     || '') ? '' : (q.explain     || ''),
          question_pt: cyrRe.test(q.question_pt || '') ? '' : (q.question_pt || ''),
        }));
        localStorage.setItem(k, JSON.stringify(cleaned));
      } catch(e) {}
    });
  } catch(e) {}
}

window.onload = () => {
  loadExpandedVocab();
  migrateCachedQuestions();
  renderHomeStats();
  updateStats();
  updateApiStatus();
  buildModulesList();
  initTTS();

  // Abre o modal automaticamente se não houver chave configurada
  if (!userData.apiKey) {
    setTimeout(() => openApiModal(), 800);
  }
};

function exportAnki(mode) {
  const lines = ['#separator:Semicolon','#html:true','#notetype:Basic','#deck:Russo App','#tags column:3'];
  const seen = new Set();
  if (mode === 'all') {
    ankiDictionary.forEach(w => {
      if (!seen.has(w.ru)) { seen.add(w.ru); lines.push(w.ru + ';' + w.pt.replace(/;/g,',') + ';Anki'); }
    });
  }
  (userData.learnedWords||[]).forEach(w => {
    if (!seen.has(w.ru)) {
      seen.add(w.ru);
      lines.push(w.ru + ';' + (w.pt||'').replace(/;/g,',') + ';app');
    }
  });
  generatedQuestionsHistory.forEach(q => {
    const ru = q.text.replace('____','...');
    if (!seen.has(ru) && q.explain) { seen.add(ru); lines.push(ru + ';' + q.explain.replace(/;/g,',') + ';questao'); }
  });
  if (lines.length <= 5) { showToast('Nenhuma palavra ainda. Faca mini aulas e quizzes.', 4000); return; }
  const blob = new Blob([lines.join('\n')], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'russo_anki_' + mode + '_' + new Date().toISOString().slice(0,10) + '.txt';
  a.click();
  showToast('Exportadas ' + (lines.length-5) + ' palavras!', 3000);
}

function exportTxt(){const q=JSON.parse(localStorage.getItem('russo_questions')||'[]');if(!q.length){alert('Complete alguns m\u00f3dulos primeiro.');return;}const txt=q.map(x=>x.text+'\nR: '+(x.options[x.correct]||'')+'\n'+x.explain).join('\n---\n');const b=new Blob([txt],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='questoes_russo.txt';a.click();}
