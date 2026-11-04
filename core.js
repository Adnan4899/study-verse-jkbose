const supabaseUrl = 'https://fwxraksvzrofgjbqvplm.supabase.co';
const supabaseKey = 'sb_publishable_Fc7hos5g-BoT0cVWBnVWSQ_IC8OdPAh'; // Paste your actual key here before committing if possible

let supabaseClient = null;
function getSupabase() {
    if (!supabaseClient) {
        if (!window.supabase) {
            uiAction("Network error. Please check internet connection.");
            throw new Error("Supabase library not loaded.");
        }
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    }
    return supabaseClient;
}

async function registerStudent() {
    const name = document.getElementById('regName')?.value.trim();
    const studentClass = document.getElementById('regClass')?.value; 
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPass')?.value;
    const btn = document.getElementById('regBtn');

    if (!name || !studentClass || !email || !password) {
        uiAction("Please fill all onboarding fields.");
        return;
    }

    if (btn) btn.innerText = "Registering...";
    
    try {
        const db = getSupabase();
        const { data: authData, error: authError } = await db.auth.signUp({
            email: email, password: password,
        });

        if (authError) {
            uiAction(authError.message);
            if (btn) btn.innerText = "Register Account";
            return;
        }

        const { error: profileError } = await db.from('profiles').insert([{ 
            id: authData.user.id, full_name: name, email: email, class: studentClass, status: 'PENDING' 
        }]);

        if (profileError) {
            uiAction("Profile creation blocked. Check RLS.");
            if (btn) btn.innerText = "Register Account";
            return;
        }

        uiAction("Account Created! You can now log in.");
        if (btn) btn.innerText = "Register Account";
        
        if (document.getElementById('regName')) document.getElementById('regName').value = '';
        if (document.getElementById('regClass')) document.getElementById('regClass').value = '';
        if (document.getElementById('regEmail')) document.getElementById('regEmail').value = '';
        if (document.getElementById('regPass')) document.getElementById('regPass').value = '';
        toggleAuthMode('login');
        
    } catch (err) {
        if (btn) btn.innerText = "Register Account";
    }
}

async function loginStudent() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPass')?.value;
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        uiAction("Enter email and password.");
        return;
    }

    if (btn) btn.innerText = "Authenticating...";

    try {
        const db = getSupabase();
        const { data, error } = await db.auth.signInWithPassword({
            email: email, password: password
        });

        if (error) {
            uiAction("Invalid login credentials.");
            if (btn) btn.innerText = "Secure Login";
            return;
        }

        const { data: profile } = await db.from('profiles').select('full_name').eq('id', data.user.id).single();

        if (profile) {
            const nameDisplay = document.getElementById('studentNameDisplay');
            if (nameDisplay) nameDisplay.innerText = profile.full_name.split(' ')[0]; 
        }

        uiAction("Login Successful!");
        if (btn) btn.innerText = "Secure Login";
        
        if (document.getElementById('loginEmail')) document.getElementById('loginEmail').value = '';
        if (document.getElementById('loginPass')) document.getElementById('loginPass').value = '';
        
        const homeTab = document.querySelectorAll('.tab-item')[0];
        if (homeTab) navigateTo('homeView', homeTab);
        
    } catch (err) {
        if (btn) btn.innerText = "Secure Login";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setDynamicGreeting();

    setTimeout(() => {
        const splash = document.getElementById("splashScreen");
        if (splash) splash.style.animation = "fadeOut 0.5s forwards";
        setTimeout(() => {
            if (splash) {
                splash.classList.remove("active-flex");
                splash.classList.add("hidden");
            }
            const onboarding = document.getElementById("onboardingScreen");
            if (onboarding) {
                onboarding.classList.remove("hidden");
                onboarding.classList.add("active-flex");
            }
        }, 500);
    }, 2500);

    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            chips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            uiAction('Filtering library by: ' + e.target.innerText);
        });
    });
});

function setDynamicGreeting() {
    const hour = new Date().getHours();
    let greeting = "Good Evening,";
    if (hour >= 5 && hour < 12) greeting = "Good Morning,";
    else if (hour >= 12 && hour < 17) greeting = "Good Afternoon,";
    
    const greetingEl = document.getElementById("dynamicGreeting");
    if (greetingEl) greetingEl.innerText = greeting;
}

function completeOnboarding() {
    const onboarding = document.getElementById("onboardingScreen");
    const appRoot = document.getElementById("app-root");
    const bottomNav = document.getElementById("bottomNav");
    
    if (onboarding) onboarding.style.animation = "fadeOut 0.4s forwards";
    setTimeout(() => {
        if (onboarding) {
            onboarding.classList.remove("active-flex");
            onboarding.classList.add("hidden");
        }
        if (appRoot) appRoot.classList.remove("hidden");
        if (bottomNav) bottomNav.classList.remove("hidden");
    }, 400);
}

function navigateTo(viewId, element) {
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    if (element) element.classList.add('active');
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');
}

let toastTimeout;
function uiAction(actionMessage) {
    const toast = document.getElementById("uiToast");
    if (!toast) return;
    
    toast.innerText = actionMessage;
    toast.classList.remove("hidden");
    toast.style.opacity = "1";
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.classList.add("hidden"), 300);
    }, 2000);
}

function toggleAuthMode(mode) {
    const login = document.getElementById('loginForm');
    const register = document.getElementById('registerForm');
    
    if (!login || !register) return;
    
    if (mode === 'register') {
        login.classList.add('hidden');
        register.classList.remove('hidden');
    } else {
        register.classList.add('hidden');
        login.classList.remove('hidden');
    }
}
