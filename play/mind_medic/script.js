// Google Cloud Console에서 HTTP 참조자 제한 설정 필수: crmc.co.kr/*
const GEMINI_API_KEY = 'AIzaSyBhCfpaiaAgPHrdQLJ1d_Mb2Cyy59lyZK8';
const GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `당신은 따뜻하고 세련된 감정 상담가예요.
사용자가 선택한 감정들을 기반으로, 그들의 마음을 보듬어주고
구체적인 처방(음식, 차/음료, 활동, 음악, 책, 여행지)을 제시해줘요.

말투 규칙 (반드시 지켜줘요):
- 모든 문장을 '~해요', '~어요', '~예요', '~거예요', '~도록 해요' 체로 끝내요.
- '~합니다', '~됩니다', '~입니다', '~습니다' 로 끝나는 문장은 절대 쓰지 않아요.
- 친근하고 따뜻한 말투를 유지해요.

톤:
- 공감 능력이 뛰어나고 따뜻해요
- 심리 상담가나 경험 많은 코치의 느낌이에요
- 구체적이고 실질적인 조언을 해줘요
- 감정을 판단하지 않고 수용하는 태도를 보여줘요

각 처방마다:
- 이유를 명확히 설명해줘요
- 왜 이 감정 상태에 도움이 되는지 설명해줘요
- 구체적인 실행 방법을 제시해줘요
- 따뜻한 격려를 담아줘요

응답 형식:
음식: [추천] | [이유]
차/음료: [추천] | [이유]
활동: [추천] | [이유]
음악: [추천] | [이유]
추천책: [추천] | [이유]
여행지: [추천] | [이유]`;

const moods = [
  { label: '감동적인', emoji: '😭' },
  { label: '고마운', emoji: '🙏' },
  { label: '기쁜', emoji: '😊' },
  { label: '설레는', emoji: '🥰' },
  { label: '사랑스러운', emoji: '💖' },
  { label: '활기찬', emoji: '⚡' },
  { label: '희망찬', emoji: '🌟' },
  { label: '기대되는', emoji: '✨' },
  { label: '신나는', emoji: '🤩' },
  { label: '열정적인', emoji: '🔥' },
  { label: '고요한', emoji: '🌙' },
  { label: '다정한', emoji: '🤗' },
  { label: '안심되는', emoji: '🌿' },
  { label: '차분한', emoji: '🧘' },
  { label: '편안한', emoji: '☁️' },
  { label: '신기한', emoji: '🪐' },
  { label: '궁금한', emoji: '🔍' },
  { label: '망설이는', emoji: '🤔' },
  { label: '한가한', emoji: '🍃' },
  { label: '몰입하는', emoji: '🎧' },
  { label: '걱정스러운', emoji: '😟' },
  { label: '답답한', emoji: '😣' },
  { label: '막막한', emoji: '😰' },
  { label: '미안한', emoji: '😔' },
  { label: '서운한', emoji: '😢' },
  { label: '외로운', emoji: '😞' },
  { label: '지친', emoji: '😫' },
  { label: '슬픈', emoji: '😢' },
  { label: '어색한', emoji: '😶' },
  { label: '안쓰러운', emoji: '🥺' },
  { label: '불안한', emoji: '😟' },
  { label: '혼란스러운', emoji: '😵' },
  { label: '긴장되는', emoji: '😳' },
  { label: '두려운', emoji: '😨' },
  { label: '억울한', emoji: '😤' }
];

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const moodGrid = document.getElementById('moodGrid');
const diagnoseButton = document.getElementById('diagnoseButton');
const surveySection = document.getElementById('surveySection');
const resultSection = document.getElementById('resultSection');
const resultDate = document.getElementById('resultDate');
const resultTitle = document.getElementById('resultTitle');
const resultSummary = document.getElementById('resultSummary');
const shareButton = document.getElementById('shareButton');
const shareNote = document.getElementById('shareNote');
const backButton = document.getElementById('backButton');

const selectedMoods = new Set();

function renderMoodCards() {
  const shuffledMoods = shuffleArray(moods);
  shuffledMoods.forEach((mood) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mood-card';
    button.innerHTML = `
      <span class="mood-emoji">${mood.emoji}</span>
      <span class="mood-label">${mood.label}</span>
    `;
    button.addEventListener('click', () => toggleMood(mood.label, button));
    moodGrid.appendChild(button);
  });
}

function toggleMood(label, button) {
  if (selectedMoods.has(label)) {
    selectedMoods.delete(label);
    button.classList.remove('selected');
  } else {
    selectedMoods.add(label);
    button.classList.add('selected');
  }
  diagnoseButton.disabled = selectedMoods.size === 0;
}

function buildSummary() {
  const selected = Array.from(selectedMoods);
  if (selected.length === 0) return '지금 느끼는 감정을 선택해 주세요.';
  const joined = selected.join(', ');
  return `오늘 당신의 마음은 ${joined}입니다. 이 혼란과 감정을 그대로 알아차리고, 천천히 내면을 돌보는 시간이 필요해요.`;
}

