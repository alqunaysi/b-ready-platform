"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Express middleware to validate JWT tokens.
 *
 * The token must be provided in the Authorization header as a Bearer token.
 * If valid, the decoded payload will be attached to req.user.
 */
function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid authorization header format' });
    }
    const token = parts[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ error: 'JWT secret not configured' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Attach user info to request for downstream handlers
        req.user = decoded;
        return next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
