export class UpdateProgressDto {
  status?: 'not_started' | 'in_progress' | 'completed';
  progressPercent?: number;
}