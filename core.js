/* ============================================================
   STUDY VERSE — GLOBAL LEARNING ECOSYSTEM
   Core Application Engine
   Founder: Adnan Manzoor
   Version: 2.0 Foundation
   ============================================================ */

"use strict";

/* ------------------------------------------------------------
   1. APPLICATION CONFIGURATION
------------------------------------------------------------ */

const STUDY_VERSE = Object.freeze({
    name: "STUDY VERSE",
    tagline: "Learn • Explore • Evolve",
    founder: "Adnan Manzoor",
    version: "2.0.0",

    supabaseUrl: "https://fwxraksvzrofgjbqvplm.supabase.co",

    // Existing public Supabase publishable key.
    // Never put a service-role key or AI secret here.
    supabaseKey: "sb_publishable_Fc7hos5g-BoT0cVWBnVWSQ_IC8OdPAh",

    tables: {
        profiles: "profiles",
        resources: "study_resources",
        posts: "posts"
    },

    storageBuckets: [
        "PYQs",
        "Guess Papers",
        "Study Materials",
        "jkbose-notes"
    ],

    roles: {
        ADMIN: "ADMIN",
        STUDENT: "STUDENT",
        EDUCATOR: "EDUCATOR",
        CONTRIBUTOR: "CONTRIBUTOR"
    },

    statuses: {
        PENDING: "PENDING",
        APPROVED: "APPROVED",
        REJECTED: "REJECTED",
        SUSPENDED: "SUSPENDED"
    }
});

/* ------------------------------------------------------------
   2. APPLICATION STATE
------------------------------------------------------------ */

let supabaseClient = null;

let currentUser = null;
let currentProfile = null;

let toastTimeout = null;
let currentView = "homeView";

let adminStudents = [];
let libraryResources = [];

let appInitialized = false;

/* ------------------------------------------------------------
   3. SUPABASE CONNECTION
------------------------------------------------------------ */

function getSupabase() {
    if (supabaseClient) return supabaseClient;

    if (!window.supabase) {
        throw new Error(
            "Supabase library is not loaded. Please check index.html."
        );
    }

    supabaseClient = window.supabase.createClient(
        STUDY_VERSE.supabaseUrl,
        STUDY_VERSE.supabaseKey
    );

    return supabaseClient;
}

/* ------------------------------------------------------------
   4. GENERAL UTILITIES
------------------------------------------------------------ */

function getElement(id) {
    return document.getElementById(id);
}

function getValue(id) {
    return getElement(id)?.value?.trim() || "";
}

function setButtonText(button, text) {
    if (button) button.innerText = text;
}

function setText(id, value) {
    const element = getElement(id);

    if (element) {
        element.textContent = value ?? "";
    }
}

function uiAction(message, type = "info") {
    const toast = getElement("uiToast");

    if (!toast) {
        console.log("[Study Verse]", message);
        return;
    }

    toast.textContent = message;
    toast.dataset.type = type;

    toast.classList.remove("hidden");
    toast.style.opacity = "1";

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.style.opacity = "0";

        setTimeout(() => {
            toast.classList.add("hidden");
        }, 300);
    }, 3000);
}

function showError(error, fallback = "Something went wrong.") {
    console.error("[Study Verse Error]", error);

    uiAction(error?.message || fallback, "error");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}

function setLoading(element, loading, loadingText = "Please wait...") {
    if (!element) return;

    if (loading) {
        element.dataset.originalText = element.innerText;
        element.disabled = true;
        element.innerText = loadingText;
    } else {
        element.disabled = false;

        if (element.dataset.originalText) {
            element.innerText = element.dataset.originalText;
        }
    }
}

function requireLogin() {
    if (!currentUser || !currentProfile) {
        uiAction("Please log in to continue.");
        navigateTo("profileView");
        return false;
    }

    return true;
}

/* ------------------------------------------------------------
   5. ROLE AND PERMISSION HELPERS
------------------------------------------------------------ */

