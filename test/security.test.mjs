import test from 'node:test';
import assert from 'node:assert/strict';
import { Security, RateLimiter } from '../js/security.js';

test('Security.escapeHTML - neutralizes XSS payloads', () => {
    const malicious = '<script>alert("XSS")</script>&<img src=x onerror=alert(1)>';
    const escaped = Security.escapeHTML(malicious);

    assert.ok(!escaped.includes('<script>'), 'Must not contain raw script tags');
    assert.ok(!escaped.includes('<img'), 'Must not contain raw img tags');
    assert.ok(escaped.includes('&lt;script&gt;'), 'Must encode opening script tag');
    assert.ok(escaped.includes('&amp;'), 'Must encode ampersand');
    assert.ok(escaped.includes('&quot;'), 'Must encode double quotes');
});

test('Security.sanitizeInput - truncates and removes control characters', () => {
    const raw = '  Student \u0000 Plastic \u0007 Dropoff  ';
    const clean = Security.sanitizeInput(raw, 50);
    assert.equal(clean, 'Student  Plastic  Dropoff');

    const longStr = 'A'.repeat(500);
    const truncated = Security.sanitizeInput(longStr, 100);
    assert.equal(truncated.length, 100);
});

test('Security.sanitizeURL - blocks malicious schemes and accepts safe URLs', () => {
    assert.equal(Security.sanitizeURL('javascript:alert(document.cookie)'), null);
    assert.equal(Security.sanitizeURL('vbscript:msgbox(1)'), null);
    assert.equal(Security.sanitizeURL('data:text/html,<script>alert(1)</script>'), null);

    assert.equal(Security.sanitizeURL('https://campus.edu/plastic.png'), 'https://campus.edu/plastic.png');
    assert.equal(Security.sanitizeURL('images/pet.jpg'), 'images/pet.jpg');
    assert.equal(Security.sanitizeURL('/images/hdpe.jpg'), '/images/hdpe.jpg');
});

test('Security.hashPassword - derives a salted PBKDF2-SHA-256 digest', async () => {
    const pass = 'SmartCampus#2026';
    const salt = 'salt123';
    const hash1 = await Security.hashPassword(pass, salt);
    const hash2 = await Security.hashPassword(pass, salt);
    const hashDifferentSalt = await Security.hashPassword(pass, 'diffSalt');

    assert.equal(typeof hash1, 'string');
    assert.equal(hash1.length, 64, 'SHA-256 output must be 64 hex characters');
    assert.equal(hash1, hash2, 'Identical pass and salt must yield identical hash');
    assert.notEqual(hash1, hashDifferentSalt, 'Different salt must yield different hash');
});

test('Security.timingSafeEqual - compares strings in constant time', () => {
    assert.equal(Security.timingSafeEqual('token_abc_123', 'token_abc_123'), true);
    assert.equal(Security.timingSafeEqual('token_abc_123', 'token_abc_999'), false);
    assert.equal(Security.timingSafeEqual('short', 'longer_string'), false);
});

test('Security.validatePassword - enforces strict OWASP complexity', () => {
    assert.equal(Security.validatePassword('weak').valid, false);
    assert.equal(Security.validatePassword('NoNumbers!').valid, false);
    assert.equal(Security.validatePassword('alllowercase123!').valid, false);
    assert.equal(Security.validatePassword('ALLUPPERCASE123!').valid, false);
    assert.equal(Security.validatePassword('NoSpecialChar123').valid, false);

    const strong = Security.validatePassword('GreenCampus@2026');
    assert.equal(strong.valid, true);
    assert.equal(strong.errors.length, 0);
});

test('Security.validateEmail - validates RFC format and detects campus emails', () => {
    assert.equal(Security.validateEmail('invalid-email').valid, false);

    const student = Security.validateEmail('kavya.thukral@campus.edu');
    assert.equal(student.valid, true);
    assert.equal(student.isCampusEmail, true);

    const standard = Security.validateEmail('user@gmail.com');
    assert.equal(standard.valid, true);
    assert.equal(standard.isCampusEmail, false);
});

test('RateLimiter - enforces lockout upon repeated brute-force failures', () => {
    const limiter = new RateLimiter(3, 1000, 2000);
    const ip = 'client_192_168_1_5';

    assert.equal(limiter.check(ip).allowed, true);
    limiter.recordFailure(ip);
    assert.equal(limiter.check(ip).allowed, true);
    limiter.recordFailure(ip);
    assert.equal(limiter.check(ip).allowed, true);

    // 3rd failure locks it
    const lockResult = limiter.recordFailure(ip);
    assert.equal(lockResult.locked, true);
    assert.equal(limiter.check(ip).allowed, false);

    limiter.reset(ip);
    assert.equal(limiter.check(ip).allowed, true);
});

