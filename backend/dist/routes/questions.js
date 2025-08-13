"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
/**
 * GET /api/questions/hierarchy
 * Returns the full hierarchy of pillars, categories, subcategories and questions.
 */
router.get('/hierarchy', async (_req, res) => {
    try {
        // Fetch pillars
        const pillars = await (0, db_1.query)('SELECT id, name, pillar_id FROM pillars ORDER BY id');
        // Fetch categories
        const categories = await (0, db_1.query)('SELECT id, name, pillar_id FROM categories ORDER BY id');
        // Fetch subcategories
        const subcategories = await (0, db_1.query)('SELECT id, name, category_id FROM subcategories ORDER BY id');
        // Fetch questions
        const questions = await (0, db_1.query)('SELECT question_id, question_text, indicator_name, is_scored, good_practice_answer, ffp_value, sbp_value, group_logic, subcategory_id FROM b_ready_questions ORDER BY question_id');
        // Build lookup maps
        const catByPillar = {};
        for (const pillar of pillars)
            catByPillar[pillar.id] = [];
        for (const cat of categories) {
            const pid = cat.pillar_id;
            if (!catByPillar[pid])
                catByPillar[pid] = [];
            catByPillar[pid].push({ id: cat.id, name: cat.name, subcategories: [] });
        }
        // Map categories by id for subcategories insertion
        const subcatByCat = {};
        for (const cat of categories) {
            subcatByCat[cat.id] = [];
        }
        for (const sub of subcategories) {
            if (!subcatByCat[sub.category_id])
                subcatByCat[sub.category_id] = [];
            subcatByCat[sub.category_id].push({ id: sub.id, name: sub.name, questions: [] });
        }
        // Map subcategories by id for question insertion
        const subcatMap = {};
        for (const catId in subcatByCat) {
            for (const sub of subcatByCat[catId]) {
                subcatMap[sub.id] = sub;
            }
        }
        // Assign questions to subcategories
        for (const q of questions) {
            const sc = subcatMap[q.subcategory_id];
            if (sc) {
                sc.questions.push(q);
            }
        }
        // Assign subcategories to categories
        const catMap = {};
        for (const pid in catByPillar) {
            for (const cat of catByPillar[parseInt(pid, 10)]) {
                catMap[cat.id] = cat;
            }
        }
        for (const catId in subcatByCat) {
            const cat = catMap[catId];
            if (cat)
                cat.subcategories = subcatByCat[catId];
        }
        // Build final structure for pillars
        const result = pillars.map(p => ({
            id: p.id,
            name: p.name,
            categories: catByPillar[p.id] || []
        }));
        return res.json({ pillars: result });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch question hierarchy' });
    }
});
exports.default = router;
