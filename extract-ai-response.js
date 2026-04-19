
const output = $input.first().json.output;
const raw = output[0].content[0].text;
if(!raw) throw new Error('Output is incorrectly formatted or missing.');

const cleaned = raw.replace(/```json|```/g, '').trim();

let parsed;
try {
  parsed = JSON.parse(cleaned);
  if(!parsed.fixed_code) throw new Error('Parsed JSON does not contain fixed_code');
} catch(e) {
  throw new Error('OpenAI did not return valid JSON: ' + raw);
}

const payload = $('GitHub Failure Webhook').first().json.body;

return {
  branch_name: parsed.branch_name,
  file_path: parsed.file_path,
  fixed_code: parsed.fixed_code,
  base64_content: Buffer.from(parsed.fixed_code).toString('base64'),
  pr_title: parsed.pr_title,
  pr_body: parsed.pr_body,
  repo: payload.repo,
  commit: payload.commit
};