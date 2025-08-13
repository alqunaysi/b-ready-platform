import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startAssessment, fetchAssessments, AssessmentSummary } from '../api';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
    // Fetch past assessments when component mounts
    const load = async () => {
      try {
        const data = await fetchAssessments();
        setAssessments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAssessments(false);
      }
    };
    load();
  }, [navigate]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const assessmentId = await startAssessment();
      navigate(`/assessments/${assessmentId}`);
    } catch (err) {
      alert('Failed to start assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Dashboard</h2>
      <button onClick={handleStart} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
        {loading ? 'Starting...' : 'Start New Assessment'}
      </button>
      <div style={{ marginTop: '1rem' }}>
        <h3>Your Assessments</h3>
        {loadingAssessments ? (
          <p>Loading...</p>
        ) : assessments.length === 0 ? (
          <p>No assessments yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>ID</th>
                <th style={{ borderBottom: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>Status</th>
                <th style={{ borderBottom: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>Created At</th>
                <th style={{ borderBottom: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>FFP Score</th>
                <th style={{ borderBottom: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>SBP Score</th>
                <th style={{ borderBottom: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map(a => (
                <tr key={a.id}>
                  <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{a.id}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{a.status}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{new Date(a.created_at).toLocaleString()}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{a.final_ffp_score ?? '-'}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{a.final_sbp_score ?? '-'}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>
                    {a.status === 'Completed' ? (
                      <button onClick={() => navigate(`/results/${a.id}`)}>View Results</button>
                    ) : (
                      <button onClick={() => navigate(`/assessments/${a.id}`)}>Continue</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;