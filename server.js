import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve images folder publicly
app.use("/drawable", express.static(path.join(__dirname, "drawable")));

// ---------------- HELPERS ----------------
function safe(part) {
  return encodeURIComponent(part);
}

function parseFile(file) {
  const nameWithoutExt = file.replace(/\.[^/.]+$/, "");
  const parts = nameWithoutExt.split("__");

  const name = parts[0]
    ? parts[0]
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  const cheatcode = parts[1] || "";
  return { name, cheatcode };
}

// 🔹 Read plugin cheatcodes (image name WITHOUT extension)
function readPluginCheatcodes(folderPath) {
  const txtFile = fs
    .readdirSync(folderPath)
    .find((f) => /\.txt$/i.test(f));

  if (!txtFile) return {};

  const content = fs.readFileSync(path.join(folderPath, txtFile), "utf-8");

  const map = {};
  content.split(/\r?\n/).forEach((line) => {
    if (!line.includes("=")) return;
    const [imageName, link] = line.split("=");
    map[imageName.trim()] = link.trim();
  });

  return map;
}

function formatTitle(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------- API ----------------
app.get("/api/images", (req, res) => {
  const baseDir = path.join(__dirname, "drawable");
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const response = {
    data: {
      codes: {},
      plugins: {},
      video: [],
    },
  };

  ["codes", "plugins"].forEach((section) => {
    const sectionPath = path.join(baseDir, section);
    if (!fs.existsSync(sectionPath)) return;

    fs.readdirSync(sectionPath).forEach((subFolder) => {
      const subPath = path.join(sectionPath, subFolder);
      if (!fs.statSync(subPath).isDirectory()) return;

      const allFiles = fs.readdirSync(subPath);

      // ---- COVER IMAGE ----
      const coverFile = allFiles.find((f) =>
        /^coverimg\.(png|jpe?g|webp)$/i.test(f)
      );

      const categoryImage = coverFile
        ? `${baseUrl}/drawable/${safe(section)}/${safe(subFolder)}/${safe(
            coverFile
          )}`
        : null;

      // ---- PLUGIN CHEATCODE MAP ----
      const pluginCheatMap =
        section === "plugins" ? readPluginCheatcodes(subPath) : {};

      // ---- ITEMS ----
      const items = allFiles
        .filter(
          (file) =>
            /\.(png|jpe?g|webp|gif|svg|zip)$/i.test(file) &&
            !/^cover/i.test(file)
        )
        .map((file) => {
          const parsed = parseFile(file);
          const fileNameOnly = file.replace(/\.[^/.]+$/, "");

          return {
            name: parsed.name,
            cheatcode:
              section === "plugins"
                ? pluginCheatMap[fileNameOnly] || ""
                : parsed.cheatcode,
            url: `${baseUrl}/drawable/${safe(section)}/${safe(subFolder)}/${safe(
              file
            )}`,
          };
        });

      response.data[section][subFolder] = {
        image: categoryImage,
        items,
      };
    });
  });

  // --------- VIDEO ---------
  const videoPath = path.join(baseDir, "video");
  if (fs.existsSync(videoPath)) {
    fs.readdirSync(videoPath).forEach((file) => {
      const filePath = path.join(videoPath, file);
      if (fs.statSync(filePath).isFile()) {
        response.data.video.push({
          title: formatTitle(file),
          url: `${baseUrl}/drawable/video/${safe(file)}`,
        });
      }
    });
  }

  res.json(response);
});

// ---------------- SERVER ----------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
