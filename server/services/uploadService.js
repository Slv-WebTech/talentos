const path = require('path');
const cloudinary = require('../config/cloudinary');

function uploadResumeToCloudinary(buffer, { candidateId, jobId, originalName }) {
  const ext = path.extname(originalName);
  const publicId = `candidate-${candidateId}-job-${jobId}-${Date.now()}${ext}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', type: 'authenticated', folder: 'resumes', public_id: publicId },
      (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id }))
    );
    stream.end(buffer);
  });
}

async function deleteResume(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', type: 'authenticated' });
  } catch (err) {
    console.error('failed to clean up orphaned resume', publicId, err.message);
  }
}

const SIGNED_URL_TTL_SECONDS = 5 * 60;

// Short-lived signed download URL for a privately stored resume.
function getSignedResumeUrl(publicId) {
  return cloudinary.utils.private_download_url(publicId, '', {
    resource_type: 'raw',
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS,
  });
}

module.exports = { uploadResumeToCloudinary, deleteResume, getSignedResumeUrl };
