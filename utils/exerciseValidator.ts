// ===== EXERCISE VALIDATION UTILITIES =====
// Validates all exercise content before rendering

import { VocabularyLevel, RewriteQ, ReadingMCQ, TrueFalseQ, FillBlankBoxQ, MegaTest50, MultipleChoiceQ, FillInputQ, ScrambleQ } from '../types';

const VALID_LEVELS: VocabularyLevel[] = ['A1', 'A2', 'B1'];
const VALID_CHOICES = ['A', 'B', 'C'] as const;

// ===== INDIVIDUAL VALIDATORS =====

export function validateRewriteQ(q: any, index: number): { valid: boolean; error?: string } {
    if (!q || typeof q !== 'object') {
        return { valid: false, error: `Rewrite Q${index + 1}: không phải object hợp lệ` };
    }

    const requiredFields = ['id', 'original_sentence', 'instruction', 'rewritten_correct', 'explanation_vi', 'level'];
    for (const field of requiredFields) {
        if (!q[field] || (typeof q[field] === 'string' && q[field].trim() === '')) {
            return { valid: false, error: `Rewrite Q${index + 1}: thiếu field "${field}"` };
        }
    }

    if (!VALID_LEVELS.includes(q.level)) {
        return { valid: false, error: `Rewrite Q${index + 1}: level "${q.level}" không hợp lệ` };
    }

    // Check hint is not the full answer (hint is optional)
    if (q.hint_sample && q.hint_sample.toLowerCase() === q.rewritten_correct.toLowerCase()) {
        return { valid: false, error: `Rewrite Q${index + 1}: hint không được là đáp án đầy đủ` };
    }

    return { valid: true };
}

export function validateReadingMCQ(q: any, index: number): { valid: boolean; error?: string } {
    if (!q || typeof q !== 'object') {
        return { valid: false, error: `Reading Q${index + 1}: không phải object hợp lệ` };
    }

    const requiredFields = ['id', 'question_text', 'choices', 'correct_choice', 'explanation_vi'];
    for (const field of requiredFields) {
        if (q[field] === undefined || q[field] === null) {
            return { valid: false, error: `Reading Q${index + 1}: thiếu field "${field}"` };
        }
    }

    if (!Array.isArray(q.choices) || q.choices.length !== 3) {
        return { valid: false, error: `Reading Q${index + 1}: choices phải có đúng 3 lựa chọn A/B/C` };
    }

    if (!VALID_CHOICES.includes(q.correct_choice)) {
        return { valid: false, error: `Reading Q${index + 1}: correct_choice phải là A, B, hoặc C` };
    }

    return { valid: true };
}

export function validateTrueFalseQ(q: any, index: number): { valid: boolean; error?: string } {
    if (!q || typeof q !== 'object') {
        return { valid: false, error: `True/False Q${index + 1}: không phải object hợp lệ` };
    }

    const requiredFields = ['id', 'statement', 'correct_answer', 'explanation_vi'];
    for (const field of requiredFields) {
        if (q[field] === undefined || q[field] === null || (typeof q[field] === 'string' && q[field].trim() === '')) {
            return { valid: false, error: `True/False Q${index + 1}: thiếu field "${field}"` };
        }
    }

    if (typeof q.correct_answer !== 'boolean') {
        return { valid: false, error: `True/False Q${index + 1}: correct_answer phải là true hoặc false` };
    }

    return { valid: true };
}

export function validateFillBlankBoxQ(q: any): { valid: boolean; error?: string } {
    if (!q || typeof q !== 'object') {
        return { valid: false, error: 'Fill-blank-box: không phải object hợp lệ' };
    }

    // Check paragraph
    if (!q.paragraph || typeof q.paragraph !== 'string' || q.paragraph.trim() === '') {
        return { valid: false, error: 'Fill-blank-box: thiếu paragraph' };
    }

    // Check word_box
    if (!Array.isArray(q.word_box) || q.word_box.length < 5) {
        return { valid: false, error: 'Fill-blank-box: word_box phải có ít nhất 5 từ' };
    }

    // Check blanks array
    if (!Array.isArray(q.blanks) || q.blanks.length < 4) {
        return { valid: false, error: 'Fill-blank-box: blanks phải có ít nhất 4 chỗ trống' };
    }

    // Check each blank has number and correct_answer
    for (const blank of q.blanks) {
        if (typeof blank.number !== 'number' || !blank.correct_answer) {
            return { valid: false, error: 'Fill-blank-box: mỗi blank phải có number và correct_answer' };
        }
    }

    return { valid: true };
}

