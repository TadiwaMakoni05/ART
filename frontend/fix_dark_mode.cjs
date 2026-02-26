const fs = require("fs");
const path = require("path");

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach((file) => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith(".jsx")) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const excludedFiles = [
  "PatientHome.jsx",
  "AIChatHelper.jsx",
  "PatientLayout.jsx",
  "ProviderLayout.jsx",
  "AdminLayout.jsx",
  "ThemeToggle.jsx",
  "App.jsx",
];

const files = walkSync(path.join(__dirname, "src"));

const replacements = [
  { regex: /\bbg-white\b/g, replacement: "bg-white dark:bg-neutral-900" },
  {
    regex: /\bbg-neutral-50\b(?! dark:bg-)/g,
    replacement: "bg-neutral-50 dark:bg-neutral-950",
  },
  {
    regex: /\bbg-neutral-100\b(?! dark:bg-)/g,
    replacement: "bg-neutral-100 dark:bg-neutral-800",
  },
  {
    regex: /\btext-black\b(?! dark:text-)/g,
    replacement: "text-black dark:text-white",
  },
  {
    regex: /\btext-neutral-900\b(?! dark:text-)/g,
    replacement: "text-neutral-900 dark:text-neutral-100",
  },
  {
    regex: /\btext-neutral-800\b(?! dark:text-)/g,
    replacement: "text-neutral-800 dark:text-neutral-200",
  },
  {
    regex: /\btext-neutral-700\b(?! dark:text-)/g,
    replacement: "text-neutral-700 dark:text-neutral-300",
  },
  {
    regex: /\btext-neutral-600\b(?! dark:text-)/g,
    replacement: "text-neutral-600 dark:text-neutral-400",
  },
  {
    regex: /\btext-neutral-500\b(?! dark:text-)/g,
    replacement: "text-neutral-500 dark:text-neutral-400",
  },
  {
    regex: /\border-neutral-200\b(?! dark:border-)/g,
    replacement: "border-neutral-200 dark:border-neutral-700",
  },
  {
    regex: /\border-neutral-100\b(?! dark:border-)/g,
    replacement: "border-neutral-100 dark:border-neutral-800",
  },
  // deduplicate multiple dark classes just in case
];

let changedFiles = 0;

files.forEach((file) => {
  const fileName = path.basename(file);
  if (excludedFiles.includes(fileName)) return;

  let content = fs.readFileSync(file, "utf8");
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  // Deduplicate
  content = content.replace(/(dark:[a-z0-9-]+)(\s+)\1/g, "$1");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, "utf8");
    console.log("Fixed:", fileName);
    changedFiles++;
  }
});

console.log("Total files changed:", changedFiles);
