import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateJWT } from '../middleware/auth';
import { calculateScores, QuestionData } from '../utils/scoring';

const router = Router();

/**
 * POST /api/assessments/start
 * Create a new assessment for the authenticated user.
 */
router.post('/start', authenticateJWT, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const result = await query<{ id: number }>(
      'INSERT INTO assessments (user_id, status) VALUES ($1, $2) RETURNING id',
      [user.id, 'In Progress']
    );
    return res.json({ assessmentId: result[0].id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not start assessment' });
  }
});

/**
 * GET /api/assessments
 * Return a list of assessments belonging to the authenticated user.
 * Each record includes id, status, final_ffp_score, final_sbp_score and created_at.
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const rows = await query<{ id: number; status: string; final_ffp_score: number | null; final_sbp_score: number | null; created_at: Date }>(
      'SELECT id, status, final_ffp_score, final_sbp_score, created_at FROM assessments WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );
    return res.json({ assessments: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

/**
 * GET /api/assessments/:id/answers
 * Fetch saved answers for a particular assessment. Requires authentication and ownership.
 */
router.get('/:id/answers', authenticateJWT, async (req: Request, res: Response) => {
  const assessmentId = parseInt(req.params.id, 10);
  const user = (req as any).user;
  try {
    // Verify ownership
    const assessments = await query<{ user_id: number }>('SELECT user_id FROM assessments WHERE id = $1', [assessmentId]);
    if (assessments.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    if (assessments[0].user_id !== user.id) {
      return res.status(403).json({ error: 'You do not own this assessment' });
    }
    // Fetch answers
    const answers = await query<{ question_id: number; user_answer: string }>('SELECT question_id, user_answer FROM user_answers WHERE assessment_id = $1', [assessmentId]);
    return res.json({ answers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch answers' });
  }
});

/**
 * POST /api/assessments/:id/answers
 * Save or update answers for questions. Expects an array of objects with
 * question_id and user_answer. Requires authentication.
 */
router.post('/:id/answers', authenticateJWT, async (req: Request, res: Response) => {
  const assessmentId = parseInt(req.params.id, 10);
  const user = (req as any).user;
  const answers: { question_id: number; user_answer: string }[] = req.body;
  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'Request body must be an array of answers' });
  }
  try {
    // Verify ownership of assessment
    const assessments = await query<{ user_id: number }>('SELECT user_id FROM assessments WHERE id = $1', [assessmentId]);
    if (assessments.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    if (assessments[0].user_id !== user.id) {
      return res.status(403).json({ error: 'You do not own this assessment' });
    }
    // Insert or replace each answer. Since the user_answers table does not
    // currently define a unique constraint on (assessment_id, question_id), we
    // delete any existing record first then insert the new one.
    for (const ans of answers) {
      const { question_id, user_answer } = ans;
      await query('DELETE FROM user_answers WHERE assessment_id = $1 AND question_id = $2', [assessmentId, question_id]);
      await query(
        'INSERT INTO user_answers (assessment_id, question_id, user_answer) VALUES ($1, $2, $3)',
        [assessmentId, question_id, user_answer]
      );
    }
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save answers' });
  }
});

/**
 * POST /api/assessments/:id/calculate
 * Finalise the assessment by calculating scores. Requires authentication.
 */
router.post('/:id/calculate', authenticateJWT, async (req: Request, res: Response) => {
  const assessmentId = parseInt(req.params.id, 10);
  const user = (req as any).user;
  try {
    // Verify ownership and status
    const assessments = await query<{ user_id: number; status: string }>('SELECT user_id, status FROM assessments WHERE id = $1', [assessmentId]);
    if (assessments.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const assessment = assessments[0];
    if (assessment.user_id !== user.id) {
      return res.status(403).json({ error: 'You do not own this assessment' });
    }
    // Fetch answered questions joined with question metadata
    const rows = await query<{
      question_id: number;
      indicator_name: string;
      group_logic: string | null;
      good_practice_answer: string | null;
      ffp_value: number;
      sbp_value: number;
      user_answer: string;
    }>(
      `SELECT qa.question_id, q.indicator_name, q.group_logic, q.good_practice_answer, q.ffp_value, q.sbp_value, qa.user_answer
       FROM user_answers qa
       JOIN b_ready_questions q ON qa.question_id = q.question_id
       WHERE qa.assessment_id = $1`,
      [assessmentId]
    );
    // Compute scores
    const scoreInput: QuestionData[] = rows.map(row => ({
      question_id: row.question_id,
      indicator_name: row.indicator_name,
      group_logic: row.group_logic,
      good_practice_answer: row.good_practice_answer,
      ffp_value: row.ffp_value,
      sbp_value: row.sbp_value,
      user_answer: row.user_answer
    }));
    const { ffp, sbp } = calculateScores(scoreInput);
    // Update assessment
    await query(
      'UPDATE assessments SET status = $1, final_ffp_score = $2, final_sbp_score = $3 WHERE id = $4',
      ['Completed', ffp, sbp, assessmentId]
    );
    return res.json({ final_ffp_score: ffp, final_sbp_score: sbp });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to calculate scores' });
  }
});

export default router;