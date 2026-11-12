/**
 * EcoVision - Smart Campus Circular Plastic Economy
 * Main Application Orchestrator & UI Controller
 */

import { store } from './state.js';
import { Security, authRateLimiter, auditLogger } from './security.js';
import { CampusMetrics } from './campus.js';

export class AppController {
    constructor() {
        this.initDOMReferences();
        this.bindEvents();
        this.subscribeToStore();
        this.registerServiceWorker();
    }

    initDOMReferences() {
        // Nav elements
        this.navCartBtn = document.getElementById('navCartBtn');
        this.navCartBadge = document.getElementById('navCartBadge');
        this.userAuthBtn = document.getElementById('userAuthBtn');
        this.navEcoCredits = document.getElementById('navEcoCredits');
        this.themeToggleBtn = document.getElementById('themeToggleBtn');

        // Modals
        this.authModal = document.getElementById('authModal');
        this.cartModal = document.getElementById('cartModal');
        this.toastContainer = document.getElementById('toastContainer');

        // Auth Form Elements
        this.authForm = document.getElementById('authForm');
        this.authModalTitle = document.getElementById('authModalTitle');
        this.authToggleModeBtn = document.getElementById('authToggleModeBtn');
        this.authSubmitBtn = document.getElementById('authSubmitBtn');
        this.authStudentFields = document.getElementById('authStudentFields');

        // Cart Elements
        this.cartItemsList = document.getElementById('cartItemsList');
        this.cartTotalKg = document.getElementById('cartTotalKg');
        this.cartTotalPrice = document.getElementById('cartTotalPrice');
        this.checkoutBtn = document.getElementById('checkoutBtn');

        this.isRegisterMode = false;
    }