function isAdmin() {
    return Boolean(
        currentUser &&
        currentProfile &&
        currentProfile.role === STUDY_VERSE.roles.ADMIN &&
        currentProfile.status === STUDY_VERSE.statuses.APPROVED
    );
}

function isEducator() {
    return Boolean(
        currentProfile &&
        currentProfile.role === STUDY_VERSE.roles.EDUCATOR &&
        currentProfile.status === STUDY_VERSE.statuses.APPROVED
    );
}

function isApprovedUser() {
    return Boolean(
        currentUser &&
        currentProfile &&
        currentProfile.status === STUDY_VERSE.statuses.APPROVED
    );
}

function requireAdmin() {
    if (!isAdmin()) {
        uiAction("Administrator permission required.", "error");
        return false;
    }

    return true;
}

function updateRoleInterface() {
    const adminElements = document.querySelectorAll("[data-admin-only]");
    const educatorElements = document.querySelectorAll("[data-educator-only]");

    adminElements.forEach(element => {
        element.classList.toggle("hidden", !isAdmin());
    });

    educatorElements.forEach(element => {
        element.classList.toggle(
            "hidden",
            !(isEducator() || isAdmin())
        );
    });

    setText(
        "accountRole",
        currentProfile?.role || "GUEST"
    );

    setText(
        "accountStatus",
        currentProfile?.status || "NOT LOGGED IN"
    );
}

/* ------------------------------------------------------------
   6. STUDENT REGISTRATION
------------------------------------------------------------ */

async function registerStudent() {
    const name = getValue("regName");
    const studentClass = getValue("regClass");
    const email = getValue("regEmail");
    const password = getElement("regPass")?.value || "";

    const button = getElement("regBtn");

    if (!name || !studentClass || !email || !password) {
        uiAction("Please complete all required fields.");
        return;
    }

    if (password.length < 6) {
        uiAction("Password must contain at least 6 characters.");
        return;
    }

    setLoading(button, true, "Creating account...");

    try {
        const db = getSupabase();

        const { data, error } = await db.auth.signUp({
            email,
            password,

            options: {
                data: {
                    full_name: name,
                    class_level: studentClass,
                    role: "STUDENT"
                }
            }
        });

        if (error) throw error;

        if (!data.user) {
            throw new Error("Account creation was unsuccessful.");
        }

        uiAction(
            data.session
                ? "Registration received. Your account awaits approval."
                : "Registration received. Please check your email if confirmation is required."
        );

        ["regName", "regClass", "regEmail", "regPass"].forEach(id => {
            const element = getElement(id);
            if (element) element.value = "";
        });

        toggleAuthMode("login");

    } catch (error) {
        showError(error, "Registration failed.");
    } finally {
        setLoading(button, false);
    }
}

/* ------------------------------------------------------------
   7. STUDENT LOGIN
------------------------------------------------------------ */

async function loginStudent() {
    const email = getValue("loginEmail");
    const password = getElement("loginPass")?.value || "";

    const button = getElement("loginBtn");

    if (!email || !password) {
        uiAction("Enter your email and password.");
        return;
    }

    setLoading(button, true, "Authenticating...");

    try {
        const db = getSupabase();

        const { data, error } = await db.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        const { data: profile, error: profileError } = await db
            .from(STUDY_VERSE.tables.profiles)
            .select("*")
            .eq("id", data.user.id)
            .single();

        if (profileError || !profile) {
            await db.auth.signOut();
            throw new Error("Your account profile could not be found.");
        }

        if (profile.status !== "APPROVED") {
            await db.auth.signOut();

            if (profile.status === "REJECTED") {
                throw new Error("Your application was not approved.");
            }

            if (profile.status === "SUSPENDED") {
                throw new Error("Your account is suspended.");
            }

            throw new Error("Your account is awaiting administrator approval.");
        }

        currentUser = data.user;
        currentProfile = profile;

        updateUserInterface();

        const emailInput = getElement("loginEmail");
        const passwordInput = getElement("loginPass");

        if (emailInput) emailInput.value = "";
        if (passwordInput) passwordInput.value = "";

        uiAction("Welcome to Study Verse!");

        navigateTo("homeView");

    } catch (error) {
        showError(error, "Unable to log in.");
    } finally {
        setLoading(button, false);
    }
}

