const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY;

/**
 * Sube una imagen (en base64, sin el prefijo data:...) a ImgBB y devuelve la URL directa.
 * Alternativa gratuita a Firebase Storage, que requiere plan pago.
 */
export async function uploadImageToImgbb(base64: string): Promise<string> {
  if (!IMGBB_API_KEY) {
    throw new Error('Falta configurar EXPO_PUBLIC_IMGBB_API_KEY en el .env');
  }

  const form = new FormData();
  form.append('image', base64);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: form,
  });
  const json = await res.json();

  if (!res.ok || !json?.data?.url) {
    throw new Error(json?.error?.message ?? 'No se pudo subir la imagen');
  }

  return json.data.url as string;
}
