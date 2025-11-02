export class CreateProgressDto {
  userId: string;
  courseId: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  progressPercent?: number;
}