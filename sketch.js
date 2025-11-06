const biomes = {
  'Antarctica': ['#748cab', '#0d1321', '#1d2d44', '#3e5c76', '#f0ebd8'],
  'Savannah': ['#606c38', '#283618', '#fefae0', '#dda15e', '#bc6c25'],
  'Swamp': ['#3a5a40', '#cad2c5', '#84a98c', '#588157', '#344e41'],
  'Desert': ['#99582a', '#6f1d1b', '#bb9457', '#432818', '#ffe6a7'],
  'Jungle': ['#0ead69', '#540d6e', '#ee4266', '#ffd23f', '#3bceac'],
  'Tundra': ['#dbdbc7ff', '#b98b73', '#ddbea9', '#d4c7b0', 'rgba(216, 224, 201, 1)', '#6b705c', '#3f4238'],
  'Ocean': ['#2f6690', '#3a7ca5', '#d9dcd6', '#16425b', '#81c3d7'],
  'Meadow': ['#a7c957', '#386641', '#6a994e', '#f2e8cf', '#bc4749'],
  'Canyon': ['#9a031e', '#5f0f40', '#fb8b24', '#e36414', '#0f4c5c'],
};
const biomeNames = Object.keys(biomes);
let paletteIndex = 0;
let palette = getPaletteByIndex(paletteIndex);

let particles = [];
let flowField = [];
let cols;
let rows;
const scaleSize = 28;
let noiseScale = 0.065;
const zIncrement = 0.002;
let zOffset = 0;
const cohesionPull = 0.01;
const autoPhaseSpeed = 0.008;

let controlsWrapper;
let sizeSlider;
let speedSlider;
let noiseSlider;
let countSlider;
let paletteSlider;
let resetButton;
let saveButton;
let autoButton;
let autoAnimate = false;
let autoPhase = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(2);
  background(getBackgroundColor());
  createInterface();
  initFlowField();
  spawnParticles();
}