// ===== MASTER VALIDATOR =====

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    filteredTest: MegaTest50 | null;
}

export function validateMegaTest50(test: any): ValidationResult {
    const errors: string[] = [];

    if (!test || typeof test !== 'object') {
        return { valid: false, errors: ['MegaTest không phải object hợp lệ'], filteredTest: null };
    }

    // Validate level
    if (!VALID_LEVELS.includes(test.level)) {
        errors.push(`Level "${test.level}" không hợp lệ - phải là A1, A2, hoặc B1`);
    }

    // Validate two passages
    if (!test.passage_reading_mcq || test.passage_reading_mcq.trim() === '') {
        errors.push('Thiếu passage_reading_mcq');
    }
    if (!test.passage_true_false || test.passage_true_false.trim() === '') {
        errors.push('Thiếu passage_true_false');
    }

    // Validate multipleChoice (need 10)
    const validMultipleChoice: MultipleChoiceQ[] = [];
    if (!Array.isArray(test.multipleChoice)) {
        errors.push('Thiếu mảng multipleChoice questions');
    } else {
        test.multipleChoice.forEach((q: any, i: number) => {
            if (q && q.id && q.question && Array.isArray(q.options) && typeof q.correctAnswer === 'number' && q.explanation) {
                validMultipleChoice.push(q);
            } else {
                errors.push(`Multiple Choice Q${i + 1} không hợp lệ`);
            }
        });
        if (validMultipleChoice.length < 10) {
            errors.push(`Chỉ có ${validMultipleChoice.length}/10 multiple choice questions hợp lệ`);
        }
    }

    // Validate fillBlank (need 10)
    const validFillBlank: FillInputQ[] = [];
    if (!Array.isArray(test.fillBlank)) {
        errors.push('Thiếu mảng fillBlank questions');
    } else {
        test.fillBlank.forEach((q: any, i: number) => {
            if (q && q.id && q.question && q.correctAnswer && q.clueEmoji) {
                validFillBlank.push(q);
            } else {
                errors.push(`Fill-blank Q${i + 1} không hợp lệ`);
            }
        });
        if (validFillBlank.length < 10) {
            errors.push(`Chỉ có ${validFillBlank.length}/10 fill-blank questions hợp lệ`);
        }
    }

    // Validate scramble (need 10)
    const validScramble: ScrambleQ[] = [];
    if (!Array.isArray(test.scramble)) {
        errors.push('Thiếu mảng scramble questions');
    } else {
        test.scramble.forEach((q: any, i: number) => {
            if (q && q.id && Array.isArray(q.scrambled) && q.correctSentence && q.translation) {
                validScramble.push(q);
            } else {
                errors.push(`Scramble Q${i + 1} không hợp lệ`);
            }
        });
        if (validScramble.length < 10) {
            errors.push(`Chỉ có ${validScramble.length}/10 scramble questions hợp lệ`);
        }
    }

    // Validate rewrite questions (need 5)
    const validRewrites: RewriteQ[] = [];
    if (!Array.isArray(test.rewrite)) {
        errors.push('Thiếu mảng rewrite questions');
    } else {
        for (let i = 0; i < test.rewrite.length; i++) {
            const result = validateRewriteQ(test.rewrite[i], i);
            if (result.valid) {
                validRewrites.push(test.rewrite[i]);
            } else {
                errors.push(result.error!);
            }
        }
        if (validRewrites.length < 5) {
            errors.push(`Chỉ có ${validRewrites.length}/5 rewrite questions hợp lệ`);
        }
    }

    // Validate reading MCQ (need 5)
    const validReadings: ReadingMCQ[] = [];
    if (!Array.isArray(test.readingMCQ)) {
        errors.push('Thiếu mảng readingMCQ questions');
    } else {
        for (let i = 0; i < test.readingMCQ.length; i++) {
            const result = validateReadingMCQ(test.readingMCQ[i], i);
            if (result.valid) {
                validReadings.push(test.readingMCQ[i]);
            } else {
                errors.push(result.error!);
            }
        }
        if (validReadings.length < 5) {
            errors.push(`Chỉ có ${validReadings.length}/5 reading MCQ questions hợp lệ`);
        }
    }

    // Validate true/false (need 5)
    const validTrueFalse: TrueFalseQ[] = [];
    if (!Array.isArray(test.trueFalse)) {
        errors.push('Thiếu mảng trueFalse questions');
    } else {
        for (let i = 0; i < test.trueFalse.length; i++) {
            const result = validateTrueFalseQ(test.trueFalse[i], i);
            if (result.valid) {
                validTrueFalse.push(test.trueFalse[i]);
            } else {
                errors.push(result.error!);
            }
        }
        if (validTrueFalse.length < 5) {
            errors.push(`Chỉ có ${validTrueFalse.length}/5 true/false questions hợp lệ`);
        }
    }

    // Validate fill-blank-box (single paragraph with 5 blanks)
    let validFillBlankBox: FillBlankBoxQ | null = null;
    if (!test.fillBlankBox || typeof test.fillBlankBox !== 'object') {
        errors.push('Thiếu fillBlankBox object');
    } else {
        const result = validateFillBlankBoxQ(test.fillBlankBox);
        if (result.valid) {
            validFillBlankBox = test.fillBlankBox;
        } else {
            errors.push(result.error!);
        }
    }

    const isValid = errors.length === 0;

    return {
        valid: isValid,
        errors,
        filteredTest: isValid ? {
            level: test.level,
            passage_reading_mcq: test.passage_reading_mcq,
            passage_reading_mcq_translation: test.passage_reading_mcq_translation || '',
            passage_true_false: test.passage_true_false,
            passage_true_false_translation: test.passage_true_false_translation || '',
            multipleChoice: validMultipleChoice.slice(0, 10),
            fillBlank: validFillBlank.slice(0, 10),
            scramble: validScramble.slice(0, 10),
            rewrite: validRewrites.slice(0, 5),
            readingMCQ: validReadings.slice(0, 5),
            trueFalse: validTrueFalse.slice(0, 5),
            fillBlankBox: validFillBlankBox!
        } : null
    };
}

// ===== SCORING UTILITIES =====

export function calculateScore(correctCount: number, totalQuestions: number = 50): {
    score: string;
    correctText: string
} {
    // 10.0 points for 50 questions, each = 0.2 points
    const rawScore = (correctCount / totalQuestions) * 10;
    const roundedScore = Math.round(rawScore * 10) / 10;

    // Format with decimal comma (Vietnamese format)
    const scoreStr = roundedScore.toFixed(1).replace('.', ',');

    return {
        score: scoreStr,
        correctText: `${correctCount}/${totalQuestions}`
    };
}

// Normalize answer for rewrite comparison
export function normalizeAnswer(answer: string): string {
    return answer
        .toLowerCase()
        .trim()
        .replace(/[.,!?;:'"]/g, '')
        .replace(/\s+/g, ' ');
}

// Check if rewrite answer is correct (including variants)
export function isRewriteCorrect(userAnswer: string, correctAnswer: string, variants?: string[]): boolean {
    const normalized = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(correctAnswer);

    if (normalized === normalizedCorrect) return true;

    if (variants && Array.isArray(variants)) {
        for (const variant of variants) {
            if (normalized === normalizeAnswer(variant)) return true;
        }
    }

    return false;
}
