// ===== EXERCISE VALIDATION UTILITIES =====
// Validates all exercise content before rendering

import { VocabularyLevel, RewriteQ, ReadingMCQ, PronunciationMCQ, MegaTest50 } from '../types';

const VALID_LEVELS: VocabularyLevel[] = ['A1', 'A2', 'B1'];
const VALID_CHOICES = ['A', 'B', 'C'] as const;

// ===== INDIVIDUAL VALIDATORS =====

export function validateRewriteQ(q: any, index: number): { valid: boolean; error?: string } {
    if (!q || typeof q !== 'object') {
        return { valid: false, error: `Rewrite Q${index + 1}: không phải object hợp lệ` };
    }

    const requiredFields = ['id', 'original_sentence', 'instruction', 'hint_sample', 'rewritten_correct', 'explanation_vi', 'level'];
    for (const field of requiredFields) {
        if (!q[field] || (typeof q[field] === 'string' && q[field].trim() === '')) {
            return { valid: false, error: `Rewrite Q${index + 1}: thiếu field "${field}"` };
        }
    }

    if (!VALID_LEVELS.includes(q.level)) {
        return { valid: false, error: `Rewrite Q${index + 1}: level "${q.level}" không hợp lệ` };
    }

    // Check hint is not the full answer
    if (q.hint_sample.toLowerCase() === q.rewritten_correct.toLowerCase()) {
        return { valid: false, error: `Rewrite Q${index + 1}: hint không được là đáp án đầy đủ` };
    }

    return { valid: true };
}

export function validateReadingMCQ(q: any, index: number): { valid: boolean; error?: string } {
    if (!q || typeof q !== 'object') {
        return { valid: false, error: `Reading Q${index + 1}: không phải object hợp lệ` };
    }

    const requiredFields = ['id', 'question_text', 'choices', 'correct_choice', 'explanation_vi', 'level'];
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

export function validatePronunciationMCQ(q: any, index: number): { valid: boolean; error?: string } {
    if (!q || typeof q !== 'object') {
        return { valid: false, error: `Pronunciation Q${index + 1}: không phải object hợp lệ` };
    }

    const requiredFields = ['id', 'instruction', 'choices', 'correct_choice', 'explanation_vi', 'level'];
    for (const field of requiredFields) {
        if (q[field] === undefined || q[field] === null) {
            return { valid: false, error: `Pronunciation Q${index + 1}: thiếu field "${field}"` };
        }
    }

    if (!Array.isArray(q.choices) || q.choices.length !== 3) {
        return { valid: false, error: `Pronunciation Q${index + 1}: choices phải có đúng 3 lựa chọn` };
    }

    // Validate each choice has word and underlined
    for (let i = 0; i < q.choices.length; i++) {
        const choice = q.choices[i];
        if (!choice.word || !choice.underlined) {
            return { valid: false, error: `Pronunciation Q${index + 1}: choice ${i + 1} thiếu word hoặc underlined` };
        }
        // Verify underlined part exists in word
        if (!choice.word.toLowerCase().includes(choice.underlined.toLowerCase())) {
            return { valid: false, error: `Pronunciation Q${index + 1}: underlined "${choice.underlined}" không có trong word "${choice.word}"` };
        }
    }

    if (!VALID_CHOICES.includes(q.correct_choice)) {
        return { valid: false, error: `Pronunciation Q${index + 1}: correct_choice phải là A, B, hoặc C` };
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

    // Validate passage
    if (!test.passage || test.passage.trim() === '') {
        errors.push('Thiếu passage đọc hiểu');
    }

    // Validate rewrite questions (need 40)
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
        if (validRewrites.length < 40) {
            errors.push(`Chỉ có ${validRewrites.length}/40 rewrite questions hợp lệ`);
        }
    }

    // Validate reading MCQ (need 5)
    const validReadings: ReadingMCQ[] = [];
    if (!Array.isArray(test.reading)) {
        errors.push('Thiếu mảng reading questions');
    } else {
        for (let i = 0; i < test.reading.length; i++) {
            const result = validateReadingMCQ(test.reading[i], i);
            if (result.valid) {
                validReadings.push(test.reading[i]);
            } else {
                errors.push(result.error!);
            }
        }
        if (validReadings.length < 5) {
            errors.push(`Chỉ có ${validReadings.length}/5 reading questions hợp lệ`);
        }
    }

    // Validate pronunciation MCQ (need 5)
    const validPronunciations: PronunciationMCQ[] = [];
    if (!Array.isArray(test.pronunciation)) {
        errors.push('Thiếu mảng pronunciation questions');
    } else {
        for (let i = 0; i < test.pronunciation.length; i++) {
            const result = validatePronunciationMCQ(test.pronunciation[i], i);
            if (result.valid) {
                validPronunciations.push(test.pronunciation[i]);
            } else {
                errors.push(result.error!);
            }
        }
        if (validPronunciations.length < 5) {
            errors.push(`Chỉ có ${validPronunciations.length}/5 pronunciation questions hợp lệ`);
        }
    }

    const isValid = errors.length === 0;

    return {
        valid: isValid,
        errors,
        filteredTest: isValid ? {
            level: test.level,
            passage: test.passage,
            passage_translation: test.passage_translation || '',
            rewrite: validRewrites.slice(0, 40),
            reading: validReadings.slice(0, 5),
            pronunciation: validPronunciations.slice(0, 5)
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
