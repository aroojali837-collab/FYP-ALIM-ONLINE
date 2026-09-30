// Downloads and imports the official Tanzil Uthmani Arabic text plus
// Fateh Muhammad Jalandhry Urdu translation after strict source validation.
// Usage: node database/import-tanzil-quran.js
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ARABIC_URL = "https://tanzil.net/pub/download/index.php";
const URDU_URL = "https://tanzil.net/trans/ur.jalandhry";
const METADATA_URL = "https://tanzil.net/res/text/metadata/quran-data.xml";

function fail(message) { throw new Error(message); }

async function download(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) fail(`Download failed (${response.status}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

function parsePipeRows(buffer, label) {
  // Tanzil's Arabic download includes an attribution block; only numbered ayah rows are parsed.
  return buffer.toString("utf8").split(/\r?\n/).filter((line) => /^\d+\|\d+\|/.test(line)).map((line) => {
    const first = line.indexOf("|");
    const second = line.indexOf("|", first + 1);
    if (first < 1 || second < 0) fail(`Invalid ${label} row: ${line.slice(0, 80)}`);
    const surah = Number(line.slice(0, first));
    const ayah = Number(line.slice(first + 1, second));
    const text = line.slice(second + 1);
    if (!Number.isInteger(surah) || !Number.isInteger(ayah) || !text) fail(`Invalid ${label} text at ${surah}:${ayah}`);
    return { surah, ayah, text };
  });
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([a-z]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
}

function buildDataset(arabicBuffer, urduBuffer, metadataBuffer) {
  const surahTags = [...metadataBuffer.toString("utf8").matchAll(/<sura\s+([^>]+?)\s*\/>/g)];
  if (surahTags.length !== 114) fail(`Expected 114 metadata Surahs, received ${surahTags.length}.`);
  const metadata = surahTags.map((match) => attributes(match[1]));
  const arabicRows = parsePipeRows(arabicBuffer, "Arabic");
  const urduRows = parsePipeRows(urduBuffer, "Urdu");
  if (arabicRows.length !== 6236 || urduRows.length !== 6236) fail("The downloaded sources do not contain the expected 6,236 ayahs.");

  const arabic = new Map(arabicRows.map((row) => [`${row.surah}:${row.ayah}`, row.text]));
  const urdu = new Map(urduRows.map((row) => [`${row.surah}:${row.ayah}`, row.text]));
  const surahs = metadata.map((item, index) => {
    const number = Number(item.index);
    const ayahCount = Number(item.ayas);
    if (number !== index + 1 || !Number.isInteger(ayahCount) || ayahCount < 1) fail(`Invalid metadata for Surah ${index + 1}.`);
    const ayahs = Array.from({ length: ayahCount }, (_, ayahIndex) => {
      const ayahNumber = ayahIndex + 1;
      const key = `${number}:${ayahNumber}`;
      if (!arabic.has(key) || !urdu.has(key)) fail(`Missing Arabic or Urdu text for ${key}.`);
      return { number: ayahNumber, arabicText: arabic.get(key), urduTranslation: urdu.get(key) };
    });
    return { number, arabicName: item.name, transliteration: item.tname, englishName: item.ename, ayahCount, ayahs };
  });

  const sha256 = crypto.createHash("sha256").update(arabicBuffer).update("\n").update(urduBuffer).update("\n").update(metadataBuffer).digest("hex");
  return {
    source: {
      verified: true,
      name: "Tanzil Uthmani Arabic + Fateh Muhammad Jalandhry Urdu",
      license: "Arabic CC BY 3.0; Urdu translation Tanzil terms",
      licenseUrl: "https://tanzil.net/trans/",
      version: "Tanzil Uthmani 1.1 + ur.jalandhry",
      sha256,
      copyrightNotice: "Arabic text: Tanzil Project, CC BY 3.0. Urdu translation: Fateh Muhammad Jalandhry via Tanzil.net."
    },
    surahs
  };
}

async function main() {
  const arabic = await download(ARABIC_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ quranType: "uthmani", outType: "txt-2", marks: "true", sajdah: "true", tatweel: "true", agree: "true" })
  });
  const [urdu, metadata] = await Promise.all([download(URDU_URL), download(METADATA_URL)]);
  const dataset = buildDataset(arabic, urdu, metadata);
  const tempPath = path.join(os.tmpdir(), `tanzil-quran-${process.pid}.json`);
  fs.writeFileSync(tempPath, JSON.stringify(dataset), "utf8");
  try {
    const result = spawnSync(process.execPath, [path.join(__dirname, "import-verified-quran.js"), tempPath], { stdio: "inherit" });
    if (result.status !== 0) process.exit(result.status || 1);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

main().catch((error) => { console.error(error.message || error); process.exit(1); });