/* ------------------------------------------------------------
   8. SESSION RESTORATION
------------------------------------------------------------ */

async function restoreSession() {
    try {
        const db = getSupabase();

        const { data, error } = await db.auth.getSession();

        if (error) throw error;

        const session = data.session;

        if (!session) return false;

        const { data: profile, error: profileError } = await db
            .from(STUDY_VERSE.tables.profiles)
            .select("*")
            .eq("id", session.user.id)
            .single();

        if (
            profileError ||
            !profile ||
            profile.status !== "APPROVED"
        ) {
            await db.auth.signOut();
            return false;
        }

        currentUser = session.user;
        currentProfile = profile;

        updateUserInterface();

        return true;

    } catch (error) {
        console.error("Session restoration:", error);
        return false;
    }
}

/* ------------------------------------------------------------
   9. USER INTERFACE UPDATE
------------------------------------------------------------ */

function updateUserInterface() {
    if (!currentProfile) return;

    const fullName = currentProfile.full_name || "Student";
    const firstName = fullName.split(" ")[0];

    setText("studentNameDisplay", firstName);
    setText("profileName", fullName);
    setText("profileEmail", currentUser?.email || "");
    setText("profileStudentId", currentProfile.student_id || "Not assigned");

    setText("accountRole", currentProfile.role);
    setText("accountStatus", currentProfile.status);

    updateRoleInterface();

    window.dispatchEvent(
        new CustomEvent("studyverse:authenticated", {
            detail: {
                role: currentProfile.role
            }
        })
    );
}

/* ------------------------------------------------------------
   10. LOGOUT
------------------------------------------------------------ */

async function logoutStudent() {
    try {
        const db = getSupabase();

        const { error } = await db.auth.signOut();

        if (error) throw error;

        currentUser = null;
        currentProfile = null;

        uiAction("You have been logged out.");

        location.reload();

    } catch (error) {
        showError(error, "Unable to log out.");
    }
}

/* ------------------------------------------------------------
   11. PASSWORD RESET
------------------------------------------------------------ */

async function resetStudentPassword() {
    const email = getValue("loginEmail");

    if (!email) {
        uiAction("Enter your registered email first.");
        return;
    }

    try {
        const db = getSupabase();

        const { error } = await db.auth.resetPasswordForEmail(email);

        if (error) throw error;

        uiAction("If the account exists, password reset instructions will be sent.");

    } catch (error) {
        showError(error, "Password reset could not be requested.");
    }
}

/* ------------------------------------------------------------
   12. NAVIGATION ENGINE
------------------------------------------------------------ */

function navigateTo(viewId, element = null) {
    const target = getElement(viewId);

    if (!target) {
        console.warn("Study Verse view not found:", viewId);
        uiAction("This section is not available yet.");
        return;
    }

    document.querySelectorAll(".app-view").forEach(view => {
        view.classList.remove("active");
    });

    target.classList.add("active");

    document.querySelectorAll(".tab-item").forEach(tab => {
        tab.classList.remove("active");
    });

    if (element) {
        element.classList.add("active");
    } else {
        const matchingTab = document.querySelector(
            `.tab-item[data-view="${viewId}"]`
        );

        if (matchingTab) matchingTab.classList.add("active");
    }

    currentView = viewId;

    window.dispatchEvent(
        new CustomEvent("studyverse:navigate", {
            detail: { viewId }
        })
    );

    if (viewId === "adminView" && isAdmin()) {
        loadAdminDashboard();
    }

    if (viewId === "libraryView") {
        loadLibraryResources();
    }

    if (viewId === "homeView") {
        setDynamicGreeting();
    }
}

