let userData = JSON.parse(localStorage.getItem('russo_gemini_v1')) || {
  completedModules: [],
  completedSubmodules: [],
  errorBank: [],
  moduleStats: {},
  learnedWords: [],
  streak: 0,
  lastStudyDate: '',
  apiKey: ''
};
// Migrate: ensure moduleStats exists
if (!userData.moduleStats) userData.moduleStats = {};
if (!userData.learnedWords) userData.learnedWords = [];
if (!userData.completedSubmodules) userData.completedSubmodules = [];
if (!userData.completedModules) userData.completedModules = [];
if (userData.streak === undefined) userData.streak = 0;
if (!userData.lastStudyDate) userData.lastStudyDate = '';
// Migração: tenta carregar chave de versão anterior
if (!userData.apiKey) {
  userData.apiKey = localStorage.getItem('russo_gemini_apikey') || '';
}

// Cache em memória das questões geradas (dicionário dinâmico)
// questionCache persisted in localStorage to avoid re-generating on reload
const _QC_KEY = 'russo_qcache_v1';
function _loadQCache() {
  try { return JSON.parse(localStorage.getItem(_QC_KEY) || '{}'); } catch(e) { return {}; }
}
function _saveQCache(cache) {
  try { localStorage.setItem(_QC_KEY, JSON.stringify(cache)); } catch(e) {}
}
const questionCache = _loadQCache();
// Histórico de todas as questões geradas (para o dicionário)
let generatedQuestionsHistory = [];

let russianVoice = null;
let currentLesson = { modId: 0, step: 0, questions: [], qIndex: 0, score: 0 };
let isQuestionAnswered = false;

// ════════════════════════════════════════════════════════════
//  API KEY MANAGEMENT
// ════════════════════════════════════════════════════════════
function openApiModal() {
  document.getElementById('modal-key-input').value = userData.apiKey || '';
  document.getElementById('modal-apikey').classList.add('open');
}

function closeApiModal() {
  document.getElementById('modal-apikey').classList.remove('open');
}

function saveApiKey() {
  const key = document.getElementById('modal-key-input').value.trim();
  userData.apiKey = key;
  saveData();
  closeApiModal();
  updateApiStatus();
}

function updateApiStatus() {
  const el = document.getElementById('api-key-status');
  if (userData.apiKey) {
    el.innerHTML = '<span class="api-status ok">✓ API Key configurada — questões dinâmicas ativas</span>';
  } else {
    el.innerHTML = '<span class="api-status missing">⚠ Sem API Key — usando questões de fallback</span>';
  }
}

// ════════════════════════════════════════════════════════════
//  GEMINI API — GERAÇÃO DINÂMICA DE QUESTÕES
// ════════════════════════════════════════════════════════════
async function generateQuestions(modId, step) {
  const cacheKey = `${modId}_${step}`;

  // Usa cache se disponível (evita chamar a API 2x para o mesmo módulo/etapa)
  if (questionCache[cacheKey] && questionCache[cacheKey].length >= 10) {
    return questionCache[cacheKey];
  }

  if (!userData.apiKey) {
    return getFallbackQuestions(step, modId);
  }

  const mod = modulesData.find(m => m.id === modId);
  const qType = step === 3 ? 'cloze' : 'translate';
  const typeDesc = step === 3
    ? 'lacuna (complete the sentence, type=cloze)'
    : 'tradução do português para o russo (type=translate)';

  // Collect vocabulary from ALL submodules of this module (including expanded words)
  const modSubs = submodulesData.filter(s => s.modId === modId);
  const allSubWords = modSubs.flatMap(s => s.words).slice(0, 40);
  const vocabHint = allSubWords.length > 0
    ? `\n\nVocabulário dos submódulos deste módulo (use nas frases): ${allSubWords.map(w => w.ru + ' (' + w.pt + ')').join(', ')}.`
    : '';
  const subThemes = modSubs.map(s => s.title).join(', ');
  const prompt = `Professor de russo CEFR. Gere 10 questões de ${typeDesc}, nível ESTRITO ${mod.cefr}, tema: "${mod.title}".

NÍVEL ${mod.cefr}: ${mod.cefr==='A1'?'presente+imperativo básico, SEM aspectos/casos complexos':mod.cefr==='A2'?'passado+futuro budu+inf, SEM genitivo plural/condicional':mod.cefr==='B1'?'aspectos verbais+genitivo plural, SEM condicional':'condicional+voz passiva+orações relativas'}

Retorne APENAS array JSON válido. Cada objeto: {type, text, translation, options:[4], correct:0-3, explain, hint, words:{ru:pt}}
- "translation": tradução COMPLETA da frase para PT (com a resposta no lugar do ____).
- correct distribuído entre 0,1,2,3.
- explain, hint e translation em PORTUGUÊS BRASILEIRO — NUNCA em russo.
- cloze: frase com ____. translate: "Como se diz: ..."

[{"type":"cloze","text":"Я ____ домой.","translation":"Eu vou para casa.","options":["иду","идёт","ходил","идти"],"correct":0,"explain":"Иду = vou a pé, agora.","hint":"R: иду"}]

Gere 10 agora:`;

  const questions = await callGeminiWithRetry(prompt, 2);

  if (questions && questions.length >= 5) {
    questionCache[cacheKey] = questions;
    _saveQCache(questionCache);
    try { const sv = JSON.parse(localStorage.getItem('russo_questions')||'[]'); const mg = [...sv,...questions.filter(q=>!sv.some(s=>s.text===q.text))]; localStorage.setItem('russo_questions',JSON.stringify(mg)); } catch(e){}
    // Adiciona ao histórico do dicionário
    questions.forEach(q => {
      if (!generatedQuestionsHistory.some(h => h.text === q.text)) {
        generatedQuestionsHistory.push(q);
      }
    });
    return questions;
  }

  // Fallback se API falhar
  return getFallbackQuestions(step, modId);
}


