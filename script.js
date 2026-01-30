// import { FirebaseManager } from './modules/firebase-manager.js'; // REMOVED STATIC IMPORT
import { NotificationSystem, renderChat, renderStories, renderPosts, updateUserUI, createChatWindow, renderHelpGallery } from './modules/ui.js';
import { openModal, closeModal, toggleSidebar, closeSidebar } from './modules/ui-core.js';
import { validateEmail, validatePhone, selectContactMethod, switchAuth } from './modules/auth.js';
import { switchWellnessMode, initCloudGame, addGratitudeNote, initVibeGame, initBreathingExercise } from './modules/wellness.js';

let dataManager;
// Helper to expose globals immediately
window.openModal = openModal;
window.closeModal = closeModal;
window.switchAuth = switchAuth;
window.selectContactMethod = selectContactMethod;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
// Wellness Globals
window.initBreathingExercise = initBreathingExercise;
window.initCloudGame = initCloudGame;
window.initVibeGame = initVibeGame;
window.addGratitudeNote = addGratitudeNote;
window.switchWellnessMode = switchWellnessMode;

// Global Firestore Listeners Tracker (for cleanup on logout)
window.firestoreUnsubscribers = [];

const mockDataManager = {
    getUser: () => ({ name: 'Envite (Hors Ligne)', loggedIn: false, uid: null }),
    login: async () => ({ success: false, message: "Mode Hors Ligne: Connexion impossible." }),
    logout: async () => { },
    listenToPosts: (type, cb) => cb([]),
    addPost: async () => false,
    listenToNotifications: () => () => { },
    listenToInbox: () => () => { },
    listenToChat: (cb) => cb([]),
    listenToStories: (cb) => cb([])
};
window.dataManager = mockDataManager;
dataManager = mockDataManager;

async function initApp() {
    // Global Error Handler to suppress Firestore Permission noise
    window.addEventListener('unhandledrejection', function (event) {
        if (event.reason && (event.reason.code === 'permission-denied' || event.reason.message.includes('permission-denied'))) {
            // Suppress standard error reporting for this known issue
            event.preventDefault();
            console.warn("⚠️ Firestore Permission Denied - Switching to SAFE OFFLINE MODE.");
            // Force mock manager to take over
            if (window.dataManager !== window.mockDataManager) {
                window.dataManager = window.mockDataManager;
                NotificationSystem.show("Mòd Sekirite (Hors Ligne) aktive", "info");
            }
        }
    });

    try {
        console.log("🌐 Attempting to load Firebase...");
        const module = await import('./modules/firebase-manager.js');
        dataManager = new module.FirebaseManager();
        window.dataManager = dataManager;
        console.log("✅ Firebase loaded successfully.");
    } catch (e) {
        console.warn("⚠️ Firebase load failed (Offline Mode Active):", e);
        NotificationSystem.show("Mode Hors Ligne activé (Connexion instable)", "warning");
    }
}

window.toggleChat = () => {
    const win = document.getElementById('chat-window') || createChatWindow();
    if (win) {
        win.classList.toggle('hidden');
        if (!win.classList.contains('hidden')) {
            // renderSuggestions(); // Ensure this exists or is handled
            document.getElementById('bot-input')?.focus();
        }
    }
};

// Call init
initApp();


