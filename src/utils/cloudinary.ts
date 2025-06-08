import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

//Configracion de servicio de cloudinary y credenciales
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

//optimizacion de imagenes y conversion a formato webp
export const uploadToCloudinary = async (file: Express.Multer.File, productId: string, index: number) => {
  return cloudinary.uploader.upload(file.path, {
    folder: `bazar-app/products/${productId}`,
    public_id: `img-${index}`,
    format: 'webp',
    quality: 'auto:good',
  });
};

export default cloudinary;