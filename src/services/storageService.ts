import { supabase } from '../lib/supabase.js';

/**
 * Supabase Storage Service - Handle file uploads and URL generation
 *
 * Bucket structure:
 * modules/
 *   ├── {slug}/
 *   │   ├── v1/
 *   │   │   ├── full.md
 *   │   │   ├── summary.md
 *   │   │   └── bundle.zip
 */

const STORAGE_BUCKET = 'modules';

/**
 * Initialize storage bucket (run once during setup)
 */
export async function initializeStorageBucket(): Promise<void> {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
      // Create bucket with public access for downloads
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'text/markdown',
          'text/plain',
          'application/zip',
          'image/png',
          'image/jpeg',
        ],
      });

      if (error) {
        console.error('Error creating storage bucket:', error);
        throw error;
      }

      console.log(`✓ Created storage bucket: ${STORAGE_BUCKET}`);
    } else {
      console.log(`✓ Storage bucket already exists: ${STORAGE_BUCKET}`);
    }
  } catch (error) {
    console.error('Error initializing storage bucket:', error);
    throw error;
  }
}

/**
 * Upload markdown file to Supabase Storage
 */
export async function uploadMarkdownFile(
  slug: string,
  version: number,
  filename: string,
  content: string
): Promise<string | null> {
  try {
    const path = `${slug}/v${version}/${filename}`;
    const buffer = Buffer.from(content, 'utf-8');

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType: 'text/markdown',
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error(`Error uploading ${filename}:`, error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    console.log(`✓ Uploaded: ${filename} → ${urlData.publicUrl}`);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadMarkdownFile:', error);
    return null;
  }
}

/**
 * Upload ZIP bundle to Supabase Storage
 */
export async function uploadZipBundle(
  slug: string,
  version: number,
  zipBuffer: Buffer
): Promise<string | null> {
  try {
    const path = `${slug}/v${version}/bundle.zip`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, zipBuffer, {
        contentType: 'application/zip',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading ZIP bundle:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    console.log(`✓ Uploaded: bundle.zip → ${urlData.publicUrl}`);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadZipBundle:', error);
    return null;
  }
}

/**
 * Upload thumbnail image to Supabase Storage
 */
export async function uploadThumbnail(
  slug: string,
  version: number,
  imageBuffer: Buffer,
  mimeType: string = 'image/png'
): Promise<string | null> {
  try {
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const path = `${slug}/v${version}/thumbnail.${extension}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, imageBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('Error uploading thumbnail:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    console.log(`✓ Uploaded: thumbnail.${extension} → ${urlData.publicUrl}`);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadThumbnail:', error);
    return null;
  }
}

/**
 * Create ZIP bundle from markdown files
 */
export async function createZipBundle(
  fullMarkdown: string,
  summaryMarkdown: string,
  moduleName: string
): Promise<Buffer> {
  // For now, return a simple placeholder
  // In production, use a proper ZIP library like 'archiver' or 'jszip'
  const content = `# ${moduleName} Bundle\n\nFull: full.md\nSummary: summary.md`;
  return Buffer.from(content, 'utf-8');
}

/**
 * Upload all module files (full MD, summary MD, ZIP)
 */
export async function uploadModuleFiles(
  slug: string,
  version: number,
  fullContent: string,
  summaryContent: string
): Promise<{
  full_md?: string;
  summary_md?: string;
  bundle_zip?: string;
}> {
  console.log(`📤 Uploading files to Supabase Storage...`);

  // Upload full markdown
  const fullUrl = await uploadMarkdownFile(slug, version, 'full.md', fullContent);

  // Upload summary markdown
  const summaryUrl = await uploadMarkdownFile(
    slug,
    version,
    'summary.md',
    summaryContent
  );

  // Create and upload ZIP bundle
  const zipBuffer = await createZipBundle(fullContent, summaryContent, slug);
  const zipUrl = await uploadZipBundle(slug, version, zipBuffer);

  const result = {
    full_md: fullUrl || undefined,
    summary_md: summaryUrl || undefined,
    bundle_zip: zipUrl || undefined,
  };

  console.log(`✓ Uploaded ${Object.values(result).filter(Boolean).length}/3 files`);

  return result;
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete all files for a module version
 */
export async function deleteModuleFiles(
  slug: string,
  version: number
): Promise<boolean> {
  try {
    const prefix = `${slug}/v${version}/`;

    const { data: files } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(`${slug}/v${version}`);

    if (!files || files.length === 0) {
      console.log(`No files found for ${slug} v${version}`);
      return true;
    }

    const filePaths = files.map((file) => `${prefix}${file.name}`);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (error) {
      console.error('Error deleting files:', error);
      return false;
    }

    console.log(`✓ Deleted ${files.length} files for ${slug} v${version}`);
    return true;
  } catch (error) {
    console.error('Error in deleteModuleFiles:', error);
    return false;
  }
}

/**
 * List all files for a module
 */
export async function listModuleFiles(slug: string): Promise<string[]> {
  try {
    const { data: files } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(slug);

    if (!files) return [];

    return files.map((file) => file.name);
  } catch (error) {
    console.error('Error listing module files:', error);
    return [];
  }
}
