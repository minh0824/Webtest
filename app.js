const MOD = 1_000_000_007n;
const POLY_BASE = 31n;
const FNV_OFFSET = 2166136261 >>> 0;
const FNV_PRIME = 16777619;
const BUCKETS = 12;

const state = {
  text: "hashing",
  compareText: "Hashing",
  algorithm: "poly",
  step: 0,
  timer: null,
};

const algorithms = {
  poly: {
    name: "Polynomial rolling",
    formula: "h = (h × 31 + code) mod 1,000,000,007",
    seed: 0n,
    compute(prev, code) {
      return (prev * POLY_BASE + BigInt(code)) % MOD;
    },
    display(value) {
      return value.toString();
    },
    low32(value) {
      return Number(value & 0xffffffffn) >>> 0;
    },
    line(prev, code, next) {
      return `h = (${prev.toString()} × 31 + ${code}) mod 1,000,000,007\n  = ${next.toString()}`;
    },
  },
  djb2: {
    name: "DJB2",
    formula: "h = ((h << 5) + h) + code",
    seed: 5381 >>> 0,
    compute(prev, code) {
      return (((prev << 5) + prev + code) >>> 0);
    },
    display(value) {
      return value.toString();
    },
    low32(value) {
      return value >>> 0;
    },
    line(prev, code, next) {
      return `h = (( ${prev} << 5 ) + ${prev}) + ${code}\n  = ${next >>> 0}  // ép về 32-bit`;
    },
  },
  fnv1a: {
    name: "FNV-1a 32-bit",
    formula: "h = (h xor code) × 16,777,619",
    seed: FNV_OFFSET,
    compute(prev, code) {
      return Math.imul((prev ^ code) >>> 0, FNV_PRIME) >>> 0;
    },
    display(value) {
      return (value >>> 0).toString();
    },
    low32(value) {
      return value >>> 0;
    },
    line(prev, code, next) {
      return `h = (${prev >>> 0} xor ${code}) × 16,777,619\n  = ${next >>> 0}  // ép về 32-bit`;
    },
  },
};

const samples = [
  "hash",
  "Hash",
  "table",
  "string",
  "algorithm",
  "visual",
  "collision",
  "data",
  "key",
  "index",
  "bucket",
  "hashing",
];