function goBack() {
    if (currentView !== "homeView") {
        navigateTo("homeView");
    }
}

function toggleAuthMode(mode) {
    const login = getElement("loginForm");
    const register = getElement("registerForm");

    if (!login || !register) return;

    if (mode === "register") {
        login.classList.add("hidden");
        register.classList.remove("hidden");
    } else {
        register.classList.add("hidden");
        login.classList.remove("hidden");
    }
}

/* ------------------------------------------------------------
   13. ONBOARDING
------------------------------------------------------------ */

function completeOnboarding() {
    const onboarding = getElement("onboardingScreen");
    const appRoot = getElement("app-root");
    const bottomNav = getElement("bottomNav");

    if (onboarding) {
        onboarding.style.animation = "fadeOut 0.4s forwards";
    }

    setTimeout(() => {
        if (onboarding) {
            onboarding.classList.remove("active-flex");
            onboarding.classList.add("hidden");
        }

        if (appRoot) appRoot.classList.remove("hidden");
        if (bottomNav) bottomNav.classList.remove("hidden");

    }, 400);
}

/* ------------------------------------------------------------
   14. GREETING AND HOME
------------------------------------------------------------ */

function setDynamicGreeting() {
    const hour = new Date().getHours();

    let greeting = "Good Evening,";

    if (hour >= 5 && hour < 12) {
        greeting = "Good Morning,";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon,";
    }

    setText("dynamicGreeting", greeting);
}

/* ------------------------------------------------------------
   15. FOUNDER / ADMIN DASHBOARD
------------------------------------------------------------ */

async function loadAdminDashboard() {
    if (!requireAdmin()) return;

    try {
        const db = getSupabase();

        const { data, error } = await db
            .from(STUDY_VERSE.tables.profiles)
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        adminStudents = data || [];

        const total = adminStudents.length;

        const pending = adminStudents.filter(
            student => student.status === "PENDING"
        ).length;

        const approved = adminStudents.filter(
            student => student.status === "APPROVED"
        ).length;

        const rejected = adminStudents.filter(
            student => student.status === "REJECTED"
        ).length;

        const suspended = adminStudents.filter(
            student => student.status === "SUSPENDED"
        ).length;

        setText("adminTotalUsers", total);
        setText("adminPendingUsers", pending);
        setText("adminApprovedUsers", approved);
        setText("adminRejectedUsers", rejected);
        setText("adminSuspendedUsers", suspended);

        renderAdminStudents(adminStudents);

    } catch (error) {
        showError(
            error,
            "Unable to load administration data. Check database permissions."
        );
    }
}

/* ------------------------------------------------------------
   16. ADMIN STUDENT LIST
------------------------------------------------------------ */

