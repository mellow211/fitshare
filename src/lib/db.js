import { supabase, isMock } from './supabase';

/**
 * Compresses an image file client-side using Canvas.
 * Resizes the image to max 800px width/height and compresses to JPEG format.
 * Returns a Promise that resolves to a Blob.
 */
/**
 * Reads the EXIF Orientation tag from a JPEG file blob.
 * Returns a Promise that resolves to the orientation number, or -1 if not found.
 */
function getExifOrientation(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target.result);
      if (view.byteLength < 2 || view.getUint16(0, false) !== 0xFFD8) {
        resolve(-2); // Not a JPEG
        return;
      }
      const length = view.byteLength;
      let offset = 2;
      while (offset < length) {
        if (offset + 2 > length) break;
        const marker = view.getUint16(offset, false);
        offset += 2;
        if (marker === 0xFFE1) {
          if (offset + 6 > length) break;
          if (view.getUint32(offset, false) !== 0x45786966) {
            resolve(-1);
            return;
          }
          offset += 6;
          const little = view.getUint16(offset, false) === 0x4949;
          offset += 2;
          if (offset + 2 > length) break;
          const tags = view.getUint16(offset, little);
          offset += 2;
          for (let i = 0; i < tags; i++) {
            const tagOffset = offset + i * 12;
            if (tagOffset + 12 > length) break;
            if (view.getUint16(tagOffset, little) === 0x0112) {
              resolve(view.getUint16(tagOffset + 8, little));
              return;
            }
          }
        } else if ((marker & 0xFF00) === 0xFF00) {
          if (offset + 2 > length) break;
          const markerLength = view.getUint16(offset, false);
          offset += markerLength;
        } else {
          break;
        }
      }
      resolve(-1);
    };
    // Read only the first 64KB for performance and efficiency
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

/**
 * Compresses an image file client-side using Canvas.
 * Resizes the image to max 800px width/height and compresses to JPEG format.
 * Returns a Promise that resolves to a Blob.
 */
export async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  // Read EXIF orientation to correct canvas drawing rotation
  const orientation = await getExifOrientation(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Check if rotated 90 or 270 degrees
        const isRotated = orientation === 5 || orientation === 6 || orientation === 7 || orientation === 8;
        const targetWidth = isRotated ? img.height : img.width;
        const targetHeight = isRotated ? img.width : img.height;

        let newWidth = targetWidth;
        let newHeight = targetHeight;

        // Calculate new dimensions preserving aspect ratio
        if (targetWidth > targetHeight) {
          if (targetWidth > maxWidth) {
            newHeight = Math.round((targetHeight * maxWidth) / targetWidth);
            newWidth = maxWidth;
          }
        } else {
          if (targetHeight > maxHeight) {
            newWidth = Math.round((targetWidth * maxHeight) / targetHeight);
            newHeight = maxHeight;
          }
        }

        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');

        // Apply transformations based on EXIF orientation to draw image upright
        ctx.save();
        if (orientation === 3) {
          // 180 degrees
          ctx.translate(newWidth, newHeight);
          ctx.rotate(Math.PI);
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
        } else if (orientation === 6) {
          // Rotate 90 degrees CW
          ctx.translate(newWidth, 0);
          ctx.rotate(90 * Math.PI / 180);
          ctx.drawImage(img, 0, 0, newHeight, newWidth);
        } else if (orientation === 8) {
          // Rotate 270 degrees CW
          ctx.translate(0, newHeight);
          ctx.rotate(270 * Math.PI / 180);
          ctx.drawImage(img, 0, 0, newHeight, newWidth);
        } else {
          // Normal drawing
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
        }
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Initial mock data to seed when local storage is empty
const INITIAL_SEEDS = [
  {
    id: 'seed-1',
    name: '새솔초등학교 동복 체육복 상의',
    category: '상의',
    color: '네이비',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400',
    measurements: { shoulder: 38, chest: 44, sleeve: 50, length: 58 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 },
    status: 'available',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    reservation: null
  },
  {
    id: 'seed-2',
    name: '새솔초등학교 동복 체육복 하의',
    category: '하의',
    color: '네이비',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=400',
    measurements: { waist: 28, length: 72 }, // pants use waist and length
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 },
    status: 'available',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reservation: null
  },
  {
    id: 'seed-3',
    name: '새솔초등학교 정복 교복 재킷',
    category: '아우터',
    color: '다크그레이',
    style: '교복',
    image_url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=400',
    measurements: { shoulder: 40, chest: 46, sleeve: 52, length: 60 },
    guidelines: { shoulder_y: 22, chest_y: 38, sleeve_start_x: 28, sleeve_end_x: 12, length_start_y: 22, length_end_y: 88 },
    status: 'reserved',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    reservation: { student_name: '김민준', grade: '4학년 1반', parent_phone: '010-1234-5678' }
  },
  {
    id: 'seed-4',
    name: '새솔초등학교 하복 생활복 상의',
    category: '상의',
    color: '화이트',
    style: '교복',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400',
    measurements: { shoulder: 36, chest: 42, sleeve: 20, length: 54 },
    guidelines: { shoulder_y: 18, chest_y: 32, sleeve_start_x: 25, sleeve_end_x: 15, length_start_y: 18, length_end_y: 85 },
    status: 'available',
    created_at: new Date().toISOString(),
    reservation: null
  }
];

