import { cloudinary } from '@/config/cloudinary';

// Generic across future upload use cases (avatars now; deposit screenshots and
// homepage banners later per backend_rules.md #22) - parameterized by folder
// rather than being avatar-specific.
export const uploadImage = async (
  buffer: Buffer,
  mimetype: string,
  folder: string,
  publicId?: string,
): Promise<string> => {
  const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
    public_id: publicId,
    overwrite: Boolean(publicId),
  });

  return result.secure_url;
};
