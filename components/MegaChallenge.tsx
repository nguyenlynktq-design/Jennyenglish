import React, { useState, useEffect } from 'react';
import { MegaTest50, MultipleChoiceQ, FillInputQ, ScrambleQ, RewriteQ, ReadingMCQ, TrueFalseQ, FillBlankBoxQ } from '../types';
import { calculateScore, isRewriteCorrect, validateMegaTest50 } from '../utils/exerciseValidator';

interface MegaChallengeProps {
  megaData: MegaTest50;
  onScoresUpdate?: (scores: { total: number }) => void;
}

type ZoneId = 'quiz' | 'fill' | 'scramble' | 'rewrite' | 'reading' | 'truefalse' | 'fillbox';

interface ZoneInfo {
  id: ZoneId;
  label: string;
  icon: string;
  count: number;
}

const ZONES: ZoneInfo[] = [
  { id: 'quiz', label: 'Quiz', icon: '📝', count: 10 },
  { id: 'fill', label: 'Điền từ', icon: '✏️', count: 10 },
  { id: 'scramble', label: 'Sắp xếp', icon: '🧩', count: 10 },
  { id: 'rewrite', label: 'Viết lại', icon: '📄', count: 5 },
  { id: 'reading', label: 'Đọc hiểu', icon: '📖', count: 5 },
  { id: 'truefalse', label: 'True/False', icon: '✓✗', count: 5 },
  { id: 'fillbox', label: 'Điền khung', icon: '📦', count: 5 },
];

