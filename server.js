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

function safe(part) {
  return encodeURIComponent(part);
}


// ---- API Endpoint ----
app.get("/api/images", (req, res) => {
  const baseDir = path.join(__dirname, "drawable");
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const response = {
    data: {},
  };

  // ---------- HANDLE CHEATCODES & PLUGINS ----------
  ["cheatcodes", "plugins"].forEach((section) => {
    const sectionPath = path.join(baseDir, section);
    response.data[section] = {  items: {} };

    if (!fs.existsSync(sectionPath)) return;

    fs.readdirSync(sectionPath).forEach((subFolder) => {
      const subPath = path.join(sectionPath, subFolder);

      if (fs.statSync(subPath).isDirectory()) {
        response.data[section].items[subFolder] = fs
          .readdirSync(subPath)
          .filter((file) => /\.(png|jpe?g|webp|gif|svg|zip)$/i.test(file))
          .map((file) => ({
            title: formatTitle(file),
            url: `${baseUrl}/drawable/${safe(section)}/${safe(subFolder)}/${safe(file)}`,
          }));
      }
    });
  });

  // ---------- HANDLE VIDEO (DIRECT FILES) ----------
  const videoPath = path.join(baseDir, "video");
  response.data.video = {  items: [] };

  if (fs.existsSync(videoPath)) {
    fs.readdirSync(videoPath).forEach((file) => {
      const filePath = path.join(videoPath, file);

      if (fs.statSync(filePath).isFile()) {
        response.data.video.items.push({
          title: formatTitle(file),
          url: `${baseUrl}/drawable/video/${safe(file)}`,
        });
      }
    });
  }

  res.json(response);
});



// ---- Helper function: make title readable ----
function formatTitle(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")   // remove file extension
    .replace(/[_-]/g, " ")      // replace _ or - with space
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize words
}

// ---- Start server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
