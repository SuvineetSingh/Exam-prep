import type { ExamType, DifficultyLevel, QuestionType } from '../utils/constants';

export type {
  LobbyRoom,
  LobbyUserProfile,
  OnlineUser,
  LobbyMessage,
} from './lobby';

export interface Question {
  id: string;
  exam_type: ExamType;
  difficulty: DifficultyLevel;
  question_type: QuestionType;
  question_text: string;
  options: string[] | null;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  correct_answer: string;
  correct_option?: string | null;
  explanation: string | null;
  topic?: string | null;
  category?: string | null;
  subtopic?: string | null;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

// Settings types
export type SettingsTab = 'profile' | 'preferences';

export interface ProfileFormData {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  exam_type: string | null;
  bio: string | null;
}

// Course subscription
export type CourseName = 'CMA' | 'CFA' | 'FE';

export interface CourseSubscription {
  id: string;
  user_id: string;
  course: CourseName;
  stripe_session_id: string | null;
  purchased_at: string;
}

// User stats for dashboard
export interface UserStats {
  total_answered: number;
  practice_answered: number;
  timed_answered: number;
  accuracy_rate: number;
  study_streak: number;
  today_count: number;
  this_week_improvement: number;
}

