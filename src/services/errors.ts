export class ServiceError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = 'SERVICE_ERROR', status = 500) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.status = status;
  }
}

export function toServiceError(error: unknown, code = 'SERVICE_ERROR', status = 500) {
  if (error instanceof ServiceError) {
    return error;
  }

  if (error instanceof Error) {
    return new ServiceError(error.message, code, status);
  }

  return new ServiceError(String(error), code, status);
}
