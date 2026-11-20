const { rankCandidate } = require('./aiServiceClient');
const { listAllForRanking, setRanking } = require('../models/applicationModel');

const CONCURRENCY = 5;

function toDetails(ranking) {
  return ranking ? { matchedSkills: ranking.matchedSkills, missingSkills: ranking.missingSkills } : null;
}

// Re-scores every application of a job with a small worker pool (the AI calls are independent).
async function rerankJob(job, { concurrency = CONCURRENCY } = {}) {
  const rows = await listAllForRanking(job.id);
  let index = 0;
  let updated = 0;

  async function worker() {
    while (index < rows.length) {
      const row = rows[index];
      index += 1;
      const ranking = await rankCandidate({
        requiredSkills: job.required_skills,
        minExperienceYears: job.min_experience_years,
        parsedData: row.parsed_data,
        resumeText: row.resume_text,
      });
      await setRanking(row.id, ranking ? ranking.score : null, toDetails(ranking));
      updated += 1;
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, worker));
  return updated;
}

module.exports = { rerankJob, toDetails };
