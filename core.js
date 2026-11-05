
/* ============================================================
   STUDY VERSE — GLOBAL LEARNING ECOSYSTEM
   Core Application Engine
   Founder: Adnan Manzoor
   Version: 2.1.0
   ============================================================ */

"use strict";

/* ------------------------------------------------------------
   1. APPLICATION CONFIGURATION
------------------------------------------------------------ */

const STUDY_VERSE = Object.freeze({
    name: "STUDY VERSE",
    tagline: "Learn • Explore • Evolve",
    founder: "Adnan Manzoor",
    version: "2.1.0",

    supabaseUrl: "https://fwxraksvzrofgjbqvplm.supabase.co",
    supabaseKey: "sb_publishable_Fc7hos5g-BoT0cVWBnVWSQ_IC8OdPAh",

    tables: {
        profiles: "profiles",
        resources: "study_resources",
        posts: "posts",
        founder: "founder_profile"
    },

    storageBuckets: [
        "PYQs",
        "Guess Papers",
        "Study Materials",
        "jkbose-notes"
    ],

    founderBucket: "founder-media",

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
    },

    founderImageMaxSize: 5 * 1024 * 1024,
    resourceMaxSize: 20 * 1024 * 1024
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

let founderProfile = null;
let founderImageObject = null;
let founderImageBlob = null;
let founderImageFile = null;

let founderCropState = {
    zoom: 1,
    x: 0.5,
    y: 0.5
};

let appInitialized = false;
let founderEditorInitialized = false;

/* ------------------------------------------------------------
   3. SUPABASE CONNECTION
------------------------------------------------------------ */

function getSupabase() {
    if (supabaseClient) return supabaseClient;

    if (!window.supabase) {
        throw new Error(
            "Supabase library is not loaded. Check index.html."
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

function setText(id, value) {
    const element = getElement(id);
    if (element) element.textContent = value ?? "";
}

function setButtonText(button, text) {
    if (button) button.textContent = text;
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

    uiAction(
        error?.message || fallback,
        "error"
    );
}

function setLoading(element, loading, loadingText = "Please wait...") {
    if (!element) return;

    if (loading) {
        if (!element.dataset.originalText) {
            element.dataset.originalText = element.textContent;
        }

        element.disabled = true;
        element.textContent = loadingText;
    } else {
        element.disabled = false;

        if (element.dataset.originalText) {
            element.textContent = element.dataset.originalText;
            delete element.dataset.originalText;
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
    document.querySelectorAll("[data-admin-only]").forEach(element => {
        element.classList.toggle("hidden", !isAdmin());
    });

    document.querySelectorAll("[data-educator-only]").forEach(element => {
        element.classList.toggle(
            "hidden",
            !(isEducator() || isAdmin())
        );
    });

    setText("accountRole", currentProfile?.role || "GUEST");
    setText("accountStatus", currentProfile?.status || "NOT LOGGED IN");
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
        if (!data.user) throw new Error("Account creation was unsuccessful.");

        uiAction(
            data.session
                ? "Registration received. Your account awaits approval."
                : "Registration received. Check your email if confirmation is required."
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

            throw new Error(
                "Your account is awaiting administrator approval."
            );
        }

        currentUser = data.user;
        currentProfile = profile;

        updateUserInterface();

        ["loginEmail", "loginPass"].forEach(id => {
            const element = getElement(id);
            if (element) element.value = "";
        });

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
            currentUser = null;
            currentProfile = null;
            return false;
        }

        currentUser = session.user;
        currentProfile = profile;

        updateUserInterface();

        return true;

    } catch (error) {
        console.error("[Study Verse] Session restoration:", error);
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
    setText(
        "profileStudentId",
        currentProfile.student_id || "Not assigned"
    );

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

        window.location.reload();

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

        uiAction(
            "If the account exists, password reset instructions will be sent."
        );

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
        loadFounderEditor();
    }

    if (viewId === "libraryView") {
        loadLibraryResources();
    }

    if (viewId === "founderView") {
        loadPublicFounderProfile();
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
   15. ADMIN DASHBOARD
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
        const pending = adminStudents.filter(s => s.status === "PENDING").length;
        const approved = adminStudents.filter(s => s.status === "APPROVED").length;
        const rejected = adminStudents.filter(s => s.status === "REJECTED").length;
        const suspended = adminStudents.filter(s => s.status === "SUSPENDED").length;

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

    const allowedStatuses = ["APPROVED", "REJECTED", "SUSPENDED"];

    if (!allowedStatuses.includes(newStatus)) {
        uiAction("Invalid account status.");
        return;
    }

    if (!studentId || studentId === currentUser.id) {
        uiAction("This account cannot be changed here.");
        return;
    }

    if (!window.confirm(`Change this student's status to ${newStatus}?`)) {
        return;
    }

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
        showError(error, "Unable to update student status.");
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

        return matchesSearch && (!status || student.status === status);
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
        filterLibraryResources();

    } catch (error) {
        console.error("[Study Verse] Library loading:", error);
        uiAction("Unable to load learning resources.");
    }
}

function filterLibraryResources() {
    const search = getValue("librarySearch").toLowerCase();
    const category = getValue("libraryCategory").toLowerCase();

    const filtered = libraryResources.filter(resource => {
        const text = [
            resource.title,
            resource.description,
            resource.subject,
            resource.category,
            resource.resource_type,
            resource.class_level
        ].join(" ").toLowerCase();

        const matchesSearch = !search || text.includes(search);
        const matchesCategory = !category ||
            String(resource.category || "").toLowerCase() === category;

        return matchesSearch && matchesCategory;
    });

    renderLibraryResources(filtered);
}

function renderLibraryResources(resources) {
    const container = getElement("libraryResourceList");
    if (!container) return;

    if (!resources || resources.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No published resources found</h3>
                <p>Try another search or category.</p>
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

        const resource = libraryResources.find(item => item.id === resourceId);

        if (!resource || !resource.file_path) {
            throw new Error("Resource not found.");
        }

        const parts = resource.file_path.split("/");
        const bucket = parts.shift();
        const path = parts.join("/");

        if (!STUDY_VERSE.storageBuckets.includes(bucket) || !path) {
            throw new Error("The resource storage path is invalid.");
        }

        const { data, error } = await db.storage
            .from(bucket)
            .createSignedUrl(path, 60);

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

    if (file.size > STUDY_VERSE.resourceMaxSize) {
        uiAction("Maximum file size is 20 MB.");
        return;
    }

    const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ];

    if (!allowedTypes.includes(file.type)) {
        uiAction("Only PDF, DOCX and TXT files are accepted.");
        return;
    }

    let uploadedPath = null;

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

        uploadedPath = filePath;

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

        if (insertError) throw insertError;

        uploadedPath = null;

        uiAction("Resource uploaded for review.");
        await loadLibraryResources();

    } catch (error) {
        if (uploadedPath) {
            await getSupabase().storage
                .from(bucket)
                .remove([uploadedPath]);
        }

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
            published ? "Resource published." : "Resource unpublished."
        );

        await loadLibraryResources();

    } catch (error) {
        showError(error, "Unable to update resource.");
    }
}

/* ------------------------------------------------------------
   22. STUDENT PROFILE UPDATE
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
        if (
            updates &&
            Object.prototype.hasOwnProperty.call(updates, field)
        ) {
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
   23. GLOBAL RESOURCE SEARCH
------------------------------------------------------------ */

async function searchStudyVerse(query) {
    const searchTerm = String(query || "").trim();

    if (searchTerm.length < 2) {
        uiAction("Enter at least two characters to search.");
        return [];
    }

    try {
        const db = getSupabase();

        // Search characters that could alter PostgREST filter syntax
        // are removed before constructing the OR expression.
        const safeTerm = searchTerm
            .replace(/[,%()_*]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (safeTerm.length < 2) return [];

        const { data, error } = await db
            .from(STUDY_VERSE.tables.resources)
            .select("id,title,description,subject,category,class_level,resource_type")
            .eq("is_published", true)
            .or(
                `title.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%,subject.ilike.%${safeTerm}%`
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
   24. FOUNDER PROFILE — PUBLIC DISPLAY
------------------------------------------------------------ */

function getFounderImageUrl(imagePath) {
    if (!imagePath) return "";

    const { data } = getSupabase()
        .storage
        .from(STUDY_VERSE.founderBucket)
        .getPublicUrl(imagePath);

    return data?.publicUrl || "";
}

function setFounderImage(imagePath) {
    const imageUrl = getFounderImageUrl(imagePath);

    const imageIds = [
        "founderPublicImage",
        "founderEditorPreview"
    ];

    imageIds.forEach(id => {
        const image = getElement(id);
        if (!image) return;

        if (imageUrl) {
            image.src = imageUrl;
            image.classList.remove("hidden");
        } else {
            image.removeAttribute("src");
            image.classList.add("hidden");
        }
    });
}

async function loadPublicFounderProfile() {
    try {
        const db = getSupabase();

        const { data, error } = await db
            .from(STUDY_VERSE.tables.founder)
            .select("*")
            .eq("id", 1)
            .eq("is_published", true)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            setText("founderPublicName", STUDY_VERSE.founder);
            setText("founderPublicDesignation", "Founder & Creator");
            setText(
                "founderPublicBiography",
                "The Founder profile will be available here soon."
            );

            setFounderImage(null);
            return null;
        }

        founderProfile = data;

        setText("founderPublicName", data.founder_name);
        setText("founderPublicDesignation", data.designation);
        setText("founderPublicBiography", data.biography);
        setText("founderPublicVision", data.vision);
        setText("founderPublicMission", data.mission);

        setFounderImage(data.image_path);

        renderFounderSocialLinks(data.social_links || {});

        return data;

    } catch (error) {
        console.error("[Study Verse] Founder profile:", error);
        uiAction("Unable to load the Founder profile.");
        return null;
    }
}

function renderFounderSocialLinks(links) {
    const container = getElement("founderPublicSocialLinks");
    if (!container) return;

    const allowed = [
        ["website", "Website"],
        ["instagram", "Instagram"],
        ["linkedin", "LinkedIn"],
        ["youtube", "YouTube"],
        ["x", "X"]
    ];

    const validLinks = allowed
        .map(([key, label]) => {
            const url = validateSocialUrl(links[key]);
            return url ? { label, url } : null;
        })
        .filter(Boolean);

    container.innerHTML = validLinks.map(item => `
        <a
            href="${escapeHTML(item.url)}"
            target="_blank"
            rel="noopener noreferrer"
        >${escapeHTML(item.label)}</a>
    `).join("");
}

/* ------------------------------------------------------------
   25. FOUNDER PROFILE — ADMIN EDITOR
------------------------------------------------------------ */

async function loadFounderEditor() {
    if (!requireAdmin()) return null;

    try {
        const db = getSupabase();

        const { data, error } = await db
            .from(STUDY_VERSE.tables.founder)
            .select("*")
            .eq("id", 1)
            .maybeSingle();

        if (error) throw error;

        founderProfile = data || null;

        if (!data) {
            uiAction("Founder profile record was not found.", "error");
            return null;
        }

        setValueIfPresent("founderNameInput", data.founder_name);
        setValueIfPresent("founderDesignationInput", data.designation);
        setValueIfPresent("founderBiographyInput", data.biography);
        setValueIfPresent("founderVisionInput", data.vision);
        setValueIfPresent("founderMissionInput", data.mission);

        const links = data.social_links || {};

        setValueIfPresent("founderWebsiteInput", links.website || "");
        setValueIfPresent("founderInstagramInput", links.instagram || "");
        setValueIfPresent("founderLinkedInInput", links.linkedin || "");
        setValueIfPresent("founderYouTubeInput", links.youtube || "");
        setValueIfPresent("founderXInput", links.x || "");

        const publishControl = getElement("founderPublishToggle");

        if (publishControl) {
            publishControl.checked = Boolean(data.is_published);
        }

        setText(
            "founderPublishStatus",
            data.is_published ? "Published" : "Not published"
        );

        setFounderImage(data.image_path);

        const preview = getElement("founderEditorPreview");

        if (preview && data.image_path) {
            preview.src = getFounderImageUrl(data.image_path);
            preview.classList.remove("hidden");
        }

        return data;

    } catch (error) {
        showError(error, "Unable to load Founder editor.");
        return null;
    }
}

function setValueIfPresent(id, value) {
    const element = getElement(id);
    if (element) element.value = value ?? "";
}

function validateSocialUrl(value) {
    const raw = String(value || "").trim();

    if (!raw) return "";

    try {
        const url = new URL(
            /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
        );

        if (!["http:", "https:"].includes(url.protocol)) {
            return "";
        }

        return url.href;

    } catch {
        return "";
    }
}

function getFounderEditorData() {
    const socialLinks = {
        website: validateSocialUrl(getValue("founderWebsiteInput")),
        instagram: validateSocialUrl(getValue("founderInstagramInput")),
        linkedin: validateSocialUrl(getValue("founderLinkedInInput")),
        youtube: validateSocialUrl(getValue("founderYouTubeInput")),
        x: validateSocialUrl(getValue("founderXInput"))
    };

    return {
        founder_name: getValue("founderNameInput") || STUDY_VERSE.founder,
        designation: getValue("founderDesignationInput") || "Founder & Creator",
        biography: getValue("founderBiographyInput"),
        vision: getValue("founderVisionInput"),
        mission: getValue("founderMissionInput"),
        social_links: socialLinks
    };
}

async function saveFounderProfile() {
    if (!requireAdmin()) return;

    const button = getElement("founderSaveButton");
    setLoading(button, true, "Saving profile...");

    let newlyUploadedPath = null;

    try {
        const db = getSupabase();
        const profileData = getFounderEditorData();

        if (!profileData.founder_name) {
            throw new Error("Founder name is required.");
        }

        const oldImagePath = founderProfile?.image_path || null;
        let imagePath = oldImagePath;

        // Upload a newly cropped image before updating the profile.
        if (founderImageBlob) {
            newlyUploadedPath =
                `founder/portrait-${Date.now()}-${crypto.randomUUID()}.webp`;

            const { error: uploadError } = await db.storage
                .from(STUDY_VERSE.founderBucket)
                .upload(newlyUploadedPath, founderImageBlob, {
                    contentType: "image/webp",
                    cacheControl: "3600",
                    upsert: false
                });

            if (uploadError) throw uploadError;

            imagePath = newlyUploadedPath;
        }

        const publishControl = getElement("founderPublishToggle");

        const updateData = {
            ...profileData,
            image_path: imagePath,
            is_published: Boolean(publishControl?.checked),
            updated_at: new Date().toISOString()
        };

        const { data: updated, error: updateError } = await db
            .from(STUDY_VERSE.tables.founder)
            .update(updateData)
            .eq("id", 1)
            .select()
            .maybeSingle();

        if (updateError) throw updateError;

        let savedProfile = updated;

        // Fallback only if the initial row does not exist.
        if (!savedProfile) {
            const { data: inserted, error: insertError } = await db
                .from(STUDY_VERSE.tables.founder)
                .insert({
                    id: 1,
                    ...updateData
                })
                .select()
                .single();

            if (insertError) throw insertError;

            savedProfile = inserted;
        }

        founderProfile = savedProfile;
        founderImageBlob = null;
        founderImageFile = null;

        setText(
            "founderPublishStatus",
            savedProfile.is_published ? "Published" : "Not published"
        );

        // Remove the old image only after the database update succeeds.
        if (
            oldImagePath &&
            newlyUploadedPath &&
            oldImagePath !== newlyUploadedPath
        ) {
            const { error: removeError } = await db.storage
                .from(STUDY_VERSE.founderBucket)
                .remove([oldImagePath]);

            if (removeError) {
                console.warn(
                    "[Study Verse] Old Founder image could not be removed:",
                    removeError
                );
            }
        }

        uiAction("Founder profile saved successfully.", "success");

        await loadPublicFounderProfile();
        await loadFounderEditor();

    } catch (error) {
        // Keep the previous profile and old image intact if saving fails.
        if (newlyUploadedPath) {
            await getSupabase()
                .storage
                .from(STUDY_VERSE.founderBucket)
                .remove([newlyUploadedPath]);
        }

        showError(error, "Unable to save Founder profile.");

    } finally {
        setLoading(button, false);
    }
}

/* ------------------------------------------------------------
   26. FOUNDER IMAGE — FILE SELECTION
------------------------------------------------------------ */

function initializeFounderEditor() {
    if (founderEditorInitialized) return;
    founderEditorInitialized = true;

    const input = getElement("founderImageInput");

    if (input) {
        input.addEventListener("change", handleFounderImageSelection);
    }

    const zoom = getElement("founderZoom");
    const positionX = getElement("founderPositionX");
    const positionY = getElement("founderPositionY");

    if (zoom) {
        zoom.addEventListener("input", () => {
            founderCropState.zoom = Number(zoom.value) || 1;
            drawFounderCropPreview();
        });
    }

    if (positionX) {
        positionX.addEventListener("input", () => {
            founderCropState.x = Number(positionX.value) / 100;
            drawFounderCropPreview();
        });
    }

    if (positionY) {
        positionY.addEventListener("input", () => {
            founderCropState.y = Number(positionY.value) / 100;
            drawFounderCropPreview();
        });
    }

    const saveButton = getElement("founderSaveButton");

    if (saveButton) {
        saveButton.addEventListener("click", saveFounderProfile);
    }

    const resetButton = getElement("founderCropReset");

    if (resetButton) {
        resetButton.addEventListener("click", resetFounderCrop);
    }
}

function handleFounderImageSelection(event) {
    if (!requireAdmin()) return;

    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        uiAction("Choose a JPG, PNG or WebP image.");
        event.target.value = "";
        return;
    }

    if (file.size > STUDY_VERSE.founderImageMaxSize) {
        uiAction("Founder image must be 5 MB or smaller.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        const image = new Image();

        image.onload = () => {
            founderImageObject = image;
            founderImageFile = file;
            founderImageBlob = null;

            founderCropState = {
                zoom: 1,
                x: 0.5,
                y: 0.5
            };

            setValueIfPresent("founderZoom", "1");
            setValueIfPresent("founderPositionX", "50");
            setValueIfPresent("founderPositionY", "50");

            const cropPanel = getElement("founderCropPanel");

            if (cropPanel) {
                cropPanel.classList.remove("hidden");
            }

            drawFounderCropPreview();
            uiAction("Image loaded. Adjust the crop and save your profile.");
        };

        image.onerror = () => {
            uiAction("This image could not be opened.", "error");
        };

        image.src = reader.result;
    };

    reader.onerror = () => {
        uiAction("Unable to read the selected image.", "error");
    };

    reader.readAsDataURL(file);
}

/* ------------------------------------------------------------
   27. FOUNDER IMAGE — CIRCULAR CROP PREVIEW
------------------------------------------------------------ */

function drawFounderCropPreview() {
    const canvas = getElement("founderCropCanvas");

    if (!canvas || !founderImageObject) return;

    const context = canvas.getContext("2d");
    const size = 500;

    canvas.width = size;
    canvas.height = size;

    context.clearRect(0, 0, size, size);

    const image = founderImageObject;

    const baseScale = Math.max(
        size / image.width,
        size / image.height
    );

    const scale = baseScale * founderCropState.zoom;

    const width = image.width * scale;
    const height = image.height * scale;

    const maxOffsetX = Math.max(0, width - size);
    const maxOffsetY = Math.max(0, height - size);

    const x = -maxOffsetX * founderCropState.x;
    const y = -maxOffsetY * founderCropState.y;

    context.save();

    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    context.clip();

    context.drawImage(image, x, y, width, height);

    context.restore();
}

function resetFounderCrop() {
    founderCropState = {
        zoom: 1,
        x: 0.5,
        y: 0.5
    };

    setValueIfPresent("founderZoom", "1");
    setValueIfPresent("founderPositionX", "50");
    setValueIfPresent("founderPositionY", "50");

    drawFounderCropPreview();
}

async function prepareFounderCroppedImage() {
    const canvas = getElement("founderCropCanvas");

    if (!canvas || !founderImageObject) {
        return null;
    }

    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (!blob) {
                reject(new Error("Unable to prepare the cropped image."));
                return;
            }

            founderImageBlob = blob;
            resolve(blob);
        }, "image/webp", 0.92);
    });
}

/* ------------------------------------------------------------
   28. FOUNDER IMAGE — PREPARE BEFORE SAVE
------------------------------------------------------------ */

async function saveFounderProfileWithImage() {
    if (founderImageObject && !founderImageBlob) {
        try {
            await prepareFounderCroppedImage();
        } catch (error) {
            showError(error, "Unable to prepare Founder image.");
            return;
        }
    }

    await saveFounderProfile();
}

/* ------------------------------------------------------------
   29. EVENT SYSTEM
------------------------------------------------------------ */

function emitStudyVerseEvent(eventName, detail = {}) {
    window.dispatchEvent(
        new CustomEvent(`studyverse:${eventName}`, {
            detail
        })
    );
}

/* ------------------------------------------------------------
   30. FEATURE AVAILABILITY
------------------------------------------------------------ */

function showFeatureUnavailable(featureName) {
    uiAction(
        `${featureName} is not connected yet. It will be enabled after implementation.`,
        "info"
    );
}

/* ------------------------------------------------------------
   31. CONNECTION STATUS
------------------------------------------------------------ */

function monitorConnection() {
    function updateStatus() {
        const online = navigator.onLine;

        setText(
            "connectionStatus",
            online ? "Online" : "Offline"
        );

        emitStudyVerseEvent("connection", { online });
    }

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    updateStatus();
}

/* ------------------------------------------------------------
   32. SEARCH AND FILTER EVENT LISTENERS
------------------------------------------------------------ */

function initializeSearchControls() {
    const adminSearch = getElement("adminStudentSearch");
    const adminFilter = getElement("adminStatusFilter");

    const librarySearch = getElement("librarySearch");
    const libraryCategory = getElement("libraryCategory");

    if (adminSearch) {
        adminSearch.addEventListener("input", filterAdminStudents);
    }

    if (adminFilter) {
        adminFilter.addEventListener("change", filterAdminStudents);
    }

    if (librarySearch) {
        librarySearch.addEventListener("input", filterLibraryResources);
    }

    if (libraryCategory) {
        libraryCategory.addEventListener("change", filterLibraryResources);
    }
}

/* ------------------------------------------------------------
   33. APPLICATION INITIALISATION
------------------------------------------------------------ */

async function startApp() {
    if (appInitialized) return;

    appInitialized = true;

    setDynamicGreeting();
    monitorConnection();
    initializeSearchControls();
    initializeFounderEditor();

    let sessionRestored = false;

    // Wait for session restoration before deciding which screen to show.
    try {
        sessionRestored = await restoreSession();
    } catch (error) {
        console.error("[Study Verse] Startup session check:", error);
    }

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
            const appRoot = getElement("app-root");
            const bottomNav = getElement("bottomNav");

            if (sessionRestored) {
                if (onboarding) onboarding.classList.add("hidden");
                if (appRoot) appRoot.classList.remove("hidden");
                if (bottomNav) bottomNav.classList.remove("hidden");

                navigateTo("homeView");
            } else {
                if (onboarding) {
                    onboarding.classList.remove("hidden");
                    onboarding.classList.add("active-flex");
                }
            }

            // Load the public Founder profile when the interface is ready.
            loadPublicFounderProfile();

        }, 500);

    }, 1200);
}

