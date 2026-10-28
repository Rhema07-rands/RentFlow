export const isVideoMedia = (urlOrFile: string | File | null | undefined): boolean => {
  if (!urlOrFile) return false;

  if (typeof urlOrFile !== 'string') {
    return urlOrFile.type ? urlOrFile.type.startsWith('video/') : false;
  }

  const cleanUrl = urlOrFile.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.m4v') ||
    cleanUrl.endsWith('.ogv') ||
    cleanUrl.endsWith('.mkv') ||
    cleanUrl.includes('/video/upload/')
  );
};

export const getVideoPoster = (url: string): string | undefined => {
  if (!url || typeof url !== 'string') return undefined;
  if (url.includes('/video/upload/')) {
    // Cloudinary automatically returns a frame JPG thumbnail by replacing the extension with .jpg
    return url.replace(/\.(mp4|webm|mov|m4v|ogv|mkv)$/i, '.jpg');
  }
  return undefined;
};
