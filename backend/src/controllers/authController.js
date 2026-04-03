import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (id, secret, expiresIn) => {
  return jwt.sign({ id }, secret, { expiresIn });
};

const createSendToken = async (user, statusCode, res) => {
  const accessToken = signToken(user._id, process.env.ACCESS_TOKEN_SECRET, '15m');
  const refreshToken = signToken(user._id, process.env.REFRESH_TOKEN_SECRET, '7d');

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.cookie('jwt', refreshToken, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token: accessToken,
    data: { user }
  });
};

export const register = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || 'student', // Admin handles higher role generation later
      rollNumber: req.body.rollNumber
    });

    await createSendToken(newUser, 201, res);
  } catch (err) {
    if (err.code === 11000) {
       return res.status(400).json({ status: 'fail', message: 'Email or Roll Number already exists' });
    }
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'fail', message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password, user.password))) {
    return res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
  }

  await createSendToken(user, 200, res);
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.jwt;
    if (!refreshToken) return res.status(401).json({ status: 'fail', message: 'No refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ status: 'fail', message: 'Invalid refresh token' });
    }

    const accessToken = signToken(user._id, process.env.ACCESS_TOKEN_SECRET, '15m');

    res.status(200).json({
      status: 'success',
      token: accessToken
    });
  } catch (err) {
    return res.status(401).json({ status: 'fail', message: 'Token refresh failed' });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.jwt;
  if (refreshToken) {
    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = '';
      await user.save({ validateBeforeSave: false });
    }
  }

  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({ status: 'success' });
};
