/**
 * download-moonshine.js
 *
 * Downloads the Moonshine Base ONNX model for local speech transcription.
 * Run this if the model was excluded by .gitignore and needs to be
 * restored after a fresh clone.
 *
 * Usage: node scripts/download-moonshine.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_ORG = 'onnx-community';
const MODEL_NAME = 'moonshine-base-ONNX';
const BASE_URL = `https://huggingface.co/${MODEL_ORG}/${MODEL_NAME}/resolve/main`;

const REQUIRED_FILES = [
  'config.json',
  'generation_config.json',
  'preprocessor_config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'onnx/encoder_model.onnx',
  'onnx/decoder_model_merged.onnx',
  'onnx/decoder_model_merged_quantized.onnx',
];

const MODELS_DIR = path.join(__dirname, '..', 'resources', 'models', MODEL_ORG, MODEL_NAME);

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 303) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const total = parseInt(res.headers['content-length'], 10);
      let downloaded = 0;
      res.on('data', (chunk) => {
        downloaded += chunk.length;
        const pct = total ? ` (${(downloaded / total * 100).toFixed(1)}%)` : '';
        process.stdout.write(`\r  ${path.basename(dest)}: ${(downloaded / 1e6).toFixed(1)}MB${pct}   `);
      });
      res.pipe(file);
      file.on('finish', () => { file.close(); process.stdout.write('\n'); resolve(); });
    }).on('error', (err) => { file.close(); fs.unlinkSync(dest); reject(err); });
  });
}

async function main() {
  console.log(`Downloading ${MODEL_ORG}/${MODEL_NAME} to ${MODELS_DIR}\n`);
  for (const file of REQUIRED_FILES) {
    const dest = path.join(MODELS_DIR, file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`  ${file} — already exists, skipping`);
      continue;
    }
    const url = `${BASE_URL}/${file}`;
    await downloadFile(url, dest);
  }
  console.log('\nDone. Moonshine Base model is ready.');
}

main().catch((e) => {
  console.error('\nDownload failed:', e.message);
  process.exit(1);
});
