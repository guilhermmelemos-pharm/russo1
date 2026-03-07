let miniLesson = { subId: null, words: [], index: 0, phase: 'present', score: 0, questions: [] };
let isMiniAnswered = false;

const GEMINI_PRO_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
const GEMINI_FLASH_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function refreshMiniLesson(subId) {
  const sub = submodulesData.find(s => s.id === subId);
  if (!sub) return;
  // Clear cache so new questions are generated
  try { localStorage.removeItem("mini_q_" + subId); } catch(e) {}
  const shuffledSub = { ...sub, words: shuffle([...sub.words]) };
  miniLesson = { subId, words: shuffledSub.words, index: 0, phase: 'present', score: 0, questions: [] };
  isMiniAnswered = false;
  document.getElementById('mini-title').innerText = sub.title;
  document.getElementById('mini-feedback').style.display = 'none';
  document.getElementById('mini-next-btn').style.display = 'none';
  document.getElementById('mini-content').innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner"></div><p style="color:var(--muted);margin-top:16px;">Gerando novas questoes...</p></div>';
  document.getElementById('mini-step').innerText = 'Carregando...';
  await generateMiniQuestions(shuffledSub);
  renderMiniStep();
}

async function expandMiniLesson(subId) {
  const sub = submodulesData.find(s => s.id === subId);
  if (!sub) return;

  // Gather words already known for this submodule
  const knownWords = (userData.learnedWords || [])
    .filter(w => w.tag === sub.title)
    .map(w => w.ru);
  const knownList = knownWords.join(', ') || 'nenhuma ainda';
  const existingWordList = sub.words.map(w => `${w.ru} = ${w.pt}`).join(', ');

  // Show loading
  document.getElementById('mini-content').innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner"></div><p style="color:var(--muted);margin-top:16px;">Buscando novas palavras e contextos...</p></div>';
  document.getElementById('mini-step').innerText = 'Carregando...';
  document.getElementById('mini-next-btn').style.display = 'none';
  document.getElementById('mini-feedback').style.display = 'none';

  const statusEl = document.getElementById('mini-content');
  await _waitForRateLimit(statusEl);

  const prompt = `Você é professor de russo. Tema: "${sub.title}" (${sub.grammar}).

Palavras que o aluno JÁ conhece: ${existingWordList}

Crie 5 itens no total:
- 2 itens com PALAVRAS NOVAS do mesmo tema (que o aluno ainda não viu)
- 3 itens com CONTEXTO NOVO para palavras antigas (situações diferentes)

Cada item DEVE ter TODOS estes campos:
- word_ru: a palavra russa principal do item
- word_pt: tradução dessa palavra
- question: pergunta contextualizada em português (situação real, NUNCA "qual a tradução de X")
- options: array com 4 opções em russo
- correct: índice 0-3 da resposta certa
- explain: explicação curta em PORTUGUÊS
- isNew: true apenas para as 3 palavras novas

Exemplo: [{"word_ru":"готовить","word_pt":"cozinhar","question":"Como você diria que ela está cozinhando agora?","options":["она готовит","она готовила","она готовить","она приготовила"],"correct":0,"explain":"готовит = presente, ação em andamento","isNew":true}]

JSON:`;

  try {
    const resp = await fetch(`${GEMINI_FLASH_URL}?key=${userData.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 2500 } })
    });
    if (!resp.ok) throw new Error('API error ' + resp.status);
    const data = await resp.json();
    const raw = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    const cleaned = raw.replace(/```json|```/g, '').trim();

    let items = [];
    try {
      // Try direct parse first
      const start = cleaned.indexOf('['), end = cleaned.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        try {
          items = JSON.parse(cleaned.slice(start, end + 1));
        } catch(je) {
          // Try extracting individual objects
          const objMatches = cleaned.slice(start, end + 1).match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/g) || [];
          for (const obj of objMatches) {
            try { items.push(JSON.parse(obj)); } catch(oe) {}
          }
        }
      }
    } catch(parseErr) {
      console.error('expand parse error:', parseErr, 'raw:', cleaned.slice(0, 200));
    }

    if (!Array.isArray(items) || items.length === 0) throw new Error('Sem itens válidos do Gemini');

    // All items have unified format — use isNew flag to separate
    const newWords = items.filter(i => i.isNew && i.word_ru && i.word_pt && i.question);
    const newQuestions = items.filter(i => !i.isNew && i.question && i.options);
    // Fallback: if isNew not set, treat all items with word_ru as new
    if (newWords.length === 0 && newQuestions.length === 0) {
      items.forEach((it, idx) => { if (idx < 3) it.isNew = true; });
    }

    // Save new words to dictionary + persist expanded vocab for this submodule
    const cyrRe = /[А-яЁё]/;
    const expandKey = 'sub_expand_' + subId;
    let expandedPool = [];
    try { expandedPool = JSON.parse(localStorage.getItem(expandKey) || '[]'); } catch(e) {}

    newWords.forEach(w => {
      const ru = (w.word_ru || '').trim();
      const pt = (w.word_pt || '').trim();
      if (ru.length > 1 && cyrRe.test(ru)) {
        // Add to learnedWords
        if (!userData.learnedWords.some(x => x.ru === ru))
          userData.learnedWords.push({ ru, pt, tag: sub.title });
        // Add to in-memory submodule words
        if (!sub.words.some(x => x.ru === ru)) sub.words.push({ ru, pt });
        // Persist to localStorage
        if (!expandedPool.some(x => x.ru === ru)) expandedPool.push({ ru, pt });
      }
    });
    try { localStorage.setItem(expandKey, JSON.stringify(expandedPool)); } catch(e) {}
    saveData();

    // All items are valid mini lesson questions — new words first
    const combined = [
      ...newWords,    // presented as "new word" phase
      ...newQuestions // practice with new context
    ];

    if (combined.length === 0) throw new Error('No items');

    // Update cache
    const cacheKey = 'mini_q_' + subId;
    try {
      const existing = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      const merged = [...existing, ...newQuestions.filter(q => !existing.some(e => e.question === q.question))];
      localStorage.setItem(cacheKey, JSON.stringify(merged));
    } catch(e) {}

    // Launch expanded mini lesson
    miniLesson = { subId, words: sub.words, index: 0, phase: 'present', score: 0, questions: combined };
    isMiniAnswered = false;
    document.getElementById('mini-title').innerText = sub.title + ' ✨';
    document.getElementById('mini-step').innerText = `Expandindo: ${newWords.length} novas + ${newQuestions.length} questões`;
    renderMiniStep();

  } catch(e) {
    console.error('expandMiniLesson error:', e);
    // Fallback: just do a regular refresh instead
    document.getElementById('mini-content').innerHTML = '<div style="text-align:center;padding:20px;"><p style="color:var(--muted);font-size:14px;">Usando questões alternativas...</p></div>';
    setTimeout(() => refreshMiniLesson(subId), 1000);
  }
}

async function startMiniLesson(subId) {
  const sub = submodulesData.find(s => s.id === subId);
  if (!sub) return;

  miniLesson = { subId, words: sub.words, index: 0, phase: 'present', score: 0, questions: [] };
  isMiniAnswered = false;

  document.getElementById('mini-title').innerText = sub.title;
  document.getElementById('mini-feedback').style.display = 'none';
  document.getElementById('mini-next-btn').style.display = 'none';

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-minilesson').classList.add('active');

  // Check localStorage cache first
  const cacheKey = 'mini_q_' + subId;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        miniLesson.questions = parsed;
        renderMiniStep();
        return;
      }
    }
  } catch(e) {}

  // No cache — call API
  document.getElementById('mini-content').innerHTML = `<div style="text-align:center;padding:40px;"><div class="spinner"></div><p style="color:var(--muted);margin-top:16px;">Preparando mini aula...</p></div>`;
  document.getElementById('mini-step').innerText = 'Carregando...';

  await generateMiniQuestions(sub);

  // Save to cache if API succeeded
  if (miniLesson.questions.length > 0) {
    try { localStorage.setItem(cacheKey, JSON.stringify(miniLesson.questions)); } catch(e) {}
  }

  renderMiniStep();
}

// ── Global API rate limiter: persists across page reloads via localStorage ──
const _apiRateLimit = { minInterval: 15000 };

function _getLastCall() {
  try { return parseInt(localStorage.getItem('_api_last_call') || '0'); } catch(e) { return 0; }
}
function _setLastCall() {
  try { localStorage.setItem('_api_last_call', String(Date.now())); } catch(e) {}
}

async function _waitForRateLimit(statusEl) {
  const now = Date.now();
  const wait = _apiRateLimit.minInterval - (now - _getLastCall());
  if (wait > 0) {
    let remaining = Math.ceil(wait / 1000);
    const update = () => {
      if (statusEl) statusEl.innerHTML = `<div style="text-align:center;padding:40px;"><div class="spinner"></div><p style="color:var(--muted);margin-top:16px;">Aguardando limite da API... ${remaining}s</p></div>`;
    };
    update();
    await new Promise(resolve => {
      const interval = setInterval(() => {
        remaining--;
        update();
        if (remaining <= 0) { clearInterval(interval); resolve(); }
      }, 1000);
    });
  }
  _setLastCall();
}

async function generateMiniQuestions(sub) {
  const wordList = sub.words.map(w => `${w.ru} = ${w.pt}`).join(', ');
  const prompt = `Você é professor de russo. Para cada palavra abaixo, crie UMA questão de múltipla escolha contextualizada — como se fosse uma situação real da vida.

ESTILO DAS PERGUNTAS (varie entre esses formatos):
- "Como você diria em russo: 'Eu beijei ela ontem à noite'?"
- "Na frase 'Vamos dançar juntos', qual palavra russa usar?"
- "Quando você quer dizer que gozou, qual palavra usa em russo?"
- "Como pedir para alguém te abraçar em russo?"
- "Qual expressão russa usaria ao terminar de comer?"

REGRAS:
- NUNCA pergunte "qual a tradução de X" ou "como se usa X" — sempre use uma frase ou situação real
- As opções ERRADAS devem ser palavras do mesmo tema (plausíveis, não aleatórias)
- correct variado entre 0-3
- question em português
- question_pt: a MESMA questão traduzida para PT se tiver palavras russas (senão omitir)
- explain curto em PORTUGUÊS explicando o uso
- NUNCA use russo em explain, hint ou translation

Palavras: ${wordList}
Gramática do tema: ${sub.grammar}

Retorne APENAS array JSON. Cada objeto: {"word_ru":"целуй","word_pt":"beija","question":"Como você diria 'Me beija agora' em russo?","options":["целуй меня","обнимай меня","ложись","расслабься"],"correct":0,"explain":"целуй = beija (imperativo informal)"}

JSON:`;

  // Wait for rate limit before calling API
  const statusEl = document.getElementById('mini-content');
  await _waitForRateLimit(statusEl);

  try {
    const resp = await fetch(`${GEMINI_FLASH_URL}?key=${userData.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      })
    });
    if (resp.status === 429) {
      // Retry with exponential backoff
      for (let attempt = 1; attempt <= 3; attempt++) {
        const wait = attempt * 20000;
        let remaining = wait / 1000;
        const interval = setInterval(() => {
          remaining--;
          if (statusEl) statusEl.innerHTML = `<div style="text-align:center;padding:40px;"><div class="spinner"></div><p style="color:var(--muted);margin-top:16px;">Limite da API — tentando novamente em ${remaining}s (tentativa ${attempt}/3)</p></div>`;
        }, 1000);
        await new Promise(r => setTimeout(r, wait));
        clearInterval(interval);
        _setLastCall();
        await _waitForRateLimit(null);
        const retry = await fetch(`${GEMINI_FLASH_URL}?key=${userData.apiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1500 } })
        });
        if (retry.ok) {
          const retryData = await retry.json();
          const retryParts = retryData?.candidates?.[0]?.content?.parts || [];
          const retryRaw = retryParts.map(p => p.text || '').join('');
          const retryCleaned = retryRaw.replace(/```json|```/g, '').trim();
          const s = retryCleaned.indexOf('['), e = retryCleaned.lastIndexOf(']');
          if (s !== -1 && e !== -1) {
            try {
              const parsed = JSON.parse(retryCleaned.slice(s, e + 1));
              if (Array.isArray(parsed) && parsed.length > 0) {
                miniLesson.questions = parsed.filter(q => q.word_ru && q.word_pt && q.question && Array.isArray(q.options));
                if (miniLesson.questions.length > 0) return;
              }
            } catch(je) {}
          }
        }
        if (attempt === 3) throw new Error('API error 429 após 3 tentativas');
      }
    }
    if (!resp.ok) throw new Error('API error ' + resp.status);
    const data = await resp.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const raw = parts.map(p => p.text || '').join('');
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('['), end = cleaned.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      // Robust JSON parse: try direct first, then attempt repair
      let parsed = null;
      try {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
      } catch(jsonErr) {
        // Try to extract individual valid objects
        const objMatches = cleaned.slice(start, end + 1).match(/\{[^{}]*\}/g) || [];
        const validObjs = [];
        for (const obj of objMatches) {
          try { validObjs.push(JSON.parse(obj)); } catch(e) {}
        }
        if (validObjs.length > 0) parsed = validObjs;
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate each question has required fields
        miniLesson.questions = parsed.filter(q =>
          q.word_ru && q.word_pt && q.question && Array.isArray(q.options) && q.options.length >= 2
        );
        if (miniLesson.questions.length > 0) return;
      }
    }
  } catch(e) {
    console.warn('Mini aula API falhou, usando fallback:', e);
  }

  // Fallback: contextual questions using word + distractors from same submodule
  miniLesson.questions = sub.words.map(w => {
    // Pick 3 distractors from other words in same submodule
    const others = shuffle(sub.words.filter(x => x.ru !== w.ru));
    const distractors = others.slice(0, 3).map(x => x.ru);
    while (distractors.length < 3) distractors.push('нет');

    // Generate a contextual question based on the Portuguese meaning
    const pt = w.pt.toLowerCase();
    let question;
    if (pt.includes('(') || pt.includes('/')) {
      // verb pair or explanation — ask for translation
      question = `Qual a tradução de "${w.ru}"?`;
    } else {
      // Ask how to say the Portuguese word in Russian
      question = `Como se diz em russo: "${w.pt}"?`;
    }

    // Place correct answer at random position
    const pos = Math.floor(Math.random() * 4);
    const opts = [...distractors];
    opts.splice(pos, 0, w.ru);

    return {
      word_ru: w.ru,
      word_pt: w.pt,
      question,
      options: opts.slice(0, 4),
      correct: pos,
      explain: `${w.ru} = ${w.pt}`
    };
  });
}
