const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDirectory = path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "") || ".jpg";
    const filename = `fixahead-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}${extension}`.replace(/[^a-zA-Z0-9._-]/g, "-");
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed."));
      return;
    }

    cb(null, true);
  },
});

module.exports = upload;
