'use strict';

/**
 * EchoLens LMS - Cloudflare R2 upload service (Showcase Feed)
 *
 * R2 is S3-compatible, so this uses @aws-sdk/client-s3 pointed at R2's
 * S3-compatible endpoint rather than a Cloudflare-specific SDK. Mirrors
 * db.js's enabled()/lazy-client shape: requiring this file must stay
 * side-effect-free when R2 isn't configured (local dev with no R2 env vars
 * set), and callers check enabled() before calling anything else.
 *
 * Every uploaded image is re-encoded through sharp before it ever reaches
 * R2 - this strips EXIF (phone photos carry GPS coordinates) and
 * neutralizes polyglot file attacks in one pass, since sharp decodes pixel
 * data and re-encodes from scratch rather than passing bytes through.
 * Magic-number validation below is a first, cheap rejection layer (blocks
 * non-images before they're even handed to sharp); it is not the thing
 * making uploads safe - the re-encode is.
 */

const crypto = require('crypto');
const sharp = require('sharp');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET = process.env.R2_BUCKET || '';

function enabled() {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);
}

let client = null;
function getClient() {
  if (!enabled()) throw new Error('R2 is not configured - callers must check r2.enabled() first.');
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    });
  }
  return client;
}

const MAX_IMAGES_PER_POST = 4;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // reject over 8MB pre-encode
const MAIN_LONGEST_EDGE = 2000;
const THUMB_LONGEST_EDGE = 600;
const ACCEPTED_TYPES = new Set(['jpeg', 'png', 'webp']);

// Checked against the file's actual bytes, never the client-supplied
// filename/mimetype - a renamed showcase.zip.jpg still won't have a JPEG
// signature. No .py/.zip/.ipynb/archive can pass this, by construction:
// there is no accept branch for anything but these three signatures.
function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

/** Validates an uploaded image buffer before it's ever handed to sharp. Throws a user-facing Error on rejection. */
function validateImageBuffer(buffer) {
  if (!buffer || !buffer.length) throw new Error('No image data received.');
  if (buffer.length > MAX_UPLOAD_BYTES) throw new Error('Image is too large - the limit is 8 MB per image.');
  const type = detectImageType(buffer);
  if (!type || !ACCEPTED_TYPES.has(type)) throw new Error('Only JPEG, PNG, or WebP images are accepted.');
  return type;
}

async function putObject(key, buffer, contentType) {
  await getClient().send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
}

/** Derives a thumbnail's R2 key from its full-size sibling's key - a `-thumb` suffix. Used only as the key generator at upload time; ShowcaseImage.thumbKey is the column of record for every read afterward, this is never re-derived to look one up. */
function thumbKeyFor(key) {
  return key.replace(/\.webp$/, '-thumb.webp');
}

/**
 * Validates, re-encodes, and uploads one image plus its thumbnail to R2.
 * Returns exactly what ShowcaseImage persists (constraint: Postgres stores
 * R2 keys only, never a full public URL) - both `r2Key` and `thumbKey` are
 * real columns the caller must write, not derived at read time.
 */
async function processAndUploadImage({ buffer, postId }) {
  validateImageBuffer(buffer);
  if (!postId) throw new Error('processAndUploadImage requires postId.');

  const main = await sharp(buffer)
    .rotate() // bake in EXIF orientation before metadata is stripped below
    .resize({ width: MAIN_LONGEST_EDGE, height: MAIN_LONGEST_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 }) // sharp does not carry EXIF/metadata into the output unless .withMetadata() is called
    .toBuffer({ resolveWithObject: true });

  const thumb = await sharp(buffer)
    .rotate()
    .resize({ width: THUMB_LONGEST_EDGE, height: THUMB_LONGEST_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  const key = `showcase/${postId}/${crypto.randomBytes(16).toString('hex')}.webp`;
  const thumbKey = thumbKeyFor(key);

  await putObject(key, main.data, 'image/webp');
  await putObject(thumbKey, thumb, 'image/webp');

  return {
    r2Key: key,
    thumbKey,
    width: main.info.width,
    height: main.info.height,
    byteSize: main.info.size,
  };
}

/** Best-effort cleanup for a removed post/image. Takes both stored keys explicitly (ShowcaseImage.r2Key/.thumbKey) rather than re-deriving thumbKey - never throws, since a stray R2 object is a minor cost, not worth failing a moderation action over. */
async function deleteImage(key, thumbKey) {
  if (!enabled() || !key) return;
  try {
    const c = getClient();
    await c.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    if (thumbKey) await c.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: thumbKey }));
  } catch (err) {
    console.error('[r2-upload] delete failed (non-fatal):', err.message);
  }
}

module.exports = {
  enabled,
  MAX_IMAGES_PER_POST,
  MAX_UPLOAD_BYTES,
  validateImageBuffer,
  processAndUploadImage,
  thumbKeyFor,
  deleteImage,
};