// ════════════════════════════════════════════════════════════
//  FALLBACK POR MÓDULO — garantia de nível correto
// ════════════════════════════════════════════════════════════
const moduleFallbacks = {
  1: [ // A1 — Imperativo
    {type:'cloze',text:'____ мне воду, пожалуйста.',options:['Дай','Даёт','Давал','Дать'],correct:0,explain:'Дай é imperativo informal de дать (dar).',hint:'R: Дай — imperativo de dar'},
    {type:'translate',text:'Como se diz "Vem cá!"?',options:['Иди сюда!','Идёт сюда!','Ходи сюда!','Идти сюда!'],correct:0,explain:'Иди сюда = imperativo de idti + sюда (cá).',hint:'R: Иди сюда'},
    {type:'cloze',text:'____ тихо! (fica quieto)',options:['Сиди','Сидит','Сидел','Сидеть'],correct:0,explain:'Сиди = imperativo informal de сидеть.',hint:'R: Сиди — imperativo'},
    {type:'translate',text:'Como se diz "Abre a janela"?',options:['Открой окно.','Открывает окно.','Открыл окно.','Открывать окно.'],correct:0,explain:'Открой = imperativo perfectivo de открыть.',hint:'R: Открой'},
    {type:'cloze',text:'____ меня! (espera)',options:['Жди','Ждёт','Ждал','Ждать'],correct:0,explain:'Жди = imperativo de ждать (esperar).',hint:'R: Жди'},
    {type:'translate',text:'Como se diz "Come isso"?',options:['Ешь это.','Ест это.','Ел это.','Есть это.'],correct:0,explain:'Ешь = imperativo de есть (comer).',hint:'R: Ешь'},
    {type:'cloze',text:'____ мне! (me ajuda)',options:['Помоги','Помогает','Помогал','Помочь'],correct:0,explain:'Помоги = imperativo de помочь (ajudar).',hint:'R: Помоги'},
    {type:'translate',text:'Como se diz "Não beba isso"?',options:['Не пей это.','Не пьёт это.','Не пил это.','Не пить это.'],correct:0,explain:'Не пей = imperativo negativo de пить.',hint:'R: Не пей'},
    {type:'cloze',text:'____ домой! (vai para casa)',options:['Иди','Идёт','Ходи','Пойдёт'],correct:0,explain:'Иди = imperativo de идти (ir a pé).',hint:'R: Иди'},
    {type:'translate',text:'Como se diz "Escreve para mim"?',options:['Пиши мне.','Пишет мне.','Писал мне.','Писать мне.'],correct:0,explain:'Пиши = imperativo de писать (escrever).',hint:'R: Пиши мне'},
  ],
  2: [ // A1 — Pronomes
    {type:'cloze',text:'У ____ есть кошка.',options:['меня','мне','я','мной'],correct:0,explain:'У меня есть = eu tenho. Genitivo de я.',hint:'R: меня — genitivo de я'},
    {type:'translate',text:'Como se diz "Eu te amo"?',options:['Я люблю тебя.','Я люблю тебе.','Я люблю ты.','Я люблю тобой.'],correct:0,explain:'Тебя = acusativo de ты (objeto direto).',hint:'R: тебя'},
    {type:'cloze',text:'Позвони ____ завтра. (para ela)',options:['ей','её','она','ею'],correct:0,explain:'Ей = dativo de она (para ela).',hint:'R: ей — dativo'},
    {type:'translate',text:'Como se diz "Ele tem um carro"?',options:['У него есть машина.','У он есть машина.','Он имеет машина.','Его есть машина.'],correct:0,explain:'У него = у + genitivo de он.',hint:'R: У него есть'},
    {type:'cloze',text:'Это ____ книга? (sua — informal)',options:['твоя','твой','ваша','твоё'],correct:0,explain:'Твоя para substantivos femininos (книга é feminino).',hint:'R: твоя — possessivo feminino'},
    {type:'translate',text:'Como se diz "Me dá isso"?',options:['Дай мне это.','Дай меня это.','Дай я это.','Дай мной это.'],correct:0,explain:'Мне = dativo de я (para mim).',hint:'R: мне — dativo'},
    {type:'cloze',text:'Я думаю о ____. (sobre você)',options:['тебе','тебя','ты','тобой'],correct:0,explain:'О + prepositivo: тебе (sobre você).',hint:'R: тебе — prepositivo'},
    {type:'translate',text:'Como se diz "Isso é para nós"?',options:['Это для нас.','Это для мы.','Это для нами.','Это нас.'],correct:0,explain:'Нас = genitivo/acusativo de мы.',hint:'R: для нас'},
    {type:'cloze',text:'Я иду к ____. (até você)',options:['тебе','тебя','ты','тебой'],correct:0,explain:'К + dativo: к тебе (até você/para você).',hint:'R: к тебе'},
    {type:'translate',text:'Como se diz "Eles têm um apartamento"?',options:['У них есть квартира.','У они есть квартира.','Они имеют квартира.','Их есть квартира.'],correct:0,explain:'У них = у + genitivo de они.',hint:'R: У них есть'},
  ],
  3: [ // A1 — Movimento
    {type:'cloze',text:'Я ____ домой пешком.',options:['иду','еду','хожу','ехал'],correct:0,explain:'Иду = ir a pé, agora, em uma direção.',hint:'R: иду — a pé, direção única, agora'},
    {type:'translate',text:'Como se diz "Vou ao trabalho de metrô todo dia"?',options:['Я езжу на работу на метро.','Я еду на работу на метро.','Я иду на работу на метро.','Я хожу на работу на метро.'],correct:0,explain:'Ездить = transporte, hábito/repetição.',hint:'R: езжу — transporte, hábito'},
    {type:'cloze',text:'Куда ты ____? (para onde você vai — a pé, agora)',options:['идёшь','ходишь','едешь','ездишь'],correct:0,explain:'Идёшь = идти conjugado para ты, agora.',hint:'R: идёшь — a pé, agora'},
    {type:'translate',text:'Como se diz "Estamos indo a Moscou de trem"?',options:['Мы едем в Москву на поезде.','Мы идём в Москву на поезде.','Мы ездим в Москву на поезде.','Мы ходим в Москву на поезде.'],correct:0,explain:'Ехать = transporte, direção única, agora.',hint:'R: едем — transporte, agora'},
    {type:'cloze',text:'Он часто ____ в парк.',options:['ходит','идёт','едет','ездит'],correct:0,explain:'Ходить para hábito/frequência a pé.',hint:'R: ходит — hábito a pé'},
    {type:'translate',text:'Como se diz "Vai reto, depois à direita"?',options:['Иди прямо, потом направо.','Идёт прямо, потом направо.','Ходи прямо, потом направо.','Идти прямо, потом направо.'],correct:0,explain:'Иди = imperativo de идти para direções.',hint:'R: Иди прямо'},
    {type:'cloze',text:'Метро ____ быстро. (o metrô vai)',options:['едет','идёт','ходит','ездит'],correct:0,explain:'Ехать para veículos em movimento agora.',hint:'R: едет — veículo em movimento'},
    {type:'translate',text:'Como se diz "Ela costuma ir de ônibus"?',options:['Она ездит на автобусе.','Она едет на автобусе.','Она идёт на автобусе.','Она ходит на автобусе.'],correct:0,explain:'Ездить = transporte, hábito.',hint:'R: ездит — transporte, hábito'},
    {type:'cloze',text:'Где автобус? — Он ____ туда.',options:['едет','ходит','идёт','ездит'],correct:0,explain:'Ехать = transporte, direção, agora.',hint:'R: едет — transporte agora'},
    {type:'translate',text:'Como se diz "Vou ao supermercado a pé agora"?',options:['Я иду в магазин пешком.','Я хожу в магазин пешком.','Я еду в магазин пешком.','Я ездил в магазин пешком.'],correct:0,explain:'Иду = a pé, direção única, agora.',hint:'R: иду — a pé, agora'},
  ],
  4: [ // A2 — Aspectos Verbais
    {type:'cloze',text:'Я долго ____ задачу.',options:['решал','решил','решу','буду решать'],correct:0,explain:'Решал (NSV) — processo longo, foco na duração.',hint:'R: решал — processo (долго)'},
    {type:'cloze',text:'Наконец-то я ____ задачу!',options:['решил','решал','решать','решаю'],correct:0,explain:'Решил (SV) — resultado final alcançado.',hint:'R: решил — resultado (наконец-то)'},
    {type:'translate',text:'Como se diz "Eu estava comendo quando ele ligou"?',options:['Я ел, когда он позвонил.','Я съел, когда он позвонил.','Я поел, когда он позвонил.','Я буду есть, когда он позвонил.'],correct:0,explain:'Ел (NSV) = processo interrompido.',hint:'R: ел — processo em andamento'},
    {type:'cloze',text:'Он ____ книгу за два часа.',options:['прочитал','читал','читает','будет читать'],correct:0,explain:'Прочитал (SV) — leu e terminou em 2 horas.',hint:'R: прочитал — concluído em tempo definido'},
    {type:'translate',text:'Como se diz "Ele sempre cozinha bem"?',options:['Он всегда хорошо готовит.','Он всегда хорошо приготовил.','Он всегда хорошо приготовит.','Он всегда хорошо приготовлял.'],correct:0,explain:'Готовит (NSV) — hábito/frequência.',hint:'R: готовит — hábito'},
    {type:'cloze',text:'Я ____ письмо и отправил.',options:['написал','писал','напишу','пишу'],correct:0,explain:'Написал (SV) — escreveu E enviou, ação completa.',hint:'R: написал — ação concluída antes de enviar'},
    {type:'translate',text:'Como se diz "Ela estava lendo o dia todo"?',options:['Она читала весь день.','Она прочитала весь день.','Она будет читать весь день.','Она читает весь день.'],correct:0,explain:'Читала (NSV) — processo que durou o dia todo.',hint:'R: читала — duração (весь день)'},
    {type:'cloze',text:'Вчера я ____ обед за 10 минут.',options:['приготовил','готовил','готовлю','буду готовить'],correct:0,explain:'Приготовил (SV) — cozinhou e ficou pronto.',hint:'R: приготовил — resultado em tempo específico'},
    {type:'translate',text:'Como se diz "Eu estava tomando banho quando tocou a campainha"?',options:['Я принимал душ, когда позвонили.','Я принял душ, когда позвонили.','Я буду принимать душ, когда позвонили.','Я приму душ, когда позвонили.'],correct:0,explain:'Принимал (NSV) — processo interrompido.',hint:'R: принимал — processo em andamento'},
    {type:'cloze',text:'Она наконец ____ по-русски!',options:['заговорила','говорила','говорит','будет говорить'],correct:0,explain:'Заговорила (SV) — passou a falar, resultado.',hint:'R: заговорила — mudança de estado (наконец)'},
  ],
  5: [ // A2 — Passado
    {type:'cloze',text:'Вчера я ____ в кино.',options:['ходил','хожу','пойду','иду'],correct:0,explain:'Ходил = fui (a pé, evento passado).',hint:'R: ходил — passado a pé'},
    {type:'translate',text:'Como se diz "Ela morava em Paris"?',options:['Она жила в Париже.','Она жить в Париже.','Она живёт в Париже.','Она будет жить в Париже.'],correct:0,explain:'Жила = passado feminino de жить.',hint:'R: жила — feminino passado'},
    {type:'cloze',text:'Мы ____ всю ночь.',options:['танцевали','танцуем','потанцевали','будем танцевать'],correct:0,explain:'Танцевали (NSV) — processo que durou a noite toda.',hint:'R: танцевали — duração'},
    {type:'translate',text:'Como se diz "Eu perdi meu telefone"?',options:['Я потерял телефон.','Я терял телефон.','Я теряю телефон.','Я потеряю телефон.'],correct:0,explain:'Потерял (SV) = perdi e está perdido.',hint:'R: потерял — resultado'},
    {type:'cloze',text:'Раньше он ____ много кофе.',options:['пил','выпил','пьёт','будет пить'],correct:0,explain:'Пил (NSV) = bebia (hábito no passado).',hint:'R: пил — hábito passado (раньше)'},
    {type:'translate',text:'Como se diz "Ela conheceu um russo ontem"?',options:['Она познакомилась с русским вчера.','Она знакомилась с русским вчера.','Она знакомится с русским вчера.','Она будет знакомиться вчера.'],correct:0,explain:'Познакомилась (SV) = conheceu (evento único, resultado).',hint:'R: познакомилась — evento único'},
    {type:'cloze',text:'Я ____ весь день, но ничего не понял.',options:['учился','выучился','учусь','буду учиться'],correct:0,explain:'Учился (NSV) — estudou o dia todo mas sem resultado.',hint:'R: учился — processo sem resultado'},
    {type:'translate',text:'Como se diz "Ele voltou para casa tarde"?',options:['Он вернулся домой поздно.','Он возвращался домой поздно.','Он возвращается домой поздно.','Он будет возвращаться поздно.'],correct:0,explain:'Вернулся (SV) = voltou (evento concluído).',hint:'R: вернулся — conclusão'},
    {type:'cloze',text:'Когда я ____ домой, она уже спала.',options:['пришёл','приходил','прихожу','приду'],correct:0,explain:'Пришёл (SV) = cheguei (evento único).',hint:'R: пришёл — evento único no passado'},
    {type:'translate',text:'Como se diz "Nós nos amávamos"?',options:['Мы любили друг друга.','Мы полюбили друг друга.','Мы любим друг друга.','Мы будем любить друг друга.'],correct:0,explain:'Любили (NSV) = amávamos (estado contínuo).',hint:'R: любили — estado contínuo'},
  ],
  6: [ // A2 — Futuro Composto
    {type:'cloze',text:'Завтра я ____ работать весь день.',options:['буду','был','будут','будешь'],correct:0,explain:'Буду + inf = futuro composto para я.',hint:'R: буду — futuro 1ª pessoa'},
    {type:'translate',text:'Como se diz "Ela vai estar esperando você"?',options:['Она будет ждать тебя.','Она ждёт тебя.','Она ждала тебя.','Она подождёт тебя.'],correct:0,explain:'Будет ждать = futuro composto (processo).',hint:'R: будет ждать'},
    {type:'cloze',text:'Мы ____ смотреть фильм вечером.',options:['будем','были','будут','буду'],correct:0,explain:'Будем = futuro de мы + infinitivo.',hint:'R: будем — futuro мы'},
    {type:'translate',text:'Como se diz "Não vou trabalhar amanhã"?',options:['Я не буду работать завтра.','Я не работал завтра.','Я не работаю завтра.','Я не работать завтра.'],correct:0,explain:'Не буду работать = negação do futuro composto.',hint:'R: не буду работать'},
    {type:'cloze',text:'Он ____ учиться в университете.',options:['будет','был','есть','буде'],correct:0,explain:'Будет = futuro composto para он.',hint:'R: будет — futuro он'},
    {type:'translate',text:'Como se diz "O que você vai estar fazendo às 8?"?',options:['Что ты будешь делать в 8?','Что ты делаешь в 8?','Что ты сделаешь в 8?','Что ты делал в 8?'],correct:0,explain:'Будешь делать = futuro composto, процесс.',hint:'R: будешь делать'},
    {type:'cloze',text:'Дети ____ играть в парке.',options:['будут','были','есть','буду'],correct:0,explain:'Будут = futuro para они/дети.',hint:'R: будут — futuro они'},
    {type:'translate',text:'Como se diz "Vou sentir sua falta"?',options:['Я буду скучать по тебе.','Я скучал по тебе.','Я скучаю по тебе.','Я поскучаю по тебе.'],correct:0,explain:'Буду скучать = processo futuro.',hint:'R: буду скучать'},
    {type:'cloze',text:'Мы ____ ждать тебя здесь.',options:['будем','были','будут','буду'],correct:0,explain:'Будем = futuro composto para мы.',hint:'R: будем ждать'},
    {type:'translate',text:'Como se diz "Ela vai estar dormindo quando você chegar"?',options:['Она будет спать, когда ты придёшь.','Она спит, когда ты придёшь.','Она спала, когда ты придёшь.','Она поспит, когда ты придёшь.'],correct:0,explain:'Будет спать = processo em andamento no futuro.',hint:'R: будет спать'},
  ],
  7: [ // A2 — Futuro Simples
    {type:'cloze',text:'Я ____ тебе завтра. (ligar)',options:['позвоню','буду звонить','звонил','звоню'],correct:0,explain:'Позвоню (SV) = ligarei uma vez, conclusão.',hint:'R: позвоню — evento único futuro'},
    {type:'translate',text:'Como se diz "Vamos nos encontrar às 7"?',options:['Встретимся в 7.','Будем встречаться в 7.','Встречались в 7.','Встречаемся в 7.'],correct:0,explain:'Встретимся (SV) = evento único futuro.',hint:'R: встретимся — evento único'},
    {type:'cloze',text:'Она ____ книгу за вечер.',options:['прочитает','будет читать','читала','читает'],correct:0,explain:'Прочитает (SV) = terminará de ler.',hint:'R: прочитает — resultado futuro'},
    {type:'translate',text:'Como se diz "Eu vou fazer isso hoje"?',options:['Я сделаю это сегодня.','Я буду делать это сегодня.','Я делал это сегодня.','Я делаю это сегодня.'],correct:0,explain:'Сделаю (SV) = farei e concluirei.',hint:'R: сделаю — conclusão'},
    {type:'cloze',text:'Мы ____ туда завтра. (ir de transporte, evento único)',options:['поедем','будем ехать','ехали','едем'],correct:0,explain:'Поедем (SV) = partiremos (decisão única).',hint:'R: поедем — evento único'},
    {type:'translate',text:'Como se diz "Ele vai comprar flores"?',options:['Он купит цветы.','Он будет покупать цветы.','Он покупал цветы.','Он покупает цветы.'],correct:0,explain:'Купит (SV) = comprará (ação única, resultado).',hint:'R: купит — resultado'},
    {type:'cloze',text:'Я ____ тебе всё. (contar)',options:['расскажу','буду рассказывать','рассказывал','рассказываю'],correct:0,explain:'Расскажу (SV) = contarei (evento único completo).',hint:'R: расскажу — evento único'},
    {type:'translate',text:'Como se diz "Eles vão chegar amanhã"?',options:['Они приедут завтра.','Они будут приезжать завтра.','Они приезжали завтра.','Они приезжают завтра.'],correct:0,explain:'Приедут (SV) = chegarão (evento único).',hint:'R: приедут — chegada única'},
    {type:'cloze',text:'Она ____ ему письмо. (escrever, conclusão)',options:['напишет','будет писать','писала','пишет'],correct:0,explain:'Напишет (SV) = escreverá e terminará.',hint:'R: напишет — conclusão'},
    {type:'translate',text:'Como se diz "Vou te ajudar"?',options:['Я помогу тебе.','Я буду помогать тебе.','Я помогал тебе.','Я помогаю тебе.'],correct:0,explain:'Помогу (SV) = ajudarei (evento único).',hint:'R: помогу — evento único'},
  ],
};
// Fill remaining modules with generic fallback
for (let i = 8; i <= 12; i++) moduleFallbacks[i] = null;

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash',       label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro',         label: 'Gemini 2.5 Pro'   },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash'   },
];
const GEMINI_URL       = GEMINI_BASE + "gemini-2.5-flash:generateContent";
const GEMINI_FLASH_URL = GEMINI_BASE + "gemini-2.5-flash:generateContent";
const GEMINI_PRO_URL   = GEMINI_BASE + "gemini-2.5-pro:generateContent";

