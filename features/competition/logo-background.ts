export type LogoPixelBuffer = Readonly<{
  data: Uint8ClampedArray;
  width: number;
  height: number;
}>;

export type LogoBackgroundResult = "already-transparent" | "removed" | "uncertain";

const TRANSPARENT_ALPHA = 24;
const OPAQUE_ALPHA = 200;
const COLOR_BUCKET_SIZE = 24;
const INITIAL_COLOR_TOLERANCE = 36;
const MIN_BORDER_COVERAGE = 0.68;

type ColorSample = Readonly<{ red: number; green: number; blue: number }>;
type ColorBucket = { count: number; red: number; green: number; blue: number };

function pixelOffset(pixelIndex: number): number {
  return pixelIndex * 4;
}

function colorDistance(data: Uint8ClampedArray, offset: number, color: ColorSample): number {
  return Math.max(
    Math.abs((data[offset] ?? 0) - color.red),
    Math.abs((data[offset + 1] ?? 0) - color.green),
    Math.abs((data[offset + 2] ?? 0) - color.blue),
  );
}

function borderPixelIndices(width: number, height: number): number[] {
  const indices: number[] = [];
  for (let x = 0; x < width; x += 1) indices.push(x);
  if (height > 1) {
    const bottomRow = (height - 1) * width;
    for (let x = 0; x < width; x += 1) indices.push(bottomRow + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    indices.push(y * width);
    if (width > 1) indices.push(y * width + width - 1);
  }
  return indices;
}

function dominantBorderColor(
  data: Uint8ClampedArray,
  border: readonly number[],
): Readonly<{ color: ColorSample; tolerance: number }> | null {
  const buckets = new Map<string, ColorBucket>();
  let opaqueCount = 0;

  for (const pixelIndex of border) {
    const offset = pixelOffset(pixelIndex);
    if ((data[offset + 3] ?? 0) < OPAQUE_ALPHA) continue;
    opaqueCount += 1;
    const red = data[offset] ?? 0;
    const green = data[offset + 1] ?? 0;
    const blue = data[offset + 2] ?? 0;
    const key = `${Math.floor(red / COLOR_BUCKET_SIZE)}:${Math.floor(green / COLOR_BUCKET_SIZE)}:${Math.floor(blue / COLOR_BUCKET_SIZE)}`;
    const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
    bucket.count += 1;
    bucket.red += red;
    bucket.green += green;
    bucket.blue += blue;
    buckets.set(key, bucket);
  }

  if (!opaqueCount) return null;
  const dominant = [...buckets.values()].sort((left, right) => right.count - left.count)[0];
  if (!dominant) return null;
  const initialColor = {
    red: dominant.red / dominant.count,
    green: dominant.green / dominant.count,
    blue: dominant.blue / dominant.count,
  };
  const matchingOffsets = border
    .map(pixelOffset)
    .filter(
      (offset) =>
        (data[offset + 3] ?? 0) >= OPAQUE_ALPHA &&
        colorDistance(data, offset, initialColor) <= INITIAL_COLOR_TOLERANCE,
    );

  if (matchingOffsets.length / opaqueCount < MIN_BORDER_COVERAGE) return null;
  const refinedColor = matchingOffsets.reduce(
    (sum, offset) => ({
      red: sum.red + (data[offset] ?? 0),
      green: sum.green + (data[offset + 1] ?? 0),
      blue: sum.blue + (data[offset + 2] ?? 0),
    }),
    { red: 0, green: 0, blue: 0 },
  );
  const color = {
    red: refinedColor.red / matchingOffsets.length,
    green: refinedColor.green / matchingOffsets.length,
    blue: refinedColor.blue / matchingOffsets.length,
  };
  const distances = matchingOffsets
    .map((offset) => colorDistance(data, offset, color))
    .sort((left, right) => left - right);
  const percentileIndex = Math.min(distances.length - 1, Math.floor(distances.length * 0.95));
  const tolerance = Math.min(52, Math.max(24, (distances[percentileIndex] ?? 0) + 12));
  const consistentBorderPixels = border.filter((pixelIndex) => {
    const offset = pixelOffset(pixelIndex);
    return (
      (data[offset + 3] ?? 0) < OPAQUE_ALPHA || colorDistance(data, offset, color) <= tolerance
    );
  }).length;

  return consistentBorderPixels / border.length >= MIN_BORDER_COVERAGE
    ? { color, tolerance }
    : null;
}

function enqueueMatchingPixel(
  image: LogoPixelBuffer,
  background: Readonly<{ color: ColorSample; tolerance: number }>,
  queue: Int32Array,
  visited: Uint8Array,
  backgroundMask: Uint8Array,
  position: number,
  tail: number,
): number {
  if (position < 0 || position >= visited.length || visited[position]) return tail;
  visited[position] = 1;
  const offset = pixelOffset(position);
  if (
    (image.data[offset + 3] ?? 0) <= TRANSPARENT_ALPHA ||
    colorDistance(image.data, offset, background.color) <= background.tolerance
  ) {
    backgroundMask[position] = 1;
    queue[tail] = position;
    return tail + 1;
  }
  return tail;
}

/**
 * Removes only pixels connected to the image border and only when that border
 * has a confidently uniform color. The buffer is left untouched when the
 * result would be ambiguous or would erase the complete image.
 */
export function removeLogoBackground(image: LogoPixelBuffer): LogoBackgroundResult {
  const { data, width, height } = image;
  if (width < 1 || height < 1 || data.length !== width * height * 4) return "uncertain";

  const border = borderPixelIndices(width, height);
  const transparentBorderPixels = border.filter(
    (pixelIndex) => (data[pixelOffset(pixelIndex) + 3] ?? 0) <= TRANSPARENT_ALPHA,
  ).length;
  const cornerIndices = [0, width - 1, (height - 1) * width, width * height - 1];
  const transparentCorners = cornerIndices.filter(
    (pixelIndex) => (data[pixelOffset(pixelIndex) + 3] ?? 0) <= TRANSPARENT_ALPHA,
  ).length;

  if (transparentCorners >= 3 || transparentBorderPixels / border.length >= 0.35) {
    return "already-transparent";
  }

  const background = dominantBorderColor(data, border);
  if (!background) return "uncertain";

  const pixelCount = width * height;
  const queue = new Int32Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const backgroundMask = new Uint8Array(pixelCount);
  let head = 0;
  let tail = 0;
  for (const pixelIndex of border) {
    tail = enqueueMatchingPixel(
      image,
      background,
      queue,
      visited,
      backgroundMask,
      pixelIndex,
      tail,
    );
  }

  while (head < tail) {
    const position = queue[head] ?? 0;
    head += 1;
    const x = position % width;
    if (x > 0)
      tail = enqueueMatchingPixel(
        image,
        background,
        queue,
        visited,
        backgroundMask,
        position - 1,
        tail,
      );
    if (x + 1 < width)
      tail = enqueueMatchingPixel(
        image,
        background,
        queue,
        visited,
        backgroundMask,
        position + 1,
        tail,
      );
    if (position >= width)
      tail = enqueueMatchingPixel(
        image,
        background,
        queue,
        visited,
        backgroundMask,
        position - width,
        tail,
      );
    if (position + width < pixelCount)
      tail = enqueueMatchingPixel(
        image,
        background,
        queue,
        visited,
        backgroundMask,
        position + width,
        tail,
      );
  }

  let removedOpaquePixels = 0;
  let remainingOpaquePixels = 0;
  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const alpha = data[pixelOffset(pixelIndex) + 3] ?? 0;
    if (alpha <= TRANSPARENT_ALPHA) continue;
    if (backgroundMask[pixelIndex]) removedOpaquePixels += 1;
    else remainingOpaquePixels += 1;
  }

  const minimumRemoval = Math.max(8, Math.floor(border.length * 0.5));
  const minimumForeground = Math.max(8, Math.floor(pixelCount * 0.003));
  if (removedOpaquePixels < minimumRemoval || remainingOpaquePixels < minimumForeground) {
    return "uncertain";
  }

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    if (backgroundMask[pixelIndex]) data[pixelOffset(pixelIndex) + 3] = 0;
  }
  return "removed";
}
