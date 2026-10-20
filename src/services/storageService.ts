import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'ventas';

/**
 * Sanitiza una cadena para usarla en nombres de carpetas o archivos en Storage
 */
const sanitizePathSegment = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Caracteres seguros
    .replace(/_+/g, '_')
    .trim();
};

export const storageService = {
  /**
   * Extrae la ruta relativa de un archivo en Supabase Storage a partir de su URL pública
   */
  extractPathFromUrl(url: string): string | null {
    if (!url) return null;
    try {
      // Formato típico de URL pública de Supabase Storage:
      // .../storage/v1/object/public/ventas/Ventas/Carta/PRD-101/foto_archivo.jpg
      const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
      const idx = url.indexOf(marker);
      if (idx !== -1) {
        return decodeURIComponent(url.substring(idx + marker.length));
      }

      // Si la URL contiene el bucket de otra forma
      const altMarker = `/${BUCKET_NAME}/`;
      const altIdx = url.indexOf(altMarker);
      if (altIdx !== -1) {
        return decodeURIComponent(url.substring(altIdx + altMarker.length));
      }

      return null;
    } catch {
      return null;
    }
  },

  /**
   * Sube un archivo a la carpeta física del producto de carta:
   * Ventas/Carta/[codigoCarta]/[mediaType]_[nombreLimpio]
   */
  async uploadProductMedia(
    productCode: string,
    mediaType: 'foto' | 'receta' | 'video',
    file: File
  ): Promise<{ url: string; path: string; name: string } | null> {
    try {
      const cleanCode = sanitizePathSegment(productCode || 'PRD-SIN-CODIGO');
      const ext = file.name.split('.').pop() || '';
      const cleanBaseName = sanitizePathSegment(file.name.replace(/\.[^/.]+$/, ''));
      const timestamp = Date.now();
      const fileName = `${mediaType}_${cleanBaseName}_${timestamp}.${ext.toLowerCase()}`;
      
      // Estructura solicitada: Ventas/Carta/[codigo_carta]/[archivo]
      const filePath = `Ventas/Carta/${cleanCode}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Error al subir archivo a Supabase Storage:', error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return {
        url: publicUrlData.publicUrl,
        path: data.path,
        name: file.name,
      };
    } catch (err) {
      console.error('Error inesperado en storageService.uploadProductMedia:', err);
      return null;
    }
  },

  /**
   * Sube un archivo a la carpeta física de una producción interna:
   * Ventas/Producciones/[codigoProduccion]/[mediaType]_[nombreLimpio]_[timestamp].[ext]
   */
  async uploadProductionMedia(
    productionCode: string,
    mediaType: 'foto' | 'receta' | 'video',
    file: File
  ): Promise<{ url: string; path: string; name: string } | null> {
    try {
      const cleanCode = sanitizePathSegment(productionCode || 'PROD-SIN-CODIGO');
      const ext = file.name.split('.').pop() || '';
      const cleanBaseName = sanitizePathSegment(file.name.replace(/\.[^/.]+$/, ''));
      const timestamp = Date.now();
      const fileName = `${mediaType}_${cleanBaseName}_${timestamp}.${ext.toLowerCase()}`;
      
      // Estructura solicitada: Ventas/Producciones/[codigoProduccion]/[archivo]
      const filePath = `Ventas/Producciones/${cleanCode}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Error al subir archivo de producción a Supabase Storage:', error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return {
        url: publicUrlData.publicUrl,
        path: data.path,
        name: file.name,
      };
    } catch (err) {
      console.error('Error inesperado en storageService.uploadProductionMedia:', err);
      return null;
    }
  },

  /**
   * Elimina físicamente un archivo de Supabase Storage a partir de su URL pública o su ruta
   */
  async deleteProductMedia(urlOrPath: string): Promise<boolean> {
    if (!urlOrPath) return false;
    try {
      let pathToDelete = urlOrPath;
      if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
        const extracted = this.extractPathFromUrl(urlOrPath);
        if (!extracted) {
          // No es un archivo alojado en el bucket de Supabase de la app (ej: URL externa de YouTube)
          return false;
        }
        pathToDelete = extracted;
      }

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([pathToDelete]);

      if (error) {
        console.warn(`No se pudo eliminar el archivo (${pathToDelete}) de Storage:`, error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error al eliminar archivo de Supabase Storage:', err);
      return false;
    }
  },

  /**
   * Elimina todos los archivos contenidos en la carpeta del producto:
   * Ventas/Carta/[codigoCarta]/
   */
  async deleteProductFolder(productCode: string): Promise<boolean> {
    if (!productCode) return false;
    try {
      const cleanCode = sanitizePathSegment(productCode);
      const folderPath = `Ventas/Carta/${cleanCode}`;

      // Listar archivos en la carpeta
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath, { limit: 100 });

      if (listError) {
        console.warn(`No se pudo listar la carpeta (${folderPath}) en Storage:`, listError.message);
        return false;
      }

      if (!files || files.length === 0) {
        return true;
      }

      const pathsToRemove = files.map((f) => `${folderPath}/${f.name}`);
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(pathsToRemove);

      if (removeError) {
        console.warn(`Error al eliminar archivos de la carpeta (${folderPath}):`, removeError.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error al eliminar carpeta de producto en Storage:', err);
      return false;
    }
  },

  /**
   * Elimina todos los archivos contenidos en la carpeta de la producción:
   * Ventas/Producciones/[codigoProduccion]/
   */
  async deleteProductionFolder(productionCode: string): Promise<boolean> {
    if (!productionCode) return false;
    try {
      const cleanCode = sanitizePathSegment(productionCode);
      const folderPath = `Ventas/Producciones/${cleanCode}`;

      // Listar archivos en la carpeta
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath, { limit: 100 });

      if (listError) {
        console.warn(`No se pudo listar la carpeta (${folderPath}) en Storage:`, listError.message);
        return false;
      }

      if (!files || files.length === 0) {
        return true;
      }

      const pathsToRemove = files.map((f) => `${folderPath}/${f.name}`);
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(pathsToRemove);

      if (removeError) {
        console.warn(`Error al eliminar archivos de la carpeta (${folderPath}):`, removeError.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error al eliminar carpeta de producción en Storage:', err);
      return false;
    }
  },

  /**
   * Obtiene los archivos multimedia existentes en Storage para un código de carta
   */
  async getProductFiles(productCode: string): Promise<{
    imageUrl?: string;
    recipeFileUrl?: string;
    recipeFileName?: string;
    videoUrl?: string;
  }> {
    if (!productCode) return {};
    try {
      const cleanCode = sanitizePathSegment(productCode);
      const folderPath = `Ventas/Carta/${cleanCode}`;
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath, { limit: 100 });

      if (error || !files || files.length === 0) {
        return {};
      }

      let imageUrl: string | undefined;
      let recipeFileUrl: string | undefined;
      let recipeFileName: string | undefined;
      let videoUrl: string | undefined;

      for (const f of files) {
        if (!f.name || f.name === '.emptyFolderPlaceholder') continue;
        const filePath = `${folderPath}/${f.name}`;
        const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        const url = pubData.publicUrl;

        if (f.name.startsWith('foto_') && !imageUrl) {
          imageUrl = url;
        } else if (f.name.startsWith('receta_') && !recipeFileUrl) {
          recipeFileUrl = url;
          const rawName = f.name.replace(/^receta_/i, '');
          const lastUnderscore = rawName.lastIndexOf('_');
          const extDot = rawName.lastIndexOf('.');
          if (lastUnderscore !== -1 && extDot !== -1 && extDot > lastUnderscore) {
            recipeFileName = rawName.substring(0, lastUnderscore) + rawName.substring(extDot);
          } else {
            recipeFileName = rawName;
          }
        } else if (f.name.startsWith('video_') && !videoUrl) {
          videoUrl = url;
        }
      }

      return { imageUrl, recipeFileUrl, recipeFileName, videoUrl };
    } catch (err) {
      console.warn('Error en getProductFiles:', err);
      return {};
    }
  },

  /**
   * Obtiene los archivos multimedia existentes en Storage para un código de producción
   */
  async getProductionFiles(productionCode: string): Promise<{
    imageUrl?: string;
    recipeFileUrl?: string;
    recipeFileName?: string;
    videoUrl?: string;
  }> {
    if (!productionCode) return {};
    try {
      const cleanCode = sanitizePathSegment(productionCode);
      const folderPath = `Ventas/Producciones/${cleanCode}`;
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath, { limit: 100 });

      if (error || !files || files.length === 0) {
        return {};
      }

      let imageUrl: string | undefined;
      let recipeFileUrl: string | undefined;
      let recipeFileName: string | undefined;
      let videoUrl: string | undefined;

      for (const f of files) {
        if (!f.name || f.name === '.emptyFolderPlaceholder') continue;
        const filePath = `${folderPath}/${f.name}`;
        const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        const url = pubData.publicUrl;

        if (f.name.startsWith('foto_') && !imageUrl) {
          imageUrl = url;
        } else if (f.name.startsWith('receta_') && !recipeFileUrl) {
          recipeFileUrl = url;
          const rawName = f.name.replace(/^receta_/i, '');
          const lastUnderscore = rawName.lastIndexOf('_');
          const extDot = rawName.lastIndexOf('.');
          if (lastUnderscore !== -1 && extDot !== -1 && extDot > lastUnderscore) {
            recipeFileName = rawName.substring(0, lastUnderscore) + rawName.substring(extDot);
          } else {
            recipeFileName = rawName;
          }
        } else if (f.name.startsWith('video_') && !videoUrl) {
          videoUrl = url;
        }
      }

      return { imageUrl, recipeFileUrl, recipeFileName, videoUrl };
    } catch (err) {
      console.warn('Error en getProductionFiles:', err);
      return {};
    }
  },

  /**
   * Sube la foto del combo a: Ventas/Combos/[codigoCombo]/foto_[nombreLimpio]_[timestamp].[ext]
   */
  async uploadComboMedia(
    comboCode: string,
    file: File
  ): Promise<{ url: string; path: string; name: string } | null> {
    try {
      const cleanCode = sanitizePathSegment(comboCode || 'CMB-SIN-CODIGO');
      const ext = file.name.split('.').pop() || '';
      const cleanBaseName = sanitizePathSegment(file.name.replace(/\.[^/.]+$/, ''));
      const timestamp = Date.now();
      const fileName = `foto_${cleanBaseName}_${timestamp}.${ext.toLowerCase()}`;
      
      const filePath = `Ventas/Combos/${cleanCode}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Error al subir foto del combo a Supabase Storage:', error);
        return null;
      }

      const { data: pubData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        url: pubData.publicUrl,
        path: filePath,
        name: file.name,
      };
    } catch (err) {
      console.error('Error inesperado al subir foto de combo:', err);
      return null;
    }
  },

  /**
   * Elimina un archivo multimedia de combo en Storage
   */
  async deleteComboMedia(urlOrPath: string): Promise<boolean> {
    return this.deleteProductMedia(urlOrPath);
  },

  /**
   * Elimina toda la carpeta física de un combo: Ventas/Combos/[codigoCombo]
   */
  async deleteComboFolder(comboCode: string): Promise<boolean> {
    try {
      const cleanCode = sanitizePathSegment(comboCode);
      const folderPath = `Ventas/Combos/${cleanCode}`;

      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath);

      if (error || !files || files.length === 0) return true;

      const filePaths = files.map((f) => `${folderPath}/${f.name}`);
      const { error: delError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

      if (delError) {
        console.error('Error al eliminar archivos de la carpeta del combo:', delError);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error inesperado al eliminar carpeta de combo:', err);
      return false;
    }
  },

  /**
   * Recupera archivos existentes en Storage de un combo
   */
  async getComboFiles(comboCode: string): Promise<{ imageUrl?: string; imageName?: string }> {
    try {
      const cleanCode = sanitizePathSegment(comboCode);
      const folderPath = `Ventas/Combos/${cleanCode}`;

      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath, { limit: 20 });

      if (error || !files || files.length === 0) return {};

      let imageUrl: string | undefined;
      let imageName: string | undefined;

      for (const f of files) {
        if (!f.name || f.name === '.emptyFolderPlaceholder') continue;
        const filePath = `${folderPath}/${f.name}`;
        const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        const url = pubData.publicUrl;

        if (f.name.startsWith('foto_') && !imageUrl) {
          imageUrl = url;
          imageName = f.name.replace(/^foto_/i, '');
        }
      }

      return { imageUrl, imageName };
    } catch (err) {
      console.warn('Error en getComboFiles:', err);
      return {};
    }
  },
};
