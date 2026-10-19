// 사용법: npm run validate — 데이터만 검사하고 파일은 만들지 않는다.
import { loadData, report } from './lib/io.mjs';
import { validateAll } from './lib/validate.mjs';

try {
  const result = validateAll(await loadData());
  report(result);
  process.exitCode = result.errors.length ? 1 : 0;
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
}
