import mongoose, { Schema, Model } from 'mongoose';

interface ICategory {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