async function callGeminiWithRetry(prompt, maxRetries = 2) {
  if (!userData.apiKey) {
    showToast('🔑 Sem chave de API — configure em ⚙️', 5000);
    return null;
  }
  let lastError = '';
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (attempt > 1) await new Promise(r => setTimeout(r, 2000 * attempt));
    try {
      await _waitForRateLimit(null);
    const response = await fetch(`${GEMINI_URL}?key=${userData.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2000
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${response.status}`;
        if (response.status === 401 || response.status === 403) {
          showToast('🔑 Chave de API inválida — verifique em ⚙️', 6000);
          return null;
        }
        if (response.status === 400) {
          console.error('Gemini 400 error:', errMsg);
          const msg = errMsg.toLowerCase().includes('api key') ? '🔑 API Key inválida — verifique em ⚙️'
            : errMsg.toLowerCase().includes('quota') ? '⏳ Cota da API esgotada — tente mais tarde'
            : errMsg.toLowerCase().includes('model') ? '🤖 Modelo não encontrado — verifique a API Key'
            : `⚠️ Erro na requisição: ${errMsg.slice(0, 60)}`;
          showToast(msg, 7000);
          return null;
        }
        if (response.status === 429) {
          const waitSec = 5 * attempt;
          showToast(`⏳ Limite de requisições atingido — aguardando ${waitSec}s...`, waitSec * 1000);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          continue;
        }
        if (response.status >= 500) {
          lastError = `Servidor Gemini indisponível (${response.status})`;
          showToast(`🌐 ${lastError} — tentativa ${attempt}/${maxRetries}`, 3000);
          continue;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      console.log('Gemini raw response:', JSON.stringify(data).slice(0, 300));

      // Gemini 2.5 pode retornar múltiplos parts (thinking + resposta)
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const rawText = parts.map(p => p.text || '').join('');

      // Parser robusto: encontra o array JSON mesmo com texto ao redor
      const startIdx = rawText.indexOf('[');
      const endIdx = rawText.lastIndexOf(']');
      if (startIdx === -1 || endIdx === -1) {
        console.error('Nenhum array JSON encontrado. Raw:', rawText.slice(0, 200));
        throw new Error('Nenhum array JSON na resposta');
      }

            // Remove \'  (barra + aspas simples) que o Gemini gera e é inválido em JSON
      const rawSlice = rawText.slice(startIdx, endIdx + 1).replace(/\\'/g, "'");

      // Parser em duas etapas:
      // 1) Tenta JSON.parse direto — rápido e funciona na maioria dos casos
      // 2) Se falhar, extrai objeto por objeto com balanceamento de chaves correto
      let parsed = [];

      try {
        const direct = JSON.parse(rawSlice);
        if (Array.isArray(direct)) parsed = direct;
      } catch(e1) {
        let i = 0;
        while (i < rawSlice.length) {
          const objStart = rawSlice.indexOf('{', i);
          if (objStart === -1) break;

          // Percorre o objeto respeitando strings e escapes corretamente
          let depth = 0;
          let inStr = false;
          let objEnd = -1;
          let j = objStart;
          while (j < rawSlice.length) {
            const ch = rawSlice[j];
            if (inStr) {
              if (ch === '\\') { j += 2; continue; } // pula caractere escapado
              if (ch === '"') inStr = false;
            } else {
              if (ch === '"') { inStr = true; }
              else if (ch === '{') { depth++; }
              else if (ch === '}') { depth--; if (depth === 0) { objEnd = j; break; } }
            }
            j++;
          }

          if (objEnd === -1) break;
          const objStr = rawSlice.slice(objStart, objEnd + 1);
          try {
            parsed.push(JSON.parse(objStr));
          } catch(e2) {
            console.warn('Objeto ignorado (JSON inválido):', objStr.slice(0, 80));
          }
          i = objEnd + 1;
        }
      }

      if (!Array.isArray(parsed)) throw new Error('Resposta não é um array JSON');

      // Valida cada questão minimamente
      const valid = parsed.filter(q =>
        q.type && q.text && Array.isArray(q.options) && q.options.length >= 4 &&
        typeof q.correct === 'number' && q.explain
      );

      console.log(`Gemini: ${parsed.length} questões recebidas, ${valid.length} válidas`);
      if (valid.length < 5) throw new Error(`Apenas ${valid.length} questões válidas`);

      return valid;

    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        showToast('🌐 Sem conexão com a internet — usando questões locais', 5000);
        return null;
      }
      console.warn(`Gemini tentativa ${attempt}/${maxRetries} falhou:`, msg);
      if (attempt < maxRetries) {
        await sleep(1200 * attempt);
      }
    }
  }
  showToast('❌ Gemini indisponível — usando questões locais', 4000);
  return null;
}

function getFallbackQuestions(step, modId) {
  // Use per-module fallback if available — guaranteed correct CEFR level
  if (modId && moduleFallbacks[modId]) {
    const modBank = moduleFallbacks[modId];
    const qType = step === 3 ? 'cloze' : 'translate';
    const typed = modBank.filter(q => q.type === qType);
    const pool = typed.length >= 5 ? typed : modBank;
    return shuffle(pool).slice(0, 10);
  }
  // Generic fallback for modules 8-12
  const qType = step === 3 ? 'cloze' : 'translate';
  let filtered = fallbackQuestions.filter(q => q.type === qType);
  if (filtered.length < 5) filtered = fallbackQuestions;
  return shuffle(filtered).slice(0, 10);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ════════════════════════════════════════════════════════════
//  TTS
// ════════════════════════════════════════════════════════════
function initTTS() {
  const voices = window.speechSynthesis.getVoices();
  russianVoice = voices.find(v => v.lang === 'ru-RU') || null;
}
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = initTTS;
}

function speakRU(text) {
  if (!('speechSynthesis' in window)) return;
  let cleanText = text.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '');
  cleanText = cleanText.replace(/[^а-яА-ЯёЁ\s\.,!\?-]/g, '').trim();
  if (!cleanText) return;
  const msg = new SpeechSynthesisUtterance(cleanText);
  msg.lang = 'ru-RU';
  // Tenta voz russa, senao usa qualquer voz disponivel com lang ru
  const voices = window.speechSynthesis.getVoices();
  const ruVoice = voices.find(v => v.lang.startsWith('ru')) || russianVoice || null;
  if (ruVoice) msg.voice = ruVoice;
  msg.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(msg);
}

