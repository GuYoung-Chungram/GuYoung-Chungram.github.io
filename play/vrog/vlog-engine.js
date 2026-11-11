// 하루 브이로그 영상 합성 및 재생 엔진 (V-1 ~ V-10)
class VlogEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 1280;
    this.height = 720;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.animFrame = null;
    this.isPlaying = false;
    this.audioElements = [];
  }

  stop() {
    this.isPlaying = false;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.audioElements.forEach((a) => {
      try {
        a.pause();
        a.currentTime = 0;
      } catch (_) {}
    });
    this.audioElements = [];
  }

  formatKoreanDateFull(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return `${y}년 ${m}월 ${d}일 ${days[dt.getDay()]}`;
  }

  formatKoreanTime(timestamp, timeZone) {
    try {
      return new Intl.DateTimeFormat('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timeZone || undefined
      }).format(new Date(timestamp));
    } catch (_) {
      const d = new Date(timestamp);
      const h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, '0');
      const ampm = h < 12 ? '오전' : '오후';
      const h12 = h % 12 || 12;
      return `${ampm} ${h12}:${m}`;
    }
  }

  async loadImage(src) {
    if (!src) return null;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // 타임라인 구성 (V-4 첫 장면 2초 + 각 컷 2초/긴 글 3초 + V-8 0.3초 겹침)
  async buildTimeline(dateStr, cuts, settings) {
    const overlap = 0.3; // V-8: 0.3초 부드러운 겹침
    const profileImg = await this.loadImage(settings.profilePhoto);
    const scenes = [];

    // 첫 장면 (V-4): 2초
    scenes.push({
      type: 'intro',
      duration: 2.0,
      startTime: 0,
      endTime: 2.0,
      profileImg,
      name: settings.name || '사용자',
      dateFullText: this.formatKoreanDateFull(dateStr),
      themeColor: settings.themeColor || '#1E3A5F'
    });

    let cursor = 2.0;
    for (let i = 0; i < cuts.length; i++) {
      const cut = cuts[i];
      const img = await this.loadImage(cut.imageDataUrl);
      const text = (cut.caption || '').trim();
      // V-6: 글이 긴 컷(18자 이상 또는 두 줄)은 3초로 늘린다
      const isLongText = text.length >= 18 || text.includes('\n');
      const duration = isLongText ? 3.0 : 2.0;
      const startTime = Math.max(0, cursor - overlap);
      const endTime = startTime + duration;
      cursor = endTime;

      scenes.push({
        type: 'cut',
        index: i,
        cut,
        img,
        text,
        timeLabel: this.formatKoreanTime(
          cut.timestamp,
          settings.useLocalTimezone ? undefined : settings.fixedTimezone
        ),
        themeColor: settings.themeColor || '#1E3A5F',
        duration,
        startTime,
        endTime,
        audioTriggered: false
      });
    }

    return {
      scenes,
      totalDuration: cursor,
      overlap
    };
  }

  // 첫 장면 그리기 (V-4)
  drawIntroScene(ctx, scene, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // 바탕색 (S-3, V-4)
    ctx.fillStyle = scene.themeColor;
    ctx.fillRect(0, 0, this.width, this.height);

    // 장식 테두리
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, this.width - 96, this.height - 96);

    const centerX = this.width / 2;
    const avatarY = 250;
    const radius = 92;

    // 프로필 사진 원형 (S-1, V-4)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, avatarY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (scene.profileImg) {
      const img = scene.profileImg;
      const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, centerX - w / 2, avatarY - h / 2, w, h);
    } else {
      ctx.fillStyle = '#FFFDF9';
      ctx.fillRect(centerX - radius, avatarY - radius, radius * 2, radius * 2);
      ctx.fillStyle = scene.themeColor;
      ctx.font = 'bold 84px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((scene.name || '나')[0], centerX, avatarY + 4);
    }
    ctx.restore();

    // 원형 흰 테두리
    ctx.beginPath();
    ctx.arc(centerX, avatarY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // 이름과 날짜 (V-4: "정구영의 하루, 2026년 11월 11일 수요일")
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 64px "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    ctx.fillText(`${scene.name}의 하루`, centerX, 435);

    ctx.font = 'bold 42px "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    ctx.fillText(scene.dateFullText, centerX, 520);

    ctx.restore();
  }

  // 컷 장면 그리기 (V-2, V-3, V-5, V-6, T-5)
  drawCutScene(ctx, scene, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // 바탕 (V-3: 세로로 찍은 컷 양옆 여백은 프로필 바탕색으로 채운다)
    ctx.fillStyle = scene.themeColor;
    ctx.fillRect(0, 0, this.width, this.height);

    const img = scene.img;
    if (img) {
      const isPortrait = img.height > img.width;
      if (!isPortrait) {
        // V-2: 가로로 찍은 컷은 화면을 가득 채운다
        const scale = Math.max(this.width / img.width, this.height / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const dx = (this.width - drawW) / 2;
        const dy = (this.height - drawH) / 2;
        ctx.drawImage(img, dx, dy, drawW, drawH);
      } else {
        // V-3: 세로로 찍은 컷은 잘라내지 않고 전체가 보이도록 줄여 가운데에 놓는다
        const scale = Math.min(this.width / img.width, this.height / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const dx = (this.width - drawW) / 2;
        const dy = (this.height - drawH) / 2;

        // 사진 가장자리 구분선
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(dx - 4, 0, drawW + 8, this.height);
        ctx.drawImage(img, dx, dy, drawW, drawH);
      }
    }

    // V-5: 각 컷의 구석(우측 상단)에 찍은 시각을 작게 표시한다
    const timeText = scene.timeLabel;
    ctx.font = 'bold 30px "Pretendard", "Apple SD Gothic Neo", sans-serif';
    const timeMetrics = ctx.measureText(timeText);
    const padX = 20;
    const boxW = timeMetrics.width + padX * 2;
    const boxH = 52;
    const boxX = this.width - boxW - 28;
    const boxY = 26;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    this.roundRect(ctx, boxX, boxY, boxW, boxH, 12);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeText, boxX + boxW / 2, boxY + boxH / 2 + 1);

    // T-2, T-5, V-6: 글을 넣은 컷은 아래쪽에 어두운 바탕 띠 + 큰 흰색 자막 표시 (최대 2줄)
    if (scene.text) {
      const lines = this.wrapSubtitleLines(scene.text, 22);
      const barHeight = lines.length > 1 ? 156 : 104;
      const barY = this.height - barHeight;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
      ctx.fillRect(0, barY, this.width, barHeight);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 42px "Pretendard", "Apple SD Gothic Neo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (lines.length === 1) {
        ctx.fillText(lines[0], this.width / 2, barY + barHeight / 2 + 2);
      } else {
        ctx.fillText(lines[0], this.width / 2, barY + 50);
        ctx.fillText(lines[1], this.width / 2, barY + 108);
      }
    }

    ctx.restore();
  }

  wrapSubtitleLines(text, maxCharsPerLine = 20) {
    const manualLines = text.split('\n').map((s) => s.trim()).filter(Boolean);
    if (manualLines.length >= 2) {
      return [manualLines[0].slice(0, 22), manualLines[1].slice(0, 22)];
    }
    const single = manualLines[0] || '';
    if (single.length <= maxCharsPerLine) return [single];
    // 띄어쓰기 기준 두 줄 나눔
    let splitIdx = single.lastIndexOf(' ', maxCharsPerLine);
    if (splitIdx <= 4) splitIdx = maxCharsPerLine;
    const line1 = single.slice(0, splitIdx).trim();
    const line2 = single.slice(splitIdx).trim();
    return [line1, line2];
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 특정 시각(t초) 프레임을 캔버스에 렌더링 (V-8 0.3초 디졸브 겹침 반영)
  renderFrameAt(timeline, t, triggerAudio = false) {
    const { scenes, overlap } = timeline;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const activeScenes = scenes.filter((s) => t >= s.startTime && t <= s.endTime + 0.05);
    if (activeScenes.length === 0 && scenes.length > 0) {
      const last = scenes[scenes.length - 1];
      this.drawScene(last, 1);
      return;
    }

    for (let i = 0; i < activeScenes.length; i++) {
      const scene = activeScenes[i];
      let alpha = 1;
      // 이전 장면과 겹치는 첫 0.3초 동안 부드럽게 페이드인 (V-8)
      if (scene.startTime > 0 && t - scene.startTime < overlap) {
        alpha = Math.max(0, Math.min(1, (t - scene.startTime) / overlap));
      }
      this.drawScene(scene, alpha);

      // V-7: 마이크를 켜고 찍은 컷은 현장 소리가 나온다
      if (
        triggerAudio &&
        scene.type === 'cut' &&
        !scene.audioTriggered &&
        scene.cut.audioDataUrl &&
        t >= scene.startTime
      ) {
        scene.audioTriggered = true;
        this.playCutAudio(scene.cut.audioDataUrl);
      }
    }
  }

  drawScene(scene, alpha) {
    if (scene.type === 'intro') {
      this.drawIntroScene(this.ctx, scene, alpha);
    } else {
      this.drawCutScene(this.ctx, scene, alpha);
    }
  }

  playCutAudio(audioDataUrl) {
    try {
      const audio = new Audio(audioDataUrl);
      this.audioElements.push(audio);
      audio.play().catch(() => {});
    } catch (_) {}
  }

  // 브이로그 영상 생성 + 녹화 (V-1 ~ V-10)
  async generateVlog(dateStr, cuts, settings, onProgress) {
    this.stop();
    const timeline = await this.buildTimeline(dateStr, cuts, settings);
    const totalDuration = timeline.totalDuration;

    // 첫 프레임 미리 그리기
    this.renderFrameAt(timeline, 0, false);

    // MediaRecorder 지원 확인 및 실시간 합성 녹화
    let recordedBlob = null;
    let mimeType = 'video/webm';
    if (typeof MediaRecorder !== 'undefined' && this.canvas.captureStream) {
      const candidates = [
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      for (const c of candidates) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) {
          mimeType = c;
          break;
        }
      }
    }

    return new Promise((resolve) => {
      let recorder = null;
      const chunks = [];

      try {
        if (typeof MediaRecorder !== 'undefined' && this.canvas.captureStream) {
          const stream = this.canvas.captureStream(30);
          recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 2500000
          });
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };
        }
      } catch (_) {
        recorder = null;
      }

      if (recorder) {
        try {
          recorder.start(100);
        } catch (_) {
          recorder = null;
        }
      }

      this.isPlaying = true;
      const startPerf = performance.now();

      const step = (now) => {
        if (!this.isPlaying) return;
        const elapsed = (now - startPerf) / 1000;
        const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
        if (onProgress) onProgress(pct, elapsed, totalDuration);

        this.renderFrameAt(timeline, Math.min(elapsed, totalDuration), true);

        if (elapsed < totalDuration) {
          this.animFrame = requestAnimationFrame(step);
        } else {
          this.isPlaying = false;
          if (onProgress) onProgress(100, totalDuration, totalDuration);

          if (recorder && recorder.state !== 'inactive') {
            recorder.onstop = () => {
              recordedBlob = new Blob(chunks, { type: mimeType });
              resolve({
                blob: recordedBlob,
                mimeType,
                timeline,
                totalDuration
              });
            };
            try {
              recorder.stop();
            } catch (_) {
              resolve({ blob: null, mimeType, timeline, totalDuration });
            }
          } else {
            resolve({ blob: null, mimeType, timeline, totalDuration });
          }
        }
      };

      this.animFrame = requestAnimationFrame(step);
    });
  }

  // 만들어진 브이로그 다시 재생
  async playTimeline(timeline, onTick, onEnded) {
    this.stop();
    timeline.scenes.forEach((s) => {
      s.audioTriggered = false;
    });
    this.isPlaying = true;
    const startPerf = performance.now();
    const total = timeline.totalDuration;

    const loop = (now) => {
      if (!this.isPlaying) return;
      const elapsed = (now - startPerf) / 1000;
      this.renderFrameAt(timeline, Math.min(elapsed, total), true);
      if (onTick) onTick(Math.min(elapsed, total), total);

      if (elapsed < total) {
        this.animFrame = requestAnimationFrame(loop);
      } else {
        this.isPlaying = false;
        if (onEnded) onEnded();
      }
    };
    this.animFrame = requestAnimationFrame(loop);
  }
}

window.VlogEngine = VlogEngine;

