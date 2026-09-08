import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const tracker = readFileSync(resolve(root, 'data/applications.md'), 'utf8');
const statusLog = readFileSync(resolve(root, 'data/status-log.tsv'), 'utf8');
const latestStatusDate = new Map();
for (const line of statusLog.split('\n')) {
  const [num, transitionDate, , to] = line.split('\t');
  if (/^\d+$/.test(num) && transitionDate && to) latestStatusDate.set(`${Number(num)}|${to}`, transitionDate);
}
const reportFiles = readdirSync(resolve(root, 'reports')).filter((f) => /^\d+-.*\.md$/.test(f));
const reportsByNum = new Map(reportFiles.map((f) => [Number(f.match(/^(\d+)-/)[1]), f]));
const pdfIndex = new Map();
for (const line of readFileSync(resolve(root, 'data/pdf-index.tsv'), 'utf8').split('\n')) {
  if (!/^\d+\t/.test(line)) continue;
  const [num, pdf] = line.split('\t');
  if (/cover/i.test(pdf)) continue;
  if (!pdfIndex.has(Number(num))) pdfIndex.set(Number(num), pdf);
}

function portal(url) {
  if (/linkedin\.com/i.test(url)) return 'LinkedIn';
  if (/naukri\.com/i.test(url)) return 'Naukri';
  if (/instahyre\.com/i.test(url)) return 'Instahyre';
  if (/cutshort\.io/i.test(url)) return 'Cutshort';
  if (/hirist\./i.test(url)) return 'Hirist';
  if (/wellfound\.com/i.test(url)) return 'Wellfound';
  if (/arc\.dev/i.test(url)) return 'Arc.dev';
  if (/indeed\.com/i.test(url)) return 'Indeed';
  if (/weworkremotely\.com/i.test(url)) return 'We Work Remotely';
  return 'Direct employer ATS';
}

function clean(value) {
  return String(value ?? '').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const rows = [];
for (const line of tracker.split('\n')) {
  if (!/^\|\s*\d+\s*\|/.test(line)) continue;
  const cells = line.split('|').slice(1, -1).map((x) => x.trim());
  const [numText, date, company, role, score, status, pdfCell, reportCell, ...noteParts] = cells;
  if (status === 'Discarded' || status === 'SKIP') continue;
  const num = Number(numText);
  const reportNum = Number(reportCell.match(/\[(\d+)\]/)?.[1] || reportCell.match(/(?:^|\/)0*(\d+)-/)?.[1] || num);
  const reportFile = reportCell.match(/(?:\.\.\/)?reports\/([^\s)]+\.md)/)?.[1] || reportsByNum.get(reportNum);
  if (!reportFile) throw new Error(`No report for tracker #${num} ${company}`);
  const reportPath = `reports/${reportFile}`;
  const reportText = readFileSync(resolve(root, reportPath), 'utf8');
  const url = clean(reportText.match(/^\*\*URL:\*\*\s*(\S+)/m)?.[1] || reportText.match(/^\s*job_url:\s*(\S+)/m)?.[1]);
  let pdf = pdfCell.match(/\((output\/[^)]+\.pdf)\)/i)?.[1] || '';
  if (!pdf) pdf = reportText.match(/^\*\*PDF:\*\*\s*(output\/\S+\.pdf)/mi)?.[1] || '';
  if (!pdf) pdf = pdfIndex.get(reportNum) || pdfIndex.get(num) || '';
  if (!pdf || !existsSync(resolve(root, pdf))) throw new Error(`Missing PDF for tracker #${num} ${company}: ${pdf}`);
  if (!url) throw new Error(`Missing URL for tracker #${num} ${company} in ${reportPath}`);
  const notes = clean(noteParts.join(' | '));
  const effectiveDate = latestStatusDate.get(`${num}|${status}`) || date;
  rows.push([effectiveDate, company, role, score, status, url, pdf, reportPath, notes, portal(url)].map(clean));
}

const keys = new Set();
for (const row of rows) {
  const key = [row[1], row[2], row[5]].map((x) => x.toLowerCase()).join('|');
  if (keys.has(key)) throw new Error(`Duplicate row: ${key}`);
  keys.add(key);
}
if (rows.length !== 96) throw new Error(`Expected 96 active rows after compensation and seniority-policy SKIPs, got ${rows.length}`);
const header = ['Date', 'Company', 'Role', 'Score', 'Status', 'URL', 'PDF', 'Report', 'Notes', 'Portal'];
console.log(JSON.stringify({ rows: rows.length, tsv: [header, ...rows].map((r) => r.join('\t')).join('\n') }));
