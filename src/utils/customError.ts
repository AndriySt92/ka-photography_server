class CustomError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;

    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export default CustomError;