    bindEvents() {
        // Modal toggles
        if (this.userAuthBtn) {
            this.userAuthBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const currentUser = store.getState().currentUser;
                if (currentUser) {
                    // Prompt logout
                    if (confirm(`Logged in as ${currentUser.name} (${currentUser.studentId}). Do you want to sign out?`)) {
                        store.setCurrentUser(null);
                        this.showToast('You have signed out of your campus account.', 'info');
                    }
                } else {
                    this.openModal(this.authModal);
                }
            });
        }

        if (this.navCartBtn) {
            this.navCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.renderCartModal();
                this.openModal(this.cartModal);
            });
        }

        // Close buttons on all modals
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Click outside modal backdrop to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeAllModals();
            }
        });

        // Accessibility: ESC key closes modals
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Theme toggle
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => {
                const nextTheme = store.toggleTheme();
                document.documentElement.setAttribute('data-theme', nextTheme);
                this.themeToggleBtn.textContent = nextTheme === 'dark' ? '☀️' : '🌙';
            });
        }

        // Auth mode toggle (Login vs Register)
        if (this.authToggleModeBtn) {
            this.authToggleModeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthMode();
            });
        }

        // Auth Form Submission
        if (this.authForm) {
            this.authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAuthSubmit();
            });
        }

        // Checkout button
        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', () => {
                this.handleCheckout();
            });
        }
    }

    subscribeToStore() {
        store.subscribe((state) => {
            this.updateHeaderUI(state);
            if (this.cartModal && this.cartModal.classList.contains('active')) {
                this.renderCartModal();
            }
        });
    }

    updateHeaderUI(state) {
        // Update Cart Count
        if (this.navCartBadge) {
            const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
            this.navCartBadge.textContent = String(count);
            this.navCartBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }

        // Update EcoCredits
        if (this.navEcoCredits) {
            const credits = state.currentUser ? state.currentUser.ecoCredits : 0;
            this.navEcoCredits.textContent = `${credits} EcoCredits`;
        }

        // Update User Button
        if (this.userAuthBtn) {
            if (state.currentUser) {
                this.userAuthBtn.textContent = `👤 ${state.currentUser.name.split(' ')[0]} (${state.currentUser.role})`;
                this.userAuthBtn.title = `Signed in as ${state.currentUser.email}. Click to sign out.`;
            } else {
                this.userAuthBtn.textContent = 'Sign In / Register';
                this.userAuthBtn.title = 'Sign in with campus account';
            }
        }
    }

    openModal(modalElement) {
        if (!modalElement) return;
        modalElement.classList.add('active');
        modalElement.setAttribute('aria-hidden', 'false');

        // Focus first input for keyboard accessibility
        const firstInput = modalElement.querySelector('input, button');
        if (firstInput) firstInput.focus();
    }

    closeAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        });
    }

    toggleAuthMode() {
        this.isRegisterMode = !this.isRegisterMode;
        if (this.isRegisterMode) {
            this.authModalTitle.textContent = 'Create Campus Account';
            this.authSubmitBtn.textContent = 'Register Account';
            this.authToggleModeBtn.textContent = 'Already registered? Sign In';
            if (this.authStudentFields) this.authStudentFields.style.display = 'block';
        } else {
            this.authModalTitle.textContent = 'Campus Portal Sign In';
            this.authSubmitBtn.textContent = 'Sign In';
            this.authToggleModeBtn.textContent = 'New student or club? Register';
            if (this.authStudentFields) this.authStudentFields.style.display = 'none';
        }
    }

    async handleAuthSubmit() {
        const emailInput = document.getElementById('authEmail');
        const passInput = document.getElementById('authPassword');
        const nameInput = document.getElementById('authName');
        const studentIdInput = document.getElementById('authStudentId');
        const roleSelect = document.getElementById('authRole');
        const hostelSelect = document.getElementById('authHostel');

        const email = (emailInput?.value || '').trim().toLowerCase();
        const password = passInput?.value || '';

        // Rate limiting check
        const limiterCheck = authRateLimiter.check(email || 'anonymous');
        if (!limiterCheck.allowed) {
            this.showToast(`Too many failed attempts. Try again in ${limiterCheck.retryAfterSeconds}s.`, 'error');
            return;
        }

        // Validate Email
        const emailCheck = Security.validateEmail(email);
        if (!emailCheck.valid) {
            this.showToast('Please enter a valid email address.', 'error');
            return;
        }

        // Validate Password Complexity
        const passCheck = this.isRegisterMode ? Security.validatePassword(password) : { valid: Boolean(password), errors: ['Password is required.'] };
        if (!passCheck.valid) {
            this.showToast(passCheck.errors[0], 'error');
            return;
        }

        // PBKDF2 hash for this browser-only demonstration account store.
        let users = [];
        try {
            users = JSON.parse(localStorage.getItem('ecovision_users') || '[]');
            if (!Array.isArray(users)) users = [];
        } catch { users = []; }

        if (this.isRegisterMode) {
            const name = nameInput?.value || 'Campus Student';
            const studentId = studentIdInput?.value || 'STU-' + Math.floor(1000 + Math.random() * 9000);
            const role = roleSelect?.value || 'student';
            const hostel = hostelSelect?.value || 'dorm_newton';

            if (!Security.validateStudentId(studentId)) {
                this.showToast('Student ID must be 4-16 alphanumeric characters.', 'error');
                return;
            }

            if (users.some(user => user.email === email || user.studentId === studentId)) {
                this.showToast('An account with this email or student ID already exists. Sign in instead.', 'error');
                authRateLimiter.recordFailure(email);
                return;
            }

            const salt = Security.generateSecureToken(16);
            const passwordHash = await Security.hashPassword(password, salt);

            const newUser = {
                name,
                email,
                studentId,
                role,
                hostel,
                ecoCredits: 200, // 200 welcome bonus EcoCredits
                passwordHash,
                passwordSalt: salt
            };

            users.push(newUser);
            try { localStorage.setItem('ecovision_users', JSON.stringify(users)); }
            catch { this.showToast('Could not save your account in this browser. Check available storage and try again.', 'error'); return; }

            store.setCurrentUser(newUser);
            authRateLimiter.reset(email);
            this.showToast(`Welcome to EcoVision, ${name}! +200 EcoCredits awarded.`, 'success');
            this.closeAllModals();
            this.authForm.reset();
        } else {
            const user = users.find(account => account.email === email);
            const passwordHash = user?.passwordSalt ? await Security.hashPassword(password, user.passwordSalt) : '';
            if (!user || !Security.timingSafeEqual(passwordHash, user.passwordHash || '')) {
                const failure = authRateLimiter.recordFailure(email);
                this.showToast(failure.locked ? `Too many failed attempts. Try again in ${failure.retryAfterSeconds}s.` : 'Email or password is incorrect.', 'error');
                return;
            }

            store.setCurrentUser(user);
            authRateLimiter.reset(email);
            this.showToast(`Welcome back, ${user.name}!`, 'success');
            this.closeAllModals();
            this.authForm.reset();
        }
    }

    renderCartModal() {
        if (!this.cartItemsList) return;
        this.cartItemsList.innerHTML = '';
        const state = store.getState();
        const cart = state.cart;

        if (cart.length === 0) {
            const emptyNotice = document.createElement('p');
            emptyNotice.className = 'form-hint';
            emptyNotice.style.textAlign = 'center';
            emptyNotice.style.padding = '2rem';
            emptyNotice.textContent = 'Your campus cart is empty.';
            this.cartItemsList.appendChild(emptyNotice);

            if (this.cartTotalKg) this.cartTotalKg.textContent = '0';
            if (this.cartTotalPrice) this.cartTotalPrice.textContent = '0';
            return;
        }

        for (const item of cart) {
            const row = document.createElement('div');
            row.className = 'cart-item-row';

            const info = document.createElement('div');
            info.className = 'cart-item-info';

            const title = document.createElement('h4');
            title.textContent = `${item.name} (${item.type})`;

            const sub = document.createElement('p');
            sub.textContent = `₹${item.price}/kg × ${item.quantity}kg = ₹${item.price * item.quantity} | Zone: ${item.zoneName}`;

            info.appendChild(title);
            info.appendChild(sub);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn-secondary btn-sm';
            removeBtn.setAttribute('type', 'button');
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', () => {
                store.removeFromCart(item.id);
                this.showToast(`Removed ${item.name} from cart.`, 'info');
            });

            row.appendChild(info);
            row.appendChild(removeBtn);
            this.cartItemsList.appendChild(row);
        }

        const totalKg = store.getCartTotalWeight();
        const totalPrice = store.getCartTotalPrice();

        if (this.cartTotalKg) this.cartTotalKg.textContent = String(totalKg);
        if (this.cartTotalPrice) this.cartTotalPrice.textContent = String(totalPrice);
    }

    handleCheckout() {
        const state = store.getState();
        if (state.cart.length === 0) {
            this.showToast('Your cart is empty.', 'error');
            return;
        }

        const res = store.checkout();
        if (res.success) {
            this.showToast(`Order #${res.receiptId} confirmed! ${res.totalKg}kg processed. +${res.earnedCredits} EcoCredits earned!`, 'success');
            this.closeAllModals();
        } else {
            this.showToast(res.message, 'error');
        }
    }

    showToast(message, type = 'info') {
        if (!this.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : ''}`;
        toast.setAttribute('role', 'alert');
        toast.textContent = message;

        this.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
            navigator.serviceWorker.register('sw.js').catch(err => {
                // Expected when running on some sandboxed origins
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
});