function renderAdminStudents(students) {
    const container = getElement("adminStudentList");

    if (!container) return;

    if (!students || students.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No student records found</h3>
                <p>Student applications will appear here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = students.map(student => {
        const name = escapeHTML(student.full_name || "Unnamed student");
        const email = escapeHTML(student.email || "Email unavailable");
        const role = escapeHTML(student.role || "STUDENT");
        const status = escapeHTML(student.status || "PENDING");
        const id = escapeHTML(student.id);

        const actions = student.role === "ADMIN"
            ? `<span>Administrator account</span>`
            : `
                <div class="admin-actions">
                    ${student.status !== "APPROVED" ? `
                        <button onclick="updateStudentStatus('${id}','APPROVED')">
                            Approve
                        </button>
                    ` : ""}

                    ${student.status !== "REJECTED" ? `
                        <button onclick="updateStudentStatus('${id}','REJECTED')">
                            Reject
                        </button>
                    ` : ""}

                    ${student.status !== "SUSPENDED" ? `
                        <button onclick="updateStudentStatus('${id}','SUSPENDED')">
                            Suspend
                        </button>
                    ` : ""}
                </div>
            `;

        return `
            <article class="admin-student-card">
                <h3>${name}</h3>
                <p>${email}</p>
                <p>Role: ${role}</p>
                <p>Status: <strong>${status}</strong></p>
                <p>Class: ${escapeHTML(student.class_level || "Not specified")}</p>
                <p>Registered: ${formatDate(student.created_at)}</p>
                ${actions}
            </article>
        `;
    }).join("");
}

/* ------------------------------------------------------------
   17. ADMIN STUDENT STATUS MANAGEMENT
------------------------------------------------------------ */

async function updateStudentStatus(studentId, newStatus) {
    if (!requireAdmin()) return;

    const allowedStatuses = [
        "APPROVED",
        "REJECTED",
        "SUSPENDED"
    ];

    if (!allowedStatuses.includes(newStatus)) {
        uiAction("Invalid account status.");
        return;
    }

    if (!studentId || studentId === currentUser.id) {
        uiAction("This account cannot be changed here.");
        return;
    }

    const confirmed = window.confirm(
        `Change this student's status to ${newStatus}?`
    );

    if (!confirmed) return;

    try {
        const db = getSupabase();

        const { error } = await db
            .from(STUDY_VERSE.tables.profiles)
            .update({ status: newStatus })
            .eq("id", studentId);

        if (error) throw error;

        uiAction(`Student status updated to ${newStatus}.`);

        await loadAdminDashboard();

    } catch (error) {
        showError(
            error,
            "Unable to update student. Check administrator database permissions."
        );
    }
}

async function refreshAdminDashboard() {
    if (!requireAdmin()) return;

    uiAction("Refreshing administration dashboard...");
    await loadAdminDashboard();
}

/* ------------------------------------------------------------
   18. STUDENT SEARCH AND FILTER
------------------------------------------------------------ */

function filterAdminStudents() {
    const search = getValue("adminStudentSearch").toLowerCase();
    const status = getValue("adminStatusFilter");

    const filtered = adminStudents.filter(student => {
        const matchesSearch = [
            student.full_name,
            student.email,
            student.student_id,
            student.class_level
        ].some(value =>
            String(value || "").toLowerCase().includes(search)
        );

        const matchesStatus = !status || student.status === status;

        return matchesSearch && matchesStatus;
    });

    renderAdminStudents(filtered);
}

/* ------------------------------------------------------------
   19. RESOURCE LIBRARY
------------------------------------------------------------ */

async function loadLibraryResources() {
    try {
        const db = getSupabase();

        const { data, error } = await db
            .from(STUDY_VERSE.tables.resources)
            .select("*")
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        libraryResources = data || [];

        renderLibraryResources(libraryResources);

    } catch (error) {
        console.error("Library loading:", error);
        uiAction("Unable to load learning resources.");
    }
}

function renderLibraryResources(resources) {
    const container = getElement("libraryResourceList");

    if (!container) return;

    if (!resources.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No published resources yet</h3>
                <p>New learning resources will appear here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = resources.map(resource => `
        <article class="resource-card">
            <h3>${escapeHTML(resource.title)}</h3>
            <p>${escapeHTML(resource.description || "")}</p>
            <p>Subject: ${escapeHTML(resource.subject || "General")}</p>
            <p>Type: ${escapeHTML(resource.resource_type || "Resource")}</p>
            <p>Level: ${escapeHTML(resource.class_level || "All levels")}</p>
            <button onclick="downloadStudyResource('${escapeHTML(resource.id)}')">
                Open resource
            </button>
        </article>
    `).join("");
}

async function downloadStudyResource(resourceId) {
    try {
        const db = getSupabase();

        const resource = libraryResources.find(
            item => item.id === resourceId
        );

        if (!resource) {
            throw new Error("Resource not found.");
        }

        const { data, error } = await db.storage
            .from(resource.file_path.split("/")[0])
            .createSignedUrl(
                resource.file_path.split("/").slice(1).join("/"),
                60
            );

        if (error) throw error;

        if (!data?.signedUrl) {
            throw new Error("Secure resource link could not be created.");
        }

        window.open(data.signedUrl, "_blank", "noopener,noreferrer");

    } catch (error) {
        showError(error, "Unable to open this resource.");
    }
}

/* ------------------------------------------------------------
   20. ADMIN RESOURCE UPLOAD
------------------------------------------------------------ */

async function uploadStudyResource(formData) {
    if (!requireAdmin()) return;

    if (!(formData instanceof FormData)) {
        uiAction("Invalid resource upload information.");
        return;
    }

    const file = formData.get("file");
    const title = String(formData.get("title") || "").trim();
    const bucket = String(formData.get("bucket") || "").trim();

    if (!file || !title || !bucket) {
        uiAction("Complete the resource information first.");
        return;
    }

    if (!STUDY_VERSE.storageBuckets.includes(bucket)) {
        uiAction("Invalid storage category.");
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        uiAction("Maximum file size is 20 MB.");
        return;
    }

    const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ];

    if (!allowedTypes.includes(file.type)) {
        uiAction("Only supported PDF, DOCX and TXT files are accepted.");
        return;
    }

    try {
        const db = getSupabase();

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

        const filePath = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await db.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { error: insertError } = await db
            .from(STUDY_VERSE.tables.resources)
            .insert({
                title,
                description: String(formData.get("description") || ""),
                subject: String(formData.get("subject") || ""),
                category: String(formData.get("category") || "General"),
                class_level: String(formData.get("class_level") || ""),
                resource_type: String(formData.get("resource_type") || "Study Material"),
                academic_year: String(formData.get("academic_year") || ""),
                chapter: String(formData.get("chapter") || ""),
                file_path: `${bucket}/${filePath}`,
                uploaded_by: currentUser.id,
                is_published: false
            });

        if (insertError) {
            await db.storage.from(bucket).remove([filePath]);
            throw insertError;
        }

        uiAction("Resource uploaded for review.");

        await loadLibraryResources();

    } catch (error) {
        showError(error, "Resource upload failed.");
    }
}

/* ------------------------------------------------------------
   21. ADMIN RESOURCE PUBLISHING
------------------------------------------------------------ */

async function setResourcePublished(resourceId, published) {
    if (!requireAdmin()) return;

    try {
        const db = getSupabase();

        const { error } = await db
            .from(STUDY_VERSE.tables.resources)
            .update({ is_published: Boolean(published) })
            .eq("id", resourceId);

        if (error) throw error;

        uiAction(
            published
                ? "Resource published."
                : "Resource unpublished."
        );

        await loadLibraryResources();

    } catch (error) {
        showError(error, "Unable to update resource.");
    }
}

/* ------------------------------------------------------------
   22. PROFILE UPDATE
------------------------------------------------------------ */

async function updateStudentProfile(updates) {
    if (!requireLogin()) return;

    const permittedFields = [
        "full_name",
        "class_level",
        "stream",
        "school",
        "district",
        "avatar_url"
    ];

    const safeUpdates = {};

    permittedFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(updates, field)) {
            safeUpdates[field] = updates[field];
        }
    });

    if (!Object.keys(safeUpdates).length) {
        uiAction("No profile changes were provided.");
        return;
    }

    try {
        const db = getSupabase();

        const { data, error } = await db
            .from(STUDY_VERSE.tables.profiles)
            .update(safeUpdates)
            .eq("id", currentUser.id)
            .select()
            .single();

        if (error) throw error;

        currentProfile = data;

        updateUserInterface();

        uiAction("Profile updated successfully.");

    } catch (error) {
        showError(error, "Profile update failed.");
    }
}