const els = {
  textInput: document.querySelector("#textInput"),
  compareInput: document.querySelector("#compareInput"),
  algorithm: document.querySelector("#algorithm"),
  stepSlider: document.querySelector("#stepSlider"),
  stepLabel: document.querySelector("#stepLabel"),
  prevBtn: document.querySelector("#prevBtn"),
  playBtn: document.querySelector("#playBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  shortHash: document.querySelector("#shortHash"),
  algorithmFormula: document.querySelector("#algorithmFormula"),
  charStrip: document.querySelector("#charStrip"),
  currentChar: document.querySelector("#currentChar"),
  currentCode: document.querySelector("#currentCode"),
  currentState: document.querySelector("#currentState"),
  stepFormula: document.querySelector("#stepFormula"),
  bitGrid: document.querySelector("#bitGrid"),
  hexHash: document.querySelector("#hexHash"),
  bucketIndex: document.querySelector("#bucketIndex"),
  lengthMetric: document.querySelector("#lengthMetric"),
  bucketGrid: document.querySelector("#bucketGrid"),
  baseCompareHash: document.querySelector("#baseCompareHash"),
  otherCompareHash: document.querySelector("#otherCompareHash"),
  bitDistance: document.querySelector("#bitDistance"),
  distanceBar: document.querySelector("#distanceBar"),
};

function charsOf(text) {
  return Array.from(text);
}

function hashSteps(text, algorithmKey = state.algorithm) {
  const algorithm = algorithms[algorithmKey];
  const chars = charsOf(text);
  const steps = [];
  let current = algorithm.seed;

  chars.forEach((char, index) => {
    const code = char.codePointAt(0);
    const previous = current;
    current = algorithm.compute(current, code);
    steps.push({
      index,
      char,
      code,
      previous,
      value: current,
      line: algorithm.line(previous, code, current),
    });
  });

  return {
    chars,
    steps,
    final: current,
    low32: algorithm.low32(current),
  };
}

function hex32(value) {
  return (value >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

function bitString(value) {
  return (value >>> 0).toString(2).padStart(32, "0");
}

function hammingDistance(a, b) {
  let x = (a ^ b) >>> 0;
  let count = 0;
  while (x) {
    count += x & 1;
    x >>>= 1;
  }
  return count;
}

function bucketFor(low32) {
  return low32 % BUCKETS;
}

function stopPlayback() {
  if (state.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }
  els.playBtn.textContent = "Chạy";
}

function setStep(step) {
  const total = charsOf(state.text).length;
  state.step = Math.max(0, Math.min(step, total));
  render();
}

function renderCharacters(result) {
  els.charStrip.innerHTML = "";

  if (!result.chars.length) {
    const empty = document.createElement("div");
    empty.className = "char-tile";
    empty.innerHTML = "<strong>∅</strong><span>empty</span>";
    els.charStrip.append(empty);
    return;
  }

  result.chars.forEach((char, index) => {
    const tile = document.createElement("div");
    tile.className = "char-tile";
    if (index < state.step) tile.classList.add("done");
    if (index === state.step - 1) tile.classList.add("active");
    tile.innerHTML = `<strong>${escapeHtml(char)}</strong><span>#${index}</span>`;
    els.charStrip.append(tile);
  });
}

function renderBits(low32) {
  const bits = bitString(low32);
  els.bitGrid.innerHTML = "";

  Array.from(bits).forEach((bit, index) => {
    const cell = document.createElement("span");
    cell.className = `bit${bit === "1" ? " on" : ""}`;
    cell.textContent = bit;
    cell.title = `bit ${31 - index}`;
    els.bitGrid.append(cell);
  });
}

function sampleHashes(activeLow32) {
  const baseList = samples.map((sample) => {
    const low32 = hashSteps(sample).low32;
    return { sample, low32, bucket: bucketFor(low32) };
  });

  baseList.push({
    sample: state.text || "empty",
    low32: activeLow32,
    bucket: bucketFor(activeLow32),
    current: true,
  });

  return baseList;
}

function renderBuckets(activeBucket, activeLow32) {
  const data = sampleHashes(activeLow32);
  const grouped = Array.from({ length: BUCKETS }, (_, index) => ({
    index,
    items: data.filter((item) => item.bucket === index),
  }));
  const maxCount = Math.max(1, ...grouped.map((bucket) => bucket.items.length));
  els.bucketGrid.innerHTML = "";

  grouped.forEach((bucket) => {
    const node = document.createElement("div");
    node.className = `bucket${bucket.index === activeBucket ? " active" : ""}`;
    const currentItem = bucket.items.find((item) => item.current);
    const label = currentItem ? `"${trimLabel(currentItem.sample)}"` : `${bucket.items.length} key`;
    const fillHeight = 14 + (bucket.items.length / maxCount) * 58;
    node.innerHTML = `
      <strong>#${bucket.index}</strong>
      <div class="bucket-label">${escapeHtml(label)}</div>
      <div class="bucket-fill" style="height: ${fillHeight}px"></div>
    `;
    els.bucketGrid.append(node);
  });
}

function renderCompare(baseLow32) {
  const other = hashSteps(state.compareText).low32;
  const distance = hammingDistance(baseLow32, other);
  els.baseCompareHash.textContent = hex32(baseLow32);
  els.otherCompareHash.textContent = hex32(other);
  els.bitDistance.textContent = `${distance}/32`;
  els.distanceBar.style.width = `${(distance / 32) * 100}%`;
}

function render() {
  const result = hashSteps(state.text);
  const algorithm = algorithms[state.algorithm];
  const shownStep = result.steps[state.step - 1];
  const currentValue = shownStep ? shownStep.value : algorithm.seed;
  const low32 = algorithm.low32(currentValue);
  const bucket = bucketFor(low32);
  const total = result.chars.length;

  els.stepSlider.max = String(total);
  els.stepSlider.value = String(state.step);
  els.stepLabel.textContent = `${state.step}/${total}`;
  els.algorithmFormula.textContent = algorithm.formula;
  els.shortHash.textContent = hex32(low32);
  els.currentChar.textContent = shownStep ? shownStep.char : "--";
  els.currentCode.textContent = shownStep ? shownStep.code : "--";
  els.currentState.textContent = algorithm.display(currentValue);
  els.stepFormula.textContent = shownStep
    ? shownStep.line
    : `Seed: h = ${algorithm.display(algorithm.seed)}\nChưa xử lý ký tự nào.`;
  els.hexHash.textContent = hex32(low32);
  els.bucketIndex.textContent = String(bucket);
  els.lengthMetric.textContent = String(total);

  renderCharacters(result);
  renderBits(low32);
  renderBuckets(bucket, low32);
  renderCompare(result.low32);

  els.prevBtn.disabled = state.step === 0;
  els.nextBtn.disabled = state.step === total;
  if (state.step === total) stopPlayback();
}

function trimLabel(value) {
  return value.length > 9 ? `${value.slice(0, 8)}…` : value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.textInput.addEventListener("input", (event) => {
  state.text = event.target.value;
  state.step = Math.min(state.step, charsOf(state.text).length);
  render();
});

els.compareInput.addEventListener("input", (event) => {
  state.compareText = event.target.value;
  render();
});

els.algorithm.addEventListener("change", (event) => {
  state.algorithm = event.target.value;
  render();
});

els.stepSlider.addEventListener("input", (event) => {
  stopPlayback();
  setStep(Number(event.target.value));
});

els.prevBtn.addEventListener("click", () => {
  stopPlayback();
  setStep(state.step - 1);
});

els.nextBtn.addEventListener("click", () => {
  stopPlayback();
  setStep(state.step + 1);
});

els.resetBtn.addEventListener("click", () => {
  stopPlayback();
  state.step = 0;
  render();
});

els.playBtn.addEventListener("click", () => {
  if (state.timer) {
    stopPlayback();
    return;
  }

  const total = charsOf(state.text).length;
  if (state.step >= total) state.step = 0;
  els.playBtn.textContent = "Dừng";
  state.timer = window.setInterval(() => {
    setStep(state.step + 1);
  }, 720);
  render();
});

render();
