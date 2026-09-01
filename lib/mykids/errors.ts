export class ApiError extends Error {
  constructor(
    message: string,
    public status = 500,
    public code = "API_ERROR",
  ) {
    super(message);
    this.name = "ApiError";
  }
}
