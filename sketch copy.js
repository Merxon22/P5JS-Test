let canv = [];
let canvasCount = 3;

const palette = [
  '#001219',
  '#005F73',
  '#0A9396',
  '#94D2BD',
  '#E9D8A6',
  '#EE9B00',
  '#CA6702',
  '#BB3E03',
  '#AE2012',
  '#9B2226'
];

function randomColor() {
  const numColors = palette.length;
  return color(palette[floor(random(numColors))]);
}

function setup() {
  const wid = 800, hgt = 600;
  createCanvas(wid, hgt);

  for (i=0; i<canvasCount; i++) {
    canv[i] = createGraphics(800, 600);
  }
  
  rectMode(CENTER);

  // Background
  canv[0].background(220);
  for(i=0; i<1000; i++) {
    canv[0].noStroke();
    col = randomColor();
    col.setAlpha(20);
    canv[0].fill(col);
    canv[0].rect(random(width), random(height), random(100));
  }

  // Draw grid of rectangles
  frame = 60;
  numAcross = 20;
  size1 = (width-frame*2)/numAcross;
  canv[0].stroke('black');
  for (x=frame; x<width-frame; x+=size1) {
    for (y=frame; y<height-frame; y+=size1) {
      colIndex = floor(random(5));
      canv[0].fill(randomColor());

      canv[0].rect(x, y, size1 * 0.5);
    }
  }
}

let time = 0;

function draw() {
  time++;

  canv[1].clear();
  pixSize = 3;
  canv[1].noStroke();
  for (x=-pixSize; x<width; x+=pixSize) {
    for (y=-pixSize; y<height; y+=pixSize) {
      canv[1].rectMode(CORNER);
      noiseScale = 0.01;
      noiseSample = noise(x * noiseScale, y * noiseScale)*255;
      canv[1].fill(noiseSample, 100);
      canv[1].rect(x, y, pixSize*2);
    }
  }

  lastCanvasIndex = canvasCount - 1;
  canv[lastCanvasIndex].clear();
  canv[lastCanvasIndex].circle(mouseX, mouseY, pixSize * 3);


  for (i=0; i<canvasCount; i++) {
    image(canv[i], 0, 0);
  }
}