function openResult() {
  resultDate.textContent = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  resultTitle.textContent = '지금 당신의 마음을 읽어낸 처방입니다.';
  resultSummary.textContent = buildSummary();
  
  surveySection.classList.add('hidden');
  resultSection.classList.remove('hidden');
  
  setTimeout(() => {
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
  
  generatePrescription();
}

async function generatePrescription() {
  const prescriptionsContainer = document.getElementById('prescriptions');
  const moodList = Array.from(selectedMoods);

  const userPrompt = `사용자의 현재 감정: ${moodList.join(', ')}

이 감정들을 종합적으로 이해하고,
따뜻하고 구체적인 처방을 6가지 카테고리(음식, 차/음료, 활동, 음악, 책, 여행지)로 제시해주세요.
각 처방에는 왜 이것이 도움이 되는지 이유를 포함시켜주세요.`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    prescriptionsContainer.innerHTML = '';
    let fullText = '';

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(line.slice(6));
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) fullText += text;
        } catch (e) {
          // 파싱 실패 무시
        }
      }
    }

    renderPrescriptions(fullText);
    shareNote.textContent = '저장하기 버튼을 누르면 사용 중인 앱에서 이 처방 결과를 바로 공유할 수 있습니다.';
  } catch (error) {
    prescriptionsContainer.innerHTML = `
      <div class="prescription-loading">
        <p>⚠️ 처방전 생성 중 오류가 발생했습니다.</p>
        <p style="font-size: 0.9rem; color: #9ca3af;">잠시 후 다시 시도해주세요.</p>
      </div>
    `;
  }
}

function parseMd(raw) {
  let text = raw.trim().replace(/^\*+\s*|\s*\*+$/g, '').trim();

  const pipeIdx = text.indexOf(' | ');
  let recommendation = '';
  let body = text;
  if (pipeIdx !== -1) {
    recommendation = text.slice(0, pipeIdx).trim().replace(/^\[|\]$/g, '');
    body = text.slice(pipeIdx + 3).trim().replace(/^\[이유\]\**/i, '').trim();
  }

  body = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  body = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  const parts = body.split(/\s*\*\s+/).filter(Boolean);
  let bodyHtml = '';
  if (parts.length > 1) {
    if (parts[0].trim()) bodyHtml += '<p class="rx-lead">' + parts[0].trim() + '</p>';
    bodyHtml += '<ul class="rx-list">';
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].trim()) bodyHtml += '<li>' + parts[i].trim() + '</li>';
    }
    bodyHtml += '</ul>';
  } else {
    bodyHtml = '<p>' + (parts[0] || body) + '</p>';
  }

  return { recommendation, bodyHtml };
}

function renderPrescriptions(text) {
  const prescriptionsContainer = document.getElementById('prescriptions');
  prescriptionsContainer.innerHTML = '';

  const categoryOrder = ['음식', '차/음료', '활동', '음악', '추천책', '여행지'];
  const categoryPatterns = {
    '음식': /음식\s*[:：](.*?)(?=차\/음료|$)/s,
    '차/음료': /차\/음료\s*[:：](.*?)(?=활동|$)/s,
    '활동': /활동\s*[:：](.*?)(?=음악|$)/s,
    '음악': /음악\s*[:：](.*?)(?=추천책|$)/s,
    '추천책': /추천책\s*[:：](.*?)(?=여행지|$)/s,
    '여행지': /여행지\s*[:：](.*?)$/s
  };

  let delay = 0;
  categoryOrder.forEach((category) => {
    const pattern = categoryPatterns[category];
    const match = text.match(pattern);
    const rawContent = match ? match[1].trim() : '';
    const { recommendation, bodyHtml } = parseMd(rawContent || '준비 중입니다.');

    const article = document.createElement('article');
    article.className = 'prescription-item';
    article.style.animationDelay = `${delay}ms`;

    const title = document.createElement('h3');
    title.textContent = category;

    const body = document.createElement('div');
    body.className = 'rx-body';
    if (recommendation) {
      const rec = document.createElement('p');
      rec.className = 'rx-recommendation';
      rec.textContent = recommendation;
      body.appendChild(rec);
    }
    body.innerHTML += bodyHtml;

    article.appendChild(title);
    article.appendChild(body);
    prescriptionsContainer.appendChild(article);

    delay += 80;
  });
}

async function shareResult() {
  const prescriptionText = document.getElementById('prescriptions').innerText;
  const shareText = `마음 처방전\n\n${buildSummary()}\n\n${prescriptionText}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: '마음 처방전',
        text: shareText
      });
      shareNote.textContent = '공유가 완료되었습니다. 선택한 앱에서 결과를 확인해보세요.';
    } catch (error) {
      if (error.name !== 'AbortError') {
        shareNote.textContent = '공유 도중 문제가 발생했습니다. 다시 시도해 주세요.';
      }
    }
  } else {
    await copyToClipboard(shareText);
    shareNote.textContent = '공유 API를 지원하지 않는 환경입니다. 텍스트를 복사했습니다.';
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

function resetSurvey() {
  selectedMoods.clear();
  diagnoseButton.disabled = true;
  document.querySelectorAll('.mood-card').forEach((card) => card.classList.remove('selected'));
  surveySection.classList.remove('hidden');
  resultSection.classList.add('hidden');
  shareNote.textContent = '';
}

diagnoseButton.addEventListener('click', openResult);
shareButton.addEventListener('click', shareResult);
backButton.addEventListener('click', resetSurvey);

renderMoodCards();
