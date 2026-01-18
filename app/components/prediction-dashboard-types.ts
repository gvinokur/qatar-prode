export interface UrgencyWarning {
  level: 'red' | 'orange' | 'yellow';
  count: number;
  message: string;
}
