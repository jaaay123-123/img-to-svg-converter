const ImageTracer = require('imagetracerjs');
const { Jimp } = require('jimp');
const fs = require('fs');

const inputPath = process.argv[2];
const outputPath = process.argv[3];
const mode = process.argv[4] || 'color'; // 'color' or 'lineart'

if (!inputPath || !outputPath) {
  process.stderr.write('Usage: node trace_adobe.js <input> <output> [color|lineart]\n');
  process.exit(1);
}

async function run() {
  const image = await Jimp.read(inputPath);
  const { width, height } = image.bitmap;

  // RGBA 픽셀 배열 구성
  const data = new Uint8ClampedArray(image.bitmap.data);

  const imageData = { data, width, height };

  const options = mode === 'lineart' ? {
    // 선화 최적화: 흑백, 고정밀
    numberofcolors: 2,
    colorquantcycles: 3,
    pathomit: 4,
    ltres: 0.5,
    qtres: 0.5,
    blurradius: 0,
    scale: 1,
    strokewidth: 0,
    linefilter: false,
    colorsampling: 2,
    mincolorratio: 0,
  } : {
    // 컬러 이미지: Adobe Image Trace 고품질 설정
    numberofcolors: 64,
    colorquantcycles: 5,
    pathomit: 4,
    ltres: 0.5,
    qtres: 0.5,
    blurradius: 0,
    blurdelta: 20,
    scale: 1,
    strokewidth: 0,
    linefilter: false,
    colorsampling: 2,
    mincolorratio: 0.02,
  };

  const svg = ImageTracer.imagedataToSVG(imageData, options);
  fs.writeFileSync(outputPath, svg);
  process.stdout.write('OK\n');
}

run().catch(err => {
  process.stderr.write(err.message + '\n');
  process.exit(1);
});
