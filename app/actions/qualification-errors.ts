/**
 * Error types for qualification prediction operations
 */
export class QualificationPredictionError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'QualificationPredictionError';
    this.code = code;
  }
}
