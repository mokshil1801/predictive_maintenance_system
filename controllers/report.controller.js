const fs = require("fs");
const { createReportFromRequest } = require("../lib/fixahead-api");

function toFetchRequest(req) {
  const protocol = req.protocol || "http";
  const host = req.get?.("host") || "localhost";
  const headers = new Headers();
  const authorization = req.headers.authorization || "";

  if (authorization) {
    headers.set("authorization", authorization);
  }

  const formData = new FormData();
  Object.entries(req.body || {}).forEach(([key, value]) => {
    formData.append(key, value);
  });

  if (req.file) {
    const buffer = req.file.buffer || fs.readFileSync(req.file.path);
    const file = new File([buffer], req.file.originalname || req.file.filename, {
      type: req.file.mimetype,
    });
    formData.append(req.file.fieldname || "photo", file);
  }

  return new Request(`${protocol}://${host}${req.originalUrl}`, {
    method: req.method,
    headers,
    body: formData,
  });
}

async function createReport(req, res, next) {
  try {
    const result = await createReportFromRequest(toFetchRequest(req));
    return res.status(201).json({
      message: "Report submitted successfully.",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createReport,
};
