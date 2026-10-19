// robots.txt 최소 해석기. 우리 봇 이름 그룹이 있으면 그것을, 없으면 * 그룹 규칙을 따른다.

const BOT_NAME = 'cheongramaxlibrarybot';

function parseGroups(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  String(text ?? '').split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.replace(/#.*$/, '').trim();
    const sep = line.indexOf(':');
    if (sep === -1) return;
    const key = line.slice(0, sep).trim().toLowerCase();
    const value = line.slice(sep + 1).trim();
    if (key === 'user-agent') {
      if (!lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      return;
    }
    lastWasAgent = false;
    if (current && (key === 'allow' || key === 'disallow') && value) {
      current.rules.push({ allow: key === 'allow', path: value });
    }
  });
  return groups;
}

function ruleToRegex(path) {
  const escaped = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped.endsWith('\\$') ? `${escaped.slice(0, -2)}$` : escaped}`);
}

export function isAllowedByRobots(robotsText, url) {
  const groups = parseGroups(robotsText);
  const group = groups.find((g) => g.agents.some((a) => BOT_NAME.includes(a) && a !== '*'))
    ?? groups.find((g) => g.agents.includes('*'));
  if (!group) return true;
  const { pathname, search } = new URL(url);
  const target = pathname + search;
  const matched = group.rules
    .filter((rule) => !/^https?:/i.test(rule.path) && ruleToRegex(rule.path).test(target))
    .sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return matched.length === 0 || matched[0].allow;
}
