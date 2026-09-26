"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Helper to generate JWT Token
const generateToken = (user) => {
    const secret = process.env.JWT_SECRET || 'supersecretjwtkey123';
    return jsonwebtoken_1.default.sign({
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        name: user.name,
    }, secret, { expiresIn: '7d' });
};
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (with email or phone)
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;
        // Basic Validation
        if (!name || (!email && !phone) || !password) {
            res.status(400).json({
                success: false,
                message: 'Please provide name, password, and either email or phone number.',
            });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.',
            });
            return;
        }
        // Check if user already exists
        const query = [];
        if (email)
            query.push({ email: email.toLowerCase() });
        if (phone)
            query.push({ phone });
        const existingUser = await User_1.default.findOne({ $or: query });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'A user with this email or phone already exists.',
            });
            return;
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Create user
        const newUser = await User_1.default.create({
            name,
            email: email ? email.toLowerCase() : undefined,
            phone: phone || undefined,
            passwordHash,
            role: role && ['user', 'admin', 'designer'].includes(role) ? role : 'user',
        });
        // Generate JWT
        const token = generateToken(newUser);
        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                createdAt: newUser.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration.',
            error: error.message,
        });
    }
});
/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get JWT token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, phone, identifier, password } = req.body;
        const loginId = identifier || email || phone;
        if (!loginId || !password) {
            res.status(400).json({
                success: false,
                message: 'Please provide email/phone and password.',
            });
            return;
        }
        // Search user by email or phone
        const user = await User_1.default.findOne({
            $or: [
                { email: loginId.toLowerCase() },
                { phone: loginId },
            ],
        }).select('+passwordHash');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials. User not found.',
            });
            return;
        }
        // Check password
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials. Password incorrect.',
            });
            return;
        }
        // Generate JWT
        const token = generateToken(user);
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login.',
            error: error.message,
        });
    }
});
/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user?.id).select('-passwordHash');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found.',
            });
            return;
        }
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.error('Fetch profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error fetching profile.',
        });
    }
});
exports.default = router;