/* ------------------------------------------------------------
   23. GLOBAL SEARCH FOUNDATION
------------------------------------------------------------ */

async function searchStudyVerse(query) {
    const searchTerm = String(query || "").trim();

    if (searchTerm.length < 2) {
        uiAction("Enter at least two characters to search.");
        return [];
    }

    try {
        const db = getSupabase();

        const { data, error } = await db
            .from(STUDY_VERSE.tables.resources)
            .select("id,title,description,subject,category,class_level,resource_type")
            .eq("is_published", true)
            .or(
                `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%`
            )
            .limit(30);

        if (error) throw error;

        return data || [];

    } catch (error) {
        showError(error, "Search is temporarily unavailable.");
        return [];
    }
}

/* ------------------------------------------------------------
   24. STUDY VERSE EVENT SYSTEM
------------------------------------------------------------ */

function emitStudyVerseEvent(eventName, detail = {}) {
    window.dispatchEvent(
        new CustomEvent(`studyverse:${eventName}`, {
            detail
        })
    );
}

/* ------------------------------------------------------------
   25. FEATURE AVAILABILITY
------------------------------------------------------------ */

function showFeatureUnavailable(featureName) {
    uiAction(
        `${featureName} is not connected yet. It will be enabled after its implementation.`,
        "info"
    );
}

