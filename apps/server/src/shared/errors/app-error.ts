export interface ErrorDetail {
  readonly path: string;
  readonly message: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly errors?: ReadonlyArray<ErrorDetail>;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    errors?: ReadonlyArray<ErrorDetail>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
