export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
