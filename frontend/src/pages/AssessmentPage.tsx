import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchQuestionHierarchy,
  saveAnswers,
  calculateAssessment,
  fetchAnswers,
  Question
} from '../api';

interface Pillar {
  id: number;
  name: string;
  categories: Category[];
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  questions: Question[];
}

const AssessmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const assessmentId = parseInt(id || '', 10);

  const [hierarchy, setHierarchy] = useState<Pillar[] | null>(null);
  const [selectedSubcat, setSelectedSubcat] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch hierarchy on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchQuestionHierarchy();
        setHierarchy(data.pillars);
        // Set initial subcategory
        const first = data.pillars[0]?.categories[0]?.subcategories[0]?.id;
        setSelectedSubcat(first || null);
        // Load existing answers if any
        const ansArray = await fetchAnswers(assessmentId);
        const ansMap: Record<number, string> = {};
        for (const ans of ansArray) {
          ansMap[ans.question_id] = ans.user_answer;
        }
        setAnswers(ansMap);
      } catch (err) {
        console.error(err);
        alert('Failed to load questions');
      }
    };
    load();
  }, [assessmentId]);

  // Handle answer change
  const handleAnswer = async (questionId: number, answer: string) => {
    // update local state
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    // send to backend
    try {
      await saveAnswers(assessmentId, [{ question_id: questionId, user_answer: answer }]);
    } catch (err) {
      console.error(err);
      alert('Failed to save answer');
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const result = await calculateAssessment(assessmentId);
      navigate(`/results/${assessmentId}`, { state: result });
    } catch (err) {
      console.error(err);
      alert('Failed to calculate scores');
    } finally {
      setLoading(false);
    }
  };

  // Render hierarchical sidebar
  const renderSidebar = () => {
    if (!hierarchy) return null;
    return (
      <div style={{ width: '250px', borderRight: '1px solid #ccc', paddingRight: '1rem' }}>
        {hierarchy.map(pillar => (
          <div key={pillar.id} style={{ marginBottom: '1rem' }}>
            <strong>{pillar.name}</strong>
            <ul style={{ listStyleType: 'none', paddingLeft: '1rem' }}>
              {pillar.categories.map(cat => (
                <li key={cat.id}>
                  <span>{cat.name}</span>
                  <ul style={{ listStyleType: 'none', paddingLeft: '1rem' }}>
                    {cat.subcategories.map(sub => (
                      <li key={sub.id}>
                        <button
                          style={{ background: sub.id === selectedSubcat ? '#eee' : 'transparent', border: 'none', padding: '0.2rem', cursor: 'pointer' }}
                          onClick={() => setSelectedSubcat(sub.id)}
                        >
                          {sub.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  // Render questions for selected subcategory
  const renderQuestions = () => {
    if (!hierarchy || !selectedSubcat) return null;
    // find subcategory
    let questions: Question[] | null = null;
    for (const p of hierarchy) {
      for (const c of p.categories) {
        for (const s of c.subcategories) {
          if (s.id === selectedSubcat) {
            questions = s.questions;
          }
        }
      }
    }
    if (!questions) return <p>Select a subcategory.</p>;
    return (
      <div>
        {questions.map(q => (
          <div key={q.question_id} style={{ marginBottom: '1rem', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
            <div style={{ marginBottom: '0.5rem' }}>{q.question_text}</div>
            <div>
              <label style={{ marginRight: '1rem' }}>
                <input
                  type="radio"
                  name={`q${q.question_id}`}
                  value="Y"
                  checked={answers[q.question_id] === 'Y'}
                  onChange={() => handleAnswer(q.question_id, 'Y')}
                />{' '}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name={`q${q.question_id}`}
                  value="N"
                  checked={answers[q.question_id] === 'N'}
                  onChange={() => handleAnswer(q.question_id, 'N')}
                />{' '}
                No
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex' }}>
      {renderSidebar()}
      <div style={{ flex: 1, padding: '1rem' }}>
        <h2>Assessment #{assessmentId}</h2>
        {renderQuestions()}
        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleCalculate} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
            {loading ? 'Calculating...' : 'Calculate Score'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;