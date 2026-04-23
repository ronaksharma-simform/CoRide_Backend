class CustomError extends Error {
  public statusCode: number;

  constructor(message = "Something went wrong", statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
export default CustomError;
