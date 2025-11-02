export class LearningProgress {
  id: string;
  userId: string;
  courseId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent?: number; // 0-100
  lastUpdated?: string;
}