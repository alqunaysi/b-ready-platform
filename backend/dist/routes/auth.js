"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/register
 * Register a new user. Requires email and password in the request body.
 * Returns a JWT on successful registration.
 */
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        // Check if the email already exists
        const existing = await (0, db_1.query)('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        // Hash the password
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Insert user
        const inserted = await (0, db_1.query)('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id', [email, passwordHash]);
        const userId = inserted[0].id;
        // Generate JWT
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 'JWT secret not configured' });
        }
        const token = jsonwebtoken_1.default.sign({ id: userId, email }, secret, { expiresIn: '12h' });
        return res.json({ token });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Registration failed' });
    }
});
/**
 * POST /api/auth/login
 * Authenticate a user by email and password.
 * Returns a JWT on successful login.
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const users = await (0, db_1.query)('SELECT id, password_hash FROM users WHERE email = $1', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = users[0];
        const valid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 'JWT secret not configured' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email }, secret, { expiresIn: '12h' });
        return res.json({ token });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Login failed' });
    }
});
exports.default = router;
