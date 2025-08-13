"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./routes/auth"));
const assessments_1 = __importDefault(require("./routes/assessments"));
const questions_1 = __importDefault(require("./routes/questions"));
// Create Express app
const app = (0, express_1.default)();
// Middleware to parse JSON bodies
app.use(express_1.default.json());
// Mount API routes
app.use('/api/auth', auth_1.default);
app.use('/api/assessments', assessments_1.default);
app.use('/api/questions', questions_1.default);
// Healthcheck endpoint
app.get('/', (_req, res) => {
    res.json({ status: 'B-Ready API is running' });
});
// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
