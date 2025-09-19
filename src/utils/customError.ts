class CustomError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    // Shows "CustomError" instead of just "Error"
    this.name = this.constructor.name;
  }
}

export default CustomError;
