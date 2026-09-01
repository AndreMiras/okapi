const DEFAULT_API_URL = "https://api.kidsandus.es/api/";

export function getEnv() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  const configuredApiUrl = process.env.MYKIDS_API_BASE_URL || DEFAULT_API_URL;
  const apiUrl = configuredApiUrl.endsWith("/")
    ? configuredApiUrl
    : `${configuredApiUrl}/`;
  return { apiUrl, secret };
}
