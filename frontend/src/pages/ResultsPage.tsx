import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { calculateAssessment } from '../api';

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const assessmentId = parseInt(id || '', 10);
  const navigate = useNavigate();
  const location = useLocation();
  const [ffp, setFfp] = useState<number | null>(null);
  const [sbp, setSbp] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // If scores were passed via state, use them; otherwise fetch
    const state = location.state as { final_ffp_score?: number; final_sbp_score?: number } | null;
    if (state && state.final_ffp_score !== undefined && state.final_sbp_score !== undefined) {
      setFfp(state.final_ffp_score);
      setSbp(state.final_sbp_score);
    } else {
      // Fetch from backend
      const fetchScores = async () => {
        setLoading(true);
        try {
          const result = await calculateAssessment(assessmentId);
          setFfp(result.final_ffp_score);
          setSbp(result.final_sbp_score);
        } catch (err) {
          alert('Failed to fetch scores');
        } finally {
          setLoading(false);
        }
      };
      fetchScores();
    }
  }, [assessmentId, location.state]);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Assessment Results</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p><strong>Firm-Focused Perspective (FFP) Score:</strong> {ffp !== null ? ffp.toFixed(2) : 'N/A'}</p>
          <p><strong>Societal Benefits Perspective (SBP) Score:</strong> {sbp !== null ? sbp.toFixed(2) : 'N/A'}</p>
        </div>
      )}
      <button onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default ResultsPage;