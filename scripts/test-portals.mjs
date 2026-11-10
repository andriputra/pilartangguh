import assert from "node:assert/strict";
import test from "node:test";
import { parsePortalInput } from "../src/lib/portals.ts";

const valid = {
  title: "Portal uji",
  description: "Deskripsi portal",
  image: "/images/portal-rw-caper.webp",
  imageAlt: "Kolase podcast RW Caper",
  url: "https://example.test/portal",
  status: "ONLINE",
  order: 0,
  number: 1,
  published: true,
  dark: false,
  tag: "Podcast",
  youtubeChannelId: "UC-test",
};

test("portal fields round-trip without dropping image, alt, or ordering", () => {
  assert.deepEqual(parsePortalInput(valid), valid);
  assert.deepEqual(parsePortalInput({ imageAlt: "  Alt baru  ", order: 3 }), { imageAlt: "Alt baru", order: 3 });
  assert.deepEqual(parsePortalInput({ description: "", youtubeChannelId: null }), { description: "", youtubeChannelId: null });
});

test("explicit image removal remains distinct from an unconfigured image", () => {
  assert.deepEqual(parsePortalInput({ image: null, imageAlt: null, url: "" }), { image: "", imageAlt: null, url: null });
  assert.deepEqual(parsePortalInput({ image: "" }), { image: "" });
  assert.deepEqual(parsePortalInput({}), {});
});

test("portal input rejects malformed bodies, unsafe links, and invalid values", () => {
  for (const body of [
    null, [], "text", 42, { title: " " }, { title: null }, { description: null },
    { image: "javascript:alert(1)" }, { image: "data:image/svg+xml,test" },
    { image: "//example.test/image.webp" }, { image: "/uploads/../private.png" },
    { url: "javascript:alert(1)" }, { url: "https://user:pass@example.test" },
    { imageAlt: "x".repeat(301) }, { status: "INVALID" },
    { order: -1 }, { order: 1.5 }, { order: "1" }, { order: 2147483648 },
    { number: 0 }, { published: "false" }, { dark: 1 },
  ]) {
    const response = parsePortalInput(body);
    assert.ok(response instanceof Response, JSON.stringify(body));
    assert.equal(response.status, 400, JSON.stringify(body));
  }
});

test("portal image paths support uploads and public http images", () => {
  for (const image of ["/uploads/123-abcd.webp", "/images/portal-rw-caper.webp", "https://example.test/image.png"]) {
    assert.deepEqual(parsePortalInput({ image }), { image });
  }
});
