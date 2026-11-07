/* ==========================================================
   STUDY VERSE — GLOBAL LEARNING ECOSYSTEM
   Core application engine | Founder: Adnan Manzoor
   File: core.js
   ========================================================== */
"use strict";

/*
  IMPORTANT:
  - This file uses the existing Supabase project configuration.
  - The Supabase publishable/anon key is intended for browser use.
  - Database access must still be protected by correct RLS policies.
  - AI requests are deliberately not sent directly to an AI provider
    from the browser. Configure a secure server/Edge Function endpoint
    in STUDY_VERSE_CONFIG.aiEndpoint before enabling live AI responses.
*/

const STUDY_VERSE_CONFIG = Object.freeze({
  name: "Study Verse",
  version: "3.0.0",
  founder: "Adnan Manzoor",
  supabaseUrl: "https://fwxraksvzrofgjbqvplm.supabase.co",
  supabaseKey: "sb_publishable_Fc7hos5g-BoT0cVWBnVWSQ_IC8OdPAh",
  aiEndpoint: "", // Add a secured Supabase Edge Function URL when deployed.
  tables: {
    profiles: "profiles",
    resources: "study_resources",
    founder: "founder_profile",
    posts: "posts"
  },
  storageBuckets: ["PYQs", "Guess Papers", "Study Materials", "jkbose-notes"],
  resourceBucket: "Study Materials",
  maxUploadBytes: 20 * 1024 * 1024
});

