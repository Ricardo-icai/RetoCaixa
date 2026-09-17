import sharp from 'sharp';
import { CommunityError } from './community.ts';

export async function sanitizeAvatar(value: unknown): Promise<string | null> {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length > 350000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new CommunityError(400, 'Foto: elige una imagen JPEG, PNG o WebP válida.');
  try {
    const bytes = Buffer.from(value.split(',')[1], 'base64');
    const image = sharp(bytes, { limitInputPixels: 16000000, animated: false });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) throw new Error('format');
    const normalized = await image.rotate().resize(256, 256, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
    return `data:image/jpeg;base64,${normalized.toString('base64')}`;
  } catch { throw new CommunityError(400, 'Foto: no se puede leer esa imagen. Prueba con otro archivo.'); }
}
