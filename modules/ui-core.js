/**
 * Core UI Functions (Dependency Free)
 * Safe to load even if network is down.
 */

export const openModal = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
};

export const closeModal = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
};

export const toggleSidebar = () => {
    document.querySelector('.sidebar')?.classList.toggle('mobile-open');
};

export const closeSidebar = () => {
    document.querySelector('.sidebar')?.classList.remove('mobile-open');
};
