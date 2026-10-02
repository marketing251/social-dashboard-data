// Regression check: parseInsights accepts the structured-output shape and
// still applies the editorial filter.  npx tsx scripts/test-parse-insights.mts
import { parseInsights } from '../src/lib/ai-insights';

const item = (cls: string, title: string) => ({ icon: '📈', cls, tag: 'win', tagLabel: 'Test', title, body: 'Body text.' });
const structured = JSON.stringify({ insights: [
  item('positive', 'LinkedIn followers up 86% in Q3'),
  item('negative', 'TikTok views down 98.6% in Q3'),
  item('warning', 'Suspect engagement on X'),
  item('negative', 'Neg 2'), item('negative', 'Neg 3'), item('negative', 'Neg 4'),
] });
const out = parseInsights(structured);
const checks = {
  parsedStructured: out.length > 0,
  bannedDropped: !out.some((i) => /suspect/i.test(i.title)),
  negativesCapped: out.filter((i) => i.cls === 'negative' || i.cls === 'warning').length <= 3,
  bareArrayStillWorks: parseInsights(JSON.stringify([item('positive', 'A')])).length === 1,
};
console.log(checks);
console.log(Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL');
process.exitCode = Object.values(checks).every(Boolean) ? 0 : 1;
