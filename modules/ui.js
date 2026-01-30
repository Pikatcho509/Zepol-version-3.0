console.log("🎨 UI.js Loaded V3.5.9-Debug");
// --- Système de Notifications ---
export class NotificationSystem {
    static init() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    static show(message, type = 'info', duration = 5000) {
        this.init();
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const iconMap = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };

        notification.innerHTML = `
            <i class="fas fa-${iconMap[type] || 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentNode.remove()">&times;</button>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                notification.style.transition = 'all 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
}

// --- UI Rendering Helpers ---
export function renderChat(msgs) {
    const feed = document.getElementById('sg-chat-feed');
    if (!feed) return;
    feed.innerHTML = '';
    msgs.forEach(m => {
        const div = document.createElement('div');
        div.className = 'sg-message';
        div.innerHTML = `<span class="chat-author">${m.author}</span>: <p>${m.text}</p>`;
        feed.appendChild(div);
    });
    feed.scrollTop = feed.scrollHeight;
}

export function renderStories(stories) {
    const container = document.getElementById('stories-grid');
    if (!container) return;
    container.innerHTML = '';

    if (!stories || stories.length === 0) {
        stories = [
            { title: "Mwen jwenn limyè", content: "Apre 3 mwa nan fènwa, mwen kòmanse wè espwa gras ak gwoup sipò a.", author: "Marie J." },
            { title: "Respire...", content: "Teknik 4-7-8 la vrèman ede m jere panik mwen.", author: "Jean P." },
            { title: "Pa janm abandone", content: "Chak ti pa konte. Jodi a mwen soti kabann mwen, e se yon viktwa.", author: "Alex" }
        ];
    }

    stories.forEach(s => {
        const div = document.createElement('div');
        div.className = 'card story-card glass-card';
        div.innerHTML = `<h4>${s.title}</h4><p>"${s.content}"</p><span class="story-author">- ${s.author}</span>`;
        container.appendChild(div);
    });
}

export function renderPosts(posts, containerId = 'posts-feed') {
    console.log(`🖼️ Rendering ${posts ? posts.length : 0} posts into #${containerId}`);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Container #${containerId} not found in DOM!`);
        return;
    }
    // Merge community and public posts for global lookup if needed, or just set current
    window.currentPosts = posts;
    container.innerHTML = '';

    if (!posts || posts.length === 0) {
        const fallbacks = [
            { id: 'f1', author: "Sipò Zepòl", content: "Byenveni! Se premye fwa w? Pa ezite pataje sa k nan kè w jodi a.", date: new Date().toISOString(), likes: 5, comments: [{ author: "Yon Zanmi", text: "Mèsi pou mesaj sa! 🙏" }] },
            { id: 'f2', author: "Kominote Zepòl", content: "Sonje ke ou pa pou kont ou. Nou la pou nou sipòte youn lòt! ✨", date: new Date().toISOString(), likes: 12, comments: [{ author: "Fanmi Zepòl", text: "Vrèman sa fè m kontan wè nou ansanm." }, { author: "Lòt Moun", text: "Wi, nou fò!" }] },
            { id: 'f3', author: "Yon Zanmi", content: "Mwen te santi m tris yè, men jodi a m ap eseye jwenn yon ti limyè. Kenbe fèm!", date: new Date().toISOString(), likes: 8, comments: [] },
            { id: 'f4', author: "Zepòl 3.0", content: "Pran yon gwo respirasyon... Tout bagay ap anfòm. 🌿", date: new Date().toISOString(), likes: 15, comments: [{ author: "Zepòl", text: "Se verite!" }] }
        ];
        posts = fallbacks;
    }

    posts.forEach(post => {
        console.log(`📝 Rendering post ID: ${post.id}, Content: "${post.content || post.text}"`);
        const div = document.createElement('div');
        div.className = 'post-card';
        if (post.likes > 10) div.classList.add('highlight');

        const content = post.content || post.text || "(Pa gen kontni)";
        const author = post.author || "Anonyme";

        const comments = post.comments || [];
        const previewComments = comments.slice(-2); // Show last 2
        const moreCommentsCount = comments.length - previewComments.length;

        let commentsHtml = '';
        if (previewComments.length > 0) {
            commentsHtml = `
                <div class="post-comments-preview">
                    ${previewComments.map(c => `
                        <div class="mini-comment">
                            <strong>${c.author}:</strong> ${c.text}
                        </div>
                    `).join('')}
                    ${moreCommentsCount > 0 ? `<div class="more-comments-link" onclick="window.handleComment('${post.id}')">Wè tout ${comments.length} repòns yo...</div>` : ''}
                </div>
            `;
        }

        let displayDate = '...';
        try {
            displayDate = post.date ? new Date(post.date).toLocaleDateString('ht-HT') : 'Nan kounye a';
        } catch (e) {
            console.warn("Invalid date for post:", post.id);
        }

        div.innerHTML = `
            <div class="post-header" style="margin-bottom:12px;">
                <span class="post-author" style="color:var(--primary-dark) !important; font-weight:700; font-size:15px;">${author}</span>
                <span class="post-date" style="color:var(--text-muted) !important; font-size:12px;">${displayDate}</span>
            </div>
            <div class="post-content" style="color:var(--text-main) !important; font-size:16px; line-height:1.6; margin-bottom:15px; display:block !important;">${content}</div>
            <div class="post-actions" style="border-top:1px solid #f0f0f0; padding-top:10px; display:flex; flex-wrap:wrap; gap:8px;">
                <button class="action-btn" onclick="window.handleLike('${post.id}')" style="background:#f8fafc; border:1px solid #edf2f7; padding:8px 12px; border-radius:20px; font-size:14px;">
                    <i class="fas fa-hands-helping" style="color:var(--primary);"></i> <strong>${post.likes || 0}</strong>
                </button>
                <button class="action-btn" onclick="window.handleComment('${post.id}')" style="background:#f8fafc; border:1px solid #edf2f7; padding:8px 12px; border-radius:20px; font-size:14px;">
                    <i class="far fa-comment" style="color:var(--primary);"></i> <strong>${comments.length}</strong>
                </button>
                ${post.creatorUid && post.creatorUid !== 'guest' ? `
                <button class="action-btn" onclick="window.openMessageTo('${post.creatorUid}', '${author}')" style="background:var(--primary-light); color:white; border:none; padding:8px 15px; border-radius:30px; font-size:13px; font-weight:600;">
                    <i class="far fa-envelope"></i> Prive
                </button>` : ''}
            </div>
            ${commentsHtml}
        `;
        container.appendChild(div);
    });
}

