const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const PARSER_PROFILE = "GPT-5.5 optimized parser";
const SECTION_WEIGHT = {
  title: 2.15,
  abstract: 2.35,
  claims: 2.6,
  claim: 2.6,
  summary: 2.05,
  background: 1.05,
  description: 1.45,
  examples: 1.3,
  drawing: 0.75,
  other: 1,
};

const el = {
  text: $("#patentText"),
  file: $("#fileInput"),
  choose: $("#chooseFileButton"),
  drop: $("#dropZone"),
  analyze: $("#analyzeButton"),
  sample: $("#sampleButton"),
  pdf: $("#downloadPdfButton"),
  clear: $("#clearButton"),
  status: $("#documentStatus"),
  parser: $("#parserProfile"),
  kw: $("#keywordList"),
  cl: $("#clusterList"),
  kwc: $("#keywordCount"),
  clc: $("#clusterCount"),
  wc: $("#wordCount"),
  signals: $("#signalGrid"),
  insight: $("#insightBox"),
  en: $("#englishModeButton"),
  ja: $("#japaneseModeButton"),
  eyebrow: $(".eyebrow"),
  title: $("h1"),
  uploadTitle: $("#uploadTitle"),
  uploadHelp: $("#uploadHelp"),
  textLabel: $("#textLabel"),
  kt: $("#keywordsTab"),
  ct: $("#clustersTab"),
  st: $("#summaryTab"),
  kh: $("#keywordsHeading"),
  ch: $("#clustersHeading"),
  sh: $("#signalsHeading"),
};

let lang = "en";
let statusKey = "empty";
let statusText = "";
let last = null;

const I = {
  en: {
    pageTitle: "Patent Keyword Extractor",
    eyebrow: "Patent analysis",
    title: "Keyword Extractor",
    parser: PARSER_PROFILE,
    uploadTitle: "Upload patent text",
    uploadHelp: "Drop a text file here or choose one from your device.",
    choose: "Choose file",
    textLabel: "Patent text",
    ph: "Paste the abstract, claims, or full patent description here...",
    analyze: "Extract keywords",
    sample: "Load sample",
    pdf: "Download PDF",
    clear: "Clear text",
    tabs: ["Keywords", "Clusters", "Signals"],
    heads: ["Technical Keywords", "CPC/IPC-like Clusters", "Document Signals"],
    empty: "No document loaded",
    draft: "Draft text",
    ready: "Analysis ready",
    sampleStatus: "Sample loaded",
    kwc: (n) => `${n} found`,
    clc: (n) => `${n} matches`,
    wc: (n) => `${n} words`,
    emptyKw: "Add patent text to extract ranked technical terms.",
    emptyCl: "Clusters appear after analysis.",
    emptyIn: "Analysis notes will appear here.",
    noKw: "No strong technical keywords were found. Try adding more patent text.",
    noCl: "No CPC/IPC-like clusters matched yet.",
    occ: (n) => `${n} occurrence${n === 1 ? "" : "s"}`,
    term: "term",
    phrase: "phrase",
    fit: (n) => `${n}% fit`,
    conf: { high: "high confidence", medium: "medium confidence", low: "low confidence" },
    sig: ["Sections", "Unique terms", "Claims cues", "Technical density"],
    none: "none",
    noCluster: "no clear cluster",
    alert: "Add patent text before downloading a PDF.",
    report: "Patent Keyword Report",
    sub: `Generated with the ${PARSER_PROFILE}`,
    ins: (k, c) => `Strongest signal: ${k}. Closest classification-style area: ${c}. Ranking uses section-aware, claim-aware parsing and technical phrase scoring.`,
  },
  ja: {
    pageTitle: "特許キーワード抽出ツール",
    eyebrow: "特許分析",
    title: "キーワード抽出",
    parser: "GPT-5.5 最適化パーサー",
    uploadTitle: "特許テキストをアップロード",
    uploadHelp: "テキストファイルをここにドロップ、または端末から選択してください。",
    choose: "ファイル選択",
    textLabel: "特許テキスト",
    ph: "要約、請求項、明細書本文をここに貼り付けてください...",
    analyze: "キーワード抽出",
    sample: "サンプル読込",
    pdf: "PDF出力",
    clear: "テキストを消去",
    tabs: ["キーワード", "分類候補", "シグナル"],
    heads: ["技術キーワード", "CPC/IPC風クラスター", "文書シグナル"],
    empty: "文書未読込",
    draft: "入力中",
    ready: "分析完了",
    sampleStatus: "サンプル読込済み",
    kwc: (n) => `${n}件`,
    clc: (n) => `${n}件`,
    wc: (n) => `${n}語相当`,
    emptyKw: "特許テキストを追加すると、技術用語を順位付けして抽出します。",
    emptyCl: "分析後に分類候補が表示されます。",
    emptyIn: "分析メモがここに表示されます。",
    noKw: "強い技術キーワードが見つかりませんでした。特許テキストを増やしてください。",
    noCl: "一致するCPC/IPC風クラスターはまだありません。",
    occ: (n) => `${n}回出現`,
    term: "単語",
    phrase: "複合語",
    fit: (n) => `適合度 ${n}%`,
    conf: { high: "信頼度 高", medium: "信頼度 中", low: "信頼度 低" },
    sig: ["セクション", "固有語", "請求項表現", "技術密度"],
    none: "なし",
    noCluster: "明確な分類なし",
    alert: "PDFを出力する前に特許テキストを入力してください。",
    report: "特許キーワードレポート",
    sub: "GPT-5.5 最適化パーサーで生成",
    ins: (k, c) => `最も強いシグナル: ${k}。近い分類領域: ${c}。セクション、請求項表現、技術複合語を重み付けして順位付けしています。`,
  },
};

