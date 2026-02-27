const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const TARGET_HEIGHT = 450;
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const SOURCE_DIR = path.join(__dirname, '..', 'src', 'asset', 'homePage');
const OUTPUT_DIR = path.join(SOURCE_DIR, 'converted');

async function collectImageFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) continue;
    files.push(path.join(dir, entry.name));
  }

  return files;
}

async function convertImage(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  const outputPath = path.join(OUTPUT_DIR, `${baseName}.jpg`);

  await sharp(filePath)
    .resize({ height: TARGET_HEIGHT, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toFile(outputPath);

  return outputPath;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const imageFiles = await collectImageFiles(SOURCE_DIR);
  if (imageFiles.length === 0) {
    console.log(`No supported image files found in ${SOURCE_DIR}`);
    return;
  }

  console.log(`Converting ${imageFiles.length} image(s) to ${TARGET_HEIGHT}px height JPGs...`);

  const results = await Promise.allSettled(imageFiles.map(convertImage));

  let successCount = 0;
  let failureCount = 0;

  results.forEach((result, index) => {
    const sourceName = path.basename(imageFiles[index]);
    if (result.status === 'fulfilled') {
      successCount += 1;
      console.log(`✔ ${sourceName} → ${path.basename(result.value)}`);
    } else {
      failureCount += 1;
      console.error(`✖ Failed to convert ${sourceName}: ${result.reason}`);
    }
  });

  console.log(`Done. ${successCount} succeeded, ${failureCount} failed.`);
  console.log(`Converted files live in: ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
