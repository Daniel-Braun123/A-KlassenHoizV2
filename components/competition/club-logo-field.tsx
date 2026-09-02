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

async function optimizeLogo(file: File): Promise<File> {
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
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Das Bild konnte nicht vorbereitet werden.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(decoded.source, 0, 0, width, height);
    const blob = await canvasBlob(canvas);
    if (!blob) throw new Error("Das Bild konnte nicht als WebP gespeichert werden.");
    if (blob.size > MAX_STORED_BYTES) throw new Error("Das optimierte Bild ist größer als 2 MB.");
    const baseName = file.name.replace(/\.[^.]+$/, "").trim() || "vereinslogo";
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
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
  initialLogoPath = null,
  initialLogoUrl = null,
  name,
  onBusyChange,
}: Readonly<{
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
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const optimized = await optimizeLogo(file);
      if (processingId !== processingIdRef.current) return;
      if (fileInputRef.current) assignInputFile(fileInputRef.current, optimized);
      if (selectedPreview) URL.revokeObjectURL(selectedPreview);
      setSelectedFile(optimized);
      setSelectedPreview(URL.createObjectURL(optimized));
      setMode("upload");
    } catch (caught) {
      if (processingId === processingIdRef.current) {
        setError(
          caught instanceof Error ? caught.message : "Das Bild konnte nicht verarbeitet werden.",
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
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
    setSelectedPreview(null);
    setError(null);
    setProcessing(false);
    onBusyChange?.(false);
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
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            aria-describedby={`${fieldId}-hint${error ? ` ${fieldId}-error` : ""}`}
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
                  <small>{formatFileSize(selectedFile.size)} · für den Upload vorbereitet</small>
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

      <div className="club-logo-field__preview" aria-live="polite">
        <ClubLogo
          className="club-logo-field__preview-image"
          logoPath={mode === "upload" && !selectedPreview ? initialLogoPath : null}
          logoUrl={previewUrl}
          name={name}
          size={48}
        />
        <span>
          <strong>Vorschau</strong>
          <small>
            {previewUrl || (mode === "upload" && initialLogoPath)
              ? "Logo ausgewählt"
              : "Initialen werden als Platzhalter angezeigt"}
          </small>
        </span>
      </div>
    </fieldset>
  );
}
