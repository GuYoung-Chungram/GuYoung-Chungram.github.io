// 사용법: npm run build          → index.html (검수 완료 자료만)
//         npm run build:preview  → _preview/index.html (검수 전 자료 포함, 미리보기 배너 표시)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { loadData, report, ROOT, SRC_DIR } from './lib/io.mjs';
import { validateAll } from './lib/validate.mjs';
import { buildPayload, embedJson, renderPage } from './lib/build.mjs';

const preview = process.argv.includes('--preview');
const outFile = preview ? path.join(ROOT, '_preview', 'index.html') : path.join(ROOT, 'index.html');

async function main() {
  const data = await loadData();
  const result = validateAll(data);
  report(result);
  if (result.errors.length) {
    console.error('검증 오류가 있어 빌드를 중단합니다.');
    return 1;
  }
  const [template, styles, app] = await Promise.all(
    ['template.html', 'styles.css', 'app.js'].map((f) => readFile(path.join(SRC_DIR, f), 'utf8')),
  );
  const payload = buildPayload(data, { now: new Date(), preview });
  const html = renderPage(template, { styles, app, data: embedJson(payload) });
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, html, 'utf8');
  console.log(`✅ ${path.relative(ROOT, outFile)} 생성 (라이브러리 ${payload.library.length}건, 새 자료 ${payload.feed.recent.length}건)`);
  return 0;
}

main()
  .then((code) => { process.exitCode = code; })
  .catch((error) => { console.error(`❌ ${error.message}`); process.exitCode = 1; });
