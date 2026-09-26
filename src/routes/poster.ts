import { Router, Request, Response } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import Poster from '../models/Poster';
import Template from '../models/Template';
import User from '../models/User';
import { renderPoster } from '../utils/posterRenderer';
import { suggestPosterStyling } from '../services/geminiService';
import { uploadImageBuffer } from '../services/uploadService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Configure Multer for in-memory uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are permitted.'));
    }
  },
});

/**
 * Helper to ensure a valid User ID (authenticated user, requested userId, or guest user)
 */
async function resolveUserId(req: AuthRequest): Promise<mongoose.Types.ObjectId> {
  if (req.user?.id && mongoose.isValidObjectId(req.user.id)) {
    return new mongoose.Types.ObjectId(req.user.id);
  }

  if (req.body.userId && mongoose.isValidObjectId(req.body.userId)) {
    return new mongoose.Types.ObjectId(req.body.userId);
  }

  // Find or create default guest user
  let guestUser = await User.findOne({ email: 'guest@politicalpostermaker.com' });
  if (!guestUser) {
    guestUser = await User.create({
      name: 'সম্মানিত অতিথি (Guest)',
      email: 'guest@politicalpostermaker.com',
      passwordHash: 'guest_no_login_hash',
      role: 'user',
    });
  }

  return guestUser._id as mongoose.Types.ObjectId;
}

/**
 * Helper to ensure a valid Template ID
 */
async function resolveTemplate(templateId?: string): Promise<any> {
  if (templateId && mongoose.isValidObjectId(templateId)) {
    const found = await Template.findById(templateId);
    if (found) return found;
  }

  // Fallback to first active template
  const defaultTemplate = await Template.findOne({ isActive: true });
  if (defaultTemplate) return defaultTemplate;

  // Create default fallback template if database is completely empty
  const created = await Template.create({
    title: 'নির্বাচনী প্রচারণা সাধারণ টেমপ্লেট',
    occasionType: 'election_campaign',
    isActive: true,
    layoutConfig: {
      width: 1200,
      height: 1600,
      palette: ['#006A4E', '#B71C1C', '#FFD700', '#0B1320', '#FFFFFF'],
    },
  });
  return created;
}

/**
 * Optional Authentication Middleware (permits both authenticated users and guests)
 */
const optionalAuth = (req: AuthRequest, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, next);
  }
  next();
};

/**
 * @route   GET /api/posters/templates
 * @desc    Get all active poster templates
 * @access  Public
 */