(() => {
  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = {
    db: null, user: null, profile: null, currentView: "homeView",
    theme: "dark", curriculum: "JKBOSE", level: "Class 10",
    country: "India", language: "English", resources: [],
    practice: [], questionIndex: 0, score: 0, answered: false,
    practiceHistory: [], notes: [], goals: [], saved: [],
    timer: null, secondsLeft: 25 * 60, timerRunning: false,
    aiMode: "study", searchItems: [], adminProfiles: []
  };

  const sampleQuestions = [
    {subject:"Science",level:"Class 10",difficulty:"Easy",q:"Which process do green plants use to prepare food?",options:["Respiration","Photosynthesis","Transpiration","Fermentation"],answer:1,explain:"Photosynthesis uses light energy to convert carbon dioxide and water into glucose."},
    {subject:"Mathematics",level:"Class 10",difficulty:"Easy",q:"What is the value of 7 × 8?",options:["54","56","64","48"],answer:1,explain:"7 multiplied by 8 equals 56."},
    {subject:"English",level:"Class 10",difficulty:"Easy",q:"Which word is a synonym of “brief”?",options:["Lengthy","Concise","Unclear","Distant"],answer:1,explain:"Concise means brief while still expressing the important information."},
    {subject:"History",level:"Class 10",difficulty:"Medium",q:"The French Revolution began in which year?",options:["1776","1789","1815","1848"],answer:1,explain:"The French Revolution began in 1789."},
    {subject:"Geography",level:"Class 10",difficulty:"Medium",q:"Which is the largest ocean on Earth?",options:["Atlantic","Indian","Arctic","Pacific"],answer:3,explain:"The Pacific Ocean is the largest ocean on Earth."},
    {subject:"Computer Science",level:"Class 10",difficulty:"Easy",q:"What does CPU stand for?",options:["Central Processing Unit","Computer Personal Utility","Core Program Unit","Central Power Utility"],answer:0,explain:"CPU stands for Central Processing Unit."},
    {subject:"Mathematics",level:"Class 12",difficulty:"Medium",q:"What is the derivative of x² with respect to x?",options:["x","2x","x²","2"],answer:1,explain:"Using the power rule, d(x²)/dx = 2x."},
    {subject:"Biology",level:"Class 12",difficulty:"Medium",q:"Which molecule carries genetic information in most organisms?",options:["ATP","DNA","Glucose","Lipid"],answer:1,explain:"DNA stores hereditary information in most organisms."}
  ];

  const curriculumCatalog = {
    JKBOSE: ["Class 9","Class 10","Class 11","Class 12"],
    CBSE: ["Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"],
    CISCE: ["Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"],
    "Cambridge International": ["Lower Secondary","IGCSE","AS Level","A Level"],
    "International Baccalaureate": ["MYP","DP"],
    "Other curriculum": ["Beginner","Intermediate","Advanced"]
  };

  function db() {
    if (state.db) return state.db;
    if (!window.supabase?.createClient) throw new Error("Supabase library did not load. Check the internet connection and index.html script.");
    state.db = window.supabase.createClient(STUDY_VERSE_CONFIG.supabaseUrl, STUDY_VERSE_CONFIG.supabaseKey);
    return state.db;
  }
  function text(id, value) { const el = $(id); if (el) el.textContent = value ?? ""; }
  function value(id) { return $(id)?.value?.trim() || ""; }
  function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function toast(message, type = "info") {
    const region = $("toastRegion");
    if (!region) { console.log("[Study Verse]", message); return; }
    region.textContent = message;
    region.className = `toast-region toast-${type}`;
    region.setAttribute("role","status");
    region.classList.remove("hidden");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => region.classList.add("hidden"), 3800);
  }
  function setBusy(button, busy, label = "Please wait…") {
    if (!button) return;
    if (busy) {
      button.dataset.oldLabel = button.textContent;
      button.disabled = true;
      button.textContent = label;
    } else {
      button.disabled = false;
      if (button.dataset.oldLabel) button.textContent = button.dataset.oldLabel;
      delete button.dataset.oldLabel;
    }
  }
  function showLoading(show, message = "Loading Study Verse…") {
    $("globalLoading")?.classList.toggle("hidden", !show);
    text("globalLoadingText", message);
  }
  function isAdmin() {
    return !!state.user && state.profile?.role === "ADMIN" && state.profile?.status === "APPROVED";
  }
  function requireLogin() {
    if (state.user && state.profile) return true;
    toast("Please sign in to use this feature.");
    navigateTo("profileView");
    showAuthMode("login");
    return false;
  }
  function dispatch(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(`studyverse:${name}`, {detail}));
  }
  function dateLabel() {
    text("todayDate", new Intl.DateTimeFormat(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date()));
  }

  // Navigation and layout
  function navigateTo(viewId) {
    const target = $(viewId);
    if (!target) { toast("This section is not available."); return; }
    $$(".app-view").forEach(view => view.classList.toggle("active", view.id === viewId));
    $$(".nav-item, .tab-item, [data-view]").forEach(item => {
      if (item.dataset.view) item.classList.toggle("active", item.dataset.view === viewId);
    });
    state.currentView = viewId;
    const titles = {
      homeView:"Your learning, reimagined", exploreView:"Explore learning",
      learnView:"Learning space", libraryView:"Learning library", testsView:"Practice & tests",
      aiView:"AI study companion", workspaceView:"My workspace", opportunitiesView:"Opportunities",
      communityView:"Learning community", profileView:"Your account", settingsView:"Settings",
      adminView:"Administration", aboutView:"About Study Verse"
    };
    text("topbarTitle", titles[viewId] || "Study Verse");
    $("mobileMenuBackdrop")?.classList.add("hidden");
    if (viewId === "libraryView") loadLibraryResources();
    if (viewId === "adminView") refreshAdminDashboard();
    if (viewId === "aboutView") loadFounderProfile();
    if (viewId === "homeView") dateLabel();
    dispatch("navigate", {viewId});
    window.scrollTo?.({top:0,behavior:"smooth"});
  }
  function toggleMobileMenu() {
    $("mobileMenuBackdrop")?.classList.toggle("hidden");
    $("desktopSidebar")?.classList.toggle("mobile-open");
  }
  function closeMobileMenu() {
    $("mobileMenuBackdrop")?.classList.add("hidden");
    $("desktopSidebar")?.classList.remove("mobile-open");
  }
  function toggleTheme() {
    setTheme(state.theme === "dark" ? "light" : "dark");
  }
  function setTheme(theme) {
    state.theme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.classList.toggle("light", state.theme === "light");
    try { localStorage.setItem("sv-theme", state.theme); } catch {}
    text("themeLabel", state.theme === "dark" ? "Dark mode" : "Light mode");
    text("themeIcon", state.theme === "dark" ? "☾" : "☀");
  }
  function openGlobalSearch() {
    $("globalSearchDialog")?.showModal?.();
    $("globalSearchDialog")?.classList.remove("hidden");
    $("globalSearchInput")?.focus();
  }
  function openNotifications() {
    $("notificationsDialog")?.showModal?.();
    $("notificationsDialog")?.classList.remove("hidden");
  }
  function closeDialog(id) {
    const dialog = $(id);
    if (!dialog) return;
    if (dialog.close) dialog.close(); else dialog.classList.add("hidden");
  }

  // Curriculum selection
  function handleCurriculumChange() {
    const select = $("homeCurriculum");
    const chosen = select?.value || state.curriculum;
    const levels = curriculumCatalog[chosen] || curriculumCatalog["Other curriculum"];
    state.curriculum = chosen;
    state.level = levels[0];
    const levelSelect = $("homeLevel");
    if (levelSelect) {
      levelSelect.innerHTML = levels.map(x => `<option value="${safe(x)}">${safe(x)}</option>`).join("");
    }
  }
  function saveHomeCurriculum() {
    state.curriculum = $("homeCurriculum")?.value || state.curriculum;
    state.level = $("homeLevel")?.value || state.level;
    try { localStorage.setItem("sv-curriculum", JSON.stringify({curriculum:state.curriculum,level:state.level})); } catch {}
    text("curriculumSaveMessage", "Your learning preferences have been saved.");
    text("homeCountry", state.country);
    toast("Learning preferences saved.","success");
  }

  // Explore subjects
  const subjects = [
    ["Mathematics","Numbers, patterns and problem-solving","∑","Class 6–12"],
    ["Science","Discover the world through science","⚛","Class 6–12"],
    ["Physics","Understand matter, energy and motion","◉","Class 9–12"],
    ["Chemistry","Explore elements and reactions","⚗","Class 9–12"],
    ["Biology","Study living systems and life","⌁","Class 9–12"],
    ["English","Build reading, writing and communication","Aa","All levels"],
    ["History","Explore people, events and the past","⌛","All levels"],
    ["Geography","Understand Earth and its environments","◎","All levels"],
    ["Computer Science","Learn computing and digital skills","⌘","All levels"],
    ["Economics","Understand choices and economies","↗","Class 11–12"],
    ["Political Science","Explore governments and society","⚖","Class 11–12"],
    ["Languages","Learn languages and communication","文","All levels"]
  ];
  function renderSubjects(filter = "") {
    const grid = $("exploreGrid");
    if (!grid) return;
    const q = filter.toLowerCase();
    const matches = subjects.filter(s => s.join(" ").toLowerCase().includes(q));
    grid.innerHTML = matches.length ? matches.map(s => `
      <button class="subject-card" type="button" data-subject="${safe(s[0])}">
        <span class="subject-symbol">${safe(s[2])}</span>
        <span class="subject-title">${safe(s[0])}</span>
        <span class="subject-description">${safe(s[1])}</span>
        <span class="subject-level">${safe(s[3])}</span>
      </button>`).join("") : `<p class="empty-state">No subjects match your search.</p>`;
  }
  function searchExplore(query) { renderSubjects(query || ""); }
  function filterExplore(filter) { renderSubjects(filter || ""); }
  function openSubject(subject) {
    text("learningPathTitle", subject);
    text("learningPathDescription", `Explore ${subject} lessons, concepts and learning resources.`);
    navigateTo("learnView");
    loadLibraryResources(subject);
  }

  // Library
  async function loadLibraryResources(subject = "") {
    const container = $("libraryResourcesGrid");
    if (container && !state.resources.length) container.innerHTML = `<p class="empty-state">Loading learning resources…</p>`;
    try {
      const {data,error} = await db().from(STUDY_VERSE_CONFIG.tables.resources)
        .select("*").order("created_at",{ascending:false}).limit(100);
      if (error) throw error;
      state.resources = data || [];
      renderLibrary(subject);
    } catch (error) {
      console.error(error);
      if (container) container.innerHTML = `<p class="empty-state">Resources could not be loaded. Please check your connection or try again later.</p>`;
    }
  }
  function renderLibrary(subject = "") {
    const container = $("libraryResourcesGrid");
    if (!container) return;
    const query = (value("librarySearchInput") + " " + subject).toLowerCase().trim();
    const type = $("libraryTypeFilter")?.value || "";
    const level = $("libraryLevelFilter")?.value || "";
    const rows = state.resources.filter(r => {
      const searchable = [r.title,r.description,r.subject,r.resource_type,r.type,r.class_level,r.level].join(" ").toLowerCase();
      const approved = !r.status || ["APPROVED","PUBLISHED","ACTIVE"].includes(String(r.status).toUpperCase());
      return approved && (!query || searchable.includes(query)) &&
        (!type || (r.resource_type || r.type || "").toLowerCase() === type.toLowerCase()) &&
        (!level || (r.class_level || r.level || "").toLowerCase().includes(level.toLowerCase()));
    });
    text("libraryResultCount", `${rows.length} resources`);
    container.innerHTML = rows.length ? rows.map(r => {
      const title = safe(r.title || "Learning resource");
      const description = safe(r.description || "Open this resource to continue learning.");
      const file = r.file_url || r.url || r.public_url || "";
      return `<article class="resource-card">
        <div class="resource-card-meta">${safe(r.subject || "General")} · ${safe(r.class_level || r.level || "All levels")}</div>
        <h3>${title}</h3><p>${description}</p>
        <span class="resource-type">${safe(r.resource_type || r.type || "Resource")}</span>
        ${file ? `<a href="${safe(file)}" target="_blank" rel="noopener noreferrer">Open resource ↗</a>` : `<span class="muted">Resource link unavailable</span>`}
      </article>`;
    }).join("") : `<p class="empty-state">No approved resources match these filters yet.</p>`;
  }
  function filterLibraryResources() { renderLibrary(); }
  function clearLibraryFilters() {
    ["librarySearchInput","libraryTypeFilter","libraryLevelFilter"].forEach(id => { if ($(id)) $(id).value = ""; });
    renderLibrary();
  }

  // Practice sessions
  function startPracticeSession() {
    const subject = $("practiceSubject")?.value || "All";
    const difficulty = $("practiceDifficulty")?.value || "All";
    const count = Math.max(1, Math.min(20, Number($("practiceQuestionCount")?.value || 5)));
    let pool = sampleQuestions.filter(q =>
      (subject === "All" || q.subject.toLowerCase() === subject.toLowerCase()) &&
      (difficulty === "All" || q.difficulty.toLowerCase() === difficulty.toLowerCase())
    );
    if (!pool.length) pool = sampleQuestions.slice();
    state.practice = [...pool].sort(() => Math.random() - 0.5).slice(0,count);
    state.questionIndex = 0; state.score = 0; state.answered = false;
    $("practiceSession")?.classList.remove("hidden");
    renderPracticeQuestion();
  }
  function renderPracticeQuestion() {
    const q = state.practice[state.questionIndex];
    if (!q) return;
    text("practiceProgressLabel", `Question ${state.questionIndex + 1} of ${state.practice.length}`);
    text("practiceQuestionCounter", `${state.questionIndex + 1}/${state.practice.length}`);
    text("practiceQuestionTitle", q.subject);
    text("practiceQuestionBody", q.q);
    text("practiceFeedback", "");
    const box = $("practiceQuestionBody");
    if (box) {
      const options = q.options.map((option,i) => `<button type="button" class="practice-option" data-answer="${i}">${String.fromCharCode(65+i)}. ${safe(option)}</button>`).join("");
      box.innerHTML = `<p>${safe(q.q)}</p><div class="practice-options">${options}</div>`;
    }
    state.answered = false;
    const next = $("practiceNextButton");
    if (next) { next.disabled = true; next.textContent = state.questionIndex === state.practice.length - 1 ? "Finish practice" : "Next question"; }
  }
  function choosePracticeAnswer(index) {
    if (state.answered) return;
    const q = state.practice[state.questionIndex];
    if (!q) return;
    state.answered = true;
    const correct = Number(index) === q.answer;
    if (correct) state.score++;
    $$(".practice-option").forEach((button,i) => {
      button.disabled = true;
      if (i === q.answer) button.classList.add("correct");
      else if (i === Number(index)) button.classList.add("incorrect");
    });
    text("practiceFeedback", `${correct ? "Correct!" : "Not quite."} ${q.explain}`);
    if ($("practiceNextButton")) $("practiceNextButton").disabled = false;
  }
  function submitOrNextPractice() {
    if (!state.answered) { toast("Choose an answer first."); return; }
    if (state.questionIndex < state.practice.length - 1) {
      state.questionIndex++; renderPracticeQuestion(); return;
    }
    const total = state.practice.length;
    state.practiceHistory.unshift({date:new Date().toISOString(),score:state.score,total});
    const session = $("practiceSession");
    if (session) session.innerHTML = `<div class="practice-result"><h3>Practice complete</h3><p>Your score: <strong>${state.score} / ${total}</strong></p><button type="button" onclick="startPracticeSession()">Try another session</button></div>`;
    renderPracticeHistory();
  }
  function endPracticeSession() {
    $("practiceSession")?.classList.add("hidden");
    state.practice = [];
  }
  function renderPracticeHistory() {
    const el = $("practiceHistory");
    if (el) el.innerHTML = state.practiceHistory.length ? state.practiceHistory.slice(0,5).map(h => `<p>${new Date(h.date).toLocaleDateString()} — ${h.score}/${h.total}</p>`).join("") : `<p class="muted">Your completed sessions will appear here.</p>`;
  }

  // AI companion: secure endpoint required for live model responses
  function setAIMode(mode) {
    state.aiMode = mode;
    const descriptions = {
      study:"Understand concepts step by step, with clear explanations.",
      explain:"Break a difficult topic into simpler ideas and examples.",
      writing:"Plan and improve your writing while keeping your own voice.",
      quiz:"Create revision questions and help you reflect on your answers."
    };
    text("aiModeDescription", descriptions[mode] || descriptions.study);
    $$(".ai-mode").forEach(el => el.classList.toggle("active",el.dataset.mode === mode));
  }
  function useAIPrompt(prompt) {
    const input = $("aiMessageInput");
    if (input) { input.value = prompt || ""; input.focus(); }
  }
  function appendChat(role, message) {
    const list = $("aiChatMessages");
    if (!list) return;
    const node = document.createElement("div");
    node.className = `chat-message ${role}`;
    node.textContent = message;
    list.appendChild(node);
    list.scrollTop = list.scrollHeight;
  }
  async function sendAIMessage(event) {
    event?.preventDefault();
    const input = $("aiMessageInput");
    const message = input?.value?.trim();
    if (!message) return;
    appendChat("user",message); input.value = "";
    if (!STUDY_VERSE_CONFIG.aiEndpoint) {
      appendChat("assistant","The AI service is not connected yet. Study Verse needs a secure server-side AI endpoint before it can send prompts to an AI model. Your message has not been sent to an external AI service.");
      text("aiConnectionState","AI service not configured");
      return;
    }
    try {
      text("aiConnectionState","Connecting securely…");
      const response = await fetch(STUDY_VERSE_CONFIG.aiEndpoint,{
        method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${state.user ? (await db().auth.getSession()).data.session?.access_token || "" : ""}`},
        body:JSON.stringify({message,mode:state.aiMode,curriculum:state.curriculum,level:state.level})
      });
      if (!response.ok) throw new Error(`AI service returned ${response.status}`);
      const data = await response.json();
      appendChat("assistant",String(data.reply || data.answer || "No response was returned."));
      text("aiConnectionState","Connected");
    } catch (error) {
      console.error(error); appendChat("assistant","The AI service could not be reached. Please try again later.");
      text("aiConnectionState","Connection unavailable");
    }
  }

  // Personal workspace — local device storage; account sync requires backend tables.
  function readLocal(key, fallback = []) {
    try { const v = JSON.parse(localStorage.getItem(key)); return Array.isArray(v) ? v : fallback; } catch { return fallback; }
  }
  function saveLocal(key, data) {
    try { localStorage.setItem(key,JSON.stringify(data)); return true; } catch { toast("Device storage is unavailable."); return false; }
  }
  function renderNotes() {
    const list = $("personalNotesList");
    if (!list) return;
    list.innerHTML = state.notes.length ? state.notes.map((n,i) => `<article class="workspace-item"><h3>${safe(n.title)}</h3><p>${safe(n.body).replace(/\n/g,"<br>")}</p><button type="button" data-delete-note="${i}">Delete</button></article>`).join("") : `<p class="empty-state">Your saved notes will appear here.</p>`;
  }
  function savePersonalNote() {
    if (!requireLogin()) return;
    const title = value("personalNoteTitle"), body = value("personalNoteBody");
    if (!title || !body) { toast("Add a note title and its content."); return; }
    state.notes.unshift({title,body,createdAt:new Date().toISOString()});
    saveLocal("sv-notes",state.notes);
    $("personalNoteTitle").value = ""; $("personalNoteBody").value = "";
    renderNotes(); text("noteSaveStatus","Saved on this device.");
  }
  function renderGoals() {
    const list = $("learningGoalsList");
    if (!list) return;
    list.innerHTML = state.goals.length ? state.goals.map((g,i) => `<label class="goal-item"><input type="checkbox" data-goal="${i}" ${g.done?"checked":""}><span>${safe(g.title)}</span><button type="button" data-delete-goal="${i}" aria-label="Delete goal">×</button></label>`).join("") : `<p class="empty-state">Add a goal to start tracking your progress.</p>`;
  }
  function addLearningGoal(event) {
    event?.preventDefault();
    if (!requireLogin()) return;
    const title = value("goalInput");
    if (!title) { toast("Enter a learning goal."); return; }
    state.goals.unshift({title,done:false,createdAt:new Date().toISOString()});
    saveLocal("sv-goals",state.goals); $("goalInput").value = ""; renderGoals();
  }
  function updateGoal(index,done) {
    if (!state.goals[index]) return;
    state.goals[index].done = done; saveLocal("sv-goals",state.goals); renderGoals();
  }
  function toggleFocusTimer() {
    if (state.timerRunning) {
      clearInterval(state.timer); state.timer = null; state.timerRunning = false;
      text("focusTimerButton","Resume"); text("focusTimerStatus","Paused"); return;
    }
    state.timerRunning = true; text("focusTimerButton","Pause"); text("focusTimerStatus","Focus session in progress");
    state.timer = setInterval(() => {
      state.secondsLeft = Math.max(0,state.secondsLeft - 1);
      renderTimer();
      if (!state.secondsLeft) {
        clearInterval(state.timer); state.timer = null; state.timerRunning = false;
        text("focusTimerButton","Start focus"); text("focusTimerStatus","Session complete — take a short break.");
        toast("Focus session complete!","success");
      }
    },1000);
  }
  function renderTimer() {
    const m = String(Math.floor(state.secondsLeft/60)).padStart(2,"0");
    const s = String(state.secondsLeft%60).padStart(2,"0");
    text("focusTimerDisplay",`${m}:${s}`);
  }
  function resetFocusTimer() {
    clearInterval(state.timer); state.timer = null; state.timerRunning = false;
    state.secondsLeft = 25*60; renderTimer();
    text("focusTimerButton","Start focus"); text("focusTimerStatus","Ready when you are");
  }
  function setFocusDuration(minutes,button) {
    clearInterval(state.timer); state.timer = null; state.timerRunning = false;
    state.secondsLeft = minutes*60; renderTimer();
    text("focusTimerButton","Start focus"); text("focusTimerStatus",`${minutes}-minute focus session`);
    $$(".timer-preset").forEach(b => b.classList.toggle("active",b === button));
  }

  // Account, authentication and profile
  function showAuthMode(mode) {
    const login = $("loginForm"), register = $("registerForm");
    login?.classList.toggle("hidden",mode !== "login");
    register?.classList.toggle("hidden",mode !== "register");
    $("loginTab")?.classList.toggle("active",mode === "login");
    $("registerTab")?.classList.toggle("active",mode === "register");
  }
  function updateAccountUI() {
    const signedIn = !!state.user;
    $("authForms")?.classList.toggle("hidden",signedIn);
    $("signedInPanel")?.classList.toggle("hidden",!signedIn);
    text("profileDisplayName",state.profile?.full_name || state.user?.user_metadata?.full_name || "Learner");
    text("profileEmail",state.user?.email || "");
    text("profileRoleLabel",state.profile?.role || "STUDENT");
    text("profileAccountStatus",state.profile?.status || "GUEST");
    text("profileCurriculumSummary",`${state.curriculum} · ${state.level}`);
    text("headerAvatar",(state.profile?.full_name || "S").trim().charAt(0).toUpperCase());
    text("profileAvatar",(state.profile?.full_name || "S").trim().charAt(0).toUpperCase());
    $("adminDashboardAccess")?.classList.toggle("hidden",!isAdmin());
    $("studentDashboardAccess")?.classList.toggle("hidden",!signedIn);
    $("roleDashboardPanel")?.classList.toggle("hidden",!signedIn);
  }
  async function loginStudent(event) {
    event?.preventDefault();
    const email = value("loginEmail"), password = $("loginPassword")?.value || "";
    if (!email || !password) { text("loginMessage","Enter your email and password."); return; }
    const button = $("loginButton"); setBusy(button,true,"Signing in…");
    try {
      const {data,error} = await db().auth.signInWithPassword({email,password});
      if (error) throw error;
      await loadUserProfile(data.user);
      text("loginMessage",""); toast("Welcome back to Study Verse!","success");
      navigateTo("homeView");
    } catch (error) {
      console.error(error); text("loginMessage",error.message || "Unable to sign in.");
    } finally { setBusy(button,false); }
  }
  async function registerStudent(event) {
    event?.preventDefault();
    const name = value("registerName"), email = value("registerEmail"), password = $("registerPassword")?.value || "";
    if (!name || !email || password.length < 8 || !$("registerTerms")?.checked) {
      text("registerMessage","Enter your name and email, use a password of at least 8 characters, and accept the terms."); return;
    }
    const button = $("registerButton"); setBusy(button,true,"Creating account…");
    try {
      const {data,error} = await db().auth.signUp({email,password,options:{data:{full_name:name,role:"STUDENT"}}});
      if (error) throw error;
      if (data.session && data.user) await loadUserProfile(data.user);
      text("registerMessage",data.session ? "Account created. Check your account status." : "Registration received. Check your email to confirm your account.");
      toast("Registration request submitted.","success");
    } catch (error) {
      console.error(error); text("registerMessage",error.message || "Registration failed.");
    } finally { setBusy(button,false); }
  }
  async function loadUserProfile(user) {
    state.user = user;
    try {
      const {data,error} = await db().from(STUDY_VERSE_CONFIG.tables.profiles).select("*").eq("id",user.id).maybeSingle();
      if (error) throw error;
      state.profile = data || {id:user.id,full_name:user.user_metadata?.full_name || "Learner",role:"STUDENT",status:"PENDING"};
    } catch (error) {
      console.warn("Profile record not available:",error);
      state.profile = {id:user.id,full_name:user.user_metadata?.full_name || "Learner",role:"STUDENT",status:"PENDING"};
    }
    updateAccountUI();
    dispatch("authenticated",{userId:user.id,role:state.profile.role});
  }
  async function restoreSession() {
    try {
      const {data,error} = await db().auth.getSession();
      if (error) throw error;
      if (data.session?.user) await loadUserProfile(data.session.user);
    } catch (error) { console.warn("Session restore:",error); }
  }
  async function logoutStudent() {
    try { const {error} = await db().auth.signOut(); if (error) throw error; }
    catch (error) { console.error(error); }
    state.user = null; state.profile = null; updateAccountUI(); toast("You have signed out."); navigateTo("homeView");
  }
  async function resetStudentPassword() {
    const email = value("loginEmail");
    if (!email) { text("loginMessage","Enter your account email first."); return; }
    try {
      const {error} = await db().auth.resetPasswordForEmail(email,{redirectTo:location.origin});
      if (error) throw error;
      text("loginMessage","If the account exists, password reset instructions will be sent.");
    } catch (error) { text("loginMessage",error.message || "Password reset request failed."); }
  }
  async function saveProfilePreferences() {
    state.language = $("profileLanguage")?.value || state.language;
    state.country = $("profileCountry")?.value || state.country;
    if (state.user && state.profile?.id) {
      try {
        const {error} = await db().from(STUDY_VERSE_CONFIG.tables.profiles).update({language:state.language,country:state.country}).eq("id",state.user.id);
        if (error) throw error;
      } catch (error) { console.warn(error); text("profilePreferencesMessage","Preferences kept on this device; cloud update was not available."); return; }
    }
    try { localStorage.setItem("sv-preferences",JSON.stringify({language:state.language,country:state.country})); } catch {}
    text("profilePreferencesMessage","Preferences saved.");
  }
  function resetLearningPreferences() {
    state.curriculum = "JKBOSE"; state.level = "Class 10"; state.language = "English"; state.country = "India";
    if ($("homeCurriculum")) $("homeCurriculum").value = state.curriculum;
    handleCurriculumChange(); if ($("homeLevel")) $("homeLevel").value = state.level;
    if ($("profileLanguage")) $("profileLanguage").value = state.language;
    if ($("profileCountry")) $("profileCountry").value = state.country;
    saveHomeCurriculum(); saveProfilePreferences();
  }

  // Admin
  async function showAdminPanel() {
    if (!isAdmin()) { toast("Administrator access is restricted."); return; }
    navigateTo("adminView");
  }
  async function refreshAdminDashboard() {
    if (!isAdmin()) {
      text("adminSystemStatus","Sign in with an approved administrator account to access these tools.");
      return;
    }
    text("adminSystemStatus","Loading administration data…");
    try {
      const [profiles,resources] = await Promise.all([
        db().from(STUDY_VERSE_CONFIG.tables.profiles).select("*").order("created_at",{ascending:false}).limit(300),
        db().from(STUDY_VERSE_CONFIG.tables.resources).select("*").order("created_at",{ascending:false}).limit(100)
      ]);
      if (profiles.error) throw profiles.error;
      if (resources.error) throw resources.error;
      state.adminProfiles = profiles.data || [];
      state.resources = resources.data || [];
      text("adminTotalUsers",state.adminProfiles.length);
      text("adminPendingUsers",state.adminProfiles.filter(p=>p.status==="PENDING").length);
      text("adminApprovedUsers",state.adminProfiles.filter(p=>p.status==="APPROVED").length);
      text("adminResourceCount",state.resources.length);
      renderAdminStudents(); renderAdminResources();
      text("adminSystemStatus","Connected to the Study Verse database.");
    } catch (error) {
      console.error(error); text("adminSystemStatus",`Could not load admin data: ${error.message}`);
    }
  }
  function renderAdminStudents() {
    const list = $("adminStudentsList");
    if (!list) return;
    const q = value("adminStudentSearch").toLowerCase();
    const rows = state.adminProfiles.filter(p => [p.full_name,p.email,p.role,p.status].join(" ").toLowerCase().includes(q));
    list.innerHTML = rows.length ? rows.map(p => `<article class="admin-user-row"><strong>${safe(p.full_name || "Learner")}</strong><span>${safe(p.email || "")}</span><span>${safe(p.role || "STUDENT")} · ${safe(p.status || "PENDING")}</span></article>`).join("") : `<p class="empty-state">No matching accounts found.</p>`;
  }
  function filterAdminStudents() { renderAdminStudents(); }
  function renderAdminResources() {
    const list = $("adminResourceList");
    if (!list) return;
    list.innerHTML = state.resources.length ? state.resources.map(r => `<article class="admin-resource-row"><strong>${safe(r.title || "Untitled resource")}</strong><span>${safe(r.status || "Status not set")}</span></article>`).join("") : `<p class="empty-state">No resources found.</p>`;
  }
  async function uploadStudyResource(event) {
    event?.preventDefault();
    if (!isAdmin()) { text("resourceUploadMessage","Administrator access required."); return; }
    const file = $("resourceFile")?.files?.[0];
    const title = value("resourceTitle");
    if (!file || !title) { text("resourceUploadMessage","Add a title and choose a file."); return; }
    if (file.size > STUDY_VERSE_CONFIG.maxUploadBytes) { text("resourceUploadMessage","File size must be 20 MB or less."); return; }
    const button = $("resourceUploadForm")?.querySelector('[type="submit"]');
    setBusy(button,true,"Uploading…");
    try {
      const ext = file.name.split(".").pop().replace(/[^a-zA-Z0-9]/g,"").toLowerCase();
      const path = `${state.user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      let uploaded = null, bucketUsed = null, lastError = null;
      for (const bucket of STUDY_VERSE_CONFIG.storageBuckets) {
        const result = await db().storage.from(bucket).upload(path,file,{upsert:false});
        if (!result.error) { uploaded = result.data; bucketUsed = bucket; break; }
        lastError = result.error;
      }
      if (!uploaded) throw lastError || new Error("Storage upload failed.");
      const {data:publicData} = db().storage.from(bucketUsed).getPublicUrl(uploaded.path);
      const row = {
        title, description:value("resourceDescription"),
        subject:value("resourceSubject"), class_level:value("resourceLevel"),
        resource_type:value("resourceType"), file_url:publicData.publicUrl,
        status:$("resourceVerified")?.checked ? "APPROVED" : "PENDING",
        uploaded_by:state.user.id
      };
      const {error} = await db().from(STUDY_VERSE_CONFIG.tables.resources).insert(row);
      if (error) throw error;
      text("resourceUploadMessage","Resource uploaded and submitted.");
      $("resourceUploadForm").reset(); await refreshAdminDashboard();
    } catch (error) {
      console.error(error); text("resourceUploadMessage",`Upload failed: ${error.message}`);
    } finally { setBusy(button,false); }
  }

  // Founder profile
  async function loadFounderProfile() {
    try {
      const {data,error} = await db().from(STUDY_VERSE_CONFIG.tables.founder).select("*").limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return;
      text("founderPublicName",data.name || STUDY_VERSE_CONFIG.founder);
      text("founderPublicDesignation",data.designation || "Founder, Study Verse");
      text("founderPublicBiography",data.biography || "");
      text("founderPublicVision",data.vision || "");
      text("founderPublicMission",data.mission || "");
      const image = $("founderPublicImage");
      if (image && data.image_url) image.src = data.image_url;
      const links = $("founderPublicSocialLinks");
      if (links) links.innerHTML = [data.website,data.instagram].filter(Boolean).map(url => `<a href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(url)}</a>`).join(" ");
      if (isAdmin()) {
        const fields = {founderNameInput:data.name,founderDesignationInput:data.designation,founderBiographyInput:data.biography,founderVisionInput:data.vision,founderMissionInput:data.mission,founderWebsiteInput:data.website,founderInstagramInput:data.instagram};
        Object.entries(fields).forEach(([id,v]) => { if ($(id)) $(id).value = v || ""; });
        if ($("founderPublishToggle")) $("founderPublishToggle").checked = data.is_published !== false;
      }
    } catch (error) { console.warn("Founder profile:",error); }
  }
  async function saveFounderProfile(event) {
    event?.preventDefault();
    if (!isAdmin()) { text("founderSaveMessage","Administrator access required."); return; }
    const row = {
      name:value("founderNameInput") || STUDY_VERSE_CONFIG.founder,
      designation:value("founderDesignationInput"),
      biography:value("founderBiographyInput"),
      vision:value("founderVisionInput"),
      mission:value("founderMissionInput"),
      website:value("founderWebsiteInput"),
      instagram:value("founderInstagramInput"),
      is_published:$("founderPublishToggle")?.checked ?? true,
      updated_at:new Date().toISOString()
    };
    try {
      const {data,error} = await db().from(STUDY_VERSE_CONFIG.tables.founder).select("id").limit(1).maybeSingle();
      if (error) throw error;
      const result = data?.id
        ? await db().from(STUDY_VERSE_CONFIG.tables.founder).update(row).eq("id",data.id)
        : await db().from(STUDY_VERSE_CONFIG.tables.founder).insert(row);
      if (result.error) throw result.error;
      text("founderSaveMessage","Founder profile saved."); toast("Founder profile updated.","success");
      loadFounderProfile();
    } catch (error) { console.error(error); text("founderSaveMessage",`Could not save: ${error.message}`); }
  }

  // Global search and home activity
  function submitGlobalSearch(event) {
    event?.preventDefault();
    const query = value("globalSearchInput").toLowerCase();
    if (!query) return;
    closeDialog("globalSearchDialog");
    const found = subjects.find(s => s[0].toLowerCase().includes(query) || s[1].toLowerCase().includes(query));
    if (found) { openSubject(found[0]); return; }
    $("librarySearchInput") && ($("librarySearchInput").value = query);
    navigateTo("libraryView"); renderLibrary();
  }
  function renderHomeActivity() {
    const list = $("homeActivityList"), empty = $("homeActivityEmpty");
    if (!list) return;
    const items = [
      ...state.notes.slice(0,2).map(n=>({title:n.title,detail:"Study note"})),
      ...state.goals.slice(0,2).map(g=>({title:g.title,detail:g.done?"Goal completed":"Learning goal"}))
    ];
    if (empty) empty.classList.toggle("hidden",items.length>0);
    list.innerHTML = items.map(i=>`<div class="activity-item"><strong>${safe(i.title)}</strong><span>${safe(i.detail)}</span></div>`).join("");
  }
  function saveResourceBookmark(resourceId) {
    if (!requireLogin()) return;
    if (!state.saved.includes(resourceId)) state.saved.push(resourceId);
    saveLocal("sv-saved",state.saved); renderSavedResources();
  }
  function renderSavedResources() {
    const list = $("savedResourcesList");
    if (!list) return;
    const rows = state.resources.filter(r=>state.saved.includes(String(r.id)));
    list.innerHTML = rows.length ? rows.map(r=>`<p>${safe(r.title)}</p>`).join("") : `<p class="muted">Your bookmarked resources will appear here.</p>`;
  }

  // Expose functions used by inline handlers in index.html.
  Object.assign(window,{
    navigateTo,toggleMobileMenu,closeMobileMenu,toggleTheme,setTheme,
    openGlobalSearch,openNotifications,closeDialog,
    handleCurriculumChange,saveHomeCurriculum,
    searchExplore,filterExplore,openSubject,
    filterLibraryResources,clearLibraryFilters,
    startPracticeSession,endPracticeSession,submitOrNextPractice,
    setAIMode,useAIPrompt,sendAIMessage,
    savePersonalNote,addLearningGoal,toggleFocusTimer,resetFocusTimer,setFocusDuration,
    showAuthMode,loginStudent,registerStudent,resetStudentPassword,logoutStudent,
    saveProfilePreferences,resetLearningPreferences,
    showAdminPanel,refreshAdminDashboard,uploadStudyResource,filterAdminStudents,
    saveFounderProfile,submitGlobalSearch
  });

  // Delegated interactions keep dynamically generated controls working.
  document.addEventListener("click",event=>{
    const answer = event.target.closest("[data-answer]");
    if (answer) choosePracticeAnswer(Number(answer.dataset.answer));
    const subject = event.target.closest("[data-subject]");
    if (subject) openSubject(subject.dataset.subject);
    const delNote = event.target.closest("[data-delete-note]");
    if (delNote) { state.notes.splice(Number(delNote.dataset.deleteNote),1); saveLocal("sv-notes",state.notes); renderNotes(); }
    const delGoal = event.target.closest("[data-delete-goal]");
    if (delGoal) { state.goals.splice(Number(delGoal.dataset.deleteGoal),1); saveLocal("sv-goals",state.goals); renderGoals(); }
  });
  document.addEventListener("change",event=>{
    const goal = event.target.closest("[data-goal]");
    if (goal) updateGoal(Number(goal.dataset.goal),goal.checked);
  });

  async function init() {
    try {
      const savedTheme = localStorage.getItem("sv-theme");
      if (savedTheme) setTheme(savedTheme); else setTheme("dark");
      const prefs = JSON.parse(localStorage.getItem("sv-curriculum") || "null");
      if (prefs) {
        state.curriculum = prefs.curriculum || state.curriculum;
        state.level = prefs.level || state.level;
      }
      const accountPrefs = JSON.parse(localStorage.getItem("sv-preferences") || "null");
      if (accountPrefs) { state.country=accountPrefs.country || state.country; state.language=accountPrefs.language || state.language; }
      state.notes = readLocal("sv-notes");
      state.goals = readLocal("sv-goals");
      state.saved = readLocal("sv-saved");
    } catch (error) { console.warn("Local preferences:",error); }
    if ($("homeCurriculum")) $("homeCurriculum").value = state.curriculum;
    handleCurriculumChange();
    if ($("homeLevel")) $("homeLevel").value = state.level;
    if ($("profileCountry")) $("profileCountry").value = state.country;
    if ($("profileLanguage")) $("profileLanguage").value = state.language;
    dateLabel(); renderSubjects(); renderNotes(); renderGoals(); renderTimer();
    renderHomeActivity(); renderSavedResources(); renderPracticeHistory(); updateAccountUI();
    try { showLoading(true,"Connecting to Study Verse…"); await restoreSession(); }
    catch (error) { console.warn(error); }
    finally { showLoading(false); }
    if ($("aboutView")) loadFounderProfile();
    if ($("libraryView")) loadLibraryResources();
    console.info(`[${STUDY_VERSE_CONFIG.name}] ${STUDY_VERSE_CONFIG.version} initialized.`);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();

  // Public read-only diagnostics for browser-console troubleshooting.
  window.StudyVerse = Object.freeze({
    version:STUDY_VERSE_CONFIG.version,
    getState:()=>({authenticated:!!state.user,role:state.profile?.role || "GUEST",status:state.profile?.status || "GUEST",view:state.currentView}),
    refreshLibrary:loadLibraryResources
  });
})();
