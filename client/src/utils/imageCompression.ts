/**
 * Utilidades para compresión de imágenes
 * Comprime imágenes grandes antes de subirlas a Firebase Storage
 */

interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  quality: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1, // Tamaño máximo en MB
  maxWidthOrHeight: 1920, // Ancho o alto máximo en píxeles
  quality: 0.8, // Calidad de compresión (0-1)
};

/**
 * Convierte un File a HTMLImageElement
 */
function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error al cargar la imagen'));
    };
    
    img.src = url;
  });
}

/**
 * Redimensiona una imagen usando canvas
 */
function resizeImage(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  let width = img.width;
  let height = img.height;

  // Calcular nuevas dimensiones manteniendo aspect ratio
  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo obtener el contexto del canvas');
  }

  // Usar imageSmoothingQuality para mejor calidad
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

/**
 * Convierte canvas a Blob con compresión
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
  type: string = 'image/jpeg'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Error al convertir canvas a blob'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Comprime una imagen si excede el tamaño máximo
 * 
 * @param file - Archivo de imagen a comprimir
 * @param options - Opciones de compresión
 * @returns File comprimido o el original si no necesita compresión
 */
export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Convertir MB a bytes
  const maxSizeBytes = opts.maxSizeMB * 1024 * 1024;

  console.log(`📸 Procesando imagen: ${file.name}`);
  console.log(`   Tamaño original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

  // Si la imagen ya es pequeña, no comprimir
  if (file.size <= maxSizeBytes) {
    console.log('   ✅ Imagen ya está optimizada, no requiere compresión');
    return file;
  }

  console.log('   🔄 Comprimiendo imagen...');

  try {
    // Cargar imagen
    const img = await fileToImage(file);
    
    console.log(`   Dimensiones originales: ${img.width}x${img.height}px`);

    // Redimensionar si es necesario
    const canvas = resizeImage(img, opts.maxWidthOrHeight, opts.maxWidthOrHeight);
    
    console.log(`   Nuevas dimensiones: ${canvas.width}x${canvas.height}px`);

    // Determinar tipo MIME
    let mimeType = file.type;
    if (!mimeType.startsWith('image/')) {
      mimeType = 'image/jpeg';
    }
    
    // Convertir PNG a JPEG para mejor compresión
    if (mimeType === 'image/png') {
      mimeType = 'image/jpeg';
      console.log('   🔄 Convirtiendo PNG a JPEG para mejor compresión');
    }

    // Comprimir
    const blob = await canvasToBlob(canvas, opts.quality, mimeType);

    // Crear nuevo File
    const compressedFile = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, '.jpg'), // Cambiar extensión a .jpg
      {
        type: mimeType,
        lastModified: Date.now(),
      }
    );

    const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
    console.log(`   ✅ Imagen comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📊 Reducción: ${compressionRatio}%`);

    return compressedFile;
  } catch (error) {
    console.error('   ❌ Error al comprimir imagen:', error);
    console.log('   ⚠️ Usando imagen original');
    return file;
  }
}

/**
 * Comprime múltiples imágenes en paralelo
 * 
 * @param files - Array de archivos de imagen
 * @param options - Opciones de compresión
 * @returns Promise con array de archivos comprimidos
 */
export async function compressImages(
  files: File[],
  options: Partial<CompressionOptions> = {}
): Promise<File[]> {
  console.log(`\n🖼️ Comprimiendo ${files.length} imágenes...`);
  
  const compressedFiles = await Promise.all(
    files.map((file) => compressImage(file, options))
  );

  const totalOriginal = files.reduce((sum, f) => sum + f.size, 0);
  const totalCompressed = compressedFiles.reduce((sum, f) => sum + f.size, 0);
  const totalReduction = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);

  console.log(`\n📊 Resumen de compresión:`);
  console.log(`   Original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Comprimido: ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Reducción total: ${totalReduction}%\n`);

  return compressedFiles;
}

/**
 * Verifica si una imagen necesita compresión
 */
export function needsCompression(file: File, maxSizeMB: number = 1): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size > maxSizeBytes;
}

/**
 * Formatea el tamaño de archivo en formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}