// Helper to interact with LocalStorage in Mock Mode
function getLocalClothes(spaceCode) {
  if (typeof window === 'undefined') return [];
  const key = `fitshare_clothes_${spaceCode}`;
  let data = localStorage.getItem(key);
  if (!data) {
    // Seed default data if empty
    localStorage.setItem(key, JSON.stringify(INITIAL_SEEDS));
    return INITIAL_SEEDS;
  }
  return JSON.parse(data);
}

function saveLocalClothes(spaceCode, clothes) {
  if (typeof window === 'undefined') return;
  const key = `fitshare_clothes_${spaceCode}`;
  localStorage.setItem(key, JSON.stringify(clothes));
}

/**
 * Fetches all clothes registered under a specific space code
 */
export async function getClothes(spaceCode) {
  if (isMock) {
    return getLocalClothes(spaceCode);
  }

  try {
    const { data, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('space_code', spaceCode)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching clothes from Supabase:', error);
    return getLocalClothes(spaceCode); // Failover to local storage
  }
}

/**
 * Saves a new clothing item to the DB/Storage
 */
export async function addCloth(spaceCode, clothData) {
  const newItem = {
    id: clothData.id || crypto.randomUUID(),
    created_at: new Date().toISOString(),
    space_code: spaceCode,
    name: clothData.name,
    category: clothData.category,
    color: clothData.color,
    style: clothData.style,
    image_url: clothData.image_url,
    measurements: clothData.measurements,
    guidelines: clothData.guidelines,
    status: 'available',
    reservation: null
  };

  if (isMock) {
    const clothes = getLocalClothes(spaceCode);
    clothes.unshift(newItem);
    saveLocalClothes(spaceCode, clothes);
    return newItem;
  }

  try {
    const { data, error } = await supabase
      .from('clothes')
      .insert([newItem])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error saving cloth to Supabase:', error);
    // Failover
    const clothes = getLocalClothes(spaceCode);
    clothes.unshift(newItem);
    saveLocalClothes(spaceCode, clothes);
    return newItem;
  }
}

/**
 * Uploads an image to Supabase Storage or returns base64 in mock mode
 */
export async function uploadImage(file, spaceCode) {
  // Always compress image client-side first
  let compressedFile;
  try {
    compressedFile = await compressImage(file);
  } catch (e) {
    console.error('Compression failed, using original file', e);
    compressedFile = file;
  }

  if (isMock) {
    // Return base64 string in mock mode so it persists in LocalStorage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  try {
    const fileName = `${spaceCode}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    // Upload compressed file to 'clothing-images' bucket
    const { data, error } = await supabase.storage
      .from('clothing-images')
      .upload(fileName, compressedFile, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('clothing-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase Storage:', error);
    // Failover to Base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onload = () => resolve(reader.result);
    });
  }
}

/**
 * Updates an item status to reserved and saves reservation info
 */
export async function reserveCloth(spaceCode, clothId, reservationData) {
  if (isMock) {
    const clothes = getLocalClothes(spaceCode);
    const updated = clothes.map(item => {
      if (item.id === clothId) {
        return {
          ...item,
          status: 'reserved',
          reservation: reservationData
        };
      }
      return item;
    });
    saveLocalClothes(spaceCode, updated);
    return true;
  }

  try {
    const { error } = await supabase
      .from('clothes')
      .update({
        status: 'reserved',
        reservation: reservationData
      })
      .eq('id', clothId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error reserving cloth in Supabase:', error);
    // Failover
    const clothes = getLocalClothes(spaceCode);
    const updated = clothes.map(item => {
      if (item.id === clothId) {
        return { ...item, status: 'reserved', reservation: reservationData };
      }
      return item;
    });
    saveLocalClothes(spaceCode, updated);
    return true;
  }
}

/**
 * Cancels a reservation: resets status to 'available' and clears reservation info
 */
export async function cancelReservation(spaceCode, clothId) {
  if (isMock) {
    const clothes = getLocalClothes(spaceCode);
    const updated = clothes.map(item => {
      if (item.id === clothId) {
        return {
          ...item,
          status: 'available',
          reservation: null
        };
      }
      return item;
    });
    saveLocalClothes(spaceCode, updated);
    return true;
  }

  try {
    const { error } = await supabase
      .from('clothes')
      .update({
        status: 'available',
        reservation: null
      })
      .eq('id', clothId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error canceling reservation in Supabase:', error);
    const clothes = getLocalClothes(spaceCode);
    const updated = clothes.map(item => {
      if (item.id === clothId) {
        return { ...item, status: 'available', reservation: null };
      }
      return item;
    });
    saveLocalClothes(spaceCode, updated);
  }
}

/**
 * Deletes a clothing item
 */
export async function deleteCloth(spaceCode, clothId) {
  if (isMock) {
    const clothes = getLocalClothes(spaceCode);
    const filtered = clothes.filter(item => item.id !== clothId);
    saveLocalClothes(spaceCode, filtered);
    return true;
  }

  try {
    const { error } = await supabase
      .from('clothes')
      .delete()
      .eq('id', clothId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting cloth from Supabase:', error);
    const clothes = getLocalClothes(spaceCode);
    const filtered = clothes.filter(item => item.id !== clothId);
    saveLocalClothes(spaceCode, filtered);
    return true;
  }
}
