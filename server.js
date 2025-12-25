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

// ---- API Endpoint ----
app.get("/api/images", (req, res) => {
  const baseDir = path.join(__dirname, "drawable");
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const result = {};

  fs.readdirSync(baseDir).forEach((folder) => {
    const folderPath = path.join(baseDir, folder);

    if (fs.statSync(folderPath).isDirectory()) {
      result[folder] = fs
        .readdirSync(folderPath)
        .filter((file) => /\.(png|jpe?g|webp|gif|svg)$/i.test(file))
        .map((file) => ({
          title: formatTitle(file),
          url: `${baseUrl}/drawable/${folder}/${file}`, 
        }));
    }
  });

  res.json({
    status: "success",
    codes: result,
  });
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
