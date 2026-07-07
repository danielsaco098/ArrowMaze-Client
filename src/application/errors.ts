/**
 * Base class for application-layer errors (failures orchestrating use cases),
 * kept distinct from domain rule violations and infrastructure errors.
 */
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class LevelNotFoundError extends ApplicationError {
  constructor(id: number) {
    super(`Level ${id} was not found.`);
  }
}

/** Raised when an auth-required use case runs without an active session. */
export class NotAuthenticatedError extends ApplicationError {
  constructor(operation: string) {
    super(`"${operation}" requires an active session. Sign in first.`);
  }
}
