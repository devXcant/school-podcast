import mongoose, { Schema } from 'mongoose';
import { IPodcast } from '../types';

const PodcastSchema = new Schema<IPodcast>({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: false,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  recordedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
  },
  duration: {
    type: Number,
    required: false,
  },
  isLive: {
    type: Boolean,
    default: false,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.models.Podcast as mongoose.Model<IPodcast> || mongoose.model<IPodcast>('Podcast', PodcastSchema);
