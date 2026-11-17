// Reduce una foto en el navegador antes de subirla: máximo 1600 px por lado, JPEG ~85 %.
// Una foto de celular de 5–10 MB queda en unos 200–500 KB y carga rápido en el directorio.
export async function comprimirFoto(archivo: File, lado = 1600): Promise<Blob> {
  if (!archivo.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");
  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo);
  } catch {
    throw new Error("No pudimos leer esa foto. Prueba con una JPG o PNG.");
  }
  const escala = Math.min(1, lado / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/jpeg", 0.85));
  if (!blob) throw new Error("No pudimos preparar la foto.");
  return blob;
}
