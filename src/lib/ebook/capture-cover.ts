import { COVER_HEIGHT, COVER_WIDTH } from "./cover";

/**
 * Rasterises the off-screen cover node at 2x (1748×2480, A5 at 300 dpi).
 * Runs in the admin browser; `modern-screenshot` is loaded lazily so it never
 * ends up in the server bundle.
 */
export async function captureCoverElement(node: HTMLElement): Promise<File> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForImages(node);

  const { domToBlob } = await import("modern-screenshot");
  const blob = await domToBlob(node, {
    type: "image/jpeg",
    quality: 0.92,
    scale: 2,
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    backgroundColor: "#ffffff",
    timeout: 20000,
  });

  if (!blob) {
    throw new Error("Gagal membuat gambar cover.");
  }
  return new File([blob], `cover-${Date.now()}.jpg`, { type: "image/jpeg" });
}

async function waitForImages(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
  await Promise.all(
    images.map((image) => image.decode?.().catch(() => undefined)),
  );
}
