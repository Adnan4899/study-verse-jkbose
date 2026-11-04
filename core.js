const supabaseUrl = 'https://fwxraksvzrofgjbqvplm.supabase.co';
const supabaseKey = 'sb_publishable_Fc7hos5g-BoT0cVWBnVWSQ_IC8OdPAh';
let supabaseClient = null;
let currentUser = null;
let currentProfile = null;
let toastTimeout = null;

function getSupabase() {
    if (!supabaseClient) {
        if (!window.supabase) {
            throw new Error('Supabase library is not loaded.');
        }

        supabaseClient = window.supabase.createClient(
            supabaseUrl,
            supabaseKey
        );
    }

    return supabaseClient;
}

function uiAction(message) {
    const toast = document.getElementById('uiToast');

    if (!toast) {
        console.log(message);
        return;
    }

    toast.innerText = message;
    toast.classList.remove('hidden');
    toast.style.opacity = '1';

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 2500);
}

function setButtonText(button, text) {
    if (button) button.innerText = text;
}

async function registerStudent() {
    const name = document.getElementById('regName')?.value.trim();
    const studentClass = document.getElementById('regClass')?.value;
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPass')?.value;
    const btn = document.getElementById('regBtn');

    if (!name || !studentClass || !email || !password) {
        uiAction('Please fill in all registration fields.');
        return;
    }

    if (password.length < 6) {
        uiAction('Password must contain at least 6 characters.');
        return;
    }

    setButtonText(btn, 'Registering...');

    try {
        const db = getSupabase();

        const { data, error } = await db.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    class_level: studentClass,
                    role: 'STUDENT'
                }
            }
        });

        if (error) throw error;

        if (!data.user) {
            throw new Error('Registration could not be completed.');
        }

        // Student profile is created automatically by the database trigger.
            const { error: profileError } = await db
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    email: email,
                    full_name: name,
                    class_level: studentClass,
                    role: 'STUDENT',
                    status: 'PENDING'
                }, { onConflict: 'id' });

            if (profileError) {
                console.error(profileError);
                uiAction('Account created, but profile setup needs attention.');
                return;
            }
        }

        uiAction(
            data.session
                ? 'Registration successful. Your account awaits approval.'
                : 'Registration received. Check your email to confirm your account.'
        );

        document.getElementById('regName').value = '';
        document.getElementById('regClass').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPass').value = '';

        toggleAuthMode('login');

    } catch (error) {
        console.error('Registration error:', error);
        uiAction(error.message || 'Registration failed.');
    } finally {
        setButtonText(btn, 'Register Account');
    }
}

async function loginStudent() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPass')?.value;
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        uiAction('Enter your email and password.');
        return;
    }

    setButtonText(btn, 'Authenticating...');

    try {
        const db = getSupabase();

        const { data, error } = await db.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        const { data: profile, error: profileError } = await db
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            await db.auth.signOut();
            throw new Error('Your student profile could not be found.');
        }

        if (profile.status !== 'APPROVED') {
            await db.auth.signOut();

            if (profile.status === 'REJECTED') {
                throw new Error('Your account application was not approved.');
            }

            if (profile.status === 'SUSPENDED') {
                throw new Error('Your account is suspended.');
            }

            throw new Error('Your account is awaiting administrator approval.');
        }

        currentUser = data.user;
        currentProfile = profile;

        const nameDisplay = document.getElementById('studentNameDisplay');

        if (nameDisplay) {
            nameDisplay.innerText = (profile.full_name || 'Student').split(' ')[0];
        }

        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPass').value = '';

        uiAction('Login successful!');

        const homeTab = document.querySelector('.tab-item');
        navigateTo('homeView', homeTab);

    } catch (error) {
        console.error('Login error:', error);
        uiAction(error.message || 'Unable to log in.');
    } finally {
        setButtonText(btn, 'Secure Login');
    }
}

async function restoreSession() {
    try {
        const db = getSupabase();

        const { data, error } = await db.auth.getSession();

        if (error) throw error;

        const session = data.session;

        if (!session) return;

        const { data: profile, error: profileError } = await db
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile || profile.status !== 'APPROVED') {
            await db.auth.signOut();
            return;
        }

        currentUser = session.user;
        currentProfile = profile;

        const nameDisplay = document.getElementById('studentNameDisplay');

        if (nameDisplay) {
            nameDisplay.innerText = (profile.full_name || 'Student').split(' ')[0];
        }
    } catch (error) {
        console.error('Session restoration error:', error);
    }
}

async function logoutStudent() {
    try {
        const db = getSupabase();
        const { error } = await db.auth.signOut();

        if (error) throw error;

        currentUser = null;
        currentProfile = null;

        uiAction('You have been logged out.');
        location.reload();

    } catch (error) {
        console.error('Logout error:', error);
        uiAction('Unable to log out. Please try again.');
    }
}

function setDynamicGreeting() {
    const hour = new Date().getHours();

    let greeting = 'Good Evening,';

    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning,';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon,';
    }

    const greetingEl = document.getElementById('dynamicGreeting');

    if (greetingEl) {
        greetingEl.innerText = greeting;
    }
}

function completeOnboarding() {
    const onboarding = document.getElementById('onboardingScreen');
    const appRoot = document.getElementById('app-root');
    const bottomNav = document.getElementById('bottomNav');

    if (onboarding) {
        onboarding.style.animation = 'fadeOut 0.4s forwards';
    }

    setTimeout(() => {
        if (onboarding) {
            onboarding.classList.remove('active-flex');
            onboarding.classList.add('hidden');
        }

        if (appRoot) appRoot.classList.remove('hidden');
        if (bottomNav) bottomNav.classList.remove('hidden');
    }, 400);
}

function navigateTo(viewId, element) {
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.remove('active');
    });

    if (element) element.classList.add('active');

    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.remove('active');
    });

    const targetView = document.getElementById(viewId);

    if (targetView) {
        targetView.classList.add('active');
    } else {
        console.warn('View not found:', viewId);
    }
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

document.addEventListener('DOMContentLoaded', async () => {
    setDynamicGreeting();

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', event => {
            document.querySelectorAll('.chip').forEach(item => {
                item.classList.remove('active');
            });

            event.currentTarget.classList.add('active');

            uiAction('Selected: ' + event.currentTarget.innerText);
        });
    });

    await restoreSession();

    setTimeout(() => {
        const splash = document.getElementById('splashScreen');

        if (splash) {
            splash.style.animation = 'fadeOut 0.5s forwards';
        }

        setTimeout(() => {
            if (splash) {
                splash.classList.remove('active-flex');
                splash.classList.add('hidden');
            }

            const onboarding = document.getElementById('onboardingScreen');

            if (onboarding) {
                onboarding.classList.remove('hidden');
                onboarding.classList.add('active-flex');
            }
        }, 500);
    }, 2500);
});

