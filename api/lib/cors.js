export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function handleCors(req, res) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export function jsonResponse(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(data);
}

export function errorResponse(res, message, status = 500) {
  return jsonResponse(res, { error: message }, status);
}
