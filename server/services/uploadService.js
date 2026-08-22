const path = require('path');
const cloudinary = require('../config/cloudinary');

function uploadResumeToCloudinary(buffer, { candidateId, jobId, originalName }) {
  const ext = path.extname(originalName);
  const publicId = `candidate-${candidateId}-job-${jobId}-${Date.now()}${ext}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'resumes', public_id: publicId },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}

module.exports = { uploadResumeToCloudinary };
