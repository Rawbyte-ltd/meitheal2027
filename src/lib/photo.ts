/**
 * Every photograph is decoded and re-encoded on the server before it is stored. Re-encoding keeps the pixels and drops
 * everything else: EXIF, GPS, XMP, IPTC, camera serials, embedded thumbnails. A phone photo taken at home carries the
 * home's coordinates, and the site promises a townland, never an address (About; docs/data-protection.md §5). The
 * Android app and a failed shrink in the web form both send the original file, so the server is the one place to do it.
 *
 * A file that is not really an image fails to decode and is refused.
 */
export async function cleanPhoto(input: Buffer): Promise<{ buf: Buffer; mime: "image/jpeg" }> {
  const sharp = (await import("sharp")).default;
  const buf = await sharp(input, { failOn: "error" })
    .rotate() // apply the EXIF orientation to the pixels before the tag is dropped
    .flatten({ background: "#ffffff" }) // a transparent PNG becomes white, not black, as a JPEG
    .resize(1800, 1800, { fit: "inside", withoutEnlargement: true }) // the size the web form and the app shrink to
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  return { buf, mime: "image/jpeg" };
}
