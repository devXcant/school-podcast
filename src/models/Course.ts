import mongoose, { Schema } from 'mongoose';
import { ICourse } from '../types';

const CourseSchema = new Schema<ICourse>({
  code: {
    type: String,
    required: [true, 'Please provide a course code'],
    unique: true,
    trim: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: false,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  lecturer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseRep: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  podcasts: [{
    type: Schema.Types.ObjectId,
    ref: 'Podcast',
  }],
}, { timestamps: true });

export default mongoose.models.Course as mongoose.Model<ICourse> || mongoose.model<ICourse>('Course', CourseSchema);

