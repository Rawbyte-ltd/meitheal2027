import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { cleanPhoto } from "../src/lib/photo.ts";

// A phone photo taken at home: GPS in the EXIF, plus a camera make and an orientation tag.
async function phonePhoto(): Promise<Buffer> {
  return sharp({ create: { width: 40, height: 20, channels: 3, background: "#808080" } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .withExif({ IFD0: { Make: "TestPhone" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "54/1 3/1 0/1", GPSLongitudeRef: "W", GPSLongitude: "7/1 21/1 0/1" } })
    .toBuffer();
}

test("the fixture really carries GPS, so the test can fail", async () => {
  const meta = await sharp(await phonePhoto()).metadata();
  assert.ok(meta.exif, "fixture has EXIF");
  assert.match(meta.exif!.toString("latin1"), /TestPhone/);
  assert.equal(meta.orientation, 6);
});

test("cleanPhoto drops EXIF, GPS and every other metadata block", async () => {
  const { buf, mime } = await cleanPhoto(await phonePhoto());
  const meta = await sharp(buf).metadata();
  assert.equal(mime, "image/jpeg");
  assert.equal(meta.format, "jpeg");
  assert.equal(meta.exif, undefined);
  assert.equal(meta.xmp, undefined);
  assert.equal(meta.iptc, undefined);
  assert.ok(!buf.toString("latin1").includes("TestPhone"));
});

test("cleanPhoto turns the photo upright before dropping the orientation tag", async () => {
  const { buf } = await cleanPhoto(await phonePhoto());
  const meta = await sharp(buf).metadata();
  assert.equal(meta.width, 20); // orientation 6 is a 90° turn: 40×20 becomes 20×40
  assert.equal(meta.height, 40);
});

test("cleanPhoto refuses a file that is not an image", async () => {
  await assert.rejects(cleanPhoto(Buffer.from("#EXTM3U\nfile:///etc/passwd\n")));
});

test("cleanPhoto shrinks a large photo to 1800px on the long side", async () => {
  const big = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#336699" } }).jpeg().toBuffer();
  const meta = await sharp((await cleanPhoto(big)).buf).metadata();
  assert.equal(Math.max(meta.width!, meta.height!), 1800);
});
