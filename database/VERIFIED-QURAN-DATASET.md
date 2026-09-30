# Verified Quran Dataset Import

The project includes `import-tanzil-quran.js`, which downloads and validates:

- Tanzil Uthmani Arabic text, preserving the downloaded Unicode characters and diacritics.
- Fateh Muhammad Jalandhry Urdu translation from Tanzil's translation catalog.
- Tanzil's official Surah metadata and ayah counts.

Run this importer from the `my-app` directory:

```text
node database/import-tanzil-quran.js
```

It verifies the 114 Surahs, 6,236 ayahs, numbering, and non-empty Arabic/Urdu source rows before inserting one SQL transaction. It also stores the source version, license links, attribution, and SHA-256 hash in `quran_dataset_sources`.

Source terms require preserving the text and attribution. See [Tanzil Arabic text license](https://tanzil.net/docs/text_license) and [Tanzil translation catalog and terms](https://tanzil.net/trans/).

No Quran text is included in this repository until a verified and appropriately licensed source is supplied.

The importer expects JSON in this shape:

```json
{
  "source": {
    "verified": true,
    "name": "Verified source name",
    "license": "License name",
    "licenseUrl": "https://source.example/license",
    "version": "version",
    "sha256": "64-character-sha256-of-the-original-dataset",
    "copyrightNotice": "source attribution"
  },
  "surahs": [
    {
      "number": 1,
      "arabicName": "exact source value",
      "transliteration": "exact source value",
      "englishName": "exact source value",
      "ayahCount": 7,
      "ayahs": [
        { "number": 1, "arabicText": "exact source value", "urduTranslation": "exact source value" }
      ]
    }
  ]
}
```

The importer rejects missing verification metadata, non-114-Surah datasets, numbering/count mismatches, empty text, duplicate versions, or modified/generated values. It inserts the source, Surahs, and ayahs in one SQL transaction.

Run it with:

```text
node database/import-verified-quran.js path/to/verified-quran-dataset.json
```
