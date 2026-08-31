/**
 * SCIS Connect Mobile - Results & Assessments TypeScript Definitions
 * Strictly maps to backend Result, Attempt, Answer, and Analytics schemas.
 */

export interface AssessmentSummary {
  _id: string;
  name: string;
  displayName?: string;
  totalMarks: number;
  duration: number; // in minutes
}

export interface AttemptSummary {
  _id: string;
  status: string; // "submitted", "in-progress", "completed", "evaluated"
  violationCount?: number;
  submissionStatus?: string;
  endTime?: string;
}

export interface SectionAnalysisItem {
  section?: string;
  sectionName?: string;
  topic?: string;
  accuracy: number;
  score?: number;
  marksObtained?: number;
  total?: number;
  totalMarks?: number;
  percentage: number;
  totalQuestions?: number;
  answered?: number;
  correct?: number;
  wrong?: number;
  skipped?: number;
  timeSpent?: number;
  averageTime?: number;
  _id?: string;
}

export interface ResultItem {
  _id: string;
  user?: string | { _id: string; name: string; email: string; role: string };
  assessment: AssessmentSummary;
  attempt?: AttemptSummary | null;
  obtainedMarks: number;
  totalMarks: number;
  percentage?: number;
  percentile?: number;
  rank?: number;
  accuracy?: number;
  completionStatus?: string;
  totalQuestions?: number;
  answered?: number;
  correct?: number;
  wrong?: number;
  skipped?: number;
  negativeMarks?: number;
  totalTimeSpent?: number; // in seconds
  sectionAnalysis?: SectionAnalysisItem[];
  weakAreas?: string[];
  strongAreas?: string[];
  attemptNumber?: number;
  previousBestObtainedMarks?: number | null;
  improvementFromPrevious?: number | null;
  bestAttempt?: boolean;
  previousBestAttempt?: unknown;
  highestObtainedMarks?: number;
  isPublished?: boolean;
  publishedAt?: string;
  isPassed?: boolean;
  status?: "Passed" | "Failed" | "Completed" | string;
  correctCount?: number;
  wrongCount?: number;
  skippedCount?: number;
  topPercentile?: number;
  totalAttempts?: number;
  createdAt: string;
  updatedAt?: string;
  __v?: number;
}

export interface TrendItem {
  date: string;
  percentage: number;
  accuracy: number;
  score: number;
  marks: number;
  total: number;
  rank: number;
}

export interface MasteryItem {
  topic: string;
  accuracy: number;
  score: number;
  total: number;
  percentage: number;
}

export interface SpeedItem {
  date: string;
  timeTaken: number;
  questionsPerMinute: number;
}

export interface ImprovementData {
  improvement: number;
  trend: "improving" | "declining" | "stable";
  data: Array<{
    assessment: number;
    percentage: number;
  }>;
}

export interface PracticeSuggestion {
  topic?: string;
  suggestion?: string;
  tip?: string;
  reason?: string;
  priority?: "High" | "Medium" | "Low";
}

export interface AIRecommendationData {
  summary?: string;
  recommendations?: string[];
  focusAreas?: string[];
  suggestedTopics?: string[];
}

export interface ResultAnalysisResponse {
  result: ResultItem;
  trends: TrendItem[];
  mastery: MasteryItem[];
  speed: SpeedItem[];
  improvement: ImprovementData;
  suggestions: PracticeSuggestion[] | string[] | any;
  aiRecommendation: AIRecommendationData | string | any;
}

export interface QuestionData {
  _id: string;
  title?: string;
  questionText?: string;
  type: "mcq" | "coding" | "subjective" | string;
  options?: Array<{ text: string; isCorrect?: boolean }>;
  correctOption?: number | string;
  marks?: number;
  explanation?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
}

export interface CodingResultSnapshot {
  status?: string;
  passedCount?: number;
  totalCount?: number;
  runtime?: number;
  memory?: number;
  code?: string;
  language?: string;
  error?: string;
}

export interface AttemptAnswerItem {
  _id: string;
  question: QuestionData;
  userAnswer?: unknown;
  selectedOption?: number | string;
  isCorrect?: boolean;
  marksObtained?: number;
  codingResult?: CodingResultSnapshot;
}

export interface AttemptAnswersResponse {
  attempt: {
    _id: string;
    status: string;
    assessment?: { _id?: string; name: string };
    user?: { _id?: string; name: string; email: string; role: string };
  };
  answers: AttemptAnswerItem[];
}

export interface AssessmentRanking {
  rank: number;
  user?: { _id?: string; name?: string; rollNo?: string };
  name?: string;
  rollNo?: string;
  score: number;
  accuracy?: number;
  timeTaken?: number;
  department?: string;
  batch?: string;
  isCurrentUser?: boolean;
}

export interface SpeedAnalysisResponse {
  overallSpeed?: number;
  averageTimePerQuestion?: number;
  totalTimeSpent?: number;
  fastestPace?: number;
  speedTrend?: Array<{ assessmentName: string; questionsPerMinute: number }>;
}

export interface StudentImprovementResponse {
  currentAverageScore?: number;
  previousAverageScore?: number;
  improvementPercentage?: number;
  trend?: "improving" | "declining" | "stable";
  history?: Array<{ assessment: string; score: number; percentage: number }>;
}

export interface SingleResultResponse {
  result: ResultItem;
  message?: string;
}

export interface ComputeResultResponse {
  success?: boolean;
  result: ResultItem;
  message?: string;
}

export interface PublishResultResponse {
  success?: boolean;
  result: ResultItem;
  message?: string;
}

export interface AssessmentResultsResponse {
  results: ResultItem[];
  assessment?: AssessmentSummary;
  totalCount?: number;
}

