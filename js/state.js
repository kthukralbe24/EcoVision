/**
 * EcoVision - Smart Campus Circular Plastic Economy
 * Centralized State Management Store
 * 
 * Features:
 * - Immutable-like state dispatching & subscription
 * - Safe LocalStorage persistence with schema verification (OWASP A08)
 * - Seed catalog with Smart Campus context & real images
 */

import { CAMPUS_ZONES, PLASTIC_CATEGORIES, INITIAL_HOSTEL_LEADERBOARD, CampusMetrics } from './campus.js';
import { Security, auditLogger } from './security.js';

export const INITIAL_PRODUCTS = [
    {
        id: 1,
        type: 'PET',
        name: 'Sorted Cafeteria PET Water Bottles',
        description: 'Cleaned, de-capped PET bottles collected from Student Union dining hubs.',
        price: 16,
        quantity: 120,
        campusZone: 'student_union',
        zoneName: 'Student Union & Central Cafeteria',
        sellerName: 'Green Dining Committee',
        sellerRole: 'campus_partner',
        ecoCredits: 3600,
        image: 'images/pet.jpg',
        verifiedDate: '2026-11-10'
    },
    {
        id: 2,
        type: 'HDPE',
        name: 'Science Lab HDPE Containers & Jugs',
        description: 'Rinsed laboratory-grade HDPE detergent and buffer containers from Biotech Complex.',
        price: 14,
        quantity: 90,
        campusZone: 'science_complex',
        zoneName: 'Biotech & Science Complex',
        sellerName: 'Lab Waste Management',
        sellerRole: 'faculty_staff',
        ecoCredits: 2250,
        image: 'images/hdpe2.png',
        verifiedDate: '2026-11-11'
    },
    {
        id: 3,
        type: 'PLA_3D',
        name: 'Engineering Makerspace 3D Print Scraps',
        description: 'Sorted PLA and PETG filament supports and prototypes for campus shredder/extruder.',
        price: 25,
        quantity: 45,
        campusZone: 'makerspace_lab',
        zoneName: 'Engineering Makerspace & 3D Lab',
        sellerName: 'Robotics & 3D Printing Club',
        sellerRole: 'student',
        ecoCredits: 2250,
        image: 'images/grade2.png',
        verifiedDate: '2026-11-11'
    },
    {
        id: 4,
        type: 'LDPE',
        name: 'Dormitory Parcel Film & Bubble Wrap',
        description: 'Clean low-density polyethylene packaging collected during campus parcel delivery days.',
        price: 10,
        quantity: 150,
        campusZone: 'north_dorms',
        zoneName: 'North Dormitories (Hall 1 & 2)',
        sellerName: 'Newton Hall Green Council',
        sellerRole: 'student',
        ecoCredits: 2700,
        image: 'images/ldpe.png',
        verifiedDate: '2026-11-09'
    },
    {
        id: 5,
        type: 'PP',
        name: 'Campus Food Court Reusable Polypropylene Trays',
        description: 'Retired heavy-duty PP meal trays and food prep bins suitable for industrial re-pelletizing.',
        price: 12,
        quantity: 110,
        campusZone: 'student_union',
        zoneName: 'Student Union & Central Cafeteria',
        sellerName: 'Campus Dining Services',
        sellerRole: 'campus_partner',
        ecoCredits: 2420,
        image: 'images/pp.png',
        verifiedDate: '2026-11-08'
    },
    {
        id: 6,
        type: 'PVC',
        name: 'Civil Engineering Workshop PVC Pipe Offcuts',
        description: 'Clean conduit and piping cut pieces from campus infrastructure laboratory projects.',
        price: 11,
        quantity: 80,
        campusZone: 'makerspace_lab',
        zoneName: 'Engineering Makerspace & 3D Lab',
        sellerName: 'Civil Engineering Dept',
        sellerRole: 'faculty_staff',
        ecoCredits: 1600,
        image: 'images/pvc.png',
        verifiedDate: '2026-11-07'
    },
    {
        id: 7,
        type: 'PS',
        name: 'Library Hardware Protective Polystyrene Cushions',
        description: 'High-density PS foam blocks from server and IT deliveries at Central Library.',
        price: 8,
        quantity: 60,
        campusZone: 'library',
        zoneName: 'Central University Library',
        sellerName: 'Campus IT Operations',
        sellerRole: 'faculty_staff',
        ecoCredits: 900,
        image: 'images/ps.png',
        verifiedDate: '2026-11-06'
    }
];

