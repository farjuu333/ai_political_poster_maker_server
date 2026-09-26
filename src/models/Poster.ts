import mongoose, { Document, Model, Schema } from 'mongoose';

export type PosterStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface IPosterFormData {
  candidateName?: string;
  designation?: string;
  partyName?: string;
  slogan?: string;
  secondarySlogan?: string;
  eventDate?: string;
  venue?: string;
  greetingText?: string;
  customNotes?: string;
  [key: string]: any;
}

export interface IPoster extends Document {
  userId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  formData: IPosterFormData;
  uploadedPhotoUrls: string[];
  generatedImageUrl?: string;
  status: PosterStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PosterSchema: Schema<IPoster> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
      required: [true, 'Template ID is required'],
      index: true,
    },
    formData: {
      type: Schema.Types.Mixed,
      default: {},
      required: [true, 'Form data is required'],
    },
    uploadedPhotoUrls: {
      type: [String],
      default: [],
    },
    generatedImageUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'processing', 'completed', 'failed'],
      default: 'draft',
      index: true,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Poster: Model<IPoster> =
  mongoose.models.Poster || mongoose.model<IPoster>('Poster', PosterSchema);

export default Poster;
