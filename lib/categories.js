"use strict";

const JR_PHEEF_CATEGORIES = Object.freeze([
  "Entertainment",
  "Tools",
  "Photography",
  "Business",
  "Shopping",
  "Education",
  "Religion",
  "Finance",
  "Fashion",
  "Travel",
  "Food",
  "Books",
  "Health",
  "Parenting",
  "Reference",
  "Communication",
  "Productivity",
  "Scientific Research",
  "Security",
  "Data&Analytics",
  "Popular",
  "Creativity",
  "Development Tools",
  "New&Noteworthy",
  "Small Business",
  "Business & Operations",
  "Social",
  "Download",
  "Sports",
  "Job",
  "News",
  "Music/Video",
  "Other"
]);

const CATEGORY_ALIASES = Object.freeze({
  "data & analytics": "Data&Analytics",
  "new & noteworthy": "New&Noteworthy"
});

function normalizeCategory(value) {
  const label = String(value ?? "").trim().toLocaleLowerCase();
  const normalized = CATEGORY_ALIASES[label] || label;
  return JR_PHEEF_CATEGORIES.find(
    category => category.toLocaleLowerCase() === normalized
  ) || null;
}

module.exports = { JR_PHEEF_CATEGORIES, normalizeCategory };
