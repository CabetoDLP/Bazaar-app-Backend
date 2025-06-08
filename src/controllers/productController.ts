import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinary';
import { Types } from 'mongoose';

// Creacion del router para definir las rutas
const productRouter = Router();

// Definir interfaz para los id de los productos
interface ParamsDictionary {
  id: string;
}

const upload = multer({
  limits: {
    fileSize: process.env.MAX_FILE_SIZE as unknown as number //stream de imagenes con multer para archivos de maximo 5mb( 5 * 1024 * 1024 // 5MB )
  },
  dest: 'uploads/'
});

//Buscar producto
productRouter.get('/items', async (req: Request, res: Response) => {
  const { search } = req.query;
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error en la búsqueda: ' + error });
  }
  return;
});

//Ver detalles de producto
productRouter.get('/items/:id', async (req: Request<ParamsDictionary>, res: Response) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
    return;
});

//Crear producto
productRouter.post('/create', upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const { name, description, price, brand, stock, category } = req.body;
    const files = req.files as Express.Multer.File[];

    //Validar parametros ingresados
    if (!name || !description || !price || !brand || !stock || !category) {
      res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    /*
    //validar imagenes ingresadas
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'Se requiere al menos una imagen' });
    }
    */
    // Crear el producto primero para obtener el ID
    const newProduct = new Product({
      name,
      description,
      price: parseFloat(price),
      brand,
      stock: parseInt(stock),
      category,
      images: [], // Inicialmente vacío
      ratings: []
    });

    const savedProduct = await newProduct.save();

    // Subir imágenes a Cloudinary
    const uploadPromises = files.map((file, index) => 
      uploadToCloudinary(file, savedProduct._id.toString(), index)
    );

    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults.map(result => result.secure_url);

    // Actualizar el producto con las URLs de las imágenes
    savedProduct.images = imageUrls;
    await savedProduct.save();
    // Eliminar archivos temporales
    // files.forEach(file => fs.unlinkSync(file.path));

    res.status(201).json(savedProduct);

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
  return;
});

// Interfaz para el parámetro de la URL
interface RatingParams {
  id: string; // ID del producto
}

//Agregar valoración
productRouter.post('/items/:id/addrating', async (req: Request, res: Response) => {
  const { id } = req.params; // Extraemos el ID directamente de params
  const { value } = req.body;

  try {
    // Validar el valor de la calificación
    if (typeof value !== 'number' || value < 1 || value > 5) {
      res.status(400).json({ 
        error: 'La calificación debe ser un número entre 1 y 5',
        received: value
      });
      return;
    }

    // Validar el ID del producto
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        error: 'ID de producto no válido',
        received: id
      });
      return;
    }

    // Buscar y actualizar el producto
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $push: {
          ratings: {
            value: Math.round(value),
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!updatedProduct) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }

    // Calcular el nuevo promedio
    const ratings = updatedProduct.ratings;
    const averageRating = ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length;

    // Respuesta exitosa
    res.json({
      success: true,
      productId: updatedProduct._id,
      ratingsCount: ratings.length,
      averageRating: parseFloat(averageRating.toFixed(2))
    });

  } catch (error) {
    console.error('Error al agregar valoración:', error);
    res.status(500).json({ 
      error: 'Error interno al agregar valoración',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// Exportar el router configurado
export default productRouter;