const stop = new Set("about above after again against also although among and another any are based because been being between both but can claim claimed claims adjust adjusts comprise comprises comprising consist consists containing could couple coupled describe described device does each embodiment embodiments exceed exceeds extract extracts fig figure first for from has have having herein include includes including into its may modify modifies more not one onto other present provide provided receive receives said second such than that the their then thereof these this through store stores storing train trained transmit transmits use using when wherein which while with within would".split(" "));
const generic = new Set("apparatus claim claims configured device embodiment embodiments example examples invention method methods module plurality present provided system systems unit units portion portions step steps".split(" "));
const technicalSuffix = /(ability|ation|ator|graphy|icity|ization|meter|metry|module|oxide|polymer|processor|sensor|therapy|transistor|vector|ware)$/;
const technicalShape = /\b([a-z]+-[a-z0-9-]+|[a-z]+\d+|\d+[a-z]+)\b/i;
const claimCue = /\b(claim|claims|wherein|comprising|configured to|adapted to|consisting of|characterized by)\b/i;

const jpStop = "する される した して および または ある いる こと もの ため これ それ 当該 本発明 実施形態 第 前記 上記 以下 以上 複数 少なくとも".split(" ");
const jpGeneric = "本発明 実施形態 請求項 装置 方法 システム 構成 複数 一例 発明".split(" ");
const jpHints = "制御装置 制御部 処理装置 プロセッサ メモリ 記憶部 学習モデル 機械学習 ニューラルネットワーク 推論 分類 特徴量 データセット 通信 無線 ネットワーク パケット 信号 送信 受信 アンテナ センサ 測定 検出 閾値 電圧 電流 温度 電池 バッテリ 車両 自律走行 経路 半導体 基板 電極 回路 トランジスタ 膜 化合物 ポリマー タンパク質 細胞 抗体 医療 患者 診断 治療 流体 圧力 熱交換器 冷却 フィルタ 膜分離".split(" ");