// ════════════════════════════════════════════════════════════
//  PERSISTÊNCIA
// ════════════════════════════════════════════════════════════
function saveData() {
  localStorage.setItem('russo_gemini_v1', JSON.stringify(userData));
  updateStats();
  updateApiStatus();
}

function updateStats() {
  const done = userData.completedModules.length;
  const subDone = (userData.completedSubmodules || []).length;
  const totalSub = submodulesData.filter(s => s.modId <= 12).length;
  const savedWords = JSON.parse(localStorage.getItem('russo_questions') || '[]').length;
  // Weighted: modules 60%, submodules 25%, vocab 15%
  const modPct   = (done / 12) * 60;
  const subPct   = (Math.min(subDone, totalSub) / totalSub) * 25;
  const vocabPct = (Math.min(savedWords, 164) / 164) * 15;
  const pct = Math.round(modPct + subPct + vocabPct);
  const level = pct >= 85 ? "B2" : pct >= 60 ? "B1" : pct >= 30 ? "A2" : "A1";
  document.getElementById('modules-count').innerText = `${done}/12`;
  document.getElementById('fluency-text').innerText = `Nível ${level} — ${pct}%`;
  document.getElementById('fluency-bar').style.width = `${pct}%`;
}

// ════════════════════════════════════════════════════════════
//  UTILITÁRIOS
// ════════════════════════════════════════════════════════════
function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ════════════════════════════════════════════════════════════
//  NAVEGAÇÃO
// ════════════════════════════════════════════════════════════
function navTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`screen-${screenId}`).classList.add('active');

  const btns = document.querySelectorAll('.nav-btn');
  const map = { home: 0, review: 1, dict: 2, grammar: 3 };
  if (map[screenId] !== undefined) btns[map[screenId]].classList.add('active');

  window.scrollTo(0, 0);

  if (screenId === 'home') { buildModulesList(); renderHomeStats(); }
  if (screenId === 'review')  buildReview();
  if (screenId === 'grammar') buildGrammarLib();
  if (screenId === 'dict') showAllDictWords();
}

