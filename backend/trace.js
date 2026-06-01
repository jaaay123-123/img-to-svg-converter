const potrace = require('potrace');
const { Jimp } = require('jimp');
const fs = require('fs');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  process.stderr.write('Usage: node trace.js <input_image> <output_svg>\n');
  process.exit(1);
}

async function trace() {
  const image = await Jimp.read(inputPath);

  // 이미지를 흑백 처리 후 potrace로 트레이싱
  image.greyscale();

  const tmpBmp = inputPath + '.bmp';
  await image.write(tmpBmp);

  potrace.trace(tmpBmp, {
    turdSize: 2,         // 노이즈 제거 임계값 (낮을수록 세밀)
    turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
    alphaMax: 1,         // 커브 최적화
    optCurve: true,      // Bezier 커브 최적화
    optTolerance: 0.2,   // 커브 허용 오차 (낮을수록 정밀)
    threshold: potrace.Potrace.THRESHOLD_AUTO,
    blackOnWhite: true,
  }, (err, svg) => {
    if (err) {
      process.stderr.write(err.message + '\n');
      fs.unlinkSync(tmpBmp);
      process.exit(1);
    }
    fs.writeFileSync(outputPath, svg);
    fs.unlinkSync(tmpBmp);
    process.stdout.write('OK\n');
  });
}

trace().catch(err => {
  process.stderr.write(err.message + '\n');
  process.exit(1);
});
