// 수집 대상 페이지를 텍스트로 받는다. 시간 초과·HTTP 오류는 예외로 올려 기관별로 기록한다.
import { USER_AGENT, FETCH_TIMEOUT_MS } from './config.mjs';

export async function fetchText(url, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/xml, text/html;q=0.9, */*;q=0.5' },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} (${url})`);
  return response.text();
}
