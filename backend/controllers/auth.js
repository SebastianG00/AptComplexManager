// controllers/auth.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authRouter = require('express').Router();
const User = require('../models/user');

// ROUTE 1: Register a new user
authRouter.post('/register', async (request, response, next) => {
  try {
    const { email, password } = request.body;

    if (!password || password.length < 6) {
      return response.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      email,
      passwordHash,
    });

    const savedUser = await user.save();
    response.status(201).json(savedUser);
  } catch (error) {
    next(error);
  }
});

// ROUTE 2: Login an existing user
authRouter.post('/login', async (request, response, next) => {
  try {
    const { email, password } = request.body;

    const user = await User.findOne({ email });
    const passwordCorrect = user === null
      ? false
      : await bcrypt.compare(password, user.passwordHash);

    if (!(user && passwordCorrect)) {
      return response.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const userForToken = {
      email: user.email,
      id: user._id,
    };

    const token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: '8h' });

    response
      .status(200)
      .send({ token, email: user.email });
  } catch (error) {
    next(error);
  }
});

module.exports = authRouter;