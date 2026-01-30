import { NotificationSystem, openModal, closeModal } from './ui.js';

export function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
    return /^\+?[\d\s-]{8,}$/.test(phone.replace(/\s/g, ''));
}

export function selectContactMethod(method) {
    const emailGroup = document.getElementById('email-input-group');
    const phoneGroup = document.getElementById('phone-input-group');
    const emailBtn = document.getElementById('email-method-btn');
    const phoneBtn = document.getElementById('phone-method-btn');
    const emailInput = document.getElementById('reg-email');
    const phoneInput = document.getElementById('reg-phone');

    if (method === 'email') {
        emailGroup.classList.remove('hidden');
        phoneGroup.classList.add('hidden');
        emailBtn.classList.add('active');
        phoneBtn.classList.remove('active');
        emailInput.required = true;
        phoneInput.required = false;
        phoneInput.value = '';
    } else {
        phoneGroup.classList.remove('hidden');
        emailGroup.classList.add('hidden');
        phoneBtn.classList.add('active');
        emailBtn.classList.remove('active');
        phoneInput.required = true;
        emailInput.required = false;
        emailInput.value = '';
    }
}

export function switchAuth(mode) {
    if (mode === 'register') {
        closeModal('auth-modal');
        openModal('register-modal');
    } else {
        closeModal('register-modal');
        openModal('auth-modal');
    }
}
