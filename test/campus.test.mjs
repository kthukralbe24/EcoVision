import test from 'node:test';
import assert from 'node:assert/strict';
import { CampusMetrics, CAMPUS_ZONES, PLASTIC_CATEGORIES, STUDENT_REWARDS } from '../js/campus.js';

test('CampusMetrics.calculateImpact - calculates correct CO2, landfill and trees', () => {
    const impact = CampusMetrics.calculateImpact(100);

    assert.equal(impact.plasticKg, 100);
    assert.equal(impact.co2OffsetKg, 162); // 100 * 1.62
    assert.equal(impact.landfillVolumeM3, 0.32); // 100 * 0.0032
    assert.equal(impact.treesEquivalent, 4); // floor(100 / 22)
    assert.equal(impact.energySavedKWh, 577); // 100 * 5.77
});

test('CampusMetrics.calculateEcoCredits - awards credits based on plastic type rate', () => {
    // PET: 30 credits/kg
    const petCredits = CampusMetrics.calculateEcoCredits('PET', 10);
    assert.equal(petCredits, 300);

    // PLA_3D: 50 credits/kg
    const plaCredits = CampusMetrics.calculateEcoCredits('PLA_3D', 5);
    assert.equal(plaCredits, 250);

    // PS: 15 credits/kg
    const psCredits = CampusMetrics.calculateEcoCredits('PS', 20);
    assert.equal(psCredits, 300);
});

test('CampusMetrics.getRoleWeightLimit - enforces role-based ordering quotas', () => {
    assert.equal(CampusMetrics.getRoleWeightLimit('student'), 50);
    assert.equal(CampusMetrics.getRoleWeightLimit('faculty_staff'), 150);
    assert.equal(CampusMetrics.getRoleWeightLimit('campus_recycler'), 1000);
});

test('Campus Zones Catalog - provides valid campus locations', () => {
    assert.ok(CAMPUS_ZONES.length >= 6);
    const dorm = CAMPUS_ZONES.find(z => z.id === 'north_dorms');
    assert.ok(dorm);
    assert.equal(dorm.type, 'Residential');

    const makerspace = CAMPUS_ZONES.find(z => z.id === 'makerspace_lab');
    assert.ok(makerspace);
    assert.equal(makerspace.type, 'Laboratory');
});

test('Student Rewards - contains valid student vouchers', () => {
    assert.ok(STUDENT_REWARDS.length >= 4);
    const cafePass = STUDENT_REWARDS.find(r => r.id === 'reward_cafe');
    assert.ok(cafePass);
    assert.equal(cafePass.costCredits, 100);
});

