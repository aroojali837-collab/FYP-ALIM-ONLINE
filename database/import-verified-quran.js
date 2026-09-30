// Imports a verified, licensed Quran dataset without changing its text.
// Usage: node database/import-verified-quran.js path/to/verified-quran-dataset.json
const fs = require("fs");
const path = require("path");
const sql = require("mssql");

function loadLocalEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

function fail(message) { throw new Error(message); }

function validate(dataset) {
  if (!dataset?.source?.verified) fail("Dataset source must be explicitly verified.");
  for (const field of ["name", "license", "licenseUrl", "version", "sha256"]) {
    if (typeof dataset.source[field] !== "string" || !dataset.source[field].trim()) fail(`Missing source.${field}.`);
  }
  if (!/^[a-f0-9]{64}$/i.test(dataset.source.sha256)) fail("source.sha256 must be a SHA-256 hash.");
  if (!Array.isArray(dataset.surahs) || dataset.surahs.length !== 114) fail("Dataset must contain exactly 114 Surahs.");
  const seenSurahs = new Set();
  for (let index = 0; index < dataset.surahs.length; index += 1) {
    const surah = dataset.surahs[index];
    if (surah.number !== index + 1 || seenSurahs.has(surah.number)) fail(`Invalid Surah number at index ${index}.`);
    seenSurahs.add(surah.number);
    for (const field of ["arabicName", "transliteration", "englishName"]) {
      if (typeof surah[field] !== "string" || !surah[field].trim()) fail(`Missing Surah ${surah.number} ${field}.`);
    }
    if (!Number.isInteger(surah.ayahCount) || surah.ayahCount < 1 || !Array.isArray(surah.ayahs) || surah.ayahs.length !== surah.ayahCount) fail(`Ayah count mismatch for Surah ${surah.number}.`);
    const seenAyahs = new Set();
    for (let ayahIndex = 0; ayahIndex < surah.ayahs.length; ayahIndex += 1) {
      const ayah = surah.ayahs[ayahIndex];
      if (ayah.number !== ayahIndex + 1 || seenAyahs.has(ayah.number)) fail(`Invalid ayah number in Surah ${surah.number}.`);
      if (typeof ayah.arabicText !== "string" || !ayah.arabicText || typeof ayah.urduTranslation !== "string" || !ayah.urduTranslation) fail(`Missing exact text in Surah ${surah.number}, ayah ${ayah.number}.`);
      seenAyahs.add(ayah.number);
    }
  }
}

async function main() {
  loadLocalEnv();
  const filePath = process.argv[2];
  if (!filePath) fail("Pass the verified dataset JSON path as the first argument.");
  const dataset = JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
  validate(dataset);
  const pool = await sql.connect({ server: process.env.DB_SERVER || "127.0.0.1", port: Number(process.env.DB_PORT || 1433), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE || "alimNext", options: { encrypt: false, trustServerCertificate: true } });
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    await new sql.Request(transaction).query("IF COL_LENGTH(N'dbo.quran_dataset_sources', N'copyright_notice') IS NULL ALTER TABLE dbo.quran_dataset_sources ADD copyright_notice NVARCHAR(MAX) NULL");
    const request = new sql.Request(transaction);
    request.input("sourceName", sql.NVarChar(255), dataset.source.name);
    request.input("licenseName", sql.NVarChar(255), dataset.source.license);
    request.input("licenseUrl", sql.NVarChar(1000), dataset.source.licenseUrl);
    request.input("version", sql.NVarChar(100), dataset.source.version);
    request.input("sha256", sql.Char(64), dataset.source.sha256.toLowerCase());
    request.input("copyrightNotice", sql.NVarChar(sql.MAX), dataset.source.copyrightNotice || null);
    const existing = await request.query("SELECT id FROM dbo.quran_dataset_sources WHERE source_name=@sourceName AND version=@version AND sha256=@sha256");
    if (existing.recordset.length) fail("This exact dataset version is already imported.");
    const source = await request.query("INSERT INTO dbo.quran_dataset_sources (source_name, license_name, license_url, version, sha256, copyright_notice, is_verified) OUTPUT INSERTED.id VALUES (@sourceName, @licenseName, @licenseUrl, @version, @sha256, @copyrightNotice, 1)");
    const sourceId = source.recordset[0].id;
    for (const surah of dataset.surahs) {
      const surahRequest = new sql.Request(transaction);
      surahRequest.input("number", sql.TinyInt, surah.number).input("sourceId", sql.Int, sourceId).input("arabicName", sql.NVarChar(255), surah.arabicName).input("transliteration", sql.NVarChar(255), surah.transliteration).input("englishName", sql.NVarChar(255), surah.englishName).input("ayahCount", sql.SmallInt, surah.ayahCount);
      await surahRequest.query("INSERT INTO dbo.quran_surahs (surah_number, source_id, arabic_name, transliteration, english_name, ayah_count) VALUES (@number, @sourceId, @arabicName, @transliteration, @englishName, @ayahCount)");
      for (const ayah of surah.ayahs) {
        const ayahRequest = new sql.Request(transaction);
        ayahRequest.input("surahNumber", sql.TinyInt, surah.number).input("ayahNumber", sql.SmallInt, ayah.number).input("arabicText", sql.NVarChar(sql.MAX), ayah.arabicText).input("urduTranslation", sql.NVarChar(sql.MAX), ayah.urduTranslation);
        await ayahRequest.query("INSERT INTO dbo.quran_ayahs (surah_number, ayah_number, arabic_text, urdu_translation) VALUES (@surahNumber, @ayahNumber, @arabicText, @urduTranslation)");
      }
    }
    await transaction.commit();
    console.log(`Imported verified dataset: ${dataset.source.name} ${dataset.source.version}`);
  } catch (error) { await transaction.rollback(); throw error; } finally { await pool.close(); }
}

main().catch((error) => { console.error(error.message || error); process.exit(1); });