// ════════════════════════════════════════════════════════════
//  LISTA DE MÓDULOS
// ════════════════════════════════════════════════════════════
function renderHomeStats() {
  const el = document.getElementById('home-stats');
  if (!el) return;
  const total = modulesData.length;
  const done = (userData.completedModules||[]).length;
  const pct = Math.round((done / total) * 100);
  const streak = userData.streak || 0;
  const today = new Date().toISOString().slice(0,10);
  const words = (userData.learnedWords||[]).length;
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:16px;">'
    + '<div style="flex:1;background:var(--card);border-radius:12px;padding:12px;text-align:center;"><div style="font-size:22px;">' + (streak>0?'🔥':'💤') + '</div><div style="font-size:20px;font-weight:700;color:' + (streak>0?'#ff6b35':'var(--muted)') + ';">' + streak + '</div><div style="font-size:11px;color:var(--muted);">dias seguidos</div></div>'
    + '<div style="flex:1;background:var(--card);border-radius:12px;padding:12px;text-align:center;"><div style="font-size:22px;">📚</div><div style="font-size:20px;font-weight:700;color:var(--accent);">' + done + '/' + total + '</div><div style="font-size:11px;color:var(--muted);">módulos</div></div>'
    + '<div style="flex:1;background:var(--card);border-radius:12px;padding:12px;text-align:center;"><div style="font-size:22px;">🧠</div><div style="font-size:20px;font-weight:700;color:var(--primary);">' + words + '</div><div style="font-size:11px;color:var(--muted);">palavras</div></div>'
    + '</div>'
    + '<div style="background:var(--card);border-radius:10px;padding:12px 14px;margin-bottom:16px;">'
    + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="color:var(--muted);">Progresso do curso</span><span style="color:var(--accent);font-weight:700;">' + pct + '%</span></div>'
    + '<div style="background:var(--surface);border-radius:6px;height:8px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:6px;transition:width 0.5s ease;"></div></div>'
    + '</div>';
}

