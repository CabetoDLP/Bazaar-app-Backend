import { Schema, model, Document, Types } from 'mongoose';

interface IRating {
  value: number;  // Valor de la calificación entre 1 y 5 estrellas
  createdAt: Date;
}

interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  brand: string;
  stock: number;
  category: string;
  ratings: IRating[]; //array de ratings
  createdAt: Date;
  images: string[]; //URLs de las imágenes en Cloudinary
}

const RatingSchema = new Schema<IRating>({
  value: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  brand: { type: String, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String, required: true },
  ratings: { type: [RatingSchema], default: [] }, //Array de ratings
  createdAt: { type: Date, default: Date.now },
  images: { type: [String], default: [] } //Array de URLs de imágenes
});

export const Product = model<IProduct>('Product', ProductSchema);