router.get('/templates', async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await Template.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates.',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/posters
 * @desc    Generate a new poster using Gemini AI + Canvas Pipeline
 * @access  Public or Private
 */
router.post(
  '/',
  optionalAuth,
  upload.any(),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];

      // Parse form data from body
      let parsedFormData: any = {};
      if (typeof req.body.formData === 'string') {
        try {
          parsedFormData = JSON.parse(req.body.formData);
        } catch {
          parsedFormData = {};
        }
      } else if (typeof req.body.formData === 'object') {
        parsedFormData = req.body.formData;
      }

      // Merge direct body fields
      const candidateName = req.body.candidateName || parsedFormData.candidateName || 'আলহাজ্ব মো: রফিকুল ইসলাম';
      const designation = req.body.designation || parsedFormData.designation || 'সাধারণ সম্পাদক পদপ্রার্থী';
      const partyName = req.body.partyName || parsedFormData.partyName || 'বাংলাদেশ আওয়ামী লীগ';
      const slogan = req.body.slogan || parsedFormData.slogan || '';
      const secondarySlogan = req.body.secondarySlogan || parsedFormData.secondarySlogan || '';
      const occasion = req.body.occasion || parsedFormData.occasion || 'নির্বাচনী প্রচারণা';
      const eventDate = req.body.eventDate || parsedFormData.eventDate || '';
      const venue = req.body.venue || parsedFormData.venue || '';
      const greetingText = req.body.greetingText || parsedFormData.greetingText || '';
      const symbolName = req.body.symbolName || parsedFormData.symbolName || '';
      const footerCredit = req.body.footerCredit || parsedFormData.footerCredit || 'সর্বস্তরের নেতাকর্মী ও শুভাকাঙ্ক্ষীবৃন্দ';
      const customNotes = req.body.customNotes || parsedFormData.customNotes || '';

      const formData = {
        candidateName,
        designation,
        partyName,
        slogan,
        secondarySlogan,
        occasion,
        eventDate,
        venue,
        greetingText,
        symbolName,
        footerCredit,
        customNotes,
        ...parsedFormData,
      };

      // 1. Resolve User and Template
      const userId = await resolveUserId(req);
      const template = await resolveTemplate(req.body.templateId);

      // 2. Separate uploaded files
      let candidatePhotoBuffer: Buffer | undefined;
      const leaderPhotoBuffers: Buffer[] = [];
      const uploadedPhotoUrls: string[] = [];

      for (const file of files) {
        if (file.fieldname === 'candidatePhoto' || file.fieldname === 'photo') {
          candidatePhotoBuffer = file.buffer;
        } else if (file.fieldname.startsWith('leader') || file.fieldname === 'leaders') {
          leaderPhotoBuffers.push(file.buffer);
        } else {
          // If first general photo, assign to candidate
          if (!candidatePhotoBuffer) {
            candidatePhotoBuffer = file.buffer;
          } else {
            leaderPhotoBuffers.push(file.buffer);
          }
        }

        // Upload original asset to Cloudinary / storage
        try {
          const uploadedUrl = await uploadImageBuffer(file.buffer, 'ai_political_posters/user_uploads', 'user_photo');
          uploadedPhotoUrls.push(uploadedUrl);
        } catch (uploadErr) {
          console.warn('⚠️ Non-fatal: failed to upload source photo:', uploadErr);
        }
      }

      // Check for photo URLs passed in body
      const candidatePhotoUrl = req.body.candidatePhotoUrl || parsedFormData.candidatePhotoUrl;
      const leaderPhotoUrls = req.body.leaderPhotoUrls || parsedFormData.leaderPhotoUrls || [];

      // 3. Create Draft Poster in MongoDB
      const posterDoc = await Poster.create({
        userId,
        templateId: template._id,
        formData,
        uploadedPhotoUrls,
        status: 'processing',
      });

      // 4. Gemini AI Layout and Color Styling
      console.log('🤖 Invoking Gemini AI for poster styling suggestions...');
      const aiSuggestions = await suggestPosterStyling({
        candidateName,
        designation,
        partyName,
        occasion,
        customNotes,
        slogan,
        secondarySlogan,
      });

      // 5. Render Poster using Node Canvas
      console.log('🎨 Rendering poster on canvas...');
      const renderedPngBuffer = await renderPoster({
        template,
        formData: {
          ...formData,
          slogan: formData.slogan || aiSuggestions.headline,
          secondarySlogan: formData.secondarySlogan || aiSuggestions.secondarySlogan,
        },
        photos: {
          candidatePhoto: candidatePhotoBuffer || candidatePhotoUrl,
          leaderPhotos: leaderPhotoBuffers.length > 0 ? leaderPhotoBuffers : leaderPhotoUrls,
        },
        dynamicTheme: aiSuggestions,
      });

      // 6. Upload Generated Poster Image
      console.log('☁️ Uploading rendered poster image...');
      const finalImageUrl = await uploadImageBuffer(
        renderedPngBuffer,
        'ai_political_posters/generated',
        `poster_${posterDoc._id}`
      );

      // 7. Update Poster in MongoDB to Completed
      posterDoc.generatedImageUrl = finalImageUrl;
      posterDoc.status = 'completed';
      await posterDoc.save();

      console.log(`✅ Poster generated successfully: ${posterDoc._id}`);

      res.status(201).json({
        success: true,
        message: 'Poster generated successfully.',
        poster: {
          id: posterDoc._id,
          status: posterDoc.status,
          generatedImageUrl: posterDoc.generatedImageUrl,
          formData: posterDoc.formData,
          aiSuggestions,
          template: {
            id: template._id,
            title: template.title,
            occasionType: template.occasionType,
          },
          createdAt: posterDoc.createdAt,
        },
      });
    } catch (error: any) {
      console.error('❌ Poster Generation Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate poster.',
        error: error.message || 'Internal server error',
      });
    }
  }
);

/**
 * @route   GET /api/posters/user/:userId
 * @desc    Get poster history for a specific user
 * @access  Public or Private
 */
router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format.',
      });
      return;
    }

    const posters = await Poster.find({ userId })
      .populate('templateId', 'title occasionType thumbnailUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posters.length,
      posters,
    });
  } catch (error: any) {
    console.error('Error fetching user posters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user posters.',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/posters/:id
 * @desc    Get single poster details and status
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid poster ID format.',
      });
      return;
    }

    const poster = await Poster.findById(id)
      .populate('templateId', 'title occasionType layoutConfig')
      .populate('userId', 'name email phone');

    if (!poster) {
      res.status(404).json({
        success: false,
        message: 'Poster not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      poster,
    });
  } catch (error: any) {
    console.error('Error fetching poster:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve poster.',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/posters
 * @desc    List all recent posters (paginated)
 * @access  Public
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 12;
    const skip = (page - 1) * limit;

    const posters = await Poster.find({ status: 'completed' })
      .populate('templateId', 'title occasionType')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Poster.countDocuments({ status: 'completed' });

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      posters,
    });
  } catch (error: any) {
    console.error('Error listing posters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list posters.',
      error: error.message,
    });
  }
});

export default router;
