@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700;900&display=swap');

  :root {
    --bg: #1a1a22;
    --surface: #22222e;
    --card: #2a2a38;
    --accent: #c9a84c;
    --accent-hover: #e0be72;
    --primary: #5cb85c;
    --primary-dark: #449944;
    --text: #e8e4d8;
    --muted: #9a96aa;
    --error: #e05c4a;
    --border: #34344a;
    --hint: #5ba3d9;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

  body {
    font-family: 'Roboto', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    padding-bottom: 90px;
    overflow-x: hidden;
  }

  h1, h2, h3 { font-family: 'Roboto', sans-serif; margin-bottom: 15px; color: var(--accent); }

  header { background-color: var(--surface); padding: 15px 20px; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid var(--border); box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
  .stats-container { display: flex; flex-direction: column; gap: 8px; font-size: 15px; font-weight: 600;}
  .stat-row { display: flex; justify-content: space-between; align-items: center; color: var(--text); }
  .progress-bg { background: var(--border); height: 8px; border-radius: 4px; width: 100%; overflow: hidden; }
  .progress-fill { background: var(--accent); height: 100%; width: 0%; transition: width 0.4s ease; }

  nav { position: fixed; bottom: 0; width: 100%; background: var(--surface); display: flex; justify-content: space-around; padding: 12px 0; border-top: 1px solid var(--border); z-index: 100; }
  .nav-btn { background: none; border: none; color: var(--muted); font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; width: 20%; font-weight: 600; transition: color 0.3s; }
  .nav-btn.active { color: var(--accent); }
  .nav-icon { font-size: 22px; margin-bottom: 2px; }

  .screen { display: none; padding: 25px 20px; animation: fadeIn 0.3s ease-in-out; }
  .screen.active { display: block; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .module-card { background: var(--card); border-radius: 12px; padding: 20px; margin-bottom: 15px; border-left: 4px solid var(--border); display: flex; justify-content: space-between; align-items: center; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s, border-color 0.2s; }
  .module-card:active { transform: scale(0.98); }
  .module-card.locked { opacity: 0.5; cursor: not-allowed; }
  .module-card.unlocked { border-left-color: var(--accent); }
  .module-card.completed { border-left-color: var(--primary); }
  .module-info h3 { margin-bottom: 5px; font-size: 18px; color: var(--text); font-family: 'Roboto', sans-serif; }
  .module-info p { color: var(--muted); font-size: 14px; font-weight: 400; }

  .phrase-box { background: var(--card); padding: 20px; border-radius: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border);}
  .ru-text { font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #fff; line-height: 1.3; }
  .pt-text { color: var(--muted); font-size: 15px; line-height: 1.4; }

  .audio-btn { background: var(--accent); color: var(--bg); border: none; border-radius: 50%; width: 45px; height: 45px; font-size: 18px; cursor: pointer; display: flex; justify-content: center; align-items: center; flex-shrink: 0; margin-left: 15px; box-shadow: 0 2px 5px rgba(232,200,122,0.3); transition: transform 0.1s; }
  .audio-btn:active { transform: scale(0.9); }


  /* ── Word Tooltip ── */
  .ru-word {
    cursor: pointer;
    position: relative;
    display: inline-block;
  }
  .ru-word:not(.ru-unknown) {
    border-bottom: 1px dashed var(--accent);
  }
  .ru-unknown {
    border-bottom: 1px dashed var(--muted);
    opacity: 0.85;
  }
  .ru-word:hover .word-tooltip,
  .ru-word.touch-active .word-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(-4px);
  }
  .word-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(0);
    background: var(--card);
    color: var(--text);
    border: 1px solid var(--accent);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s;
    z-index: 200;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  }
  .word-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: var(--accent);
  }
  /* Translate full sentence button */
  .translate-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    margin-top: 8px;
    transition: all 0.2s;
  }
  .translate-btn:hover { border-color: var(--accent); color: var(--accent); }
  .translation-result {
    font-size: 13px;
    color: var(--hint);
    margin-top: 8px;
    font-style: italic;
    min-height: 20px;
  }

  .option-btn { display: block; width: 100%; background: var(--surface); color: var(--text); border: 2px solid var(--border); padding: 16px; border-radius: 12px; margin-bottom: 12px; font-size: 16px; font-weight: 600; text-align: left; cursor: pointer; transition: all 0.2s; }
  .option-btn:active { transform: scale(0.98); }
  .option-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .option-btn.selected { border-color: var(--accent); background: rgba(212,175,55,0.15); }
  .option-btn.correct { background: rgba(46, 204, 113, 0.1); border-color: var(--primary); color: var(--primary); }
  .option-btn.wrong { background: rgba(231, 76, 60, 0.1); border-color: var(--error); color: var(--error); }

  .btn { display: block; width: 100%; background: var(--accent); color: var(--bg); border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 25px; text-align: center; text-transform: uppercase; letter-spacing: 1px; transition: background 0.2s; }
  .btn:active { background: var(--accent-hover); transform: scale(0.98); }
  .btn-outline { background: transparent; border: 2px solid var(--border); color: var(--text); margin-top: 15px; }
  .btn-outline:active { background: var(--border); }
  .btn-hint { background: transparent; color: var(--hint); border: 1px solid var(--hint); margin-top: 15px; padding: 10px 15px; border-radius: 8px; display: inline-block; width: auto; font-size: 14px; font-weight: 600; cursor: pointer; }

  .feedback-box { display: none; margin-top: 20px; padding: 18px; border-radius: 12px; background: var(--card); text-align: left; border-left: 4px solid var(--primary); line-height: 1.5; }
  .feedback-title { font-weight: 700; margin-bottom: 8px; font-size: 18px; }

  .search-bar { width: 100%; padding: 16px; border-radius: 12px; border: 2px solid var(--border); background: var(--surface); color: var(--text); margin-bottom: 20px; font-size: 16px; outline: none; transition: border-color 0.3s; }
  .search-bar:focus { border-color: var(--accent); }

  .grammar-section { background: var(--card); padding: 25px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--border); line-height: 1.6; font-size: 16px; }
  .grammar-section h3 { border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 15px; }
  .grammar-section ul { margin-left: 20px; margin-top: 10px; }
  .grammar-section li { margin-bottom: 10px; }
  .grammar-section b { color: var(--accent); }

  .flex-col { display: flex; flex-direction: column; }
  .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
  .back-btn { background: transparent; color: var(--muted); border: none; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; }

  /* ── Loading Spinner ── */
  .loading-overlay {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 60px 20px; gap: 20px;
  }
  .spinner {
    width: 48px; height: 48px;
    border: 4px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { color: var(--muted); font-size: 15px; font-weight: 600; text-align: center; line-height: 1.5; }

  /* ── API Key Modal ── */
  .modal-backdrop {
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75);
    z-index: 200; align-items: center; justify-content: center; padding: 20px;
  }
  .modal-backdrop.open { display: flex; }
  .modal-box {
    background: var(--card); border-radius: 16px; padding: 28px;
    width: 100%; max-width: 420px; border: 1px solid var(--border);
  }
  .modal-box h3 { color: var(--accent); margin-bottom: 12px; }
  .modal-box p { color: var(--muted); font-size: 14px; margin-bottom: 18px; line-height: 1.5; }
  .modal-input {
    width: 100%; padding: 14px; border-radius: 10px; border: 2px solid var(--border);
    background: var(--surface); color: var(--text); font-size: 15px; outline: none;
    margin-bottom: 14px; transition: border-color 0.2s;
  }
  .modal-input:focus { border-color: var(--accent); }
  .modal-actions { display: flex; gap: 10px; margin-top: 6px; }
  .modal-actions .btn { margin-top: 0; flex: 1; padding: 13px; }
  .btn-danger { background: var(--error); color: #fff; }
  .api-status { font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; }
  .api-status.ok  { background: rgba(76,175,80,0.15); color: var(--primary); }
  .api-status.missing { background: rgba(231,76,60,0.15); color: var(--error); }
