import axios from 'axios';

// Axios instance with base configuration
const api = axios.create({
  baseURL: '/api'
});

// Attach authorization token if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface LoginResponse {
  token: string;
}

export async function register(email: string, password: string): Promise<string> {
  const response = await api.post<LoginResponse>('/auth/register', { email, password });
  return response.data.token;
}

export async function login(email: string, password: string): Promise<string> {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
  return response.data.token;
}

export async function startAssessment(): Promise<number> {
  const response = await api.post<{ assessmentId: number }>('/assessments/start');
  return response.data.assessmentId;
}

export async function saveAnswers(assessmentId: number, answers: { question_id: number; user_answer: string }[]): Promise<void> {
  await api.post(`/assessments/${assessmentId}/answers`, answers);
}

export async function calculateAssessment(assessmentId: number): Promise<{ final_ffp_score: number; final_sbp_score: number }> {
  const response = await api.post<{ final_ffp_score: number; final_sbp_score: number }>(`/assessments/${assessmentId}/calculate`);
  return response.data;
}

export interface AssessmentSummary {
  id: number;
  status: string;
  final_ffp_score: number | null;
  final_sbp_score: number | null;
  created_at: string;
}

export async function fetchAssessments(): Promise<AssessmentSummary[]> {
  const response = await api.get<{ assessments: AssessmentSummary[] }>('/assessments');
  return response.data.assessments;
}

export async function fetchAnswers(assessmentId: number): Promise<{ question_id: number; user_answer: string }[]> {
  const response = await api.get<{ answers: { question_id: number; user_answer: string }[] }>(`/assessments/${assessmentId}/answers`);
  return response.data.answers;
}

export interface Question {
  question_id: number;
  question_text: string;
  indicator_name: string;
  is_scored: boolean;
  good_practice_answer: string | null;
  ffp_value: number;
  sbp_value: number;
  group_logic: string | null;
  subcategory_id: string;
}

export async function fetchQuestionHierarchy() {
  const response = await api.get<{
    pillars: {
      id: number;
      name: string;
      categories: {
        id: string;
        name: string;
        subcategories: {
          id: string;
          name: string;
          questions: Question[];
        }[];
      }[];
    }[];
  }>('/questions/hierarchy');
  return response.data;
}