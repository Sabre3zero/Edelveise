// modal.js
const MODAL_URL = 'login-modal.html';

let modalElement = null;
let isLoaded = false;
let currentStep = null;

// In-memory store for data collected across steps of one flow.
// Cleared when the flow completes or the modal is closed.
let flowData = {};

// ─── Loading ──────────────────────────────────────────────────────

async function loadModal() {
    if (isLoaded) return modalElement;

    try {
        const response = await fetch(MODAL_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html.trim();

        modalElement = wrapper.firstElementChild;
        document.body.appendChild(modalElement);

        isLoaded = true;
        attachModalEvents();
        return modalElement;
    } catch (err) {
        console.error('Не удалось загрузить модальное окно:', err);
    }
}

// ─── Step navigation ──────────────────────────────────────────────

function showStep(stepName) {
    if (!modalElement) return;

    const steps = modalElement.querySelectorAll('.modal_step');
    let found = false;
    steps.forEach(step => {
        const isTarget = step.dataset.step === stepName;
        step.classList.toggle('active', isTarget);
        if (isTarget) found = true;
    });

    if (!found) {
        console.warn(`Шаг "${stepName}" не найден`);
        return;
    }

    currentStep = stepName;

    // Focus first input in the active step
    const activeInput = modalElement.querySelector('.modal_step.active input');
    activeInput?.focus();
}

// ─── Open / close ─────────────────────────────────────────────────

/**
 * Open the modal.
 * @param {'register'|'login'} flow — which flow to start (default: register).
 * @param {string} [step] — optional specific step to jump to.
 */
async function openModal(flow = 'register', step = null) {
    const modal = await loadModal();
    if (!modal) return;

    flowData = {}; // fresh flow
    const firstStep = step || AUTH_CONFIG.start[flow] || 'register-phone';
    showStep(firstStep);

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (!modalElement) return;
    modalElement.classList.remove('open');
    modalElement.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    flowData = {};
    currentStep = null;
}

// ─── Events ───────────────────────────────────────────────────────

function attachModalEvents() {
    if (!modalElement) return;

    // Close button
    modalElement.querySelector('.modal_close')
        ?.addEventListener('click', closeModal);

    // Click on dark backdrop
    modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) closeModal();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalElement.classList.contains('open')) {
            closeModal();
        }
    });

    // "Switch to other flow" links (data-goto="...")
    modalElement.addEventListener('click', (e) => {
        const link = e.target.closest('[data-goto]');
        if (!link) return;
        e.preventDefault();
        showStep(link.dataset.goto);
    });

    // Handle each form submit
    modalElement.querySelectorAll('.modal_form').forEach(form => {
        form.addEventListener('submit', (e) => handleFormSubmit(e, form));
    });
}

// ─── Form handling ────────────────────────────────────────────────

function handleFormSubmit(e, form) {
    e.preventDefault();

    const step = form.dataset.form;
    const data = Object.fromEntries(new FormData(form));

    // Validate SMS code on code steps
    if (step === 'register-code' || step === 'login-code') {
        if (data.code !== AUTH_CONFIG.SMS_CODE) {
            alert('Неверный код. Попробуйте снова.');
            form.querySelector('input[name="code"]')?.focus();
            return;
        }
    }

    // Save collected data for the flow
    Object.assign(flowData, data);

    // Log for now (replace with real API calls later)
    console.log(`[${step}] →`, data, '| flowData so far:', flowData);

    // Determine next step
    const nextStep = AUTH_CONFIG.next[step];

    if (nextStep === null) {
        // Flow complete
        onFlowComplete(step);
        closeModal();
        return;
    }

    showStep(nextStep);
}

function onFlowComplete(step) {
    if (step === 'register-info') {
        console.log('✅ Регистрация завершена:', flowData);
        // TODO: send flowData to backend, store token, redirect, etc.
    } else if (step === 'login-code') {
        console.log('✅ Авторизация успешна:', flowData);
        // TODO: send flowData.phone + code to backend, store token, etc.
    }
}

// Expose globally so buttons can call them
window.openModal = openModal;
window.closeModal = closeModal;

// Auto-bind any element with [data-open-auth]
document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-auth]');
    if (!trigger) return;
    const flow = trigger.dataset.openAuth || 'register';
    openModal(flow);
});