/* ------------------------------------------------------------
   26. CONNECTION STATUS
------------------------------------------------------------ */

function monitorConnection() {
    function updateStatus() {
        const status = navigator.onLine ? "Online" : "Offline";

        setText("connectionStatus", status);

        emitStudyVerseEvent("connection", {
            online: navigator.onLine
        });
    }

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    updateStatus();
}

/* ------------------------------------------------------------
   27. APPLICATION INITIALISATION
------------------------------------------------------------ */

async function startApp() {
    if (appInitialized) return;

    appInitialized = true;

    setDynamicGreeting();
    monitorConnection();

    // Session restoration must not block the splash transition.
    restoreSession();

    setTimeout(() => {
        const splash = getElement("splashScreen");

        if (splash) {
            splash.style.animation = "fadeOut 0.5s forwards";
        }

        setTimeout(() => {
            if (splash) {
                splash.classList.remove("active-flex");
                splash.classList.add("hidden");
            }

            const onboarding = getElement("onboardingScreen");

            if (onboarding) {
                onboarding.classList.remove("hidden");
                onboarding.classList.add("active-flex");
            }

        }, 500);

    }, 2500);
}

/* ------------------------------------------------------------
   28. PUBLIC APPLICATION API
------------------------------------------------------------ */

window.StudyVerse = Object.freeze({
    version: STUDY_VERSE.version,

    getUser: () => currentUser,
    getProfile: () => currentProfile,

    isAdmin,
    isEducator,
    isApprovedUser,

    refreshAdminDashboard,
    loadAdminDashboard,

    loadLibraryResources,
    searchStudyVerse,

    updateStudentProfile,
    emit: emitStudyVerseEvent
});

/* ------------------------------------------------------------
   29. GLOBAL FUNCTIONS
   Required for existing HTML onclick handlers.
------------------------------------------------------------ */

Object.assign(window, {
    registerStudent,
    loginStudent,
    logoutStudent,
    restoreSession,
    resetStudentPassword,

    navigateTo,
    goBack,
    toggleAuthMode,
    completeOnboarding,

    setDynamicGreeting,

    loadAdminDashboard,
    refreshAdminDashboard,
    updateStudentStatus,
    filterAdminStudents,

    loadLibraryResources,
    downloadStudyResource,
    uploadStudyResource,
    setResourcePublished,

    updateStudentProfile,
    searchStudyVerse,
    showFeatureUnavailable
});

/* ------------------------------------------------------------
   30. START APPLICATION
------------------------------------------------------------ */

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
} else {
    startApp();
}

/* ============================================================
   END OF STUDY VERSE CORE ENGINE
   ============================================================ 
