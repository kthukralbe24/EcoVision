import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../js/state.js';

test('StateStore - initialization and inventory loading', () => {
    const state = store.getState();
    assert.ok(Array.isArray(state.products));
    assert.ok(state.products.length >= 5);
    assert.ok(Array.isArray(state.cart));
    assert.ok(Array.isArray(state.leaderboard));
});

test('StateStore - user login and role update', () => {
    store.setCurrentUser({
        name: 'Kavya Thukral',
        email: 'kavya@campus.edu',
        role: 'student',
        studentId: 'STU-9921',
        hostel: 'dorm_newton',
        ecoCredits: 200
    });

    const state = store.getState();
    assert.ok(state.currentUser);
    assert.equal(state.currentUser.name, 'Kavya Thukral');
    assert.equal(state.currentUser.studentId, 'STU-9921');
    assert.equal(state.currentUser.role, 'student');
});

test('StateStore - add to cart and weight limit enforcement', () => {
    store.clearCart();
    const product = store.getState().products[0];

    // Add 10kg
    const res1 = store.addToCart(product.id, 10);
    assert.equal(res1.success, true);
    assert.equal(store.getCartTotalWeight(), 10);

    // Try adding 60kg more as a student (exceeds 50kg limit)
    const res2 = store.addToCart(product.id, 60);
    assert.equal(res2.success, false);
    assert.ok(res2.message.includes('limit of 50kg'));

    // Cart weight should still be 10kg
    assert.equal(store.getCartTotalWeight(), 10);
});

test('StateStore - checkout processes order and updates campus diverted kg', () => {
    store.clearCart();
    const product = store.getState().products[0];
    const initialDiverted = store.getState().totalDivertedKg;
    const initialProductQty = product.quantity;

    store.addToCart(product.id, 5);
    const checkoutResult = store.checkout();

    assert.equal(checkoutResult.success, true);
    assert.equal(checkoutResult.totalKg, 5);
    assert.equal(store.getState().cart.length, 0);
    assert.equal(store.getState().totalDivertedKg, initialDiverted + 5);
    assert.equal(product.quantity, initialProductQty - 5);
});

test('StateStore - addListing adds product and updates hostel leaderboard', () => {
    const initialCount = store.getState().products.length;
    const dormNewton = store.getState().leaderboard.find(d => d.id === 'dorm_newton');
    const initialDormKg = dormNewton.totalKg;

    const newListing = store.addListing({
        type: 'PLA_3D',
        title: 'Makerspace Recycled Spool Prototypes',
        description: 'Clean filament spools for campus 3D extruder',
        price: 25,
        quantity: 12,
        campusZone: 'makerspace_lab',
        contactName: 'Makerspace Lead',
        studentId: 'STU-3D',
        hostel: 'dorm_newton'
    });

    assert.ok(newListing.id);
    assert.equal(store.getState().products.length, initialCount + 1);
    assert.equal(dormNewton.totalKg, initialDormKg + 12);
});

test('StateStore - redeemReward deducts EcoCredits and creates voucher', () => {
    store.setCurrentUser({
        name: 'Kavya Thukral',
        email: 'kavya@campus.edu',
        role: 'student',
        studentId: 'STU-9921',
        hostel: 'dorm_newton',
        ecoCredits: 250
    });

    const res = store.redeemReward('reward_cafe'); // costs 100
    assert.equal(res.success, true);
    assert.equal(res.voucher.rewardId, 'reward_cafe');
    assert.equal(res.remainingCredits, 150);
});

