import mongoose, { Schema, Model } from 'mongoose';

interface IDeveloperNote {
  content: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DeveloperNoteSchema = new Schema<IDeveloperNote>(
  {
    content: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

DeveloperNoteSchema.index({ status: 1, createdAt: -1 });

const DeveloperNote: Model<IDeveloperNote> =
  mongoose.models.DeveloperNote || mongoose.model<IDeveloperNote>('DeveloperNote', DeveloperNoteSchema);

export default DeveloperNote;