const clusters = [
  ["G06F / G06N", "Computing, data processing, machine learning", "計算機、データ処理、機械学習", "processor memory model neural training inference algorithm dataset classification feature vector software computer".split(" "), "プロセッサ メモリ モデル ニューラル 学習 推論 アルゴリズム データセット 分類 特徴量 ベクトル ソフトウェア 計算機 記憶部".split(" ")],
  ["H04W / H04L", "Wireless and digital communications", "無線・デジタル通信", "network wireless packet signal antenna channel transmission receiver routing encryption protocol".split(" "), "通信 無線 ネットワーク パケット 信号 送信 受信 アンテナ チャネル 暗号 プロトコル".split(" ")],
  ["H01L", "Semiconductor devices and circuits", "半導体デバイス・回路", "semiconductor substrate electrode transistor dielectric layer gate circuit wafer lithography".split(" "), "半導体 基板 電極 トランジスタ 絶縁膜 層 ゲート 回路 ウェハ リソグラフィ".split(" ")],
  ["A61B / A61K", "Medical, diagnostic, and therapeutic technology", "医療・診断・治療技術", "patient tissue diagnosis therapeutic drug composition protein antibody cell imaging catheter".split(" "), "患者 組織 診断 治療 薬剤 組成物 タンパク質 抗体 細胞 画像 カテーテル".split(" ")],
  ["B60L / B60W", "Vehicle control and electric mobility", "車両制御・電動モビリティ", "vehicle battery charging motor braking autonomous route torque coolant thermal".split(" "), "車両 電池 バッテリ 充電 モータ 制動 自律走行 経路 トルク 冷却 熱".split(" ")],
  ["C07 / C08", "Chemical compounds and polymers", "化合物・高分子", "polymer catalyst monomer compound solvent resin reaction molecule synthesis coating".split(" "), "ポリマー 触媒 モノマー 化合物 溶媒 樹脂 反応 分子 合成 コーティング".split(" ")],
  ["F16 / F24", "Mechanical, thermal, and fluid systems", "機械・熱・流体システム", "valve pump pressure fluid heat exchanger coolant compressor actuator flow".split(" "), "弁 ポンプ 圧力 流体 熱交換器 冷却 圧縮機 アクチュエータ 流量".split(" ")],
];

const samples = {
  en: `A system for predictive thermal management of battery modules in an electric vehicle includes temperature sensors coupled to battery cells, memory storing a trained machine learning model, and a processor configured to receive sensor measurements. The processor extracts voltage, current, state-of-charge, and ambient temperature features and predicts a thermal runaway risk score. When the risk score exceeds a threshold, the system adjusts coolant flow through a heat exchanger, modifies charging current, and transmits a warning packet to a vehicle control network.`,
  ja: `電動車両の電池モジュールを予測的に熱管理する制御装置は、電池セルに結合された複数の温度センサと、学習済みの機械学習モデルを記憶するメモリと、センサ測定値を受信するプロセッサとを備える。プロセッサは、電圧、電流、充電状態、および外気温度の特徴量を抽出し、各セル群について熱暴走リスクスコアを推定する。リスクスコアが閾値を超えた場合、熱交換器を通る冷却流量を調整し、車両制御ネットワークへ警告パケットを送信する。`,
};

function tr() {
  return I[lang];
}

function hasJa(s) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(s);
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
}