class StateStore {
    constructor() {
        this.subscribers = new Set();
        this.state = this.loadInitialState();
    }

    /**
     * Safe schema verification and loading from LocalStorage
     */
    loadInitialState() {
        const defaultState = {
            products: [...INITIAL_PRODUCTS],
            cart: [],
            currentUser: null,
            leaderboard: [...INITIAL_HOSTEL_LEADERBOARD],
            totalDivertedKg: 1450,
            vouchersClaimed: [],
            theme: 'light'
        };

        if (typeof window === 'undefined' || !window.localStorage) {
            return defaultState;
        }

        try {
            const stored = localStorage.getItem('ecovision_state');
            if (!stored) return defaultState;
            
            const parsed = JSON.parse(stored);
            return {
                products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products : defaultState.products,
                cart: Array.isArray(parsed.cart) ? parsed.cart : [],
                currentUser: parsed.currentUser && typeof parsed.currentUser === 'object' ? parsed.currentUser : null,
                leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : defaultState.leaderboard,
                totalDivertedKg: typeof parsed.totalDivertedKg === 'number' ? parsed.totalDivertedKg : defaultState.totalDivertedKg,
                vouchersClaimed: Array.isArray(parsed.vouchersClaimed) ? parsed.vouchersClaimed : [],
                theme: parsed.theme === 'dark' ? 'dark' : 'light'
            };
        } catch (err) {
            console.warn('Failed to parse state from localStorage, resetting to defaults.', err);
            auditLogger.log('WARN', 'Corrupt localStorage detected and sanitized to defaults.');
            return defaultState;
        }
    }

