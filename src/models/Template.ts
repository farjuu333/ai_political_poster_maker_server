import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILayoutConfig {
  width?: number;
  height?: number;
  aspectRatio?: string;
  elements?: Array<{
    id: string;
    type: 'text' | 'image' | 'leader_photo' | 'party_symbol' | 'shape';
    x: number;
    y: number;
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    defaultContent?: string;
    zIndex?: number;
    maxPhotos?: number;
    [key: string]: any;
  }>;
  background?: {
    color?: string;
    gradient?: string;
    imageUrl?: string;
  };
  palette?: string[];
  [key: string]: any;
}

export interface ITemplate extends Document {
  title: string;
  occasionType: string;
  layoutConfig: ILayoutConfig;
  thumbnailUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema<ITemplate> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a template title'],
      trim: true,
    },
    occasionType: {
      type: String,
      required: [true, 'Please specify the occasion type'],
      trim: true,
      index: true,
    },
    layoutConfig: {
      type: Schema.Types.Mixed,
      required: [true, 'Layout configuration JSON is required'],
      default: {},
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);

export default Template;
