"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { JR_PHEEF_CATEGORIES, normalizeCategory } = require("../lib/categories");

test("JR PHEEF has exactly the official 33 categories in the approved order", () => {
  assert.equal(JR_PHEEF_CATEGORIES.length, 33);
  assert.equal(new Set(JR_PHEEF_CATEGORIES).size, 33);
  assert.equal(JR_PHEEF_CATEGORIES[19], "Data&Analytics");
  assert.equal(JR_PHEEF_CATEGORIES[23], "New&Noteworthy");
  assert.equal(JR_PHEEF_CATEGORIES[25], "Business & Operations");
  assert.equal(JR_PHEEF_CATEGORIES[31], "Music/Video");
});

test("category normalization is case-insensitive and trims whitespace", () => {
  assert.equal(normalizeCategory("  eNtErTaInMeNt "), "Entertainment");
  assert.equal(normalizeCategory("Business & Operations"), "Business & Operations");
});

test("legacy category labels map to the official labels", () => {
  assert.equal(normalizeCategory("Data & Analytics"), "Data&Analytics");
  assert.equal(normalizeCategory("New & Noteworthy"), "New&Noteworthy");
});

test("unknown or empty categories are rejected", () => {
  assert.equal(normalizeCategory(""), null);
  assert.equal(normalizeCategory("Not a category"), null);
});
