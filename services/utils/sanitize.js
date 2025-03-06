export const sanitizeRequest = (request) => {
  const sanitized = { ...request };
  
  // Redact Authorization header
  if (sanitized.headers?.Authorization) {
    sanitized.headers.Authorization = 'REDACTED';
  }

  // Redact any apiKey in body
  if (sanitized.body?.apiKey) {
    sanitized.body.apiKey = 'REDACTED';
  }

  return sanitized;
};