"use client";

import {
  useId,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from "react";

import { ClubLogo } from "@/components/competition/club-logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  removeLogoBackground,
  type LogoBackgroundResult,
} from "@/features/competition/logo-background";
import type { ClubLogoMode } from "@/features/competition/types";

const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_STORED_BYTES = 2 * 1024 * 1024;
const MAX_LOGO_EDGE = 512;

type DecodedImage = Readonly<{
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
}>;

function acceptsLogo(file: File): boolean {
  return ACCEPTED_LOGO_TYPES.some((type) => type === file.type);
}

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      dispose: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image decoding failed"));
  });
  image.src = objectUrl;
  await loaded;
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    dispose: () => URL.revokeObjectURL(objectUrl),
  };
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
}

type PreparedLogo = Readonly<{
  background: LogoBackgroundResult | null;
  file: File;
  transparentFile: File | null;
}>;

async function optimizeLogo(file: File, checkBackground: boolean): Promise<PreparedLogo> {
  if (!acceptsLogo(file)) throw new Error("Verwende ein PNG-, JPEG- oder WebP-Bild.");
  if (file.size > MAX_SOURCE_BYTES)
    throw new Error("Das Ausgangsbild darf maximal 5 MB groß sein.");

  let decoded: DecodedImage | null = null;
  try {
    decoded = await decodeImage(file);
    if (decoded.width < 1 || decoded.height < 1) throw new Error("Das Bild ist leer.");
    const scale = Math.min(1, MAX_LOGO_EDGE / decoded.width, MAX_LOGO_EDGE / decoded.height);
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Das Bild konnte nicht vorbereitet werden.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(decoded.source, 0, 0, width, height);
    const blob = await canvasBlob(canvas);
    if (!blob) throw new Error("Das Bild konnte nicht als WebP gespeichert werden.");
    if (blob.size > MAX_STORED_BYTES) throw new Error("Das optimierte Bild ist größer als 2 MB.");
    const baseName = file.name.replace(/\.[^.]+$/, "").trim() || "vereinslogo";
    let background: LogoBackgroundResult | null = null;
    let transparentFile: File | null = null;
    if (checkBackground) {
      background = "uncertain";
      try {
        const pixels = context.getImageData(0, 0, width, height);
        background = removeLogoBackground(pixels);
        if (background === "removed") {
          context.putImageData(pixels, 0, 0);
          const transparentBlob = await canvasBlob(canvas);
          if (!transparentBlob || transparentBlob.size > MAX_STORED_BYTES) {
            background = "uncertain";
          } else {
            transparentFile = new File([transparentBlob], `${baseName}.webp`, {
              type: "image/webp",
            });
          }
        }
      } catch {
        background = "uncertain";
      }
    }
    return {
      background,
      file: new File([blob], `${baseName}.webp`, { type: "image/webp" }),
      transparentFile,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Das ")) throw error;
    throw new Error("Das Bild konnte nicht gelesen werden.");
  } finally {
    decoded?.dispose();
  }
}

function assignInputFile(input: HTMLInputElement, file: File): void {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}

export function ClubLogoField({
  allowBackgroundRemoval = false,
  initialLogoPath = null,
  initialLogoUrl = null,
  name,
  onBusyChange,
}: Readonly<{
  allowBackgroundRemoval?: boolean;
  initialLogoPath?: string | null;
  initialLogoUrl?: string | null;
  name: string;
  onBusyChange?: (busy: boolean) => void;
}>) {
  const generatedId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingIdRef = useRef(0);
  const initialMode: ClubLogoMode = initialLogoPath ? "upload" : initialLogoUrl ? "url" : "upload";
  const [mode, setMode] = useState<ClubLogoMode>(initialMode);
  const [url, setUrl] = useState(initialLogoUrl ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preparedLogo, setPreparedLogo] = useState<PreparedLogo | null>(null);
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundResult, setBackgroundResult] = useState<LogoBackgroundResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const fieldId = `club-logo-${generatedId.replace(/:/g, "")}`;

  useEffect(
    () => () => {
      if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    },
    [selectedPreview],
  );

  async function prepareFile(file: File): Promise<void> {
    const processingId = processingIdRef.current + 1;
    processingIdRef.current = processingId;
    setError(null);
    setProcessing(true);
    onBusyChange?.(true);
    try {
      const prepared = await optimizeLogo(file, allowBackgroundRemoval);
      if (processingId !== processingIdRef.current) return;
      if (fileInputRef.current) assignInputFile(fileInputRef.current, prepared.file);
      if (selectedPreview) URL.revokeObjectURL(selectedPreview);
      setSelectedFile(prepared.file);
      setPreparedLogo(prepared);
      setBackgroundRemoved(false);
      setSelectedPreview(URL.createObjectURL(prepared.file));
      setBackgroundResult(prepared.background);
      setMode("upload");
    } catch (caught) {
      if (processingId === processingIdRef.current) {
        setError(
          caught instanceof Error ? caught.message : "Das Bild konnte nicht verarbeitet werden.",
        );
        if (fileInputRef.current) {
          if (selectedFile) assignInputFile(fileInputRef.current, selectedFile);
          else fileInputRef.current.value = "";
        }
      }
    } finally {
      if (processingId === processingIdRef.current) {
        setProcessing(false);
        onBusyChange?.(false);
      }
    }
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.currentTarget.files?.[0];
    if (file) void prepareFile(file);
  }

  function dropFile(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void prepareFile(file);
  }

  function pasteFile(event: ClipboardEvent<HTMLDivElement>): void {
    const file = Array.from(event.clipboardData.items)
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))
      ?.getAsFile();
    if (!file) return;
    event.preventDefault();
    void prepareFile(file);
  }

  function clearSelectedFile(): void {
    processingIdRef.current += 1;
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    setSelectedFile(null);
    setPreparedLogo(null);
    setBackgroundRemoved(false);
    setSelectedPreview(null);
    setError(null);
    setBackgroundResult(null);
    setProcessing(false);
    onBusyChange?.(false);
  }

  function toggleBackground(): void {
    if (processing || !preparedLogo?.transparentFile || !fileInputRef.current) return;
    const file = backgroundRemoved ? preparedLogo.file : preparedLogo.transparentFile;
    assignInputFile(fileInputRef.current, file);
    setSelectedFile(file);
    setSelectedPreview(URL.createObjectURL(file));
    setBackgroundRemoved(!backgroundRemoved);
  }

  const previewUrl =
    mode === "none"
      ? null
      : mode === "url"
        ? /^https:\/\/.+/.test(url.trim())
          ? url.trim()
          : null
        : selectedPreview || initialLogoUrl;

  return (
    <fieldset className="club-logo-field">
      <legend>Vereinslogo</legend>
      <div className="club-logo-field__choices">
        {(
          [
            ["upload", "Bild hochladen"],
            ["url", "Bild-URL"],
            ["none", "Kein Logo"],
          ] as const
        ).map(([value, label]) => (
          <label key={value}>
            <input
              checked={mode === value}
              name="logoMode"
              onChange={() => setMode(value)}
              type="radio"
              value={value}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      {mode === "upload" ? (
        <div className="field club-logo-upload">
          <span className="field__label" id={`${fieldId}-label`}>
            Bilddatei
          </span>
          <p className="field__hint" id={`${fieldId}-hint`}>
            PNG, JPEG oder WebP bis 5 MB. Das Bild wird auf maximal 512 Pixel verkleinert und als
            WebP gespeichert.
          </p>
          <input
            ref={(input) => {
              fileInputRef.current = input;
              if (input && selectedFile) assignInputFile(input, selectedFile);
            }}
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            aria-describedby={`${fieldId}-hint${error ? ` ${fieldId}-error` : ""}${backgroundResult === "uncertain" ? ` ${fieldId}-background-warning` : ""}`}
            aria-labelledby={`${fieldId}-label`}
            className="visually-hidden"
            name="logo"
            onChange={selectFile}
            type="file"
          />
          <div
            className="club-logo-dropzone"
            data-dragging={isDragging || undefined}
            data-has-file={Boolean(selectedFile) || undefined}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDragging(false);
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={dropFile}
            onPaste={pasteFile}
            tabIndex={0}
          >
            {selectedFile ? (
              <div className="club-logo-dropzone__selected">
                <ClubLogo
                  className="club-logo-dropzone__preview"
                  logoUrl={selectedPreview}
                  name={name}
                  size={56}
                />
                <span>
                  <strong>{selectedFile.name}</strong>
                  <small>
                    {formatFileSize(selectedFile.size)} ·{" "}
                    {backgroundRemoved
                      ? "Hintergrund entfernt"
                      : backgroundResult === "already-transparent"
                        ? "Transparenz erkannt"
                        : "Original wird verwendet"}
                  </small>
                </span>
                <Button onClick={clearSelectedFile} type="button" variant="ghost">
                  Entfernen
                </Button>
              </div>
            ) : (
              <div className="club-logo-dropzone__empty">
                <span className="club-logo-dropzone__icon" aria-hidden="true">
                  <Icon name="image" />
                </span>
                <span>
                  <strong>{processing ? "Bild wird vorbereitet …" : "Logo hier ablegen"}</strong>
                  <small>oder Screenshot mit Strg + V einfügen</small>
                </span>
                <Button
                  disabled={processing}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  variant="secondary"
                >
                  Datei auswählen
                </Button>
              </div>
            )}
          </div>
          {error ? (
            <p className="field__error" id={`${fieldId}-error`} role="alert">
              {error}
            </p>
          ) : null}
          {backgroundResult === "uncertain" ? (
            <p
              className="club-logo-field__warning"
              id={`${fieldId}-background-warning`}
              role="status"
            >
              Der Hintergrund kann nicht sicher entfernt werden. Du kannst das Original verwenden.
            </p>
          ) : null}
        </div>
      ) : null}

      {mode === "url" ? (
        <div className="field">
          <label className="field__label" htmlFor={`${fieldId}-url`}>
            Logo-URL <span aria-hidden="true">*</span>
          </label>
          <p className="field__hint" id={`${fieldId}-url-hint`}>
            Direkte HTTPS-Adresse zu einer PNG-, JPEG- oder WebP-Datei.
          </p>
          <input
            aria-describedby={`${fieldId}-url-hint`}
            autoComplete="url"
            className="field__control"
            id={`${fieldId}-url`}
            maxLength={2048}
            name="logoUrl"
            onChange={(event) => setUrl(event.currentTarget.value)}
            placeholder="https://…"
            required
            type="url"
            value={url}
          />
        </div>
      ) : null}

      {allowBackgroundRemoval && mode === "upload" ? (
        <div className="club-logo-field__background-actions">
          <Button
            aria-describedby={`${fieldId}-background-hint`}
            disabled={processing || !preparedLogo?.transparentFile}
            onClick={toggleBackground}
            type="button"
            variant="secondary"
          >
            {backgroundRemoved ? "Rückgängig" : "Hintergrund entfernen"}
          </Button>
          <p className="field__hint" id={`${fieldId}-background-hint`}>
            {processing
              ? "Bild wird geprüft …"
              : backgroundRemoved
                ? "Mit Rückgängig stellst du das Original wieder her."
                : backgroundResult === "already-transparent"
                  ? "Das Logo hat bereits einen transparenten Hintergrund."
                  : !selectedFile
                    ? "Füge zuerst ein Logo hinzu."
                    : backgroundResult === "removed"
                      ? "Ein einfarbiger Hintergrund wurde erkannt."
                      : "Für dieses Bild nicht verfügbar."}
          </p>
        </div>
      ) : null}

      <div className="club-logo-field__preview" aria-live="polite">
        <ClubLogo
          className={`club-logo-field__preview-image${selectedPreview ? " club-logo-field__preview-image--processed" : ""}`}
          logoPath={mode === "upload" && !selectedPreview ? initialLogoPath : null}
          logoUrl={previewUrl}
          name={name}
          size={48}
        />
        <span>
          <strong>Vorschau</strong>
          <small>
            {mode === "upload" &&
            selectedPreview &&
            (backgroundRemoved || backgroundResult === "already-transparent")
              ? "Transparenter Hintergrund wird gespeichert"
              : mode === "upload" && selectedPreview
                ? "Originalbild wird gespeichert"
                : previewUrl || (mode === "upload" && initialLogoPath)
                  ? "Logo ausgewählt"
                  : "Initialen werden als Platzhalter angezeigt"}
          </small>
        </span>
      </div>
    </fieldset>
  );
}
