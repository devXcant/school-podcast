import mongoose, { Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, UserMethods>;

const UserSchema = new Schema<IUser, UserModel, UserMethods>({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password should be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'course_rep', 'lecturer', 'admin'],
    default: 'student',
  },
  department: {
    type: String,
    required: false,
  },
  courses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course',
  }],
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User as UserModel || mongoose.model<IUser, UserModel>('User', UserSchema);