/* ------------------------------------------------------------
   34. PUBLIC APPLICATION API
------------------------------------------------------------ */

window.StudyVerse = Object.freeze({
    version: STUDY_VERSE.version,

    getUser: () => currentUser,
    getProfile: () => currentProfile,
    getFounderProfile: () => founderProfile,

    isAdmin,
    isEducator,
    isApprovedUser,

    refreshAdminDashboard,
    loadAdminDashboard,

    loadLibraryResources,
    searchStudyVerse,

    updateStudentProfile,

    loadPublicFounderProfile,
    loadFounderEditor,
    saveFounderProfile: saveFounderProfileWithImage,

    emit: emitStudyVerseEvent
});

/* ------------------------------------------------------------
   35. GLOBAL FUNCTIONS
   Required for existing and upcoming HTML handlers.
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
    filterLibraryResources,
    downloadStudyResource,
    uploadStudyResource,
    setResourcePublished,

    updateStudentProfile,
    searchStudyVerse,
    showFeatureUnavailable,

    loadPublicFounderProfile,
    loadFounderEditor,
    saveFounderProfile: saveFounderProfileWithImage,
    initializeFounderEditor,
    resetFounderCrop
});

/* ------------------------------------------------------------
   36. START APPLICATION
------------------------------------------------------------ */

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
} else {
    startApp();
}

/* ============================================================
   END OF STUDY VERSE CORE ENGINE
   ============================================================ */
