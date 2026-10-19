// 데이터 파일 읽기와 검증 결과 출력. CLI(validate.mjs, build.mjs)가 함께 쓴다.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SRC_DIR = path.join(ROOT, '_src');
const DATA_FILES = ['library', 'feed', 'sources', 'stages'];

async function readJson(file) {
  const text = await readFile(file, 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${path.relative(ROOT, file)} JSON 형식 오류: ${error.message}`);
  }
}

export async function loadData() {
  const entries = await Promise.all(
    DATA_FILES.map(async (name) => [name, await readJson(path.join(SRC_DIR, 'data', `${name}.json`))]),
  );
  return Object.fromEntries(entries);
}

export function report({ errors, warnings }) {
  warnings.forEach((message) => console.warn(`⚠️  ${message}`));
  errors.forEach((message) => console.error(`❌ ${message}`));
  console.log(`검증 결과: 오류 ${errors.length}건, 경고 ${warnings.length}건`);
}
