const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = (p) => path.join(root, p);

async function main() {
  fs.mkdirSync(out("public/images/products"), { recursive: true });
  fs.mkdirSync(out("src/app"), { recursive: true });

  const gen = fs.readdirSync(out("vibe_images"));
  const pick = (prefix) => {
    const f = gen.filter((n) => n.startsWith(prefix)).sort().pop();
    if (!f) throw new Error("missing generated image: " + prefix);
    return out(path.join("vibe_images", f));
  };

  const jobs = [
    [pick("hero-jpg"), "public/images/hero.jpg", 1400],
    [pick("helm-jpg"), "public/images/products/helm.jpg", 900],
    [pick("rompi-jpg"), "public/images/products/rompi.jpg", 900],
    [pick("sepatu-jpg"), "public/images/products/sepatu.jpg", 900],
    [pick("sarung-jpg"), "public/images/products/sarung.jpg", 900],
  ];
  for (const [src, dest, width] of jobs) {
    await sharp(src).resize({ width, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(out(dest));
    console.log("->", dest);
  }

  // Favicon + apple icon + logo mark from the official logo (centre square crop)
  const logo = out("assets/logo-source.jpeg");
  const { width, height } = await sharp(logo).metadata();
  const side = Math.min(width, height);
  const extract = { left: Math.round((width - side) / 2), top: Math.round((height - side) / 2), width: side, height: side };
  for (const [dest, size] of [
    ["src/app/icon.png", 64],
    ["src/app/apple-icon.png", 180],
    ["public/images/logo-mark.png", 240],
  ]) {
    await sharp(logo).extract(extract).resize(size, size).png().toFile(out(dest));
    console.log("->", dest);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
