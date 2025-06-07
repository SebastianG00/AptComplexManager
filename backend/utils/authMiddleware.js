// utils/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (request, response, next) => {
  // Get the 'authorization' header from the incoming request
  const authorization = request.get('authorization');

  let token = '';
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    // Extract the token from the header (it's in the format "Bearer <token>")
    token = authorization.substring(7);
  }

  // If no token was found, block the request
  if (!token) {
    return response.status(401).json({ error: 'Token missing' });
  }

  try {
    // Verify the token using the secret key from your .env file
    const decodedToken = jwt.verify(token, process.env.SECRET);

    // Attach the user's ID from the token to the request object
    // Now, all subsequent route handlers will know which user is making the request
    request.userId = decodedToken.id;

    // The token is valid, so call next() to proceed to the route handler
    next();
  } catch (error) {
    // This block catches errors from jwt.verify (e.g., invalid signature, expired token)
    return response.status(401).json({ error: 'Token invalid or expired' });
  }
};

module.exports = authMiddleware;