
const payload = $('GitHub Failure Webhook').first().json.body;
const jobs = $('Fetch Logs').first().json.jobs || [];

const failedJob = jobs.find(j => j.conclusion === 'failure') || jobs[0];
const failedSteps = failedJob?.steps?.filter(s => s.conclusion === 'failure') || [];

const stepDetails = failedSteps.map(s => `
  Step: ${s.name}
  Status: ${s.conclusion}
  Started: ${s.started_at}
  Completed: ${s.completed_at}
`).join('\n');

const commitData = $('Fetch Changed Files').first().json;
const changedFiles = commitData.files || [];

const codeExtensions = ['.js', '.ts', '.py', '.json', '.yml', '.yaml', '.sh', '.java', '.go', '.rb'];
const relevantFiles = changedFiles.filter(f => 
  codeExtensions.some(ext => f.filename.endsWith(ext)) && 
  f.status !== 'removed'
);

const fileContent = $('Fetch File Content').first().json;
const actualCode = typeof fileContent === 'string' 
  ? fileContent 
  : (fileContent.data || fileContent.content || JSON.stringify(fileContent));

let filesSection = '';

if (relevantFiles.length > 0) {
  for (const file of relevantFiles) {
    const ext = file.filename.split('.').pop();
    const langMap = { 
      js: 'javascript', ts: 'typescript', py: 'python', 
      json: 'json', yml: 'yaml', yaml: 'yaml', 
      sh: 'bash', java: 'java', go: 'go', rb: 'ruby' 
    };
    const lang = langMap[ext] || ext;

    filesSection += `File: ${file.filename}\nStatus: ${file.status}\n\`\`\`${lang}\n${actualCode}\n\`\`\`\n\n`;
  }
} else {
  filesSection = 'No relevant code files detected in this commit.';
}

const prompt = `
CI/CD Pipeline Failure Report
==============================
Repository: ${payload.repo}
Branch: ${payload.branch}
Commit: ${payload.commit}
Triggered by: ${payload.actor}
Run ID: ${payload.run_id}
Run URL: https://github.com/${payload.repo}/actions/runs/${payload.run_id}

Failed Job: ${failedJob?.name || 'Unknown'}

Failed Steps:
${stepDetails || 'Unknown'}

All Steps Summary:
${failedJob?.steps?.map(s => `- ${s.name}: ${s.conclusion}`).join('\n') || 'None'}

Changed Files in This Commit (${relevantFiles.length} files):
==============================
${filesSection}
==============================

IMPORTANT INSTRUCTIONS:
- The file_path must be the REAL file that needs fixing from the list above
- The fixed_code must PRESERVE all existing working code, only fix the bug
- Do NOT rewrite the entire file from scratch
- Do NOT use placeholder values
- Return ONLY valid JSON in this format:
{
  "file_path": "actual/file/path.js",
  "fixed_code": "complete corrected code here",
  "explanation": "brief explanation of what was fixed"
}
`;

return { prompt };