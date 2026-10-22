/**
 * Robust file downloader for modern browsers (Chrome, Edge, Firefox, Safari).
 * Resolves Chrome's UUID download issue by:
 * 1. Converting large base64 data URLs to streaming Blobs
 * 2. Attaching the <a> tag to document.body so the download attribute is strictly honored
 * 3. Delaying URL.revokeObjectURL so background download processes can finish writing the file.
 */
export function triggerFileDownload(source, filename) {
  let url = '';
  let shouldRevoke = false;

  if (source instanceof Blob) {
    url = URL.createObjectURL(source);
    shouldRevoke = true;
  } else if (typeof source === 'string' && source.startsWith('data:')) {
    try {
      const parts = source.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      url = URL.createObjectURL(blob);
      shouldRevoke = true;
    } catch {
      url = source;
    }
  } else {
    url = source;
  }

  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  // Delay cleanup so Chrome/Edge background download process has full access to the blob
  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      if (shouldRevoke) {
        URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    }
  }, 4000);
}
