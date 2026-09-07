import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ClubLogoField } from "@/components/competition/club-logo-field";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockImageUpload(transparent = false) {
  const pixels = new Uint8ClampedArray(16 * 16 * 4).fill(255);
  for (let y = 4; y < 12; y += 1) {
    for (let x = 4; x < 12; x += 1) {
      const offset = (y * 16 + x) * 4;
      pixels[offset] = 180;
      pixels[offset + 1] = 0;
      pixels[offset + 2] = 0;
    }
  }
  if (transparent) {
    for (let x = 0; x < 16; x += 1) {
      pixels[x * 4 + 3] = 0;
      pixels[(15 * 16 + x) * 4 + 3] = 0;
    }
  }
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ width: 16, height: 16, close: vi.fn() }),
  );
  vi.stubGlobal(
    "DataTransfer",
    class {
      files: File[] = [];
      items = { add: (file: File) => this.files.push(file) };
    },
  );
  let urlNumber = 0;
  vi.spyOn(URL, "createObjectURL").mockImplementation(() => `blob:logo-${++urlNumber}`);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  const getImageData = vi.fn(() => ({ data: pixels.slice(), width: 16, height: 16 }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
    getImageData,
    putImageData: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  let encoded = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
    callback(new Blob([`image-${++encoded}`], { type: "image/webp" }));
  });
  return { getImageData };
}

async function uploadLogo(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, "files", { writable: true, configurable: true, value: [] });
  fireEvent.change(input, {
    target: { files: [new File(["image"], "logo.png", { type: "image/png" })] },
  });
  await screen.findByText("logo.webp");
  return input;
}

describe("ClubLogoField", () => {
  it("übernimmt Transparenz erst nach Klick und stellt beim Rückgängigmachen die Originaldatei wieder her", async () => {
    mockImageUpload();
    const { container } = render(<ClubLogoField allowBackgroundRemoval name="Testverein" />);
    expect(screen.getByRole("button", { name: "Hintergrund entfernen" })).toBeDisabled();
    const input = await uploadLogo(container);
    const original = input.files![0];
    const originalPreview = container
      .querySelector(".club-logo-field__preview img")!
      .getAttribute("src");
    expect(screen.getByText("Originalbild wird gespeichert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hintergrund entfernen" }));
    expect(input.files![0]).not.toBe(original);
    expect(container.querySelector(".club-logo-field__preview img")).not.toHaveAttribute(
      "src",
      originalPreview,
    );
    expect(screen.getByText("Transparenter Hintergrund wird gespeichert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Rückgängig" }));
    expect(input.files![0]).toBe(original);
    expect(screen.getByText("Originalbild wird gespeichert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hintergrund entfernen" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Entfernen" }));
    expect(screen.getByRole("button", { name: "Hintergrund entfernen" })).toBeDisabled();
  });

  it("deaktiviert die Entfernung bei bereits transparenten Bildern", async () => {
    mockImageUpload(true);
    const { container } = render(<ClubLogoField allowBackgroundRemoval name="Testverein" />);
    await uploadLogo(container);
    expect(screen.getByRole("button", { name: "Hintergrund entfernen" })).toBeDisabled();
    expect(
      screen.getByText("Das Logo hat bereits einen transparenten Hintergrund."),
    ).toBeInTheDocument();
  });

  it("behält bei nicht sicher entfernbaren Hintergründen das Original und zeigt einen Hinweis", async () => {
    const { getImageData } = mockImageUpload();
    getImageData.mockImplementation(() => {
      throw new Error("Pixel access denied");
    });
    const { container } = render(<ClubLogoField allowBackgroundRemoval name="Testverein" />);
    await uploadLogo(container);
    expect(screen.getByRole("button", { name: "Hintergrund entfernen" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Der Hintergrund kann nicht sicher entfernt werden.",
    );
    expect(screen.getByText("Originalbild wird gespeichert")).toBeInTheDocument();
  });

  it("prüft und entfernt beim Bearbeiten keinen Hintergrund", async () => {
    const { getImageData } = mockImageUpload();
    const { container } = render(<ClubLogoField name="Bestehender Verein" />);
    await uploadLogo(container);
    expect(getImageData).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Hintergrund entfernen" })).not.toBeInTheDocument();
    expect(screen.getByText("Originalbild wird gespeichert")).toBeInTheDocument();
  });

  it("setzt die Bearbeitung bei einer neuen Datei zurück", async () => {
    mockImageUpload();
    const { container } = render(<ClubLogoField allowBackgroundRemoval name="Testverein" />);
    const input = await uploadLogo(container);
    fireEvent.click(screen.getByRole("button", { name: "Hintergrund entfernen" }));
    fireEvent.change(input, {
      target: { files: [new File(["new"], "neu.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(screen.getByText("neu.webp")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Rückgängig" })).not.toBeInTheDocument();
    expect(screen.getByText("Originalbild wird gespeichert")).toBeInTheDocument();
  });

  it("bietet Upload, URL und einen Initialen-Fallback als klare Quellen an", () => {
    const { container } = render(<ClubLogoField name="SV Beispiel" />);

    expect(screen.getByRole("radio", { name: "Bild hochladen" })).toBeChecked();
    expect(screen.getByText("Logo hier ablegen")).toBeInTheDocument();
    expect(screen.getByText(/Strg \+ V/)).toBeInTheDocument();
    expect(
      container.querySelector(".club-logo-field__preview .club-logo--fallback"),
    ).toHaveTextContent("SB");
  });

  it("zeigt eine eingegebene HTTPS-Adresse unmittelbar in der Vorschau", () => {
    const { container } = render(<ClubLogoField name="FC Vorschau" />);

    fireEvent.click(screen.getByRole("radio", { name: "Bild-URL" }));
    const urlInput = screen.getByRole("textbox", { name: "Logo-URL" });
    fireEvent.change(urlInput, { target: { value: "https://example.test/logo.webp" } });

    expect(urlInput).toBeRequired();
    expect(container.querySelector(".club-logo-field__preview img")).toHaveAttribute(
      "src",
      "https://example.test/logo.webp",
    );
  });

  it("kann ein bestehendes Logo bewusst entfernen", () => {
    const { container } = render(
      <ClubLogoField initialLogoUrl="https://example.test/logo.webp" name="TSV Beispiel" />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Kein Logo" }));

    expect(container.querySelector(".club-logo-field__preview img")).not.toBeInTheDocument();
    expect(
      container.querySelector(".club-logo-field__preview .club-logo--fallback"),
    ).toHaveTextContent("TB");
    expect(screen.getByText("Initialen werden als Platzhalter angezeigt")).toBeInTheDocument();
  });
});