export const MegaChallenge: React.FC<MegaChallengeProps> = ({ megaData, onScoresUpdate }) => {
  const [activeZone, setActiveZone] = useState<ZoneId>('quiz');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [scrambleSelections, setScrambleSelections] = useState<Record<string, string[]>>({});

  // Validate data
  const validation = validateMegaTest50(megaData);

  if (!validation.valid) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 m-4">
        <h3 className="text-red-700 font-bold text-lg mb-3">⚠️ Lỗi Dữ Liệu Bài Kiểm Tra</h3>
        <p className="text-red-600 mb-3">Bài kiểm tra không hợp lệ và không thể hiển thị:</p>
        <ul className="list-disc pl-6 text-red-600 text-sm">
          {validation.errors.slice(0, 5).map((err, i) => (
            <li key={i}>{err}</li>
          ))}
          {validation.errors.length > 5 && (
            <li>...và {validation.errors.length - 5} lỗi khác</li>
          )}
        </ul>
      </div>
    );
  }

  const data = validation.filteredTest!;

  // Calculate score for a zone
  const calculateZoneScore = (zone: ZoneId): { correct: number; total: number } => {
    let correct = 0;
    let total = 0;

    switch (zone) {
      case 'quiz':
        total = data.multipleChoice?.length || 0;
        data.multipleChoice?.forEach((q) => {
          if (submitted[q.id] && answers[q.id] === q.correctAnswer) correct++;
        });
        break;
      case 'fill':
        total = data.fillBlank?.length || 0;
        data.fillBlank?.forEach((q) => {
          if (submitted[q.id] && answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) correct++;
        });
        break;
      case 'scramble':
        total = data.scramble?.length || 0;
        data.scramble?.forEach((q) => {
          if (submitted[q.id]) {
            const userSentence = (scrambleSelections[q.id] || []).join(' ');
            if (userSentence.toLowerCase().replace(/\s+/g, ' ').trim() ===
              q.correctSentence.toLowerCase().replace(/\s+/g, ' ').trim()) correct++;
          }
        });
        break;
      case 'rewrite':
        total = data.rewrite?.length || 0;
        data.rewrite?.forEach((q) => {
          if (submitted[q.id] && isRewriteCorrect(answers[q.id] || '', q.rewritten_correct, q.allowed_variants)) correct++;
        });
        break;
      case 'reading':
        total = data.readingMCQ?.length || 0;
        data.readingMCQ?.forEach((q) => {
          if (submitted[q.id] && answers[q.id] === q.correct_choice) correct++;
        });
        break;
      case 'truefalse':
        total = data.trueFalse?.length || 0;
        data.trueFalse?.forEach((q) => {
          if (submitted[q.id] && answers[q.id] === q.correct_answer) correct++;
        });
        break;
      case 'fillbox':
        total = data.fillBlankBox?.length || 0;
        data.fillBlankBox?.forEach((q) => {
          if (submitted[q.id] && answers[q.id] === q.correct_answer) correct++;
        });
        break;
    }

    return { correct, total };
  };

  // Get total correct
  const getTotalCorrect = (): number => {
    return ZONES.reduce((sum, zone) => sum + calculateZoneScore(zone.id).correct, 0);
  };

  // Get submitted count for zone
  const getZoneSubmitted = (zone: ZoneId): number => {
    let count = 0;
    switch (zone) {
      case 'quiz': data.multipleChoice?.forEach(q => { if (submitted[q.id]) count++; }); break;
      case 'fill': data.fillBlank?.forEach(q => { if (submitted[q.id]) count++; }); break;
      case 'scramble': data.scramble?.forEach(q => { if (submitted[q.id]) count++; }); break;
      case 'rewrite': data.rewrite?.forEach(q => { if (submitted[q.id]) count++; }); break;
      case 'reading': data.readingMCQ?.forEach(q => { if (submitted[q.id]) count++; }); break;
      case 'truefalse': data.trueFalse?.forEach(q => { if (submitted[q.id]) count++; }); break;
      case 'fillbox': data.fillBlankBox?.forEach(q => { if (submitted[q.id]) count++; }); break;
    }
    return count;
  };

  // Handle answer
  const handleAnswer = (qId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  // Submit answer
  const handleSubmit = (qId: string) => {
    setSubmitted(prev => ({ ...prev, [qId]: true }));
  };

  // Scramble: click word to add to selection
  const handleScrambleWordClick = (qId: string, word: string, fromSelected: boolean) => {
    setScrambleSelections(prev => {
      const current = prev[qId] || [];
      if (fromSelected) {
        // Remove from selection
        const idx = current.lastIndexOf(word);
        if (idx !== -1) {
          const newArr = [...current];
          newArr.splice(idx, 1);
          return { ...prev, [qId]: newArr };
        }
      } else {
        // Add to selection
        return { ...prev, [qId]: [...current, word] };
      }
      return prev;
    });
  };

  // Calculate scores
  const totalCorrect = getTotalCorrect();
  const { score, correctText } = calculateScore(totalCorrect, 50);

  // Update parent
  useEffect(() => {
    onScoresUpdate?.({ total: totalCorrect });
  }, [totalCorrect, onScoresUpdate]);

  return (
    <div className="bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-2xl p-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-2">
          🚀 MEGA CHALLENGE - 50 CÂU 🚀
        </h2>
        <p className="text-emerald-200 mt-1">Cấp độ: {data.level}</p>
      </div>

      {/* Score Display */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="bg-white/10 backdrop-blur rounded-xl px-6 py-3 text-center">
          <div className="text-sm text-emerald-200">ĐIỂM</div>
          <div className="text-2xl font-bold text-yellow-400">{score}/10,0</div>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl px-6 py-3 text-center">
          <div className="text-sm text-emerald-200">ĐÚNG</div>
          <div className="text-2xl font-bold text-green-400">{correctText}</div>
        </div>
      </div>

      {/* Zone Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {ZONES.map((zone) => {
          const submittedCount = getZoneSubmitted(zone.id);
          const isActive = activeZone === zone.id;
          const { correct, total } = calculateZoneScore(zone.id);

          return (
            <button
              key={zone.id}
              onClick={() => setActiveZone(zone.id)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${isActive
                  ? 'bg-yellow-400 text-green-900 scale-105 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              <span>{zone.icon}</span>
              <span className="hidden sm:inline">{zone.count}</span>
              <span>{zone.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${submittedCount === total ? 'bg-green-500 text-white' : 'bg-white/30'
                }`}>
                {correct}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl p-4 md:p-6 min-h-[400px]">
        {/* Quiz Section */}
        {activeZone === 'quiz' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">📝 Multiple Choice Quiz (10 câu)</h3>
            {data.multipleChoice?.map((q, idx) => (
              <div key={q.id} className="border rounded-lg p-4 bg-gray-50">
                <p className="font-semibold mb-3">Câu {idx + 1}: {q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => { handleAnswer(q.id, optIdx); handleSubmit(q.id); }}
                      disabled={submitted[q.id]}
                      className={`p-3 rounded-lg text-left transition-all border ${submitted[q.id]
                          ? optIdx === q.correctAnswer
                            ? 'bg-green-100 border-green-500 text-green-800'
                            : answers[q.id] === optIdx
                              ? 'bg-red-100 border-red-500 text-red-800'
                              : 'bg-gray-100 border-gray-300'
                          : answers[q.id] === optIdx
                            ? 'bg-blue-100 border-blue-500'
                            : 'bg-white border-gray-300 hover:border-blue-400'
                        }`}
                    >
                      <span className="font-bold mr-2">{['A', 'B', 'C', 'D'][optIdx]}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
                {submitted[q.id] && (
                  <p className={`mt-3 text-sm ${answers[q.id] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                    {answers[q.id] === q.correctAnswer ? '✓ Đúng!' : `✗ Sai! Đáp án đúng: ${['A', 'B', 'C', 'D'][q.correctAnswer]}`}
                    <span className="block text-gray-600 mt-1">{q.explanation}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Fill-blank Section */}
        {activeZone === 'fill' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">✏️ Fill in the Blank (10 câu)</h3>
            {data.fillBlank?.map((q, idx) => (
              <div key={q.id} className="border rounded-lg p-4 bg-gray-50">
                <p className="font-semibold mb-3">
                  <span className="mr-2">{q.clueEmoji}</span>
                  Câu {idx + 1}: {q.question}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    disabled={submitted[q.id]}
                    placeholder="Nhập từ..."
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {!submitted[q.id] && (
                    <button
                      onClick={() => handleSubmit(q.id)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Check
                    </button>
                  )}
                </div>
                {submitted[q.id] && (
                  <p className={`mt-3 text-sm ${answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
                      ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
                      ? '✓ Đúng!'
                      : `✗ Sai! Đáp án đúng: ${q.correctAnswer}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Scramble Section */}
        {activeZone === 'scramble' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">🧩 Sắp Xếp Câu (10 câu)</h3>
            {data.scramble?.map((q, idx) => {
              const selected = scrambleSelections[q.id] || [];
              const available = [...q.scrambled];
              selected.forEach(word => {
                const i = available.indexOf(word);
                if (i !== -1) available.splice(i, 1);
              });
              const userSentence = selected.join(' ');
              const isCorrect = userSentence.toLowerCase().replace(/\s+/g, ' ').trim() ===
                q.correctSentence.toLowerCase().replace(/\s+/g, ' ').trim();

              return (
                <div key={q.id} className="border rounded-lg p-4 bg-gray-50">
                  <p className="font-semibold mb-3">Câu {idx + 1}: {q.translation}</p>

                  {/* Selected words (click to remove) */}
                  <div className="min-h-[60px] p-3 border-2 border-dashed border-blue-300 rounded-lg mb-3 bg-blue-50">
                    {selected.length === 0 ? (
                      <span className="text-gray-400">Bấm vào các từ bên dưới để sắp xếp...</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selected.map((word, i) => (
                          <button
                            key={i}
                            onClick={() => !submitted[q.id] && handleScrambleWordClick(q.id, word, true)}
                            disabled={submitted[q.id]}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Available words (click to add) */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {available.map((word, i) => (
                      <button
                        key={i}
                        onClick={() => !submitted[q.id] && handleScrambleWordClick(q.id, word, false)}
                        disabled={submitted[q.id]}
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                      >
                        {word}
                      </button>
                    ))}
                  </div>

                  {!submitted[q.id] && (
                    <button
                      onClick={() => handleSubmit(q.id)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Kiểm tra
                    </button>
                  )}

                  {submitted[q.id] && (
                    <p className={`mt-3 text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? '✓ Đúng!' : `✗ Sai! Đáp án đúng: ${q.correctSentence}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Rewrite Section */}
        {activeZone === 'rewrite' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">📄 Viết Lại Câu (5 câu)</h3>
            {data.rewrite?.map((q, idx) => {
              const isCorrect = submitted[q.id] && isRewriteCorrect(answers[q.id] || '', q.rewritten_correct, q.allowed_variants);

              return (
                <div key={q.id} className="border rounded-lg p-4 bg-gray-50">
                  <p className="font-semibold mb-2">Câu {idx + 1}:</p>
                  <p className="mb-2 text-gray-800 italic">"{q.original_sentence}"</p>
                  <p className="text-sm text-gray-600 mb-2">{q.instruction}</p>
                  {q.hint_sample && (
                    <p className="text-sm text-blue-600 mb-3">💡 Gợi ý: {q.hint_sample}</p>
                  )}
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    disabled={submitted[q.id]}
                    rows={2}
                    placeholder="Nhập câu viết lại..."
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {!submitted[q.id] && (
                    <button
                      onClick={() => handleSubmit(q.id)}
                      className="mt-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Kiểm tra
                    </button>
                  )}
                  {submitted[q.id] && (
                    <div className={`mt-3 text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      <p>{isCorrect ? '✓ Đúng!' : '✗ Chưa đúng!'}</p>
                      <p className="text-gray-700 mt-1">Đáp án mẫu: <span className="font-medium">{q.rewritten_correct}</span></p>
                      <p className="text-gray-600 mt-1">{q.explanation_vi}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reading MCQ Section */}
        {activeZone === 'reading' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">📖 Đọc Hiểu MCQ (5 câu)</h3>

            {/* Passage */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-bold text-blue-800 mb-2">📚 Bài đọc:</h4>
              <p className="text-gray-800 leading-relaxed">{data.passage_reading_mcq}</p>
              <details className="mt-2">
                <summary className="text-blue-600 cursor-pointer text-sm">Xem dịch tiếng Việt</summary>
                <p className="text-gray-600 mt-2 text-sm">{data.passage_reading_mcq_translation}</p>
              </details>
            </div>

            {data.readingMCQ?.map((q, idx) => (
              <div key={q.id} className="border rounded-lg p-4 bg-gray-50">
                <p className="font-semibold mb-3">Câu {idx + 1}: {q.question_text}</p>
                <div className="space-y-2">
                  {q.choices.map((choice, choiceIdx) => {
                    const letter = ['A', 'B', 'C'][choiceIdx];
                    return (
                      <button
                        key={choiceIdx}
                        onClick={() => { handleAnswer(q.id, letter); handleSubmit(q.id); }}
                        disabled={submitted[q.id]}
                        className={`w-full p-3 rounded-lg text-left transition-all border ${submitted[q.id]
                            ? letter === q.correct_choice
                              ? 'bg-green-100 border-green-500 text-green-800'
                              : answers[q.id] === letter
                                ? 'bg-red-100 border-red-500 text-red-800'
                                : 'bg-gray-100 border-gray-300'
                            : answers[q.id] === letter
                              ? 'bg-blue-100 border-blue-500'
                              : 'bg-white border-gray-300 hover:border-blue-400'
                          }`}
                      >
                        <span className="font-bold mr-2">{letter}.</span>
                        {choice}
                      </button>
                    );
                  })}
                </div>
                {submitted[q.id] && (
                  <p className={`mt-3 text-sm ${answers[q.id] === q.correct_choice ? 'text-green-600' : 'text-red-600'}`}>
                    {answers[q.id] === q.correct_choice ? '✓ Đúng!' : `✗ Sai! Đáp án: ${q.correct_choice}`}
                    <span className="block text-gray-600 mt-1">{q.explanation_vi}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* True/False Section */}
        {activeZone === 'truefalse' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">✓✗ True/False (5 câu)</h3>

            {/* Passage */}
            <div className="bg-purple-50 p-4 rounded-lg mb-4">
              <h4 className="font-bold text-purple-800 mb-2">📚 Bài đọc:</h4>
              <p className="text-gray-800 leading-relaxed">{data.passage_true_false}</p>
              <details className="mt-2">
                <summary className="text-purple-600 cursor-pointer text-sm">Xem dịch tiếng Việt</summary>
                <p className="text-gray-600 mt-2 text-sm">{data.passage_true_false_translation}</p>
              </details>
            </div>

            {data.trueFalse?.map((q, idx) => (
              <div key={q.id} className="border rounded-lg p-4 bg-gray-50">
                <p className="font-semibold mb-3">Câu {idx + 1}: {q.statement}</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => { handleAnswer(q.id, true); handleSubmit(q.id); }}
                    disabled={submitted[q.id]}
                    className={`flex-1 p-3 rounded-lg font-bold transition-all border ${submitted[q.id]
                        ? q.correct_answer === true
                          ? 'bg-green-100 border-green-500 text-green-800'
                          : answers[q.id] === true
                            ? 'bg-red-100 border-red-500 text-red-800'
                            : 'bg-gray-100 border-gray-300'
                        : answers[q.id] === true
                          ? 'bg-blue-100 border-blue-500'
                          : 'bg-white border-gray-300 hover:border-green-400'
                      }`}
                  >
                    ✓ TRUE
                  </button>
                  <button
                    onClick={() => { handleAnswer(q.id, false); handleSubmit(q.id); }}
                    disabled={submitted[q.id]}
                    className={`flex-1 p-3 rounded-lg font-bold transition-all border ${submitted[q.id]
                        ? q.correct_answer === false
                          ? 'bg-green-100 border-green-500 text-green-800'
                          : answers[q.id] === false
                            ? 'bg-red-100 border-red-500 text-red-800'
                            : 'bg-gray-100 border-gray-300'
                        : answers[q.id] === false
                          ? 'bg-blue-100 border-blue-500'
                          : 'bg-white border-gray-300 hover:border-red-400'
                      }`}
                  >
                    ✗ FALSE
                  </button>
                </div>
                {submitted[q.id] && (
                  <p className={`mt-3 text-sm ${answers[q.id] === q.correct_answer ? 'text-green-600' : 'text-red-600'}`}>
                    {answers[q.id] === q.correct_answer ? '✓ Đúng!' : `✗ Sai! Đáp án: ${q.correct_answer ? 'TRUE' : 'FALSE'}`}
                    <span className="block text-gray-600 mt-1">{q.explanation_vi}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Fill-blank Box Section */}
        {activeZone === 'fillbox' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">📦 Điền Từ Trong Khung (5 câu)</h3>
            {data.fillBlankBox?.map((q, idx) => (
              <div key={q.id} className="border rounded-lg p-4 bg-gray-50">
                <p className="font-semibold mb-3">Câu {idx + 1}: {q.sentence}</p>

                {/* Word Box */}
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  {q.word_box.map((word, i) => (
                    <button
                      key={i}
                      onClick={() => { handleAnswer(q.id, word); handleSubmit(q.id); }}
                      disabled={submitted[q.id]}
                      className={`px-4 py-2 rounded-lg font-medium transition-all border ${submitted[q.id]
                          ? word === q.correct_answer
                            ? 'bg-green-200 border-green-500 text-green-800'
                            : answers[q.id] === word
                              ? 'bg-red-200 border-red-500 text-red-800'
                              : 'bg-gray-100 border-gray-300'
                          : 'bg-white border-amber-300 hover:bg-amber-100'
                        }`}
                    >
                      {word}
                    </button>
                  ))}
                </div>

                {submitted[q.id] && (
                  <p className={`mt-3 text-sm ${answers[q.id] === q.correct_answer ? 'text-green-600' : 'text-red-600'}`}>
                    {answers[q.id] === q.correct_answer ? '✓ Đúng!' : `✗ Sai! Đáp án: ${q.correct_answer}`}
                    <span className="block text-gray-600 mt-1">{q.explanation_vi}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MegaChallenge;