    /**
     * Persist current state to LocalStorage
     */
    persist() {
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
            localStorage.setItem('ecovision_state', JSON.stringify(this.state));
        } catch (err) {
            console.error('Storage quota exceeded or storage blocked', err);
            auditLogger.log('WARN', 'Storage persist failed due to browser restriction.');
        }
    }

    /**
     * Subscribe to state changes
     * @param {(state: any) => void} callback 
     * @returns {() => void} unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        // Call immediately with current state
        callback(this.state);
        return () => this.subscribers.delete(callback);
    }

    notify() {
        this.persist();
        for (const cb of this.subscribers) {
            try {
                cb(this.state);
            } catch (err) {
                console.error('Error in state subscriber callback', err);
            }
        }
    }

    getState() {
        return this.state;
    }

    // --- State Mutations ---

    /**
     * Set authenticated user
     */
    setCurrentUser(user) {
        this.state.currentUser = user ? {
            name: Security.sanitizeInput(user.name, 60),
            email: Security.sanitizeInput(user.email, 100),
            role: user.role || 'student',
            studentId: Security.sanitizeInput(user.studentId || 'STU-2026', 20),
            hostel: Security.sanitizeInput(user.hostel || 'dorm_newton', 40),
            ecoCredits: Number(user.ecoCredits) || 150,
            token: user.token || Security.generateSecureToken(24),
            loginTime: Date.now()
        } : null;

        auditLogger.log(
            user ? 'AUTH_SUCCESS' : 'INFO', 
            user ? `User logged in: ${this.state.currentUser.email}` : 'User logged out.'
        );
        this.notify();
    }

    /**
     * Add product to cart with validation against role limit
     */
    addToCart(productId, quantity) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product) {
            return { success: false, message: 'Item not found in campus inventory.' };
        }

        const requestedQty = Number(quantity);
        if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
            return { success: false, message: 'Enter a valid quantity greater than zero.' };
        }
        const existing = this.state.cart.find(item => item.id === productId);
        const alreadyInCart = existing?.quantity || 0;
        const qty = Math.min(Math.floor(requestedQty), Math.max(0, product.quantity - alreadyInCart));
        if (!qty) return { success: false, message: 'No additional stock is available for this item.' };
        const currentTotalKg = this.getCartTotalWeight();
        const userRole = this.state.currentUser?.role || 'student';
        const roleLimit = CampusMetrics.getRoleWeightLimit(userRole);

        if (currentTotalKg + qty > roleLimit) {
            return {
                success: false,
                message: `Exceeds your campus order limit of ${roleLimit}kg for ${userRole}. Current cart has ${currentTotalKg}kg.`
            };
        }

        if (existing) {
            existing.quantity += qty;
        } else {
            this.state.cart.push({
                id: product.id,
                name: product.name,
                type: product.type,
                price: product.price,
                campusZone: product.campusZone,
                zoneName: product.zoneName,
                quantity: qty,
                maxAvailable: product.quantity,
                image: product.image
            });
        }

        this.notify();
        return { success: true, message: `Added ${qty}kg to campus order cart!` };
    }

    /**
     * Update quantity of an item in cart
     */
    updateCartItemQuantity(productId, newQty) {
        const item = this.state.cart.find(i => i.id === productId);
        if (!item) return;

        if (newQty <= 0) {
            this.removeFromCart(productId);
            return;
        }

        const numericQty = Number(newQty);
        if (!Number.isFinite(numericQty)) return;
        const otherItemsWeight = this.getCartTotalWeight() - item.quantity;
        const roleLimit = CampusMetrics.getRoleWeightLimit(this.state.currentUser?.role || 'student');
        item.quantity = Math.min(item.maxAvailable, Math.max(1, Math.floor(numericQty)), Math.max(1, roleLimit - otherItemsWeight));
        this.notify();
    }

    /**
     * Remove item from cart
     */
    removeFromCart(productId) {
        this.state.cart = this.state.cart.filter(item => item.id !== productId);
        this.notify();
    }

    /**
     * Clear all items from cart
     */
    clearCart() {
        this.state.cart = [];
        this.notify();
    }

    getCartTotalWeight() {
        return this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    getCartTotalPrice() {
        return this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    /**
     * Checkout current cart and update stock & campus statistics
     */
    checkout() {
        if (this.state.cart.length === 0) {
            return { success: false, message: 'Cart is empty.' };
        }

        for (const item of this.state.cart) {
            const product = this.state.products.find(p => p.id === item.id);
            if (!product || !Number.isFinite(item.quantity) || item.quantity < 1 || product.quantity < item.quantity) {
                return { success: false, message: `${item.name || 'An item'} no longer has enough stock. Update your cart and try again.` };
            }
        }

        const totalKg = this.getCartTotalWeight();
        const totalPrice = this.getCartTotalPrice();

        // Deduct inventory
        for (const item of this.state.cart) {
            const product = this.state.products.find(p => p.id === item.id);
            if (product) {
                product.quantity -= item.quantity;
            }
        }

        // Award EcoCredits to buyer (10% back in EcoCredits)
        const earnedCredits = Math.round(totalKg * 15);
        if (this.state.currentUser) {
            this.state.currentUser.ecoCredits = (this.state.currentUser.ecoCredits || 0) + earnedCredits;
        }

        // Update total campus diverted metric
        this.state.totalDivertedKg += totalKg;

        // Clear cart
        const completedItems = [...this.state.cart];
        this.state.cart = [];

        auditLogger.log('INFO', `Campus order completed: ${totalKg}kg of plastic, ₹${totalPrice}`, { totalKg, totalPrice, earnedCredits });
        this.notify();

        return {
            success: true,
            totalKg,
            totalPrice,
            earnedCredits,
            items: completedItems,
            receiptId: 'ORD-' + Security.generateSecureToken(6).toUpperCase()
        };
    }

    /**
     * Add a new plastic waste listing from a student/campus seller
     */
    addListing(listing) {
        const id = Date.now();
        const zoneObj = CAMPUS_ZONES.find(z => z.id === listing.campusZone) || CAMPUS_ZONES[0];
        const categoryObj = PLASTIC_CATEGORIES[listing.type] || PLASTIC_CATEGORIES.PET;
        const qty = Number(listing.quantity) || 1;
        const credits = CampusMetrics.calculateEcoCredits(listing.type, qty);

        const newProduct = {
            id,
            type: listing.type,
            name: Security.sanitizeInput(listing.title || `${categoryObj.name} - ${zoneObj.name}`, 80),
            description: Security.sanitizeInput(listing.description || 'Clean sorted campus plastic scrap ready for collection.', 300),
            price: Number(listing.price) || categoryObj.ratePerKg,
            quantity: qty,
            campusZone: zoneObj.id,
            zoneName: zoneObj.name,
            sellerName: Security.sanitizeInput(listing.contactName || (this.state.currentUser ? this.state.currentUser.name : 'Campus Student'), 50),
            sellerRole: this.state.currentUser?.role || 'student',
            studentId: Security.sanitizeInput(listing.studentId || (this.state.currentUser ? this.state.currentUser.studentId : 'STU-NEW'), 20),
            ecoCredits: credits,
            image: Security.sanitizeURL(listing.image) || 'images/recycle.png',
            verifiedDate: new Date().toISOString().split('T')[0]
        };

        this.state.products.unshift(newProduct);

        // Update leaderboard for student's hostel
        const hostelId = listing.hostel || this.state.currentUser?.hostel || 'dorm_newton';
        const dorm = this.state.leaderboard.find(d => d.id === hostelId);
        if (dorm) {
            dorm.totalKg += qty;
            dorm.credits += credits;
            this.state.leaderboard.sort((a, b) => b.totalKg - a.totalKg);
            this.state.leaderboard.forEach((d, idx) => d.rank = idx + 1);
        }

        // Award seller instant listing reward points
        if (this.state.currentUser) {
            this.state.currentUser.ecoCredits = (this.state.currentUser.ecoCredits || 0) + Math.round(credits * 0.2);
        }

        auditLogger.log('INFO', `New campus plastic listing created: ${newProduct.name} (${qty}kg)`, { id, type: newProduct.type });
        this.notify();
        return newProduct;
    }

    /**
     * Redeem EcoCredits for a student reward voucher
     */
    redeemReward(rewardId) {
        if (!this.state.currentUser) {
            return { success: false, message: 'Please sign in with your campus account to redeem rewards.' };
        }

        const credits = this.state.currentUser.ecoCredits || 0;
        const cost = rewardId === 'reward_cafe' ? 100 :
                     rewardId === 'reward_print' ? 60 :
                     rewardId === 'reward_bookstore' ? 150 :
                     rewardId === 'reward_filament' ? 280 : 400;

        if (credits < cost) {
            return {
                success: false,
                message: `Insufficient EcoCredits! You have ${credits} credits, but this reward requires ${cost}.`
            };
        }

        this.state.currentUser.ecoCredits -= cost;
        const voucher = {
            id: 'VOUCH-' + Security.generateSecureToken(5).toUpperCase(),
            rewardId,
            cost,
            date: new Date().toLocaleDateString(),
            studentId: this.state.currentUser.studentId
        };
        this.state.vouchersClaimed.push(voucher);

        auditLogger.log('INFO', `Reward redeemed by ${this.state.currentUser.studentId}: ${voucher.id}`);
        this.notify();
        return { success: true, voucher, remainingCredits: this.state.currentUser.ecoCredits };
    }

    /**
     * Toggle Dark/Light mode
     */
    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.notify();
        return this.state.theme;
    }
}

export const store = new StateStore();

