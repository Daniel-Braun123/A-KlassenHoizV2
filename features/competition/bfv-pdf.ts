import "server-only";

import { ApplicationError } from "@/lib/actions/errors";
import { parseBfvSchedulePages } from "./bfv-parser-core";
import type { BfvScheduleDocument } from "./bfv-import-types";

const MAX_PDF_BYTES = 5 * 1024 * 1024;
const MAX_PAGES = 40;
const MATCH_NUMBER_PATTERN = /^\d{3,}$/;

type PdfTextItem = Readonly<{ fontName?: string; str?: string }>;

function validatePdfBytes(file: File, bytes: Uint8Array): void {
  if (!file.name.toLocaleLowerCase("de-DE").endsWith(".pdf")) {
    throw new ApplicationError("INVALID_INPUT", "Bitte eine PDF-Datei auswählen.");
  }
  if (!bytes.length || bytes.length > MAX_PDF_BYTES) {
    throw new ApplicationError("INVALID_INPUT", "Die BFV-PDF darf höchstens 5 MB groß sein.");
  }
  const header = new TextDecoder("ascii").decode(bytes.subarray(0, 5));
  if (header !== "%PDF-") {
    throw new ApplicationError("INVALID_INPUT", "Die ausgewählte Datei ist keine gültige PDF.");
  }
}

export async function parseBfvSchedulePdf(file: File): Promise<BfvScheduleDocument> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  validatePdfBytes(file, bytes);
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);

  try {
    if (pdf.numPages < 1 || pdf.numPages > MAX_PAGES) {
      throw new ApplicationError(
        "INVALID_INPUT",
        `Die BFV-PDF muss zwischen 1 und ${MAX_PAGES} Seiten enthalten.`,
      );
    }
    const [{ text }, matchNumberFonts] = await Promise.all([
      extractText(pdf),
      (async () => {
        const entries: Array<{ fontName: string; sourceMatchNumber: string }> = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          for (const rawItem of content.items as PdfTextItem[]) {
            const sourceMatchNumber = rawItem.str?.trim();
            if (
              sourceMatchNumber &&
              rawItem.fontName &&
              MATCH_NUMBER_PATTERN.test(sourceMatchNumber)
            ) {
              entries.push({ fontName: rawItem.fontName, sourceMatchNumber });
            }
          }
        }
        return entries;
      })(),
    ]);

    const fontCounts = new Map<string, number>();
    for (const entry of matchNumberFonts) {
      fontCounts.set(entry.fontName, (fontCounts.get(entry.fontName) ?? 0) + 1);
    }
    const primaryFont = [...fontCounts.entries()].toSorted(
      (left, right) => right[1] - left[1],
    )[0]?.[0];
    const changedIds = new Set(
      primaryFont
        ? matchNumberFonts
            .filter((entry) => entry.fontName !== primaryFont)
            .map((entry) => entry.sourceMatchNumber)
        : [],
    );
    return parseBfvSchedulePages(text, changedIds);
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    throw new ApplicationError("INVALID_INPUT", "Die BFV-PDF konnte nicht gelesen werden.", {
      cause: error,
    });
  } finally {
    await pdf.cleanup();
  }
}
