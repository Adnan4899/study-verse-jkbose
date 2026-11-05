
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#080d1b">
    <meta name="description" content="Study Verse JKBOSE — Free educational resources, notes, previous year papers and learning support for students.">
    <title>Study Verse JKBOSE | Learn • Prepare • Achieve</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="premium.css">

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>

<body>
    <div class="ambient-mesh"></div>

    <!-- SPLASH SCREEN -->
    <div id="splashScreen" class="fullscreen-view active-flex">
        <div class="splash-content">
            <div class="splash-logo">
                <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <h1 class="brand-title">STUDY VERSE</h1>
            <p class="brand-subtitle">JKBOSE</p>
            <p class="intro-tagline">Learn • Prepare • Achieve</p>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
        </div>
    </div>

    <!-- INTRODUCTION -->
    <div id="onboardingScreen" class="intro-view hidden">
        <div class="intro-scroll-wrapper">
            <div class="intro-header-sec">
                <div class="intro-logo">
                    <i class="fa-solid fa-graduation-cap"></i>
                </div>
                <h1 class="intro-brand">STUDY VERSE<br>JKBOSE</h1>
                <p class="intro-tagline">Learn • Prepare • Achieve</p>
                <p class="intro-desc">
                    A free student-learning platform providing educational
                    resources, academic support and opportunities for learners.
                </p>
            </div>

            <div class="intro-section">
                <h3 class="intro-sec-title">Your Learning Space</h3>
                <div class="benefits-grid">
                    <div class="benefit-card"><i class="fa-solid fa-book-open"></i><span>Study Notes</span></div>
                    <div class="benefit-card"><i class="fa-solid fa-file-lines"></i><span>Previous Papers</span></div>
                    <div class="benefit-card"><i class="fa-solid fa-layer-group"></i><span>Study Materials</span></div>
                    <div class="benefit-card"><i class="fa-solid fa-list-check"></i><span>Syllabus</span></div>
                    <div class="benefit-card"><i class="fa-solid fa-file-signature"></i><span>Model Papers</span></div>
                    <div class="benefit-card"><i class="fa-solid fa-stopwatch"></i><span>Practice Tests</span></div>
                    <div class="benefit-card"><i class="fa-solid fa-bookmark"></i><span>Saved Resources</span></div>
                    <div class="benefit-card"><i class="fa-solid fa-bullhorn"></i><span>Exam Updates</span></div>
                </div>
            </div>

            <div class="founder-card">
                <div class="founder-badge">FOUNDER</div>
                <h3 class="founder-name">Adnan Manzoor</h3>
                <p class="founder-vision">
                    Making educational resources and learning opportunities
                    accessible to students, helping every learner move forward.
                </p>
            </div>

            <div class="intro-footer">
                <p class="closing-line">Your Learning Journey Starts Here.</p>
                <button class="btn-premium btn-large btn-explore" onclick="completeOnboarding()">
                    Explore Platform <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- MAIN APPLICATION -->
    <main id="app-root" class="hidden">

        <!-- HOME -->
        <section id="homeView" class="app-view active">
            <header class="home-header">
                <div class="user-greeting">
                    <p id="dynamicGreeting">Welcome,</p>
                    <h2 id="studentNameDisplay">Student</h2>
                </div>
                <div class="header-actions">
                    <button class="icon-btn" aria-label="Search" onclick="navigateTo('libraryView', document.querySelectorAll('.tab-item')[1])">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                    <button class="icon-btn" aria-label="Notifications" onclick="uiAction('Notifications will appear here.')">
                        <i class="fa-regular fa-bell"></i>
                    </button>
                </div>
            </header>

            <div class="scroll-container">
                <div class="hero-banner">
                    <div class="hero-content">
                        <p class="hero-eyebrow">WELCOME TO YOUR LEARNING SPACE</p>
                        <h3>Learn Without Limits.</h3>
                        <p>Explore free study resources and prepare with confidence.</p>
                        <button class="btn-premium" onclick="navigateTo('libraryView', document.querySelectorAll('.tab-item')[1])">
                            Explore Library <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <h3 class="section-title">Explore Categories</h3>
                <div class="quick-grid">
                    <div class="quick-card cyan-glow" onclick="navigateTo('libraryView', document.querySelectorAll('.tab-item')[1])">
                        <i class="fa-solid fa-book-open"></i><span>Notes</span>
                    </div>
                    <div class="quick-card blue-glow" onclick="navigateTo('libraryView', document.querySelectorAll('.tab-item')[1])">
                        <i class="fa-solid fa-file-lines"></i><span>PYQs</span>
                    </div>
                    <div class="quick-card purple-glow" onclick="navigateTo('learnView', document.querySelectorAll('.tab-item')[2])">
                        <i class="fa-solid fa-graduation-cap"></i><span>Learn Hub</span>
                    </div>
                    <div class="quick-card grey-glow" onclick="uiAction('Announcements will appear here.')">
                        <i class="fa-solid fa-bullhorn"></i><span>Updates</span>
                    </div>
                </div>

                <h3 class="section-title">Choose Your Class</h3>
                <div class="class-list">
                    <div class="class-card" onclick="openClassResources('9th')">
                        <div class="class-info"><h2>Class 9th</h2><p>Secondary School</p></div>
                        <div class="class-action"><i class="fa-solid fa-arrow-right"></i></div>
                    </div>
                    <div class="class-card" onclick="openClassResources('10th')">
                        <div class="class-info"><h2>Class 10th</h2><p>Secondary School Examination</p></div>
                        <div class="class-action"><i class="fa-solid fa-arrow-right"></i></div>
                    </div>
                    <div class="class-card" onclick="openClassResources('11th')">
                        <div class="class-info"><h2>Class 11th</h2><p>Higher Secondary Part I</p></div>
                        <div class="class-action"><i class="fa-solid fa-arrow-right"></i></div>
                    </div>
                    <div class="class-card" onclick="openClassResources('12th')">
                        <div class="class-info"><h2>Class 12th</h2><p>Higher Secondary Part II</p></div>
                        <div class="class-action"><i class="fa-solid fa-arrow-right"></i></div>
                    </div>
                </div>

                <h3 class="section-title">Study Verse Features</h3>
                <div class="horizontal-scroll">
                    <div class="featured-card" onclick="openResourceCategory('Notes')">
                        <i class="fa-solid fa-star"></i><h4>Study Notes</h4>
                    </div>
                    <div class="featured-card" onclick="openResourceCategory('PYQs')">
                        <i class="fa-solid fa-clock-rotate-left"></i><h4>Previous Papers</h4>
                    </div>
                    <div class="featured-card" onclick="openResourceCategory('Guess Papers')">
                        <i class="fa-solid fa-lightbulb"></i><h4>Guess Papers</h4>
                    </div>
                    <div class="featured-card" onclick="openResourceCategory('Model Papers')">
                        <i class="fa-solid fa-file-signature"></i><h4>Model Papers</h4>
                    </div>
                </div>

                <div class="ai-mentor-card">
                    <div class="ai-badge">COMING SOON</div>
                    <div class="ai-content">
                        <div class="ai-icon"><i class="fa-solid fa-robot"></i></div>
                        <div class="ai-text">
                            <h3>AI Study Mentor</h3>
                            <p>AI-powered learning assistance is planned for a future release.</p>
                        </div>
                    </div>
                </div>

                <h3 class="section-title">Practice Zone</h3>
                <div class="test-grid">
                    <div class="test-item" onclick="navigateTo('testsView', document.querySelectorAll('.tab-item')[3])">
                        <i class="fa-solid fa-check-double"></i><span>MCQ Tests</span>
                    </div>
                    <div class="test-item" onclick="navigateTo('testsView', document.querySelectorAll('.tab-item')[3])">
                        <i class="fa-solid fa-stopwatch"></i><span>Chapter Tests</span>
                    </div>
                    <div class="test-item" onclick="navigateTo('testsView', document.querySelectorAll('.tab-item')[3])">
                        <i class="fa-solid fa-pen-to-square"></i><span>Practice</span>
                    </div>
                    <div class="test-item" onclick="navigateTo('testsView', document.querySelectorAll('.tab-item')[3])">
                        <i class="fa-solid fa-chart-simple"></i><span>Results</span>
                    </div>
                </div>

                <footer class="app-footer">
                    <h2 class="footer-brand">STUDY VERSE JKBOSE</h2>
                    <p class="footer-slogan">Learn • Prepare • Achieve</p>
                    <div class="footer-divider"></div>
                    <p class="footer-founder">Founder: Adnan Manzoor</p>
                    <p>Free learning resources for students.</p>
                </footer>
            </div>
        </section>

        <!-- DIGITAL LIBRARY -->
        <section id="libraryView" class="app-view">
            <header class="home-header library-header">
                <div>
                    <h2>Digital Library</h2>
                    <p>Explore free educational resources</p>
                </div>
                <div class="search-bar">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="search" id="librarySearch" placeholder="Search title, subject or chapter..." oninput="filterResources()">
                </div>
            </header>

            <div class="scroll-container">
                <div class="library-filters">
                    <select id="classFilter" onchange="filterResources()">
                        <option value="">All Classes</option>
                        <option value="9th">Class 9th</option>
                        <option value="10th">Class 10th</option>
                        <option value="11th">Class 11th</option>
                        <option value="12th">Class 12th</option>
                    </select>

                    <select id="subjectFilter" onchange="filterResources()">
                        <option value="">All Subjects</option>
                    </select>

                    <select id="typeFilter" onchange="filterResources()">
                        <option value="">All Resource Types</option>
                        <option value="Notes">Notes</option>
                        <option value="PYQs">PYQs</option>
                        <option value="Guess Papers">Guess Papers</option>
                        <option value="Model Papers">Model Papers</option>
                        <option value="Study Materials">Study Materials</option>
                    </select>
                </div>

                <div class="filter-chips">
                    <button class="chip active" type="button" data-category="" onclick="setResourceCategory('')">All Resources</button>
                    <button class="chip" type="button" data-category="Notes" onclick="setResourceCategory('Notes')">Notes</button>
                    <button class="chip" type="button" data-category="PYQs" onclick="setResourceCategory('PYQs')">PYQs</button>
                    <button class="chip" type="button" data-category="Guess Papers" onclick="setResourceCategory('Guess Papers')">Guess Papers</button>
                    <button class="chip" type="button" data-category="Model Papers" onclick="setResourceCategory('Model Papers')">Model Papers</button>
                </div>

                <div id="resourceCount" class="resource-count">Loading resources...</div>

                <div id="resourceLoading" class="empty-state">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading study resources...</p>
                </div>

                <div id="resourceGrid" class="library-grid"></div>

                <div id="resourceEmpty" class="empty-state hidden">
                    <i class="fa-solid fa-folder-open"></i>
                    <h3>No resources found</h3>
                    <p>Try changing your search or filters.</p>
                </div>
            </div>
        </section>

        <!-- LEARN HUB -->
        <section id="learnView" class="app-view">
            <header class="home-header">
                <div>
                    <h2>Learn Hub</h2>
                    <p>Explore class-wise learning resources</p>
                </div>
            </header>

            <div class="scroll-container">
                <h3 class="section-title">Select Your Class</h3>
                <div class="subject-grid">
                    <div class="subject-card" onclick="openClassResources('9th')">
                        <div class="sub-icon"><i class="fa-solid fa-book"></i></div>
                        <div class="sub-text"><h3>Class 9th</h3><p>Subjects and study materials</p></div>
                        <i class="fa-solid fa-arrow-right sub-arrow"></i>
                    </div>
                    <div class="subject-card" onclick="openClassResources('10th')">
                        <div class="sub-icon"><i class="fa-solid fa-book-open"></i></div>
                        <div class="sub-text"><h3>Class 10th</h3><p>Subjects and study materials</p></div>
                        <i class="fa-solid fa-arrow-right sub-arrow"></i>
                    </div>
                    <div class="subject-card" onclick="openClassResources('11th')">
                        <div class="sub-icon"><i class="fa-solid fa-graduation-cap"></i></div>
                        <div class="sub-text"><h3>Class 11th</h3><p>Arts, Medical and Non-Medical</p></div>
                        <i class="fa-solid fa-arrow-right sub-arrow"></i>
                    </div>
                    <div class="subject-card" onclick="openClassResources('12th')">
                        <div class="sub-icon"><i class="fa-solid fa-graduation-cap"></i></div>
                        <div class="sub-text"><h3>Class 12th</h3><p>Arts, Medical and Non-Medical</p></div>
                        <i class="fa-solid fa-arrow-right sub-arrow"></i>
                    </div>
                </div>
            </div>
        </section>

        <!-- PRACTICE CENTRE -->
        <section id="testsView" class="app-view">
            <header class="home-header">
                <div>
                    <h2>Practice Centre</h2>
                    <p>Test your understanding and track progress</p>
                </div>
            </header>

            <div class="scroll-container">
                <div id="quizList" class="quiz-list">
                    <div class="empty-state">
                        <i class="fa-solid fa-clipboard-question"></i>
                        <h3>Practice Centre</h3>
                        <p>Published practice tests will appear here.</p>
                    </div>
                </div>

                <div id="quizContainer" class="quiz-container hidden">
                    <div id="quizProgress"></div>
                    <div id="quizQuestion"></div>
                    <div id="quizOptions"></div>
                    <div class="quiz-actions">
                        <button id="quizNextBtn" class="btn-premium" type="button" onclick="nextQuizQuestion()">Next</button>
                        <button id="quizSubmitBtn" class="btn-premium hidden" type="button" onclick="submitQuiz()">Submit Test</button>
                    </div>
                </div>

                <div id="quizResult" class="quiz-result hidden"></div>
            </div>
        </section>

        <!-- STUDENT PROFILE AND AUTHENTICATION -->
        <section id="profileView" class="app-view">
            <header class="home-header">
                <div>
                    <h2>Student Portal</h2>
                    <p>Your personal learning workspace</p>
                </div>
            </header>

            <div class="scroll-container">
                <div id="loginForm" class="glass-panel auth-panel">
                    <h3>Welcome Back</h3>
                    <p>Sign in to your approved student account.</p>

                    <div class="input-group">
                        <i class="fa-solid fa-envelope"></i>
                        <input type="email" id="loginEmail" class="form-input" placeholder="Email Address" autocomplete="email">
                    </div>

                    <div class="input-group">
                        <i class="fa-solid fa-lock"></i>
                        <input type="password" id="loginPass" class="form-input" placeholder="Password" autocomplete="current-password">
                    </div>

                    <button class="btn-premium btn-large" id="loginBtn" type="button" onclick="loginStudent()">Secure Login</button>

                    <p class="auth-switch">
                        New student?
                        <span onclick="toggleAuthMode('register')">Create Account</span>
                    </p>
                </div>

                <div id="registerForm" class="glass-panel auth-panel hidden">
                    <h3>Create Your Account</h3>
                    <p>Register for free access to the student platform.</p>

                    <div class="input-group">
                        <i class="fa-solid fa-user"></i>
                        <input type="text" id="regName" class="form-input" placeholder="Full Name" autocomplete="name">
                    </div>

                    <div class="input-group">
                        <i class="fa-solid fa-graduation-cap"></i>
                        <select id="regClass" class="form-input">
                            <option value="" selected disabled>Select Your Class</option>
                            <option value="9th">Class 9th</option>
                            <option value="10th">Class 10th</option>
                            <option value="11th">Class 11th</option>
                            <option value="12th">Class 12th</option>
                        </select>
                    </div>

                    <div class="input-group">
                        <i class="fa-solid fa-envelope"></i>
                        <input type="email" id="regEmail" class="form-input" placeholder="Email Address" autocomplete="email">
                    </div>

                    <div class="input-group">
                        <i class="fa-solid fa-lock"></i>
                        <input type="password" id="regPass" class="form-input" placeholder="Create Password" autocomplete="new-password">
                    </div>

                    <button class="btn-premium btn-large" id="regBtn" type="button" onclick="registerStudent()">Register Account</button>

                    <p class="auth-switch">
                        Already registered?
                        <span onclick="toggleAuthMode('login')">Login Here</span>
                    </p>
                    <p class="auth-note">New accounts require administrator approval before student login.</p>
                </div>

                <!-- LOGGED-IN PROFILE -->
                <div id="studentProfilePanel" class="glass-panel hidden">
                    <div class="profile-heading">
                        <div class="profile-avatar"><i class="fa-solid fa-user-graduate"></i></div>
                        <div>
                            <h3 id="profileName">Student</h3>
                            <p id="profileClass">Student Account</p>
                        </div>
                    </div>
                    <div class="profile-details">
                        <p><strong>Email:</strong> <span id="profileEmail">—</span></p>
                        <p><strong>Student ID:</strong> <span id="profileStudentId">—</span></p>
                        <p><strong>Account Status:</strong> <span id="profileStatus">—</span></p>
                    </div>
                    <button class="btn-premium" type="button" onclick="logoutStudent()">Log Out</button>
                </div>

                <!-- ADMIN PANEL -->
                <div id="adminPanel" class="glass-panel hidden">
                    <h3><i class="fa-solid fa-shield-halved"></i> Administration</h3>
                    <p>Administrator workspace</p>

                    <div id="adminStats"></div>

                    <h4>Student Applications</h4>
                    <div id="pendingStudents">
                        <p>Student applications will load here.</p>
                    </div>

                    <h4>Upload Study Resource</h4>
                    <form id="resourceUploadForm">
                        <input id="uploadTitle" type="text" placeholder="Resource title" required>
                        <select id="uploadClass" required>
                            <option value="">Select class</option>
                            <option value="9th">Class 9th</option>
                            <option value="10th">Class 10th</option>
                            <option value="11th">Class 11th</option>
                            <option value="12th">Class 12th</option>
                        </select>
                        <input id="uploadSubject" type="text" placeholder="Subject" required>
                        <select id="uploadType" required>
                            <option value="">Resource type</option>
                            <option value="Notes">Notes</option>
                            <option value="PYQs">PYQs</option>
                            <option value="Guess Papers">Guess Papers</option>
                            <option value="Model Papers">Model Papers</option>
                            <option value="Study Materials">Study Materials</option>
                        </select>
                        <input id="uploadYear" type="text" placeholder="Academic year (optional)">
                        <input id="uploadChapter" type="text" placeholder="Chapter (optional)">
                        <textarea id="uploadDescription" placeholder="Short description (optional)"></textarea>
                        <label for="resourceFile">Select PDF file</label>
                        <input id="resourceFile" type="file" accept="application/pdf,.pdf" required>
                        <button id="uploadResourceBtn" class="btn-premium" type="submit">Upload Resource</button>
                    </form>
                </div>
            </div>
        </section>
    </main>

    <!-- BOTTOM NAVIGATION -->
    <nav id="bottomNav" class="glass-panel bottom-tab-bar hidden">
        <button class="tab-item active" type="button" onclick="navigateTo('homeView', this)">
            <i class="fa-solid fa-house"></i><span>Home</span>
        </button>
        <button class="tab-item" type="button" onclick="navigateTo('libraryView', this)">
            <i class="fa-solid fa-book-open"></i><span>Library</span>
        </button>
        <button class="tab-item" type="button" onclick="navigateTo('learnView', this)">
            <i class="fa-solid fa-graduation-cap"></i><span>Learn</span>
        </button>
        <button class="tab-item" type="button" onclick="navigateTo('testsView', this)">
            <i class="fa-solid fa-pen-to-square"></i><span>Practice</span>
        </button>
        <button class="tab-item" type="button" onclick="navigateTo('profileView', this)">
            <i class="fa-solid fa-user"></i><span>Profile</span>
        </button>
    </nav>

    <div id="uiToast" class="ui-toast hidden" role="status" aria-live="polite"></div>

    <script src="core.js"></script>
</body>
</html>

