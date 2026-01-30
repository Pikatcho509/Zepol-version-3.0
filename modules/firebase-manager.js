import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, orderBy, limit, onSnapshot, arrayUnion, increment, where } from '../firebase-config.js';
import { NotificationSystem } from './ui.js';

export class FirebaseManager {
    constructor() {
        this.currentUser = null;
        this.initAuth();
    }

    initAuth() {
        console.log("🔥 Initializing Firebase Auth... Project ID:", db._app.options.projectId);
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    const userData = userDoc.exists() ? userDoc.data() : {};

                    this.currentUser = {
                        name: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        uid: user.uid,
                        loggedIn: true,
                        isMember: userData.isMember || false
                    };
                } catch (e) {
                    console.error("Error fetching user data:", e);
                    this.currentUser = {
                        name: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        uid: user.uid,
                        loggedIn: true,
                        isMember: false
                    };
                }
            } else {
                this.currentUser = { name: 'Envite', loggedIn: false, isMember: false, uid: null };
            }
            if (window.updateUserUI) window.updateUserUI(); // Global UI update
        });
    }

    getUser() {
        return this.currentUser || { name: 'Envite', loggedIn: false, isMember: false, uid: null };
    }

    async login(identifier, password) {
        try {
            let email = identifier;
            if (/^[+]?[0-9\s]+$/.test(identifier) && !identifier.includes('@')) {
                email = `${identifier.replace(/\s/g, '')}@zepol-phone.temp`;
            }
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            let msg = error.message;
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                msg = "Imèl, telefòn oswa modpas la pa bon. Tanpri tcheke yo byen.";
            }
            return { success: false, message: msg };
        }
    }

    async register(identifier, password, userData = {}) {
        try {
            let email = identifier;
            // Phone Normalization
            if (/^[+]?[0-9\s]+$/.test(identifier) && !identifier.includes('@')) {
                email = `${identifier.replace(/\s/g, '')}@zepol-phone.temp`;
                if (!userData.phone) userData.phone = identifier;
            } else {
                if (!userData.email) userData.email = email;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: userData.fullName || userData.username
            });
            await setDoc(doc(db, "users", userCredential.user.uid), {
                fullName: userData.fullName || '',
                email: email,
                phone: userData.phone || '',
                username: userData.username || '',
                createdAt: new Date().toISOString(),
                ...userData
            });
            return { success: true };
        } catch (error) {
            console.error("Register Error:", error);
            return { success: false, message: error.message };
        }
    }

    async logout() {
        // Clean up all active listeners before logging out
        if (window.firestoreUnsubscribers) {
            window.firestoreUnsubscribers.forEach(unsub => {
                try {
                    unsub();
                } catch (e) {
                    console.warn('Error unsubscribing listener:', e);
                }
            });
            window.firestoreUnsubscribers = [];
        }
        await signOut(auth);
    }

    listenToPosts(type, callback) {
        const q = query(collection(db, "posts"), where("postType", "==", type), orderBy("date", "desc"), limit(50));

        return onSnapshot(q, (snapshot) => {
            const posts = [];
            snapshot.forEach((doc) => {
                posts.push({ id: doc.id, ...doc.data() });
            });
            callback(posts);
        }, (error) => {
            if (error.code === 'failed-precondition' || error.message.includes('index')) {
                console.info("Missing Composite Index. Using Client-Side filtering fallback...");
                const fallbackQ = query(collection(db, "posts"), orderBy("date", "desc"), limit(100));
                onSnapshot(fallbackQ, (snapshot) => {
                    const posts = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        if (data.postType === type) {
                            posts.push({ id: doc.id, ...data });
                        }
                    });
                    callback(posts);
                });
            } else {
                console.error(`Firestore [${type}] error:`, error);
                callback([]);
            }
        });
    }

    async addPost(post) {
        try {
            const postData = {
                postType: post.postType || 'public',
                ...post,
                creatorUid: this.currentUser?.uid || 'guest',
                date: post.date || new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, "posts"), postData);
            return true;
        } catch (e) {
            console.error("❌ Error adding post: ", e);
            return false;
        }
    }

    async addMoodLog(score) {
        if (!this.currentUser?.uid) return;
        try {
            await addDoc(collection(db, `users/${this.currentUser.uid}/moods`), {
                score: score,
                date: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error saving mood:", e);
        }
    }

    async likePost(postId) {
        try {
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);

            await updateDoc(postRef, {
                likes: increment(1)
            });

            if (postSnap.exists()) {
                const data = postSnap.data();
                if (data.creatorUid && data.creatorUid !== this.currentUser?.uid) {
                    await this.addNotification(data.creatorUid, {
                        type: 'like',
                        postId: postId,
                        senderName: this.currentUser?.name || 'Yon moun',
                        message: `soutni paj ou a.`
                    });
                }
            }
            return true;
        } catch (e) {
            console.error("Error liking post: ", e);
            return false;
        }
    }

    async addComment(postId, commentData) {
        if (!this.currentUser) return false;
        try {
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);

            const comment = {
                author: commentData.author || this.currentUser.name,
                authorId: this.currentUser.uid,
                text: commentData.text,
                date: new Date().toISOString()
            };

            await updateDoc(postRef, {
                comments: arrayUnion(comment)
            });

            if (postSnap.exists()) {
                const data = postSnap.data();
                if (data.creatorUid && data.creatorUid !== this.currentUser?.uid) {
                    await this.addNotification(data.creatorUid, {
                        type: 'comment',
                        postId: postId,
                        senderName: comment.author,
                        message: `kòmante sou pòs ou a.`
                    });
                }
            }
            return true;
        } catch (e) {
            console.error("Error adding comment: ", e);
            return false;
        }
    }

    async toggleMembership(status) {
        if (!this.currentUser?.uid) return false;
        try {
            await setDoc(doc(db, "users", this.currentUser.uid), {
                isMember: status,
                joinedCommunityAt: new Date().toISOString()
            }, { merge: true });
            this.currentUser.isMember = status;
            return true;
        } catch (e) {
            console.error("Error toggling membership:", e);
            return false;
        }
    }

    // --- Notifications & DMs ---

    async addNotification(userId, data) {
        try {
            await addDoc(collection(db, `users/${userId}/notifications`), {
                ...data,
                read: false,
                date: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error adding notification:", e);
        }
    }

    listenToNotifications(callback) {
        if (!this.currentUser?.uid) return () => { };
        const q = query(collection(db, `users/${this.currentUser.uid}/notifications`), orderBy("date", "desc"), limit(20));
        return onSnapshot(q, (snapshot) => {
            const notifs = [];
            snapshot.forEach((doc) => {
                notifs.push({ id: doc.id, ...doc.data() });
            });
            callback(notifs);
        });
    }

    async markNotificationRead(notifId) {
        if (!this.currentUser?.uid) return;
        try {
            await updateDoc(doc(db, `users/${this.currentUser.uid}/notifications`, notifId), {
                read: true
            });
        } catch (e) {
            console.error("Error marking notif read:", e);
        }
    }

    async sendDirectMessage(recipientId, text) {
        if (!this.currentUser?.uid) return false;
        try {
            const msg = {
                senderId: this.currentUser.uid,
                senderName: this.currentUser.name,
                text: text,
                date: new Date().toISOString(),
                read: false
            };
            await addDoc(collection(db, `users/${recipientId}/inbox`), msg);

            await this.addNotification(recipientId, {
                type: 'dm',
                senderName: this.currentUser.name,
                message: "voye yon bèl mesaj sipò pou ou. Mèsi pou konfyans ou! 🕊️"
            });
            return true;
        } catch (e) {
            console.error("Error sending DM:", e);
            return false;
        }
    }

    listenToInbox(callback) {
        if (!this.currentUser?.uid) return () => { };
        const q = query(collection(db, `users/${this.currentUser.uid}/inbox`), orderBy("date", "desc"), limit(50));
        return onSnapshot(q, (snapshot) => {
            const msgs = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() });
            });
            callback(msgs);
        });
    }

    // --- Other methods ---
    async addSuccessStory(story) {
        try {
            await addDoc(collection(db, "success_stories"), { ...story, date: new Date().toISOString() });
            return true;
        } catch (e) { return false; }
    }

    listenToStories(callback) {
        const q = query(collection(db, "success_stories"), orderBy("date", "desc"), limit(20));
        return onSnapshot(q, (snapshot) => {
            const stories = [];
            snapshot.forEach((doc) => stories.push({ id: doc.id, ...doc.data() }));
            callback(stories);
        });
    }

    listenToChat(callback) {
        const q = query(collection(db, "support_chat"), orderBy("date", "asc"), limit(100));
        return onSnapshot(q, (snapshot) => {
            const msgs = [];
            snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
            callback(msgs);
        });
    }

    async sendMessage(text) {
        if (!this.currentUser?.loggedIn) return false;
        try {
            await addDoc(collection(db, "support_chat"), {
                author: this.currentUser.name,
                text: text,
                date: new Date().toISOString()
            });
            return true;
        } catch (e) { return false; }
    }
}