window.navigateTo = function (viewId) {
    console.log("🚀 Navigating to:", viewId);
    const user = dataManager.getUser();
    const publicViews = ['home', 'sos'];
    const backBtn = document.getElementById('back-btn');

    if (!user.loggedIn && !publicViews.includes(viewId)) {
        NotificationSystem.show("Tanpri konekte pou aksede fonksyonalite sa a.", "info");
        navigateTo('home');
        openModal('auth-modal');
        return;
    }

    // 1. Force Close Dashboard if open
    const dashCollapse = document.getElementById('dashboard-collapse');
    if (dashCollapse && !dashCollapse.classList.contains('hidden')) {
        dashCollapse.classList.add('hidden');
        const toggleBtn = document.getElementById('dash-toggle-text');
        if (toggleBtn) toggleBtn.textContent = "Rezime Mwen";
    }

    // 1b. Force Close Mobile Sidebar
    document.querySelector('.sidebar')?.classList.remove('mobile-open');

    // 2. Hide ALL views
    document.querySelectorAll('.view').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });

    // 3. Show Target View
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        window.scrollTo(0, 0); // Always scroll to top
        console.log(`✅ View ${viewId} is now active.`);
    } else {
        console.error(`❌ Target view view-${viewId} not found! Fallback to Home.`);
        // Prevent white screen by forcing home
        const home = document.getElementById('view-home');
        if (home) {
            home.classList.remove('hidden');
            home.classList.add('active');
        }
    }

    // 4. Update Navigation State (Sidebar/Footer)
    document.querySelectorAll('.nav-links li, .nav-links a').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.view === viewId) el.classList.add('active');
        if (viewId !== 'home' && el.innerText.toLowerCase().includes('akey')) {
            el.classList.remove('active');
        }
    });

    document.querySelectorAll('.mobile-nav-footer .mobile-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewId) {
            item.classList.add('active');
        }
    });

    if (viewId !== 'home') backBtn?.classList.remove('hidden');
    else backBtn?.classList.add('hidden');

    // 5. View Specific Logic
    if (viewId === 'home') {
        if (window.unsubscribeHome) window.unsubscribeHome();
        window.unsubscribeHome = dataManager.listenToPosts('public', (posts) => {
            window.currentPublicPosts = posts;
            window.applyHomeFilter('all');
        });
    }

    if (viewId === 'community') {
        if (window.unsubscribePosts) window.unsubscribePosts();
        window.unsubscribePosts = dataManager.listenToPosts('community', (posts) => {
            window.currentCommunityPosts = posts;
            if (user.isMember) renderPosts(posts, 'posts-feed');
            else {
                const feed = document.getElementById('posts-feed');
                if (feed) feed.innerHTML = '<div style="text-align:center; padding: 40px; color: grey;">Mete tèt ou ansanm ak nou (vin manm) pou w wè mesaj sa yo.</div>';
            }
        });
        // Ensure sub-listeners attached
        if (typeof renderStories === 'function') dataManager.listenToStories(renderStories);
    }

    if (viewId === 'messages') {
        if (dataManager.listenToInbox) dataManager.listenToInbox(renderInbox);
    }

    if (window.startSosTicker) window.startSosTicker();
};

window.startSosTicker = () => {
    const ticker = document.getElementById('sos-ticker-text');
    if (!ticker) return;
    const messages = [
        "Ou pa pou kont ou. 💙",
        "Gen espwa toujou. ✨",
        "Nou la avè w. 🤝",
        "Chak pa konte. 👣"
    ];
    let i = 0;
    if (window.sosInterval) clearInterval(window.sosInterval);
    window.sosInterval = setInterval(() => {
        ticker.style.opacity = 0;
        setTimeout(() => {
            i = (i + 1) % messages.length;
            ticker.textContent = messages[i];
            ticker.style.opacity = 1;
        }, 500);
    }, 4000);
};

window.toggleSidebar = () => document.querySelector('.sidebar')?.classList.toggle('mobile-open');
window.closeSidebar = () => document.querySelector('.sidebar')?.classList.remove('mobile-open');
window.handleBack = () => navigateTo('home');

window.toggleDashboard = () => {
    const dash = document.getElementById('dashboard-collapse');
    const text = document.getElementById('dash-toggle-text');
    if (dash) {
        dash.classList.toggle('hidden');
        if (text) text.textContent = dash.classList.contains('hidden') ? "Wè Rezime Byennèt Mwen" : "Kache Rezime Byennèt Mwen";
    }
}

window.openMoodModal = () => openModal('mood-modal');

window.submitMoodLog = async (score) => {
    await dataManager.addMoodLog(score);
    closeModal('mood-modal');
    NotificationSystem.show("Mèsi paske w pataje jan w santi w. 🙏", "success");
};

