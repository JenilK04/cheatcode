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
  const imagesDir = path.join(__dirname, "drawable");

  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        status: "error",
        message: "Unable to read images directory",
      }); 
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Build response structure
    const imageList = files
      .filter((name) => /\.(png|jpe?g|webp|gif|svg)$/i.test(name))
      .map((file, index) => ({
        title: formatTitle(file),
        name: file,
        url: `${baseUrl}/drawable/${file}`,
      }));

    res.json({
      status: "success",
      count: imageList.length,
      images: imageList,
    });
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
