// image-upload-helper.js - Image compression and optimization

class ImageUploadHelper {
    constructor(options = {}) {
        this.options = {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8,
            maxSizeMB: 2,
            ...options
        };
    }
    
    async compressImage(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('File is not an image'));
                return;
            }
            
            if (file.size <= this.options.maxSizeMB * 1024 * 1024) {
                // File already small enough
                resolve(file);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > this.options.maxWidth) {
                        height = (height * this.options.maxWidth) / width;
                        width = this.options.maxWidth;
                    }
                    
                    if (height > this.options.maxHeight) {
                        width = (width * this.options.maxHeight) / height;
                        height = this.options.maxHeight;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Canvas to Blob failed'));
                                return;
                            }
                            
                            const compressedFile = new File(
                                [blob],
                                file.name,
                                { type: 'image/jpeg', lastModified: Date.now() }
                            );
                            
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        this.options.quality
                    );
                };
                
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
    
    async uploadToSupabase(file, bucket = 'product-images') {
        try {
            // Compress if needed
            const compressedFile = await this.compressImage(file);
            
            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExt = compressedFile.name.split('.').pop().toLowerCase();
            const fileName = `image_${timestamp}_${randomString}.${fileExt}`;
            
            // Upload to Supabase
            const { data, error } = await supabaseClient.storage
                .from(bucket)
                .upload(fileName, compressedFile, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: compressedFile.type
                });
            
            if (error) throw error;
            
            // Get public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from(bucket)
                .getPublicUrl(fileName);
            
            return {
                success: true,
                url: publicUrl,
                fileName: fileName,
                size: compressedFile.size,
                originalSize: file.size,
                compression: Math.round((1 - compressedFile.size / file.size) * 100)
            };
            
        } catch (error) {
            console.error('Image upload error:', error);
            throw error;
        }
    }
    
    async uploadMultiple(files, bucket = 'product-images') {
        const uploads = Array.from(files).map(file => 
            this.uploadToSupabase(file, bucket)
        );
        
        return Promise.allSettled(uploads);
    }
    
    // Image preview with compression
    async createPreview(file, maxWidth = 400) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve({
                        dataUrl: canvas.toDataURL('image/jpeg', 0.7),
                        width: width,
                        height: height,
                        originalWidth: img.width,
                        originalHeight: img.height
                    });
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // Validate image
    validateImage(file) {
        const errors = [];
        
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            errors.push('Only JPG, PNG, WEBP, or GIF images are allowed');
        }
        
        // Check file size
        const maxSize = this.options.maxSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push(`Image must be less than ${this.options.maxSizeMB}MB`);
        }
        
        // Check dimensions if possible
        return new Promise((resolve) => {
            if (errors.length > 0) {
                resolve({ valid: false, errors });
                return;
            }
            
            const img = new Image();
            img.onload = () => {
                if (img.width > 5000 || img.height > 5000) {
                    errors.push('Image dimensions too large (max 5000x5000)');
                }
                resolve({ valid: errors.length === 0, errors });
            };
            img.onerror = () => {
                errors.push('Cannot read image dimensions');
                resolve({ valid: false, errors });
            };
            img.src = URL.createObjectURL(file);
        });
    }
}

// Global instance
const imageUploader = new ImageUploadHelper();

// Export
window.imageUploader = imageUploader;