export function updateUserUI(dataManager) {
    const user = dataManager.getUser();
    const navUser = document.getElementById('nav-username');
    const userMini = document.getElementById('user-mini');
    const authBtn = document.getElementById('auth-btn');
    const registerBtn = document.getElementById('register-btn');
    const joinCommBtn = document.getElementById('join-comm-btn');
    const chatOverlay = document.getElementById('chat-lock-overlay');

    if (navUser) navUser.textContent = user.name;

    if (user.loggedIn) {
        userMini?.classList.remove('hidden');
        if (authBtn) authBtn.textContent = 'Pwofil';
        registerBtn?.classList.add('hidden');

        if (user.isMember) {
            joinCommBtn?.classList.add('hidden');
            chatOverlay?.classList.add('hidden');
            document.getElementById('posts-feed')?.classList.remove('blurred');
        } else {
            joinCommBtn?.classList.remove('hidden');
            chatOverlay?.classList.remove('hidden');
            document.getElementById('posts-feed')?.classList.add('blurred');
        }
    } else {
        userMini?.classList.add('hidden');
        if (authBtn) authBtn.textContent = 'Konekte';
        registerBtn?.classList.remove('hidden');
        joinCommBtn?.classList.remove('hidden');
        chatOverlay?.classList.add('hidden');
    }
}

// --- Modals ---
export { openModal, closeModal } from './ui-core.js';

export function createChatWindow() {
    const chatWindow = document.createElement('div');
    chatWindow.id = 'chat-window';
    chatWindow.className = 'chat-window glass-panel hidden';
    chatWindow.innerHTML = `
        <div class="chat-header">
            <h4>Yon Zepòl 🤖</h4>
            <span class="close-chat" onclick="window.toggleChat()">&times;</span>
        </div>
        <div class="chat-messages" id="chat-messages">
            <div class="msg bot">Bonjou! Mwen se Yon Zepòl. Kijan mwen ka ede w jodi a?</div>
        </div>
        <div id="chat-suggestions" class="chat-suggestions"></div>
        <div class="chat-input-area">
            <input type="text" id="bot-input" placeholder="Ekri la...">
            <button onclick="window.sendUserMessage()"><i class="fas fa-paper-plane"></i></button>
        </div>`;
    document.body.appendChild(chatWindow);
    document.getElementById('bot-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') window.sendUserMessage(); });
    return chatWindow;
}

export function renderHelpGallery() {
    const container = document.getElementById('help-gallery');
    if (!container) return;
    const helpItems = [
        { title: "Kijan pou m pataje?", icon: "pen-fancy", desc: "Klike sou 'Pataje' epi ekri sa k nan kè w." },
        { title: "Kijan pou m jwenn èd?", icon: "hand-holding-heart", desc: "Sèvi ak bouton 'SOS' la pou w jwenn sipò imedyat." },
        { title: "Ki sekirite m genyen?", icon: "shield-alt", desc: "Done ou yo an sekirite epi w ka anonim." }
    ];
    container.innerHTML = helpItems.map(item => `
        <div class="card help-card glass-card">
            <i class="fas fa-${item.icon}"></i>
            <h4>${item.title}</h4>
            <p>${item.desc}</p>
        </div>
    `).join('');
}
