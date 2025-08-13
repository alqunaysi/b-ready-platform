"use strict";
/**
 * Scoring utilities for the B-Ready Assessment Platform.
 *
 * This module implements the rule-based scoring logic described in the
 * specification. Each question carries two values: ffp_value (firm-focused
 * perspective) and sbp_value (societal benefits perspective). Depending on the
 * group_logic field of the question, points are awarded according to different
 * rules:
 *
 * - Simple (null/undefined): award the question’s points if the user’s answer
 *   matches the good_practice_answer.
 * - AND: treat all questions with the same indicator_name and group_logic as
 *   belonging to one group; points for all questions in the group are awarded
 *   only if every question in the group is answered correctly.
 * - OR: group of questions where points are awarded if at least one question
 *   within the group is answered correctly. Points for each correctly
 *   answered question in the group are summed.
 * - PARTIAL: group of questions where points are summed across each correctly
 *   answered question.
 * - CDF_INPUT: placeholder normal CDF calculation for each question; see
 *   normalCDF() implementation below. For the purposes of this platform,
 *   user answers are interpreted as binary inputs (Y=1, N=0) and passed
 *   directly into the CDF.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateScores = calculateScores;
/**
 * Calculates aggregate FFP and SBP scores for a set of answered questions.
 * @param questions The answered questions with metadata and user answers.
 */
function calculateScores(questions) {
    let totalFfp = 0;
    let totalSbp = 0;
    // Group questions by indicator_name and group_logic. This ensures groups
    // containing multiple questions (for AND/OR/PARTIAL) are evaluated together.
    const groups = {};
    for (const q of questions) {
        const gl = q.group_logic ? q.group_logic.toUpperCase() : 'SIMPLE';
        const key = `${gl}::${q.indicator_name}`;
        if (!groups[key])
            groups[key] = [];
        groups[key].push(q);
    }
    // Iterate over each group and apply rules
    for (const key of Object.keys(groups)) {
        const qs = groups[key];
        const [logic] = key.split('::');
        switch (logic) {
            case 'AND': {
                // All questions must be answered correctly to earn any points.
                const allCorrect = qs.every(q => compareAnswers(q.user_answer, q.good_practice_answer));
                if (allCorrect) {
                    for (const q of qs) {
                        totalFfp += Number(q.ffp_value) || 0;
                        totalSbp += Number(q.sbp_value) || 0;
                    }
                }
                break;
            }
            case 'OR': {
                // Award points for each correctly answered question. Points are only
                // granted if at least one question in the group is correct.
                let anyCorrect = false;
                for (const q of qs) {
                    if (compareAnswers(q.user_answer, q.good_practice_answer)) {
                        anyCorrect = true;
                        totalFfp += Number(q.ffp_value) || 0;
                        totalSbp += Number(q.sbp_value) || 0;
                    }
                }
                // If none are correct, no points are added.
                break;
            }
            case 'PARTIAL': {
                // Sum points across each correctly answered question.
                for (const q of qs) {
                    if (compareAnswers(q.user_answer, q.good_practice_answer)) {
                        totalFfp += Number(q.ffp_value) || 0;
                        totalSbp += Number(q.sbp_value) || 0;
                    }
                }
                break;
            }
            case 'CDF_INPUT': {
                // Placeholder Normal CDF: interpret 'Y' as 1 and 'N' as 0; multiply by
                // the question’s ffp/sbp values.
                for (const q of qs) {
                    const inputVal = q.user_answer.trim().toUpperCase() === 'Y' ? 1 : 0;
                    const factor = normalCDF(inputVal);
                    totalFfp += factor * (Number(q.ffp_value) || 0);
                    totalSbp += factor * (Number(q.sbp_value) || 0);
                }
                break;
            }
            default: {
                // SIMPLE or unrecognised: treat individually.
                for (const q of qs) {
                    if (compareAnswers(q.user_answer, q.good_practice_answer)) {
                        totalFfp += Number(q.ffp_value) || 0;
                        totalSbp += Number(q.sbp_value) || 0;
                    }
                }
                break;
            }
        }
    }
    return { ffp: totalFfp, sbp: totalSbp };
}
/**
 * Compare a user answer against the good practice answer. Handles nulls and
 * case-insensitive comparison.
 */
function compareAnswers(user, good) {
    if (good === null || good === undefined)
        return false;
    if (user === null || user === undefined)
        return false;
    return user.trim().toUpperCase() === good.trim().toUpperCase();
}
/**
 * Approximate the cumulative distribution function for the standard normal
 * distribution. Uses an approximation formula that is sufficiently accurate
 * for this placeholder implementation.
 *
 * Source: Abramowitz and Stegun approximation
 */
function normalCDF(x) {
    // constants
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    // Save the sign of x
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x) / Math.sqrt(2.0);
    // A&S formula for error function erf
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return 0.5 * (1.0 + sign * y);
}
