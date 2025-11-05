let canvas = [];

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
  createCanvas(600, 400);
  background(220);
  rectMode(CENTER);
  
  // Background
  for(i=0; i<1000; i++) {
    noStroke();
    col = randomColor();
    col.setAlpha(20);
    fill(col);
    rect(random(width), random(height), random(100));
  }

  // Draw grid of rectangles
  frame = 60;
  numAcross = 20;
  size1 = (width-frame*2)/numAcross;
  stroke('black');
  for (x=frame; x<width-frame; x+=size1) {
    for (y=frame; y<height-frame; y+=size1) {
      colIndex = floor(random(5));
      fill(randomColor());
      
      rect(x, y, size1 * 0.5);
    }
  }
}
