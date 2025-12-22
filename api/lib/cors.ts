import type { VercelRequest, VercelResponse } from '@vercel/node';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

export function jsonResponse(res: VercelResponse, data: unknown, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(data);
}

export function errorResponse(res: VercelResponse, message: string, status = 500) {
  return jsonResponse(res, { error: message }, status);
}
