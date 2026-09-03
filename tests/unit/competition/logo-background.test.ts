import { describe, expect, it } from "vitest";

import { removeLogoBackground } from "@/features/competition/logo-background";

function image(rows: ReadonlyArray<ReadonlyArray<readonly [number, number, number, number]>>) {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  return {
    data: new Uint8ClampedArray(rows.flat(2)),
    width,
    height,
  };
}

const white = [255, 255, 255, 255] as const;
const red = [220, 20, 20, 255] as const;
const transparent = [0, 0, 0, 0] as const;

describe("removeLogoBackground", () => {
  it("entfernt nur den einfarbigen, mit dem Rand verbundenen Hintergrund", () => {
    const pixels = image([
      [white, white, white, white, white],
      [white, red, red, red, white],
      [white, red, white, red, white],
      [white, red, red, red, white],
      [white, white, white, white, white],
    ]);

    expect(removeLogoBackground(pixels)).toBe("removed");
    expect(pixels.data[3]).toBe(0);
    expect(pixels.data[(2 * 5 + 2) * 4 + 3]).toBe(255);
  });

  it("belässt ein bereits freigestelltes Logo unverändert", () => {
    const pixels = image([
      [transparent, transparent, transparent],
      [transparent, red, transparent],
      [transparent, transparent, transparent],
    ]);
    const original = new Uint8ClampedArray(pixels.data);

    expect(removeLogoBackground(pixels)).toBe("already-transparent");
    expect(pixels.data).toEqual(original);
  });

  it("verwendet bei einem uneinheitlichen Rand sicherheitshalber das Original", () => {
    const blue = [20, 60, 220, 255] as const;
    const green = [20, 180, 70, 255] as const;
    const pixels = image([
      [white, red, blue],
      [green, red, white],
      [blue, green, red],
    ]);
    const original = new Uint8ClampedArray(pixels.data);

    expect(removeLogoBackground(pixels)).toBe("uncertain");
    expect(pixels.data).toEqual(original);
  });

  it("löscht kein vollständig einfarbiges Bild", () => {
    const pixels = image(Array.from({ length: 5 }, () => Array(5).fill(white)));
    const original = new Uint8ClampedArray(pixels.data);

    expect(removeLogoBackground(pixels)).toBe("uncertain");
    expect(pixels.data).toEqual(original);
  });
});
