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