function draw() {
  if (autoAnimate) {
    autoModulateParameters();
  }
  syncParticleCount();
  generateFlowField();
  particles.forEach((p) => {
    p.follow(flowField);
    p.update();
    p.edges();
    p.show();
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(getBackgroundColor());
  initFlowField();
  respawnParticles();
}

function initFlowField() {
  cols = floor(width / scaleSize) + 1;
  rows = floor(height / scaleSize) + 1;
  flowField = new Array(cols * rows);
}

function generateFlowField() {
  const scaleStep = getNoiseScale();
  let yOffset = 0;
  for (let y = 0; y < rows; y++) {
    let xOffset = 0;
    for (let x = 0; x < cols; x++) {
      const angle = noise(xOffset, yOffset, zOffset) * TWO_PI * 2;
      const vector = p5.Vector.fromAngle(angle);
      vector.setMag(0.9);
      const index = x + y * cols;
      flowField[index] = vector;
      xOffset += scaleStep;
    }
    yOffset += scaleStep;
  }
  zOffset += zIncrement;
}

function spawnParticles() {
  const targetCount = getTargetParticleCount();
  particles = new Array(targetCount)
    .fill(null)
    .map(() => new Particle(random(width), random(height)));
}

function respawnParticles() {
  syncParticleCount();
  particles.forEach((p) => p.resetPosition());
}

// Particle drifts along the evolving flow field, producing layered trails.
class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.prev = this.pos.copy();
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.baseSpeed = random(1.2, 2.4);
    this.baseWeight = random(0.6, 1.8);
    this.refreshColor();
  }

  follow(field) {
    const x = floor(this.pos.x / scaleSize);
    const y = floor(this.pos.y / scaleSize);
    const index = x + y * cols;
    const force = field[index];
    if (force) {
      this.applyForce(force);
    }
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    const center = createVector(width / 2, height / 2);
    const cohesionForce = p5.Vector.sub(center, this.pos);
    if (cohesionForce.magSq() > 1) {
      cohesionForce.setMag(cohesionPull * getSpeedFactor());
      this.applyForce(cohesionForce);
    }
    this.vel.add(this.acc);
    this.vel.limit(this.baseSpeed * getSpeedFactor());
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  show() {
    stroke(this.color);
    strokeWeight(this.baseWeight * getSizeFactor());
    line(this.pos.x, this.pos.y, this.prev.x, this.prev.y);
    this.prev.set(this.pos);
  }

  edges() {
    if (this.pos.x > width) {
      this.pos.x = 0;
      this.prev.set(this.pos);
    }
    if (this.pos.x < 0) {
      this.pos.x = width;
      this.prev.set(this.pos);
    }
    if (this.pos.y > height) {
      this.pos.y = 0;
      this.prev.set(this.pos);
    }
    if (this.pos.y < 0) {
      this.pos.y = height;
      this.prev.set(this.pos);
    }
  }

  resetPosition() {
    this.pos.set(random(width), random(height));
    this.prev.set(this.pos);
  }

  refreshColor() {
    if (!palette.length) {
      this.color = color(255);
      return;
    }
    const swatch = palette[floor(random(palette.length))];
    this.color = color(swatch);
    this.color.setAlpha(random(85, 150));
  }
}

function createInterface() {
  controlsWrapper = createDiv();
  controlsWrapper.id('control-panel');
  controlsWrapper.style('position', 'absolute');
  controlsWrapper.style('top', '16px');
  controlsWrapper.style('left', '16px');
  controlsWrapper.style('padding', '12px 16px');
  controlsWrapper.style('background', 'rgba(0, 18, 25, 0.72)');
  controlsWrapper.style('border-radius', '8px');
  controlsWrapper.style('color', '#E9D8A6');
  controlsWrapper.style('font-family', 'monospace');
  controlsWrapper.style('font-size', '13px');
  controlsWrapper.style('line-height', '1.4');

  sizeSlider = createLabeledSlider('Creature', 1, 20, 3, 0.05);
  speedSlider = createLabeledSlider('Drive', 0.1, 5, 1, 0.01);
  noiseSlider = createLabeledSlider('Fluency', 0.01, 100, 30, 0.01);
  countSlider = createLabeledSlider('Swarm', 20, 1000, getBaseParticleCount(), 10);
  paletteSlider = createLabeledSlider('Biome', 0, biomeNames.length - 1, paletteIndex, 1);
  paletteSlider.input(handlePaletteChange);
  updatePaletteLabel();

  const buttonRow = createDiv();
  buttonRow.parent(controlsWrapper);
  buttonRow.style('display', 'flex');
  buttonRow.style('gap', '8px');
  buttonRow.style('margin-top', '6px');

  resetButton = createButton('Reset');
  resetButton.parent(buttonRow);
  styleButton(resetButton);
  resetButton.mousePressed(resetCanvas);

  saveButton = createButton('Save JPG');
  saveButton.parent(buttonRow);
  styleButton(saveButton);
  saveButton.mousePressed(saveSnapshot);

  autoButton = createButton('Auto Flow: Off');
  autoButton.parent(buttonRow);
  styleButton(autoButton);
  autoButton.mousePressed(toggleAutomation);
  updateAutoButtonState();
}

function createLabeledSlider(label, min, max, value, step) {
  const holder = createDiv();
  holder.parent(controlsWrapper);
  holder.style('margin-bottom', '10px');

  const title = createSpan(label);
  title.parent(holder);
  title.style('display', 'block');
  title.style('margin-bottom', '4px');

  const slider = createSlider(min, max, value, step);
  slider.parent(holder);
  slider.style('width', '160px');
  slider._labelSpan = title;
  return slider;
}

function styleButton(btn) {
  btn.style('background', '#0A9396');
  btn.style('color', '#001219');
  btn.style('border', 'none');
  btn.style('padding', '6px 10px');
  btn.style('border-radius', '4px');
  btn.style('cursor', 'pointer');
  btn.style('font-family', 'monospace');
  btn.style('font-size', '12px');
}

function getSizeFactor() {
  return sizeSlider ? sizeSlider.value() : 1;
}

function getSpeedFactor() {
  return speedSlider ? speedSlider.value() : 1;
}

function getNoiseScale() {
  const raw = noiseSlider ? noiseSlider.value() : noiseScale;
  noiseScale = raw;
  const safe = max(raw, 0.0001);
  return 1 / safe;
}

function resetCanvas() {
  background(getBackgroundColor());
  syncParticleCount();
  particles.forEach((p) => {
    p.resetPosition();
  });
}

function toggleAutomation() {
  autoAnimate = !autoAnimate;
  if (autoAnimate) {
    autoPhase = random(TWO_PI);
  }
  updateAutoButtonState();
}

function updateAutoButtonState() {
  if (!autoButton) {
    return;
  }
  autoButton.html(autoAnimate ? 'Breathe: On' : 'Breathe: Off');
  autoButton.style('background', autoAnimate ? '#EE9B00' : '#0A9396');
  autoButton.style('color', '#001219');
}

function autoModulateParameters() {
  if (!speedSlider || !noiseSlider || !sizeSlider) {
    return;
  }
  autoPhase += autoPhaseSpeed;

  const speedMin = parseFloat(speedSlider.elt.min);
  const speedMax = parseFloat(speedSlider.elt.max);
  const speedMid = (speedMin + speedMax) * 0.5;
  const speedAmp = (speedMax - speedMin) * 0.35;
  const nextSpeed = constrain(speedMid + sin(autoPhase) * speedAmp, speedMin, speedMax);
  speedSlider.value(nextSpeed);

  const noiseMin = parseFloat(noiseSlider.elt.min);
  const noiseMax = parseFloat(noiseSlider.elt.max);
  const noiseMid = (noiseMin + noiseMax) * 0.5;
  const noiseAmp = (noiseMax - noiseMin) * 0.4;
  const nextNoise = constrain(noiseMid + cos(autoPhase * 0.85 + PI / 3) * noiseAmp, noiseMin, noiseMax);
  noiseSlider.value(nextNoise);

  const sizeMin = parseFloat(sizeSlider.elt.min);
  const sizeMax = parseFloat(sizeSlider.elt.max);
  const sizeMid = (sizeMin + sizeMax) * 0.5;
  const sizeAmp = (sizeMax - sizeMin) * 0.45;
  const nextSize = constrain(sizeMid + sin(autoPhase * 0.2 + HALF_PI) * sizeAmp, sizeMin, sizeMax);
  sizeSlider.value(nextSize);
}

function saveSnapshot() {
  const timestamp = nf(year(), 4) + nf(month(), 2) + nf(day(), 2) + '_' + nf(hour(), 2) + nf(minute(), 2) + nf(second(), 2);
  saveCanvas('flow_' + timestamp, 'jpg');
}

function handlePaletteChange() {
  if (!paletteSlider) {
    return;
  }
  const newIndex = constrain(round(paletteSlider.value()), 0, biomeNames.length - 1);
  if (newIndex !== paletteIndex) {
    paletteIndex = newIndex;
    palette = getPaletteByIndex(paletteIndex);
    applyPalette();
  }
  paletteSlider.value(newIndex);
  updatePaletteLabel();
}

function applyPalette() {
  background(getBackgroundColor());
  particles.forEach((p) => p.refreshColor());
}

function updatePaletteLabel() {
  if (!paletteSlider || !paletteSlider._labelSpan) {
    return;
  }
  const name = getBiomeName(paletteIndex) || 'Biome ' + (paletteIndex + 1);
  paletteSlider._labelSpan.html('Biome: ' + name);
}

function getBiomeName(index) {
  if (index < 0 || index >= biomeNames.length) {
    return null;
  }
  return biomeNames[index];
}

function getPaletteByIndex(index) {
  const name = getBiomeName(index);
  return name ? biomes[name] : [];
}

function getBackgroundColor() {
  return palette && palette.length ? palette[0] : '#000000';
}

function syncParticleCount() {
  const target = getTargetParticleCount();
  const current = particles.length;
  if (current < target) {
    const deficit = target - current;
    for (let i = 0; i < deficit; i++) {
      particles.push(new Particle(random(width), random(height)));
    }
  } else if (current > target) {
    particles.length = target;
  }
}

function getTargetParticleCount() {
  return countSlider ? floor(countSlider.value()) : getBaseParticleCount();
}

function getBaseParticleCount() {
  const area = width * height;
  return constrain(floor(area / 9000), 300, 1200);
}
