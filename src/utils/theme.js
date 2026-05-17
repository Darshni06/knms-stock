export const T = {
  teal:   "#2CB5A8",
  teal2:  "#1a8a80",
  peach:  "#E8876A",
  slate:  "#1E2A38",
  slateM: "#3A4A5C",
  muted:  "#7A8FA6",
  bg:     "#EEF5F4",
  white:  "#FFFFFF",
  border: "#DDE8E7",
};

export const FLAG_META = {
  broken:   { icon: "🔴", label: "Broken",         color: "#C53030", bg: "rgba(197,48,48,.1)"   },
  missing:  { icon: "⚠️", label: "Missing",        color: "#B7791F", bg: "rgba(183,121,31,.1)"  },
  paint:    { icon: "🎨", label: "Paint/Varnish",  color: "#2B6CB0", bg: "rgba(43,108,176,.1)"  },
  purchase: { icon: "🛒", label: "Purchase Needed",color: "#276749", bg: "rgba(39,103,73,.1)"   },
  repair:   { icon: "🔧", label: "Repair Needed",  color: "#553C9A", bg: "rgba(85,60,154,.1)"   },
};

export const CLASSES = ["PP-2","PP-3","PP-4","PP-5","PP-6","PP-7","PP-8","PP-9","PP-10"];

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sora', sans-serif; background: ${T.bg}; color: ${T.slate}; }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }

  .sidebar {
    width: 230px; min-height: 100vh; position: fixed; left: 0; top: 0; bottom: 0;
    background: ${T.slate};
    display: flex; flex-direction: column;
    z-index: 50;
    box-shadow: 4px 0 32px rgba(30,42,56,.18);
  }

  .main { margin-left: 230px; min-height: 100vh; padding: 36px 40px; }

  .nav-item {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 18px; margin: 2px 12px; border-radius: 10px;
    cursor: pointer; font-size: 13.5px; font-weight: 500;
    color: rgba(255,255,255,.55); transition: all .18s;
    user-select: none;
  }
  .nav-item:hover  { background: rgba(255,255,255,.08); color: rgba(255,255,255,.9); }
  .nav-item.active { background: rgba(44,181,168,.22); color: ${T.teal}; font-weight: 600; }
  .nav-item .nav-icon { font-size: 16px; width: 22px; text-align: center; }

  .card {
    background: white; border-radius: 16px;
    border: 1px solid ${T.border};
    box-shadow: 0 2px 12px rgba(30,42,56,.06);
  }

  .btn {
    border: none; border-radius: 10px; padding: 9px 18px;
    font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .16s; display: inline-flex; align-items: center; gap: 7px;
  }
  .btn-primary { background: ${T.teal}; color: white; box-shadow: 0 2px 10px rgba(44,181,168,.3); }
  .btn-primary:hover { background: ${T.teal2}; transform: translateY(-1px); }
  .btn-ghost   { background: white; color: ${T.slateM}; border: 1.5px solid ${T.border}; }
  .btn-ghost:hover { border-color: ${T.teal}; color: ${T.teal}; }
  .btn-danger  { background: white; color: #C53030; border: 1.5px solid #FEB2B2; }
  .btn-danger:hover { background: #FFF5F5; }

  .tab {
    padding: 7px 16px; border-radius: 9px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: 7px;
    white-space: nowrap; border: 1.5px solid transparent;
    user-select: none;
  }
  .tab.active { background: ${T.teal}; color: white; }
  .tab:not(.active) { background: white; color: ${T.muted}; border-color: ${T.border}; }
  .tab:not(.active):hover { border-color: ${T.teal}; color: ${T.teal}; }

  .status-cell {
    padding: 8px 10px; min-width: 88px; vertical-align: top;
    border: 1px solid #EEF3F3; cursor: pointer; transition: background .12s;
    position: relative;
  }
  .status-cell:hover { background: rgba(44,181,168,.06) !important; }
  .status-cell-empty { color: #C8D8D7; font-size: 12px; text-align: center; }

  .flag-btn {
    padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
    cursor: pointer; border: 1.5px solid #E2E8F0; background: white;
    color: #718096; transition: all .14s; font-family: 'Sora', sans-serif;
    display: flex; align-items: center; gap: 5px;
  }

  .form-input, .form-select, .form-textarea {
    width: 100%; border: 1.5px solid ${T.border}; border-radius: 10px;
    padding: 9px 13px; font-size: 13.5px; color: ${T.slate};
    background: #FAFCFC; font-family: 'Sora', sans-serif;
    outline: none; transition: border .15s;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: ${T.teal}; background: white; }
  .form-textarea { resize: vertical; min-height: 78px; }
  .form-label { font-size: 11px; font-weight: 700; color: ${T.muted}; letter-spacing: .7px; text-transform: uppercase; display: block; margin-bottom: 5px; }

  .modal-overlay {
    position: fixed; inset: 0; background: rgba(30,42,56,.5);
    backdrop-filter: blur(6px); z-index: 200;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn .18s ease;
  }
  .modal {
    background: white; border-radius: 20px; padding: 32px;
    width: 520px; max-width: 100%; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 24px 80px rgba(30,42,56,.22);
    animation: slideUp .22s ease;
  }

  .stat-card {
    padding: 22px 24px; border-radius: 14px; background: white;
    border: 1px solid ${T.border};
  }

  .chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 700;
  }

  @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

  .page-enter { animation: slideUp .25s ease; }

  .issue-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; border-bottom: 1px solid #F2F7F6; }
  .issue-row:last-child { border-bottom: none; }

  .spinner {
    width: 36px; height: 36px; border: 3px solid ${T.border};
    border-top-color: ${T.teal}; border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