function fmt(t) {
  return hasJa(t) ? t : t.replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizeText(text) {
  return text
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detectSection(line) {
  const clean = line.trim().replace(/^\d+[.)]\s*/, "").replace(/[:：]\s*$/, "").toLowerCase();
  if (/^(title|発明の名称)$/.test(clean)) return "title";
  if (/^(abstract|要約)$/.test(clean)) return "abstract";
  if (/^(claim|claims|what is claimed is|特許請求の範囲|請求項)$/.test(clean)) return "claims";
  if (/^(summary|summary of the invention|発明の概要)$/.test(clean)) return "summary";
  if (/^(background|background of the invention|背景技術)$/.test(clean)) return "background";
  if (/^(description|detailed description|詳細な説明|発明を実施するための形態)$/.test(clean)) return "description";
  if (/^(examples|example|実施例)$/.test(clean)) return "examples";
  if (/^(brief description of drawings|drawings|図面の簡単な説明)$/.test(clean)) return "drawing";
  return null;
}

function splitSections(text) {
  const sections = [];
  let current = { type: "other", text: "" };
  for (const line of normalizeText(text).split(/\n+/)) {
    const detected = detectSection(line);
    if (detected) {
      if (current.text.trim()) sections.push(current);
      current = { type: detected, text: "" };
    } else {
      current.text += `${line}\n`;
    }
  }
  if (current.text.trim()) sections.push(current);
  if (!sections.length) sections.push({ type: "other", text: normalizeText(text) });
  return sections.map((section) => ({
    ...section,
    text: section.text.trim(),
    weight: SECTION_WEIGHT[section.type] || SECTION_WEIGHT.other,
  }));
}

function sentences(text) {
  return normalizeText(text).split(/(?<=[.!?。！？])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
}

function lemma(token) {
  return token
    .toLowerCase()
    .replace(/'s$/, "")
    .replace(/(ies)$/, "y")
    .replace(/(sses)$/, "ss")
    .replace(/(?<!s)s$/, "");
}

function tokenizeEn(text) {
  return [...normalizeText(text).toLowerCase().matchAll(/[a-z][a-z0-9-]*(?:'[a-z]+)?/g)].map((m) => lemma(m[0]));
}

function isUsefulToken(token) {
  return token.length > 2 && !stop.has(token) && !generic.has(token) && !/^\d+$/.test(token);
}

function addCandidate(map, rawTerm, section, sentence, amount, type = "term") {
  const term = normalizeText(rawTerm).toLowerCase().replace(/^[-\s]+|[-\s]+$/g, "");
  if (!term || term.length < 3) return;
  if (!hasJa(term) && term.split(/\s+/).some((token) => !isUsefulToken(token))) return;
  if (generic.has(term) || jpGeneric.includes(term)) return;
  const item = map.get(term) || { term, count: 0, weighted: 0, sections: new Set(), evidence: "", type };
  item.count += 1;
  item.weighted += amount * section.weight;
  item.sections.add(section.type);
  item.type = item.type === "phrase" || type === "phrase" ? "phrase" : "term";
  if (!item.evidence || sentence.length < item.evidence.length) item.evidence = sentence;
  map.set(term, item);
}

function phraseWindows(tokens) {
  const out = [];
  for (let size = Math.min(4, tokens.length); size >= 2; size -= 1) {
    for (let i = 0; i <= tokens.length - size; i += 1) {
      const slice = tokens.slice(i, i + size);
      if (slice.every(isUsefulToken) && slice.some((t) => technicalSuffix.test(t) || clusters.some((c) => c[3].includes(t)))) {
        out.push(slice.join(" "));
      }
    }
  }
  return out;
}

function addEnglishCandidates(map, sections) {
  for (const section of sections) {
    for (const sentence of sentences(section.text)) {
      const tokens = tokenizeEn(sentence);
      for (const token of tokens) {
        if (isUsefulToken(token)) addCandidate(map, token, section, sentence, 1.8, "term");
      }
      for (const segment of sentence.split(/[,;:()\[\]]|\band\b|\bor\b|\bcoupled\s+to\b/gi)) {
        for (const phrase of phraseWindows(tokenizeEn(segment))) {
          addCandidate(map, phrase, section, sentence, 2.8 + phrase.split(" ").length * 0.45, "phrase");
        }
      }
      for (const m of sentence.matchAll(/\b(?:[a-z]+-){1,3}[a-z0-9]+\b/gi)) {
        addCandidate(map, m[0], section, sentence, 3.3, "phrase");
      }
    }
  }
}

function addJapaneseCandidates(map, sections) {
  for (const section of sections) {
    for (const sentence of sentences(section.text)) {
      for (const hint of jpHints) {
        if (sentence.includes(hint)) addCandidate(map, hint, section, sentence, 3.5, hint.length > 3 ? "phrase" : "term");
      }
      for (const m of sentence.matchAll(/[\p{Script=Han}\p{Script=Katakana}ー]{2,12}/gu)) {
        const term = m[0];
        if (!jpStop.includes(term) && !jpGeneric.includes(term)) {
          addCandidate(map, term, section, sentence, Math.min(4, 1.5 + term.length / 3), term.length > 3 ? "phrase" : "term");
        }
      }
    }
  }
}

function boost(term, text, item = {}) {
  let b = 0;
  for (const c of clusters) {
    for (const w of [...c[3], ...c[4]]) {
      if (term.includes(w.toLowerCase())) b += 2.4;
    }
  }
  if (technicalSuffix.test(term) || technicalShape.test(term)) b += 1.6;
  if (/(control|sensor|model|processor|composition|interface|network|thermal|voltage|current|coolant)/.test(term)) b += 1.35;
  if (/(制御|センサ|モデル|組成物|インターフェース|ネットワーク|熱|電圧|電流|冷却)/.test(term)) b += 1.35;
  if (item.sections?.has("claims")) b += 2.2;
  if (item.sections?.has("abstract")) b += 1.7;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx >= 0 && /abstract|summary|claim|claims|要約|請求項|発明の概要/.test(text.toLowerCase().slice(Math.max(0, idx - 220), idx + 220))) b += 1.5;
  if (claimCue.test(item.evidence || "")) b += 1.25;
  return b;
}

function scoreCandidate(item, text) {
  const words = hasJa(item.term) ? Math.max(1, Math.ceil(item.term.length / 3)) : item.term.split(/\s+/).length;
  const phraseBonus = item.type === "phrase" ? 1.45 : 1;
  const specificity = Math.min(2.4, 0.72 + words * 0.34 + Math.log(item.term.length + 1) / 5);
  const sectionDiversity = 1 + Math.min(0.55, item.sections.size * 0.14);
  return item.weighted * phraseBonus * specificity * sectionDiversity + boost(item.term, text, item);
}

function compactKeywords(items) {
  const kept = [];
  for (const item of items) {
    const duplicate = kept.some((prior) => {
      const a = prior.term;
      const b = item.term;
      return (a.includes(b) || b.includes(a)) && Math.abs(prior.score - item.score) < 2.5;
    });
    if (!duplicate) kept.push(item);
    if (kept.length === 18) break;
  }
  return kept;
}

function extract(text) {
  const normalized = normalizeText(text);
  const sections = splitSections(normalized);
  const map = new Map();
  addEnglishCandidates(map, sections);
  if (hasJa(normalized)) addJapaneseCandidates(map, sections);
  const scored = [...map.values()]
    .map((item) => ({
      term: item.term,
      count: item.count,
      score: Math.round(scoreCandidate(item, normalized) * 10) / 10,
      evidence: item.evidence,
      type: item.type,
    }))
    .filter((item) => item.score >= 3.2)
    .sort((a, b) => b.score - a.score || b.count - a.count || b.term.length - a.term.length);
  return compactKeywords(scored);
}

function scoreClusters(text, kws) {
  const lowered = normalizeText(text).toLowerCase();
  return clusters
    .map(([code, title, jaTitle, terms, jaTerms]) => {
      let score = 0;
      const matched = new Set();
      for (const t of [...terms, ...jaTerms]) {
        const target = t.toLowerCase();
        if (lowered.includes(target)) {
          score += 8;
          matched.add(t);
        }
      }
      for (const k of kws) {
        for (const t of [...terms, ...jaTerms]) {
          if (k.term.includes(t.toLowerCase()) || t.toLowerCase().includes(k.term)) {
            score += Math.min(16, k.score / 2.2);
            matched.add(t);
          }
        }
      }
      const pct = Math.min(99, Math.round(score));
      const confidence = pct > 65 ? "high" : pct > 34 ? "medium" : "low";
      return { code, title, jaTitle, score: pct, confidence, matched: [...matched].slice(0, 7) };
    })
    .filter((x) => x.score > 9)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function signals(text, kws) {
  const normalized = normalizeText(text);
  const sections = splitSections(normalized);
  const words = hasJa(normalized) ? Math.max(1, Math.round(normalized.length / 2.2)) : tokenizeEn(normalized).length;
  const uniqueTerms = new Set(kws.map((k) => k.term)).size;
  const claimsCues = (normalized.match(/claim|wherein|comprising|configured to|請求項|備える|構成され/gi) || []).length;
  const density = Math.min(100, Math.round((kws.reduce((a, k) => a + k.count, 0) / Math.max(1, words)) * 1000));
  return { sections: sections.length, uniqueTerms, claimsCues, density, words, topKeyword: kws[0]?.term || tr().none };
}

function setStatus(key, text = "") {
  statusKey = key;
  statusText = text;
  const L = tr();
  const value = key === "file" ? text : L[key] || text || L.empty;
  el.status.textContent = value;
}

function analyze() {
  const text = el.text.value.trim();
  if (!text) return renderEmpty();
  const keywords = extract(text);
  const cls = scoreClusters(text, keywords);
  const sig = signals(text, keywords);
  last = { text, keywords, clusters: cls, signals: sig, language: lang };
  renderKeywords(keywords);
  renderClusters(cls);
  renderSignals(sig, cls);
  setStatus("ready");
}

function renderKeywords(kws) {
  el.kwc.textContent = tr().kwc(kws.length);
  if (!kws.length) {
    el.kw.className = "keyword-list empty-state";
    el.kw.textContent = tr().noKw;
    return;
  }
  const max = Math.max(...kws.map((x) => x.score));
  el.kw.className = "keyword-list";
  el.kw.innerHTML = kws.map((x, i) => `<article class="keyword-item"><span class="rank">${i + 1}</span><div><div class="keyword-name">${esc(fmt(x.term))}</div><div class="keyword-meta">${x.type === "phrase" ? tr().phrase : tr().term} · ${tr().occ(x.count)}</div>${x.evidence ? `<div class="keyword-evidence">${esc(x.evidence)}</div>` : ""}</div><div class="score-bar"><span style="width:${Math.max(12, Math.round((x.score / max) * 100))}%"></span></div></article>`).join("");
}

function renderClusters(cls) {
  el.clc.textContent = tr().clc(cls.length);
  if (!cls.length) {
    el.cl.className = "cluster-list empty-state";
    el.cl.textContent = tr().noCl;
    return;
  }
  const lab = (c) => (lang === "ja" ? c.jaTitle : c.title);
  el.cl.className = "cluster-list";
  el.cl.innerHTML = cls.map((c) => `<article class="cluster-item"><div class="cluster-top"><strong class="cluster-code">${esc(c.code)}</strong><span class="cluster-score">${tr().fit(c.score)} · ${tr().conf[c.confidence]}</span></div><p class="cluster-title">${esc(lab(c))}</p><div class="chip-row">${c.matched.map((m) => `<span class="chip">${esc(fmt(m))}</span>`).join("")}</div></article>`).join("");
}

function renderSignals(sig, cls) {
  el.wc.textContent = tr().wc(sig.words);
  el.signals.innerHTML = [sig.sections, sig.uniqueTerms, sig.claimsCues, `${sig.density}%`].map((v, i) => `<div><dt>${tr().sig[i]}</dt><dd>${v}</dd></div>`).join("");
  const c = cls[0] ? (lang === "ja" ? cls[0].jaTitle : cls[0].title) : tr().noCluster;
  el.insight.textContent = tr().ins(fmt(sig.topKeyword), c);
}

function renderEmpty() {
  last = null;
  setStatus("empty");
  el.kwc.textContent = tr().kwc(0);
  el.clc.textContent = tr().clc(0);
  el.wc.textContent = tr().wc(0);
  el.kw.className = "keyword-list empty-state";
  el.kw.textContent = tr().emptyKw;
  el.cl.className = "cluster-list empty-state";
  el.cl.textContent = tr().emptyCl;
  el.signals.innerHTML = `<div><dt>${tr().sig[0]}</dt><dd>0</dd></div><div><dt>${tr().sig[1]}</dt><dd>0</dd></div><div><dt>${tr().sig[2]}</dt><dd>0</dd></div><div><dt>${tr().sig[3]}</dt><dd>0%</dd></div>`;
  el.insight.textContent = tr().emptyIn;
}

function setLang(l) {
  lang = l;
  document.documentElement.lang = l;
  document.title = tr().pageTitle;
  el.en.classList.toggle("active", l === "en");
  el.ja.classList.toggle("active", l === "ja");
  el.eyebrow.textContent = tr().eyebrow;
  el.title.textContent = tr().title;
  el.parser.textContent = tr().parser;
  el.uploadTitle.textContent = tr().uploadTitle;
  el.uploadHelp.textContent = tr().uploadHelp;
  el.choose.textContent = tr().choose;
  el.textLabel.textContent = tr().textLabel;
  el.text.placeholder = tr().ph;
  el.analyze.textContent = tr().analyze;
  el.sample.textContent = tr().sample;
  el.pdf.textContent = tr().pdf;
  el.clear.title = tr().clear;
  el.clear.setAttribute("aria-label", tr().clear);
  [el.kt.textContent, el.ct.textContent, el.st.textContent] = tr().tabs;
  [el.kh.textContent, el.ch.textContent, el.sh.textContent] = tr().heads;
  if (statusKey === "file") setStatus("file", statusText);
  el.text.value.trim() ? analyze() : renderEmpty();
}

function reportLines(a) {
  const L = I[a.language];
  const lab = (c) => (a.language === "ja" ? c.jaTitle : c.title);
  const lines = [
    { text: L.report, size: 34, w: 800, c: "#18201d", g: 8 },
    { text: L.sub, size: 15, c: "#66736f", g: 18 },
    { text: `${L.wc(a.signals.words)} · ${L.kwc(a.keywords.length)} · ${L.clc(a.clusters.length)}`, size: 14, c: "#176b61", g: 24 },
    { text: L.heads[0], size: 20, w: 800, c: "#18201d", g: 10 },
  ];
  (a.keywords.length ? a.keywords : []).forEach((k, i) => lines.push({ text: `${i + 1}. ${fmt(k.term)}  ${L.occ(k.count)}`, size: 13, c: "#24312d", g: 6 }));
  if (!a.keywords.length) lines.push({ text: L.noKw, size: 13, c: "#66736f", g: 8 });
  lines.push({ text: L.heads[1], size: 20, w: 800, c: "#18201d", g: 12, b: 18 });
  a.clusters.forEach((c) => {
    lines.push({ text: `${c.code}  ${lab(c)}  ${L.fit(c.score)} · ${L.conf[c.confidence]}`, size: 14, w: 800, c: "#3b668f", g: 6 });
    lines.push({ text: c.matched.join(", "), size: 12, c: "#66736f", g: 10 });
  });
  if (!a.clusters.length) lines.push({ text: L.noCl, size: 13, c: "#66736f", g: 8 });
  lines.push({ text: L.heads[2], size: 20, w: 800, c: "#18201d", g: 12, b: 18 });
  for (const [i, v] of [a.signals.sections, a.signals.uniqueTerms, a.signals.claimsCues, `${a.signals.density}%`].entries()) {
    lines.push({ text: `${L.sig[i]}: ${v}`, size: 13, c: "#24312d", g: i === 3 ? 14 : 5 });
  }
  lines.push({ text: L.ins(fmt(a.signals.topKeyword), a.clusters[0] ? lab(a.clusters[0]) : L.noCluster), size: 13, c: "#176b61", g: 18 });
  return lines;
}

function wrap(ctx, s, max) {
  const toks = hasJa(s) ? [...s] : String(s).split(/\s+/);
  let line = "";
  const out = [];
  for (const t of toks) {
    const sep = hasJa(s) ? "" : " ";
    const test = line ? line + sep + t : t;
    if (ctx.measureText(test).width > max && line) {
      out.push(line);
      line = t;
    } else line = test;
  }
  if (line) out.push(line);
  return out;
}

function pages(lines) {
  const W = 1240;
  const H = 1754;
  const M = 92;
  const make = () => {
    const c = document.createElement("canvas");
    const x = c.getContext("2d");
    c.width = W;
    c.height = H;
    x.fillStyle = "#fbfcfa";
    x.fillRect(0, 0, W, H);
    x.fillStyle = "#176b61";
    x.fillRect(0, 0, 14, H);
    x.textBaseline = "top";
    return c;
  };
  let c = make();
  let x = c.getContext("2d");
  let y = M;
  const out = [];
  for (const l of lines) {
    y += l.b || 0;
    x.font = `${l.w || 500} ${l.size * 2}px Inter, "Yu Gothic", Meiryo, Arial, sans-serif`;
    const ws = wrap(x, l.text, W - M * 2);
    const bh = ws.length * l.size * 2 * 1.38 + l.g * 2;
    if (y + bh > H - M) {
      out.push(c);
      c = make();
      x = c.getContext("2d");
      y = M;
      x.font = `${l.w || 500} ${l.size * 2}px Inter, "Yu Gothic", Meiryo, Arial, sans-serif`;
    }
    x.fillStyle = l.c;
    for (const w of ws) {
      x.fillText(w, M, y);
      y += l.size * 2 * 1.38;
    }
    y += l.g * 2;
  }
  out.push(c);
  return out.map((p) => ({ w: p.width, h: p.height, b: dataBytes(p.toDataURL("image/jpeg", 0.92)) }));
}

function dataBytes(url) {
  const bin = atob(url.split(",")[1]);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) u[i] = bin.charCodeAt(i);
  return u;
}

function imagePdf(imgs) {
  const enc = new TextEncoder();
  const ch = [];
  const off = [];
  let pos = 0;
  const pw = 595.28;
  const ph = 841.89;
  const wr = (s) => {
    const b = typeof s === "string" ? enc.encode(s) : s;
    ch.push(b);
    pos += b.length;
  };
  const obj = (id, parts) => {
    off[id] = pos;
    wr(`${id} 0 obj\n`);
    parts.forEach(wr);
    wr("\nendobj\n");
  };
  wr("%PDF-1.4\n%ÿÿÿÿ\n");
  obj(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  obj(2, [`<< /Type /Pages /Count ${imgs.length} /Kids [${imgs.map((_, i) => `${3 + i * 3} 0 R`).join(" ")}] >>`]);
  imgs.forEach((im, i) => {
    const p = 3 + i * 3;
    const img = p + 1;
    const ct = p + 2;
    const n = `Im${i + 1}`;
    const stream = `q\n${pw} 0 0 ${ph} 0 0 cm\n/${n} Do\nQ`;
    obj(p, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /${n} ${img} 0 R >> >> /Contents ${ct} 0 R >>`]);
    obj(img, [`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.b.length} >>\nstream\n`, im.b, "\nendstream"]);
    obj(ct, [`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`]);
  });
  const xref = pos;
  const cnt = 2 + imgs.length * 3;
  wr(`xref\n0 ${cnt + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= cnt; i += 1) wr(`${String(off[i]).padStart(10, "0")} 00000 n \n`);
  wr(`trailer\n<< /Size ${cnt + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const out = new Uint8Array(pos);
  let cur = 0;
  for (const c of ch) {
    out.set(c, cur);
    cur += c.length;
  }
  return out;
}

function downloadPdf() {
  if (!el.text.value.trim()) return alert(tr().alert);
  if (!last || last.text !== el.text.value.trim() || last.language !== lang) analyze();
  const blob = new Blob([imagePdf(pages(reportLines(last)))], { type: "application/pdf" });
  const a = document.createElement("a");
  const d = new Date().toISOString().slice(0, 10);
  const u = URL.createObjectURL(blob);
  a.href = u;
  a.download = lang === "ja" ? `特許キーワードレポート-${d}.pdf` : `patent-keyword-report-${d}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

$$('.tab').forEach((tab) => tab.addEventListener('click', () => {
  $$('.tab').forEach((x) => x.classList.remove('active'));
  $$('.tab-panel').forEach((x) => x.classList.remove('active'));
  tab.classList.add('active');
  $(`#${tab.dataset.tab}Panel`).classList.add('active');
}));

$$('.language-button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.language)));
el.choose.onclick = () => el.file.click();
el.file.onchange = () => {
  const f = el.file.files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    el.text.value = String(r.result || "");
    setStatus("file", f.name);
    analyze();
  };
  r.readAsText(f);
};
el.drop.ondragover = (e) => {
  e.preventDefault();
  el.drop.classList.add('dragging');
};
el.drop.ondragleave = () => el.drop.classList.remove('dragging');
el.drop.ondrop = (e) => {
  e.preventDefault();
  el.drop.classList.remove('dragging');
  const f = e.dataTransfer.files?.[0];
  if (f) {
    const r = new FileReader();
    r.onload = () => {
      el.text.value = String(r.result || "");
      setStatus("file", f.name);
      analyze();
    };
    r.readAsText(f);
  }
};
el.analyze.onclick = analyze;
el.pdf.onclick = downloadPdf;
el.text.oninput = () => setStatus(el.text.value.trim() ? "draft" : "empty");
el.sample.onclick = () => {
  el.text.value = samples[lang];
  setStatus("sample");
  analyze();
};
el.clear.onclick = () => {
  el.text.value = "";
  renderEmpty();
  el.text.focus();
};
setLang("en");
