import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

/**
 * GET /api/questions/hierarchy
 * Returns the full hierarchy of pillars, categories, subcategories and questions.
 */
router.get('/hierarchy', async (_req: Request, res: Response) => {
  try {
    // Fetch pillars
    const pillars = await query<{ id: number; name: string; pillar_id: number }>('SELECT id, name, pillar_id FROM pillars ORDER BY id');
    // Fetch categories
    const categories = await query<{ id: string; name: string; pillar_id: number }>('SELECT id, name, pillar_id FROM categories ORDER BY id');
    // Fetch subcategories
    const subcategories = await query<{ id: string; name: string; category_id: string }>('SELECT id, name, category_id FROM subcategories ORDER BY id');
    // Fetch questions
    const questions = await query<{ question_id: number; question_text: string; indicator_name: string; is_scored: boolean; good_practice_answer: string | null; ffp_value: number; sbp_value: number; group_logic: string | null; subcategory_id: string }>(
      'SELECT question_id, question_text, indicator_name, is_scored, good_practice_answer, ffp_value, sbp_value, group_logic, subcategory_id FROM b_ready_questions ORDER BY question_id'
    );
    // Build lookup maps
    const catByPillar: Record<number, any[]> = {};
    for (const pillar of pillars) catByPillar[pillar.id] = [];
    for (const cat of categories) {
      const pid = cat.pillar_id;
      if (!catByPillar[pid]) catByPillar[pid] = [];
      catByPillar[pid].push({ id: cat.id, name: cat.name, subcategories: [] as any[] });
    }
    // Map categories by id for subcategories insertion
    const subcatByCat: Record<string, any[]> = {};
    for (const cat of categories) {
      subcatByCat[cat.id] = [];
    }
    for (const sub of subcategories) {
      if (!subcatByCat[sub.category_id]) subcatByCat[sub.category_id] = [];
      subcatByCat[sub.category_id].push({ id: sub.id, name: sub.name, questions: [] as any[] });
    }
    // Map subcategories by id for question insertion
    const subcatMap: Record<string, any> = {};
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
    const catMap: Record<string, any> = {};
    for (const pid in catByPillar) {
      for (const cat of catByPillar[parseInt(pid, 10)]) {
        catMap[cat.id] = cat;
      }
    }
    for (const catId in subcatByCat) {
      const cat = catMap[catId];
      if (cat) cat.subcategories = subcatByCat[catId];
    }
    // Build final structure for pillars
    const result = pillars.map(p => ({
      id: p.id,
      name: p.name,
      categories: catByPillar[p.id] || []
    }));
    return res.json({ pillars: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch question hierarchy' });
  }
});

export default router;