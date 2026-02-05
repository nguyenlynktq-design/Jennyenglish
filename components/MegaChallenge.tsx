
import React, { useState, useEffect } from 'react';
import { MegaTest50, RewriteQ, ReadingMCQ, PronunciationMCQ, VocabularyLevel } from '../types';
import { calculateScore, isRewriteCorrect, validateMegaTest50 } from '../utils/exerciseValidator';

interface MegaChallengeProps {
  megaData: MegaTest50;
  onScoresUpdate?: (scores: { total: number; rewrite: number; reading: number; pronunciation: number }) => void;
}

export const MegaChallenge: React.FC<MegaChallengeProps> = ({ megaData, onScoresUpdate }) => {
  const [activeZone, setActiveZone] = useState<'rewrite' | 'reading' | 'pronunciation'>('rewrite');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);

  // Validate on mount
  useEffect(() => {
    if (megaData) {
      const result = validateMegaTest50(megaData);
      setValidationResult({ valid: result.valid, errors: result.errors });
    }
  }, [megaData]);

  const handleAnswer = (qId: string, val: any) => {
    if (submitted[qId]) return;
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const checkFinal = (qId: string) => {
    setSubmitted(prev => ({ ...prev, [qId]: true }));
  };

  // Calculate scores for each section
  const calculateZoneScore = (zone: string): number => {
    let correct = 0;
    if (!megaData) return 0;

    if (zone === 'rewrite') {
      (megaData.rewrite || []).forEach(q => {
        if (submitted[q.id]) {
          const isCorrect = isRewriteCorrect(
            answers[q.id] || '',
            q.rewritten_correct,
            q.allowed_variants
          );
          if (isCorrect) correct++;
        }
      });
    } else if (zone === 'reading') {
      (megaData.reading || []).forEach(q => {
        if (submitted[q.id] && answers[q.id] === q.correct_choice) {
          correct++;
        }
      });
    } else if (zone === 'pronunciation') {
      (megaData.pronunciation || []).forEach(q => {
        if (submitted[q.id] && answers[q.id] === q.correct_choice) {
          correct++;
        }
      });
    }
    return correct;
  };

  // Update parent with scores
  useEffect(() => {
    if (onScoresUpdate) {
      const rewrite = calculateZoneScore('rewrite');
      const reading = calculateZoneScore('reading');
      const pronunciation = calculateZoneScore('pronunciation');
      const total = rewrite + reading + pronunciation;
      onScoresUpdate({ total, rewrite, reading, pronunciation });
    }
  }, [submitted, megaData]);

  // Calculate total score for display
  const getTotalCorrect = () => {
    return calculateZoneScore('rewrite') + calculateZoneScore('reading') + calculateZoneScore('pronunciation');
  };

  const getTotalSubmitted = () => {
    return Object.keys(submitted).filter(k => submitted[k]).length;
  };

  // Check if test is complete
  const isTestComplete = () => {
    const rewriteCount = megaData?.rewrite?.length || 0;
    const readingCount = megaData?.reading?.length || 0;
    const pronCount = megaData?.pronunciation?.length || 0;
    return getTotalSubmitted() >= (rewriteCount + readingCount + pronCount);
  };

  // Validation error display
  if (validationResult && !validationResult.valid) {
    return (
      <div className="bg-red-50 rounded-3xl p-8 border-2 border-red-200">
        <h2 className="text-xl font-black text-red-700 mb-4">⚠️ Lỗi Dữ Liệu Bài Kiểm Tra</h2>
        <p className="text-red-600 mb-4">Bài kiểm tra không hợp lệ và không thể hiển thị:</p>
        <ul className="list-disc list-inside space-y-2">
          {validationResult.errors.slice(0, 5).map((err, i) => (
            <li key={i} className="text-red-600 text-sm">{err}</li>
          ))}
          {validationResult.errors.length > 5 && (
            <li className="text-red-500 text-sm italic">...và {validationResult.errors.length - 5} lỗi khác</li>
          )}
        </ul>
      </div>
    );
  }

  if (!megaData) return null;

  const { score, correctText } = calculateScore(getTotalCorrect());

  return (
    <div className="bg-brand-900 rounded-[3rem] shadow-xl border-[8px] border-brand-800 overflow-hidden mb-12 font-sans">
      {/* Header with Score Display */}
      <div className="bg-brand-800 p-6 text-center border-b-2 border-brand-700">
        <h2 className="text-xl md:text-2xl font-black text-white uppercase italic mb-2 tracking-tighter">
          🚀 MEGA CHALLENGE - 50 CÂU HỎI 🚀
        </h2>
        <p className="text-brand-200 text-sm mb-4">Cấp độ: {megaData.level}</p>

        {/* Score Display */}
        <div className="flex justify-center gap-6 mb-4">
          <div className="bg-white/10 rounded-2xl px-6 py-3">
            <p className="text-brand-200 text-xs uppercase tracking-wider">Điểm</p>
            <p className="text-3xl font-black text-highlight-400">{score}/10,0</p>
          </div>
          <div className="bg-white/10 rounded-2xl px-6 py-3">
            <p className="text-brand-200 text-xs uppercase tracking-wider">Đúng</p>
            <p className="text-3xl font-black text-green-400">{correctText}</p>
          </div>
        </div>

        {/* Zone Navigation */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { id: 'rewrite', label: '40 Viết lại câu', icon: '✏️', count: megaData.rewrite?.length || 0 },
            { id: 'reading', label: '5 Đọc hiểu', icon: '📖', count: megaData.reading?.length || 0 },
            { id: 'pronunciation', label: '5 Phát âm', icon: '🔊', count: megaData.pronunciation?.length || 0 },
          ].map(z => (
            <button
              key={z.id}
              onClick={() => setActiveZone(z.id as any)}
              className={`px-4 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${activeZone === z.id
                  ? 'bg-highlight-400 text-brand-900 scale-105 shadow-lg ring-2 ring-white/20'
                  : 'bg-brand-700 text-brand-200 hover:bg-brand-600'
                }`}
            >
              <span className="text-xl">{z.icon}</span> {z.label}
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">
                {calculateZoneScore(z.id)}/{z.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 bg-white/5">
        {/* ===== REWRITE SECTION (40 Questions) ===== */}
        {activeZone === 'rewrite' && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {(megaData.rewrite || []).map((q, idx) => {
              const userAnswer = answers[q.id] || '';
              const isCorrect = isRewriteCorrect(userAnswer, q.rewritten_correct, q.allowed_variants);

              return (
                <div key={q.id} className="bg-white p-6 rounded-[2rem] shadow-lg border-b-4 border-slate-100">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="bg-brand-100 text-brand-600 px-3 py-1 rounded-lg font-black text-sm shrink-0">
                      {idx + 1}/{megaData.rewrite?.length || 40}
                    </span>
                    <div className="flex-1">
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
                        Viết lại câu sao cho nghĩa không đổi:
                      </p>
                      <p className="text-xl font-black text-slate-800 leading-relaxed">
                        "{q.original_sentence}"
                      </p>
                      <p className="mt-2 text-sm text-brand-600 font-semibold bg-brand-50 px-3 py-2 rounded-lg inline-block">
                        💡 {q.hint_sample}
                      </p>
                    </div>
                  </div>

                  <textarea
                    disabled={submitted[q.id]}
                    value={userAnswer}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    placeholder="Viết câu trả lời của bạn..."
                    rows={2}
                    className={`w-full p-4 text-lg rounded-xl border-2 font-semibold outline-none transition-all resize-none ${submitted[q.id]
                        ? isCorrect
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-slate-50 border-slate-200 focus:border-brand-500'
                      }`}
                  />

                  {!submitted[q.id] ? (
                    <button
                      onClick={() => checkFinal(q.id)}
                      disabled={!userAnswer.trim()}
                      className="w-full mt-3 py-3 bg-brand-600 text-white rounded-xl font-black text-lg shadow-md uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Kiểm tra 🚀
                    </button>
                  ) : (
                    <div className={`mt-4 p-4 rounded-2xl border-l-4 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{isCorrect ? '🌟' : '💡'}</span>
                        <div>
                          <p className="font-black text-sm mb-1 text-slate-800">
                            {isCorrect ? 'Tuyệt vời! Câu trả lời chính xác!' : 'Chưa đúng! Đáp án đúng là:'}
                          </p>
                          {!isCorrect && (
                            <p className="text-green-700 font-semibold mb-2">✓ {q.rewritten_correct}</p>
                          )}
                          <p className="text-xs italic text-slate-600 leading-relaxed">{q.explanation_vi}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== READING SECTION (5 Questions) ===== */}
        {activeZone === 'reading' && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {/* Reading Passage */}
            <div className="bg-white p-6 rounded-[2rem] shadow-lg border-2 border-brand-100">
              <h3 className="text-lg font-black text-brand-600 mb-4 flex items-center gap-2">
                📖 Đọc đoạn văn sau:
              </h3>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <p className="text-lg text-slate-800 leading-relaxed whitespace-pre-line">
                  {megaData.passage}
                </p>
              </div>
              {megaData.passage_translation && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-brand-500 font-semibold">
                    📝 Xem bản dịch tiếng Việt
                  </summary>
                  <p className="mt-2 text-sm text-slate-600 italic leading-relaxed">
                    {megaData.passage_translation}
                  </p>
                </details>
              )}
            </div>

            {/* Reading Questions */}
            {(megaData.reading || []).map((q, idx) => {
              const isCorrect = answers[q.id] === q.correct_choice;

              return (
                <div key={q.id} className="bg-white p-6 rounded-[2rem] shadow-lg border-b-4 border-slate-100">
                  <p className="font-black text-lg text-slate-800 mb-4 flex gap-3 leading-tight">
                    <span className="bg-brand-100 text-brand-600 px-3 py-0.5 rounded-lg h-fit text-sm">
                      Q{idx + 1}
                    </span>
                    {q.question_text}
                  </p>

                  <div className="space-y-3">
                    {(q.choices || []).map((choice, i) => {
                      const letter = ['A', 'B', 'C'][i];
                      return (
                        <button
                          key={i}
                          onClick={() => { handleAnswer(q.id, letter); checkFinal(q.id); }}
                          disabled={submitted[q.id]}
                          className={`w-full p-4 rounded-xl border-2 font-bold text-left text-base transition-all flex items-center gap-3 ${submitted[q.id]
                              ? letter === q.correct_choice
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : answers[q.id] === letter
                                  ? 'bg-red-100 border-red-500 text-red-700'
                                  : 'bg-slate-50 opacity-50'
                              : 'bg-white border-slate-100 hover:border-brand-300 hover:bg-brand-50'
                            }`}
                        >
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${submitted[q.id]
                              ? letter === q.correct_choice
                                ? 'bg-green-500 text-white'
                                : answers[q.id] === letter
                                  ? 'bg-red-500 text-white'
                                  : 'bg-slate-200 text-slate-400'
                              : 'bg-brand-500 text-white'
                            }`}>
                            {letter}
                          </span>
                          {choice}
                        </button>
                      );
                    })}
                  </div>

                  {submitted[q.id] && (
                    <div className={`mt-4 p-4 rounded-2xl border-l-4 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{isCorrect ? '🌟' : '💡'}</span>
                        <div>
                          <p className="font-black text-sm mb-1 text-slate-800">
                            {isCorrect ? 'Chính xác!' : `Chưa đúng! Đáp án đúng là: ${q.correct_choice}`}
                          </p>
                          <p className="text-xs italic text-slate-600 leading-relaxed">{q.explanation_vi}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== PRONUNCIATION SECTION (5 Questions) ===== */}
        {activeZone === 'pronunciation' && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {(megaData.pronunciation || []).map((q, idx) => {
              const isCorrect = answers[q.id] === q.correct_choice;

              return (
                <div key={q.id} className="bg-white p-6 rounded-[2rem] shadow-lg border-b-4 border-slate-100">
                  <p className="text-slate-400 font-black uppercase text-[10px] mb-2 tracking-widest">
                    Câu {idx + 1}/5 - PHÁT ÂM
                  </p>
                  <p className="font-bold text-lg text-slate-800 mb-4">
                    🔊 {q.instruction || "Chọn từ có phần gạch chân phát âm khác với các từ còn lại:"}
                  </p>

                  <div className="grid md:grid-cols-3 gap-4">
                    {(q.choices || []).map((choice, i) => {
                      const letter = ['A', 'B', 'C'][i];
                      // Render word with underlined part
                      const renderWord = () => {
                        const word = choice.word;
                        const underlined = choice.underlined;
                        const idx = word.toLowerCase().indexOf(underlined.toLowerCase());
                        if (idx === -1) return word;
                        return (
                          <>
                            {word.slice(0, idx)}
                            <span className="underline decoration-2 decoration-brand-500 font-black">
                              {word.slice(idx, idx + underlined.length)}
                            </span>
                            {word.slice(idx + underlined.length)}
                          </>
                        );
                      };

                      return (
                        <button
                          key={i}
                          onClick={() => { handleAnswer(q.id, letter); checkFinal(q.id); }}
                          disabled={submitted[q.id]}
                          className={`p-6 rounded-xl border-2 font-bold text-center text-xl transition-all ${submitted[q.id]
                              ? letter === q.correct_choice
                                ? 'bg-green-100 border-green-500 text-green-700 ring-2 ring-green-200'
                                : answers[q.id] === letter
                                  ? 'bg-red-100 border-red-500 text-red-700'
                                  : 'bg-slate-50 opacity-50'
                              : 'bg-white border-slate-200 hover:border-brand-400 hover:bg-brand-50'
                            }`}
                        >
                          <span className={`block w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center font-black text-lg ${submitted[q.id]
                              ? letter === q.correct_choice
                                ? 'bg-green-500 text-white'
                                : answers[q.id] === letter
                                  ? 'bg-red-500 text-white'
                                  : 'bg-slate-200 text-slate-400'
                              : 'bg-brand-500 text-white'
                            }`}>
                            {letter}
                          </span>
                          <span className="text-2xl">{renderWord()}</span>
                        </button>
                      );
                    })}
                  </div>

                  {submitted[q.id] && (
                    <div className={`mt-4 p-4 rounded-2xl border-l-4 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{isCorrect ? '🔊' : '💡'}</span>
                        <div>
                          <p className="font-black text-sm mb-1 text-slate-800">
                            {isCorrect ? 'Chính xác! Bạn nghe đúng rồi!' : `Chưa đúng! Đáp án đúng là: ${q.correct_choice}`}
                          </p>
                          <p className="text-xs italic text-slate-600 leading-relaxed">{q.explanation_vi}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Test Complete Banner */}
      {isTestComplete() && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
          <h3 className="text-2xl font-black text-white mb-2">🎉 Hoàn Thành Bài Kiểm Tra!</h3>
          <p className="text-white/90 text-lg">
            Điểm số của bạn: <span className="font-black text-yellow-300">{score}/10,0</span> ({correctText} câu đúng)
          </p>
        </div>
      )}
    </div>
  );
};
