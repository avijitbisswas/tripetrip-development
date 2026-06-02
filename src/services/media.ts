import { ServiceError } from './errors';

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export async function getCloudinarySignature() {
  const response = await fetch('/api/cloudinary/sign');

  if (!response.ok) {
    throw new ServiceError('Unable to prepare image upload', 'CLOUDINARY_SIGN_FAILED', response.status);
  }

  return response.json() as Promise<CloudinarySignature>;
}

export async function uploadImageToCloudinary(file: File) {
  const signature = await getCloudinarySignature();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('signature', signature.signature);
  formData.append('folder', signature.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new ServiceError('Image upload failed', 'CLOUDINARY_UPLOAD_FAILED', response.status);
  }

  const data = await response.json() as { secure_url: string };
  return data.secure_url;
}
