/**
 * API Key Authentication Middleware
 *
 * Every POST request from the Raspberry Pi must include the header:
 *   X-Secret-Key: <value of DEVICE_SECRET in backend .env>
 *
 * If the key is missing or wrong, the request is rejected with 401.
 */
const apiKeyAuth = (req, res, next) => {
  const clientKey = req.headers['x-secret-key'];

  if (!clientKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: X-Secret-Key header is missing',
    });
  }

  if (clientKey !== process.env.DEVICE_SECRET) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid secret key',
    });
  }

  next(); // Key is valid — allow the request to continue
};

module.exports = apiKeyAuth;