// Click outside to close dashboard OR modals
document.addEventListener('click', (e) => {
    // 1. Dashboard Logic
    const dash = document.getElementById('dashboard-collapse');
    const toggleBtn = document.querySelector('.dashboard-toggle-btn');
    if (dash && !dash.classList.contains('hidden') && !dash.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
        dash.classList.add('hidden');
        if (document.getElementById('dash-toggle-text')) document.getElementById('dash-toggle-text').innerText = "Wè Rezime Byennèt Mwen";
    }

    // 2. Modal Logic (If clicking on the backdrop itself)
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        if (modalId) {
            window.closeModal(modalId);
        }
    }
});

window.applyHomeFilter = (mood) => {
    if (!window.currentPublicPosts) return;
    const feed = document.getElementById('home-posts-feed');
    if (!feed) return;

    // Filter Logic
    let filtered = window.currentPublicPosts;
    if (mood !== 'all') {
        filtered = window.currentPublicPosts.filter(p => {
            // Check if post content or mood matches filter
            const txt = (p.text || "").toLowerCase();
            const m = (p.mood || "").toLowerCase();
            if (mood === 'happy') return m === 'happy' || m === 'joy' || txt.includes('kontan') || txt.includes('byen');
            if (mood === 'sad') return m === 'sad' || txt.includes('tris') || txt.includes('mal');
            if (mood === 'anxious') return m === 'anxious' || txt.includes('pè') || txt.includes('anksye');
            return false;
        });
    }

    // Render
    renderPosts(filtered.slice(0, window.showingAllHome ? 50 : 3), 'home-posts-feed');

    // Update active tab visual
    document.querySelectorAll('.home-filters .filter-chip').forEach(btn => {
        if (btn.innerText.toLowerCase().includes(mood === 'all' ? 'tout' : (mood === 'happy' ? 'kontan' : (mood === 'sad' ? 'tris' : 'anksye')))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Handle "View All" visibility
    const viewAllBtn = document.querySelector('#featured-posts .view-all');
    if (viewAllBtn) {
        if (mood === 'all' && !window.showingAllHome) viewAllBtn.classList.remove('hidden');
        else viewAllBtn.classList.add('hidden');
    }
};



window.showAllHomePosts = function () {
    window.showingAllHome = true;
    window.applyHomeFilter('all');
};

window.startGuestQuiz = () => {
    ['1', '2', '3', '4'].forEach(s => document.getElementById(`quiz-step-${s}`)?.classList.add('hidden'));
    document.getElementById('quiz-step-1')?.classList.remove('hidden');
    document.getElementById('quiz-result-gate')?.classList.add('hidden');
    openModal('guest-quiz-modal');
};

window.nextQuizStep = (step) => {
    // Hide previous
    document.getElementById(`quiz-step-${step - 1}`)?.classList.add('hidden');
    // Show current
    document.getElementById(`quiz-step-${step}`)?.classList.remove('hidden');
};

window.finishQuiz = (resultType) => {
    // Hide last step
    document.getElementById('quiz-step-4')?.classList.add('hidden');
    // Show gate
    document.getElementById('quiz-result-gate')?.classList.remove('hidden');

    // Save Result for post-login
    localStorage.setItem('zepol_pending_result', resultType || 'general');
};

window.checkPendingQuizResult = () => {
    const pending = localStorage.getItem('zepol_pending_result');
    if (pending) {
        localStorage.removeItem('zepol_pending_result'); // Clear it
        // Show Welcome Result Modal
        const user = dataManager.getUser();

        let message = "Mèsi paske w te onèt ak tèt ou.";
        if (pending === 'hope') message = "Lè w kenbe espwa, ou deja fè mwatye chemen an. Nou la pou n fè rès la avè w.";
        if (pending === 'doubt') message = "Li nòmal pou w gen dout. Isit la, n ap ede w jwenn klète ak kalm.";
        if (pending === 'despair') message = "Ou gen anpil kouraj. Pataje pwa sa a avèk nou, pa pote l pou kont ou ankò.";

        const modal = document.getElementById('welcome-result-modal');
        if (modal) {
            document.getElementById('welcome-name').textContent = user.name || "Zanmi";
            document.getElementById('welcome-analysis').textContent = message;
            openModal('welcome-result-modal');
        } else {
            NotificationSystem.show("Byenveni lakay ou. Rezilta w anrejistre.", "success");
        }
    }
};

window.updateUserUI = () => {
    const user = dataManager.getUser();
    updateUserUI(dataManager);

    // Dynamic Greeting
    const hour = new Date().getHours();
    const greetingText = document.getElementById('greeting-text');
    if (greetingText) {
        greetingText.innerText = hour >= 16 ? "Bonswa" : "Bonjou";
    }

    const sidebar = document.querySelector('.sidebar');
    const mobileNav = document.querySelector('.mobile-nav-footer');
    const lockOverlay = document.getElementById('auth-lock-overlay');
    const authOnlyContent = document.querySelectorAll('.auth-only-content');
    const guestElements = document.querySelectorAll('.guest-only');
    const memberElements = document.querySelectorAll('.member-only');
    const authOnlyVisible = document.querySelectorAll('.auth-only-visible');
    const authOnlyHidden = document.querySelectorAll('.auth-only-hidden');
    const greetingName = document.getElementById('user-greeting-name');
    const marketingButtons = document.querySelectorAll('#auth-btn, #register-btn, #hero-register-btn');

    console.log("🔐 updateUserUI: user.loggedIn =", user.loggedIn);

    if (user.loggedIn) {
        sidebar?.classList.remove('hidden');
        if (mobileNav) {
            mobileNav.classList.remove('hidden');
            mobileNav.classList.add('mobile-flex');
        }
        lockOverlay?.classList.add('hidden');
        authOnlyContent.forEach(el => el.classList.remove('hidden'));
        authOnlyVisible.forEach(el => el.classList.remove('hidden'));
        authOnlyHidden.forEach(el => el.classList.add('hidden'));
        document.body.classList.remove('auth-locked');

        guestElements.forEach(el => el.classList.add('hidden'));
        memberElements.forEach(el => el.classList.remove('hidden'));
        marketingButtons.forEach(el => el.classList.add('hidden'));
        // Safety checks for every DOM element
        const greetingEl = document.getElementById('greeting-text');
        if (greetingEl) greetingEl.textContent = "Bonjou";

        const memberNameEl = document.getElementById('member-banner-name');
        if (memberNameEl) memberNameEl.textContent = user.name || "Zanmi";

        const userGreetingNameEl = document.getElementById('user-greeting-name');
        if (userGreetingNameEl) userGreetingNameEl.textContent = user.name || "Zanmi";

        const navUserName = document.getElementById('nav-username');
        if (navUserName) navUserName.textContent = user.name || "Zanmi";

        // Toggle visibility of bells and banners safely
        ['motivation-banner', 'notification-bell', 'inbox-bell'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('hidden');
        });

        setupNotifications();
    } else {
        sidebar?.classList.add('hidden');
        if (mobileNav) {
            mobileNav.classList.remove('mobile-flex');
            mobileNav.classList.add('hidden');
        }
        lockOverlay?.classList.remove('hidden');
        authOnlyContent.forEach(el => el.classList.add('hidden'));
        authOnlyVisible.forEach(el => el.classList.add('hidden'));
        authOnlyHidden.forEach(el => el.classList.remove('hidden'));
        document.body.classList.add('auth-locked');

        guestElements.forEach(el => el.classList.remove('hidden'));
        memberElements.forEach(el => el.classList.add('hidden'));
        marketingButtons.forEach(el => el.classList.remove('hidden'));
    }
};

function setupNotifications() {
    const user = dataManager.getUser();
    if (!user.loggedIn || !user.uid) {
        console.warn("⚠️ setupNotifications: User not logged in, skipping listeners.");
        return;
    }
    console.log("🔔 Setting up Notifications for:", user.uid);
    if (dataManager.listenToNotifications) {
        if (window.unsubscribeNotifs) window.unsubscribeNotifs();
        window.unsubscribeNotifs = dataManager.listenToNotifications((notifs) => {
            const unreadCount = notifs.filter(n => !n.read).length;
            const badge = document.getElementById('notif-badge');
            if (badge) {
                badge.textContent = unreadCount;
                badge.classList.toggle('hidden', unreadCount === 0);
            }
            window.currentNotifications = notifs;
            renderNotifications();
        });
    }

    if (dataManager.listenToInbox) {
        if (window.unsubscribeInbox) window.unsubscribeInbox();
        window.unsubscribeInbox = dataManager.listenToInbox((messages) => {
            const unreadCount = messages.filter(m => !m.read).length;
            const badge = document.getElementById('msg-badge');
            if (badge) {
                badge.textContent = unreadCount;
                badge.classList.toggle('hidden', unreadCount === 0);
            }
            renderInbox(messages);
        });
    }
}

function renderNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list || !window.currentNotifications) return;
    if (window.currentNotifications.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:grey;">Pa gen nouvo alèt.</p>';
        return;
    }
    list.innerHTML = window.currentNotifications.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotifClick('${n.id}', '${n.postId}')">
            <i class="fas ${n.type === 'like' ? 'fa-heart' : 'fa-comment'}"></i>
            <span><strong>${n.senderName}</strong> ${n.message}</span>
        </div>
    `).join('');
}

window.handleNotifClick = async (notifId, postId) => {
    await dataManager.markNotificationRead(notifId);
    closeModal('notifications-modal');
    if (postId) window.handleComment(postId);
};

window.openNotifications = () => openModal('notifications-modal');

// handleComment moved up

window.submitDM = async () => {
    const input = document.getElementById('dm-input');
    const text = input.value.trim();
    if (!text) return;
    const success = await dataManager.sendDirectMessage(window.currentDMRecipientId, text);
    if (success) {
        input.value = '';
        closeModal('direct-message-modal');
        openModal('thanks-modal');
    }
};

window.openMessageTo = (recipientId, recipientName) => {
    window.currentDMRecipientId = recipientId;
    const title = document.getElementById('dm-recipient-name');
    if (title) title.textContent = `Pou: ${recipientName}`;
    openModal('direct-message-modal');
};

function renderInbox(messages) {
    const container = document.getElementById('inbox-list');
    if (!container) return;
    if (!messages || messages.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:grey;">Pa gen mesaj ankò.</div>';
        return;
    }
    container.innerHTML = messages.map(m => `
        <div class="msg-card ${m.read ? '' : 'unread'}">
            <div class="msg-avatar">${m.senderName[0]}</div>
            <div class="msg-content-mini">
                <div class="msg-header">
                    <span class="msg-sender">${m.senderName}</span>
                    <span class="msg-time">${new Date(m.date).toLocaleTimeString()}</span>
                </div>
                <div class="msg-text-preview">${m.text}</div>
            </div>
        </div>
    `).join('');
}

window.handleLike = async (postId) => {
    const user = dataManager.getUser();
    if (!user.loggedIn) {
        openModal('auth-modal');
        return;
    }
    await dataManager.likePost(postId);
};

window.handleComment = (postId) => {
    const user = dataManager.getUser();
    if (!user.loggedIn) {
        openModal('auth-modal');
        return;
    }
    window.currentPostId = postId;
    const post = (window.currentPublicPosts?.find(p => p.id === postId)) || (window.currentCommunityPosts?.find(p => p.id === postId));
    const list = document.getElementById('comments-list');
    list.innerHTML = '';
    if (post?.comments) {
        post.comments.forEach(c => {
            const cdiv = document.createElement('div');
            cdiv.className = 'comment-item';
            cdiv.style = "padding: 10px; border-bottom: 1px solid #eee; display:flex; justify-content:space-between; align-items:center;";
            cdiv.innerHTML = `
                <div><strong>${c.author}:</strong> ${c.text}</div>
                ${(c.authorId && c.authorId !== user.uid) ? `
                <button class="action-btn" onclick="closeModal('comment-modal'); window.openMessageTo('${c.authorId}', '${c.author}')">
                    <i class="fas fa-reply"></i> Prive
                </button>` : ''}
            `;
            list.appendChild(cdiv);
        });
    }
    openModal('comment-modal');
};

window.toggleQuickBreathe = () => {
    const circle = document.getElementById('mini-breathe-circle');
    if (circle) {
        if (circle.classList.contains('hidden')) {
            circle.classList.remove('hidden');
            // Stop after 3 cycles (12 seconds) automatically to not be annoying
            setTimeout(() => {
                circle.classList.add('hidden');
            }, 12000);
        } else {
            circle.classList.add('hidden');
        }
    }
};

window.submitGratitude = async () => {
    const input = document.getElementById('gratitude-input');
    const text = input.value.trim();
    if (!text) return;

    // Simulate API call
    console.log("🙏 Gratitude added:", text);
    // In a real app we would save this to Firestore
    // await dataManager.addGratitude(text); 

    input.value = '';
    closeModal('gratitude-modal');
    NotificationSystem.show("Mèsi! Gratitid ou ajoute nan bokal la. ✨", "success");

    // Update dashboard mini text if it exists
    const latestEl = document.getElementById('latest-gratitude');
    if (latestEl) latestEl.textContent = `"${text}"`;
};

window.saveJournalEntry = async () => {
    const text = document.getElementById('journal-text').value.trim();
    const status = document.getElementById('journal-save-status');

    if (!text) {
        closeModal('journal-entry-modal');
        return;
    }

    if (status) status.textContent = "Anrejistre...";

    // Simulate Save
    await new Promise(r => setTimeout(r, 800));
    console.log("📖 Journal saved");

    if (status) status.textContent = "Sove!";
    setTimeout(() => closeModal('journal-entry-modal'), 500);
    NotificationSystem.show("Panse w yo an sekirite.", "success");
};

window.showAllHomePosts = function () {
    const user = dataManager.getUser();
    if (!user.loggedIn) {
        openModal('auth-modal');
        return;
    }
    window.showingAllHome = true;
    window.applyHomeFilter('all');
    document.querySelector('#featured-posts .view-all')?.classList.add('hidden');
};

// Alias for HTML compatibility
window.filterHomePosts = window.applyHomeFilter;

window.updateUserUI(); // Use the wrapper or pass dataManager
document.querySelectorAll('.nav-links li').forEach(li => li.addEventListener('click', () => navigateTo(li.dataset.view)));

// Register Form Listener
document.getElementById('register-form')?.addEventListener('submit', async e => {
    e.preventDefault();

    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const username = document.getElementById('reg-username').value;
    const fullname = document.getElementById('reg-fullname').value;
    const method = document.getElementById('email-input-group').classList.contains('hidden') ? 'phone' : 'email';

    if (password !== confirm) {
        NotificationSystem.show("Modpas yo pa idantik.", "error");
        return;
    }

    const identifier = method === 'email' ? email : phone;
    if (!identifier) {
        NotificationSystem.show("Tanpri antre kontak ou.", "error");
        return;
    }

    // Call Register
    const res = await dataManager.register(identifier, password, { username, fullName: fullname });
    if (res.success) {
        closeModal('register-modal');
        // Auto-login or wait for auth state change
        // If register returns success, user might be logged in automatically by Firebase, 
        // but we can ensure UI updates.
        navigateTo('home');
        NotificationSystem.show("Kont kreye avèk siksè! Byenveni.", "success");
        window.checkPendingQuizResult();
    } else {
        NotificationSystem.show("Erè: " + res.message, "error");
    }
});


document.getElementById('login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('login-identifier').value;
    const pass = document.getElementById('login-password').value;
    const res = await dataManager.login(id, pass);
    if (res.success) {
        closeModal('auth-modal');
        navigateTo('home');
        NotificationSystem.show("Byenveni!", "success");
        window.checkPendingQuizResult(); // Check for quiz result
    } else NotificationSystem.show("Erè: " + res.message, "error");
});

document.getElementById('submit-comment-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('comment-input');
    const isAnon = document.querySelector('input[name="comment-identity"]:checked')?.value === 'anon';
    if (!input.value.trim() || !window.currentPostId) return;
    if (await dataManager.addComment(window.currentPostId, { text: input.value.trim(), author: isAnon ? "Anonim" : dataManager.getUser().name })) {
        input.value = '';
        closeModal('comment-modal');
        NotificationSystem.show("Repòns ou voye!", "success");
    }
});

navigateTo('home');