function buildModulesList() {
  const list = document.getElementById('modules-list');
  list.innerHTML = '';
  modulesData.forEach((mod, index) => {
    const isLocked    = false;
    const isCompleted = userData.completedModules.includes(mod.id);
    const statusClass = isLocked ? 'locked' : (isCompleted ? 'completed' : 'unlocked');
    list.innerHTML += `
      <div class="module-card ${statusClass}" style="flex-direction:column;align-items:stretch;gap:10px;" onclick="openModuleHub(${mod.id}, ${isLocked})">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="module-info">
            <p>${mod.phase} · <span style="color:var(--accent);">${mod.cefr}</span></p>
            <h3>${mod.title}</h3>
          </div>
          <div style="font-size:24px;">${isLocked ? '🔒' : isCompleted ? '✅' : '▶️'}</div>
        </div>

      </div>`;
  });
}

// ════════════════════════════════════════════════════════════
//  FLUXO DE LIÇÃO
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
//  MODULE HUB — Grammar summary + submodules + final exam
// ════════════════════════════════════════════════════════════
function openModuleHub(modId, isLocked) {
  if (isLocked) return;
  const mod = modulesData.find(m => m.id === modId);
  openSubmodules(modId, mod.title);
}

// ════════════════════════════════════════════════════════════
//  MINI AULA — Apresenta palavra → questão contextualizada
// ════════════════════════════════════════════════════════════
