// 2022 개정 초등 사회과 교육과정 [6사10-01], [6사10-02], [6사09-01] 연계 모덕마블
const board = document.querySelector('#board');
const rollButton = document.querySelector('#roll-button');
const dieOne = document.querySelector('#die-one');
const rollSum = document.querySelector('#roll-sum');
const timer = document.querySelector('#timer');
const roundNumber = document.querySelector('#round-number');
const maxRoundText = document.querySelector('#max-round-text');
const targetRoundDisplay = document.querySelector('#target-round-display');
const centerMessage = document.querySelector('#center-message');
const playerRows = document.querySelectorAll('.player-row[data-player-row]');
const playerCountNum = document.querySelector('#player-count-num');
const dieOneFace = dieOne.querySelector('.front');
const setupModal = document.querySelector('#setup-modal');
const quizModal = document.querySelector('#quiz-modal');
const infoModal = document.querySelector('#info-modal');
const gameOverModal = document.querySelector('#game-over-modal');
const nameFields = document.querySelector('#name-fields');
const quizEyebrow = document.querySelector('#quiz-eyebrow');
const quizTitle = document.querySelector('#quiz-title');
const quizQuestion = document.querySelector('#quiz-question');
const quizOptions = document.querySelector('#quiz-options');
const quizResult = document.querySelector('#quiz-result');
const quizExplanation = document.querySelector('#quiz-explanation');
const purchaseActions = document.querySelector('#purchase-actions');
const purchaseQuestion = document.querySelector('#purchase-question');
const buyProperty = document.querySelector('#buy-property');
const skipProperty = document.querySelector('#skip-property');
const specialActions = document.querySelector('#special-actions');
const claimSpecial = document.querySelector('#claim-special');
const currentTurnAvatar = document.querySelector('#current-turn-avatar');
const currentTurnLabel = document.querySelector('#current-turn-label');
const currentTurnName = document.querySelector('#current-turn-name');
const logList = document.querySelector('#log-list');
const boardLegend = document.querySelector('#board-legend');
const soundToggleBtn = document.querySelector('#sound-toggle');
const closeInfoBtn = document.querySelector('#close-info');
const restartGameBtn = document.querySelector('#restart-game');

let selectedPlayerCount = 2;
let targetMaxRounds = 10;
let soundEnabled = true;
let gamePlayers = [];
let currentPlayerIndex = 0;
let activeQuizSpace = -1;
let currentRound = 1;
let isGameFinished = false;
let isMoving = false;
const startingMoney = 200000;
const salaryBonus = 50000;

// Web Audio API 사운드 합성기
class SoundManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playRoll() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160 + Math.random() * 80, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
      }, i * 65);
    }
  }

  playStep() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playCorrect() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (딩동댕동)
    notes.forEach((freq, index) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
      }, index * 90);
    });
  }

  playIncorrect() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playCoin() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    [987.77, 1318.51].forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
      }, i * 80);
    });
  }

  playFanfare() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
      }, idx * 130);
    });
  }
}

const sounds = new SoundManager();

// 소리 토글 버튼
soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggleBtn.textContent = soundEnabled ? '🔊 소리 ON' : '🔇 소리 OFF';
  if (soundEnabled) sounds.playStep();
});

// 32개 보드칸 데이터 (4개 특수칸 + 28개 국가)
const spaces = [
  // [0~7]
  { name: '출발지', symbol: '🚩', type: 'special-start', tag: '시작점', isSpecial: true, cost: 0,
    desc: '세계 일주의 출발지입니다. 이곳을 지나가거나 도착할 때마다 세계 일주 월급 ₩50,000을 받습니다.' },
  { name: '한국', symbol: '◒', type: 'accent-blue', tag: '온대계절풍', cost: 70000,
    desc: '사계절이 뚜렷하고 여름에 고온다우한 온대 계절풍 기후입니다. 배산임수의 전통 취락과 벼농사가 발달했습니다.',
    quiz: {
      question: '우리나라(한국)의 기후 특징으로 알맞은 것은 무엇일까요?',
      options: ['사계절의 변화가 뚜렷하고 여름에 덥고 비가 많이 온다.', '일 년 내내 눈과 얼음으로 덮여 있다.', '비가 거의 오지 않아 사막이 넓게 펼쳐져 있다.'],
      answer: '사계절의 변화가 뚜렷하고 여름에 덥고 비가 많이 온다.',
      explanation: '한국은 중위도 온대 계절풍 기후로 사계절이 뚜렷하며, 여름에는 남동 계절풍의 영향으로 덥고 비가 많이 내립니다.'
    }
  },
  { name: '일본', symbol: '✿', type: 'accent-blue', tag: '화산/온천', cost: 65000,
    desc: '판의 경계에 위치하여 화산과 지진이 잦지만, 풍부한 온천과 화산 지형을 활용한 관광 산업이 크게 발달했습니다.',
    quiz: {
      question: '일본에서 화산 지형과 지열을 활용하여 세계적으로 유명하게 발달한 관광 문화는?',
      options: ['온천 문화', '사파리 투어', '열대 플랜테이션'],
      answer: '온천 문화',
      explanation: '일본은 판의 경계에 위치하여 화산과 지진이 자주 발생하지만, 풍부한 화산 지형과 지열을 이용한 온천 관광이 크게 발달했습니다.'
    }
  },
  { name: '베트남', symbol: '✦', type: 'accent-blue', tag: '열대계절풍', cost: 50000,
    desc: '메콩강 삼각주와 고온다습한 열대 몬순 기후를 바탕으로 1년에 2~3회 벼를 수확하는 쌀 농사의 중심지입니다.',
    quiz: {
      question: '베트남의 메콩강 삼각주와 같은 비옥한 평야와 열대 기후에서 활발하게 이루어지는 농업은?',
      options: ['벼농사(쌀 농사)', '밀 유목', '순록 사육'],
      answer: '벼농사(쌀 농사)',
      explanation: '베트남은 고온 다습한 열대 몬순 기후와 큰 하천의 삼각주 평야를 활용하여 1년에 2~3번 벼를 수확하는 쌀 농사가 매우 발달했습니다.'
    }
  },
  { name: '태국', symbol: '◆', type: 'accent-blue', tag: '열대/하천', cost: 55000,
    desc: '짜오프라야강을 따라 운하와 하천 교통이 발달하여 배 위에서 과일과 음식을 거래하는 수상 시장 문화가 있습니다.',
    quiz: {
      question: '태국처럼 비가 많이 오고 하천이 발달한 열대 지역에서 물 위에서 물건을 사고파는 시장은?',
      options: ['수상 시장', '오아시스 시장', '빙하 시장'],
      answer: '수상 시장',
      explanation: '태국은 하천과 운하 교통이 발달하여 배 위에서 과일, 음식, 채소 등을 거래하는 수상 시장이 전통 생활 문화로 자리잡았습니다.'
    }
  },
  { name: '필리핀', symbol: '◇', type: 'accent-blue', tag: '해안/환경', cost: 45000,
    desc: '산호초와 아름다운 모래사장이 발달한 해안 관광지입니다. 환경 보전을 위해 일시 폐쇄 정화 작업을 한 보라카이가 유명합니다.',
    quiz: {
      question: '필리핀 보라카이섬이 아름다운 해안 관광지로서 지속되기 위해 일시 폐쇄했던 주된 이유는?',
      options: ['관광객 쓰레기와 환경오염 정화를 위해', '지진 발생으로 지형이 사라져서', '사막화가 급속히 진행되어서'],
      answer: '관광객 쓰레기와 환경오염 정화를 위해',
      explanation: '교과서에 소개된 보라카이섬은 지나친 관광 개발과 쓰레기 오염 문제를 해결하고 자연을 보전하기 위해 일시적으로 섬을 폐쇄하고 정화 작업을 했습니다.'
    }
  },
  { name: '인도네시아', symbol: '●', type: 'accent-blue', tag: '열대우림', cost: 50000,
    desc: '적도 부근의 열대 우림 기후로 지열과 해충을 피하기 위한 고상 가옥과 열대 고무/야자 플랜테이션이 발달했습니다.',
    quiz: {
      question: '열대 우림 기후 지역에서 땅의 열기와 습기, 해충을 피하기 위해 바닥을 띄워 지은 집은?',
      options: ['고상 가옥', '통나무집', '이글루'],
      answer: '고상 가옥',
      explanation: '인도네시아 등 열대 기후 지역 주민들은 지면에서 올라오는 뜨거운 열기와 습기, 뱀과 해충을 막기 위해 기둥을 세워 바닥을 높인 고상 가옥을 짓습니다.'
    }
  },
  { name: '인도', symbol: '↗', type: 'accent-blue', tag: '몬순/하천', cost: 60000,
    desc: '열대 계절풍의 영향을 받으며, 갠지스강을 중심으로 농업과 힌두교 문화가 밀접하게 연결되어 있습니다.',
    quiz: {
      question: '인도 주민들이 성스럽게 여기며 삶의 터전이자 종교적 목욕 의식을 치르는 대표적인 하천은?',
      options: ['갠지스강', '아마존강', '라인강'],
      answer: '갠지스강',
      explanation: '갠지스강은 인도 사람들에게 농업용수와 생활용수를 공급할 뿐만 아니라, 힌두교도들이 성스럽게 여기는 대표적인 하천입니다.'
    }
  },

  // [8]
  { name: '기후 퀴즈', symbol: '🌍', type: 'special-climate', tag: '기후탐험', isSpecial: true, cost: 0,
    desc: '세계의 기후(열대, 건조, 온대, 냉대, 한대, 고산)에 대한 탐구 퀴즈를 풀고 장학금 ₩30,000을 획득하는 특수칸입니다.' },

  // [9~15]
  { name: '이탈리아', symbol: '●', type: 'accent-yellow', tag: '지중해성', cost: 65000,
    desc: '여름이 덥고 건조한 지중해성 기후로, 잎이 단단하고 두꺼운 올리브, 포도, 오렌지 등의 수목 농업이 활발합니다.',
    quiz: {
      question: '이탈리아와 같은 지중해성 기후 지역에서 여름의 고온 건조한 날씨를 견디며 잘 자라는 작물은?',
      options: ['올리브, 포도, 오렌지', '카사바, 얌', '순록, 이끼'],
      answer: '올리브, 포도, 오렌지',
      explanation: '지중해 연안은 여름이 덥고 건조하므로 잎이 작고 두꺼우며 단단한 껍질을 가진 올리브, 포도, 코르크 등의 수목 농업이 발달했습니다.'
    }
  },
  { name: '그리스', symbol: '△', type: 'accent-yellow', tag: '지중해해안', cost: 60000,
    desc: '강렬한 여름 햇빛을 반사하기 위해 외벽을 하얗게 칠한 가옥과 아름다운 지중해 섬 관광이 발달했습니다.',
    quiz: {
      question: '그리스 산토리니의 집들이 햇빛을 반사하기 위해 주로 사용하는 벽의 색깔은?',
      options: ['하얀색', '검은색', '빨간색'],
      answer: '하얀색',
      explanation: '지중해성 기후의 강렬한 여름 햇빛과 열기를 반사하여 실내를 시원하게 유지하기 위해 집 외벽을 하얗게 칠합니다.'
    }
  },
  { name: '프랑스', symbol: '✦', type: 'accent-yellow', tag: '서안해양성', cost: 75000,
    desc: '편서풍과 난류의 영향으로 연중 온화하며 고른 강수량을 보이는 서안 해양성 기후와 넓은 곡창 지대가 발달했습니다.',
    quiz: {
      question: '서부 유럽 프랑스에 나타나는 서안 해양성 기후의 가장 큰 특징은?',
      options: ['편서풍과 난류의 영향으로 연중 온화하고 비가 고르게 내린다.', '여름에 비가 전혀 오지 않고 사막이 된다.', '일 년 내내 영하 40도 이하로 춥다.'],
      answer: '편서풍과 난류의 영향으로 연중 온화하고 비가 고르게 내린다.',
      explanation: '바다에서 불어오는 편서풍과 따뜻한 북대서양 해류 덕분에 여름은 서늘하고 겨울은 온화하며 연중 강수량이 고릅니다.'
    }
  },
  { name: '영국', symbol: '◇', type: 'accent-yellow', tag: '서안해양성', cost: 70000,
    desc: '바다의 영향으로 흐리고 비가 자주 내려 우산, 트렌치코트, 티(Tea) 문화가 일상생활에 정착되었습니다.',
    quiz: {
      question: '영국 런던에서 흐린 날이 많고 비가 자주 내려 일상생활에서 필수품이 된 물건은?',
      options: ['우산과 트렌치코트', '썰매', '선인장 모자'],
      answer: '우산과 트렌치코트',
      explanation: '영국은 연중 바다 습기의 영향으로 안개와 보슬비가 자주 내려 우산과 방수 코트(트렌치코트) 문화가 발달했습니다.'
    }
  },
  { name: '독일', symbol: '♢', type: 'accent-yellow', tag: '하천교통', cost: 65000,
    desc: '유럽의 중심부를 관통하는 라인강을 따라 수상 화물 운송과 공업 도시들이 번영하였습니다.',
    quiz: {
      question: '독일을 가로지르며 내륙 수로 교통과 산업 발달의 대동맥 역할을 해온 유명 하천은?',
      options: ['라인강', '나일강', '미시시피강'],
      answer: '라인강',
      explanation: '라인강은 유럽 여러 나라를 연결하는 국제 하천으로, 화물선이 운항하는 수상 교통과 하천 주변 산업이 크게 발달했습니다.'
    }
  },
  { name: '노르웨이', symbol: '▣', type: 'accent-yellow', tag: '피오르해안', cost: 65000,
    desc: '빙하가 깎아 만든 U자 골짜기에 바닷물이 유입된 웅장한 피오르 해안과 연어 양식업이 유명합니다.',
    quiz: {
      question: '노르웨이에서 빙하의 침식 작용으로 만들어진 좁고 깊은 골짜기에 바닷물이 들어온 해안 지형은?',
      options: ['피오르', '갯벌', '사구'],
      answer: '피오르',
      explanation: '노르웨이의 피오르(Fiord)는 과거 빙하가 깎아 만든 U자곡에 바닷물이 차오른 지형으로, 웅장한 절벽 경관 관광과 연어 양식이 발달했습니다.'
    }
  },
  { name: '아이슬란드', symbol: '☕', type: 'accent-yellow', tag: '화산/지열', cost: 60000,
    desc: '빙하와 화산이 공존하는 섬나라로, 풍부한 지하 지열 에너지를 이용한 친환경 난방과 온실 농업을 합니다.',
    quiz: {
      question: '‘불과 얼음의 나라’로 불리며, 풍부한 화산 지열을 이용해 난방과 온실 농업을 하는 나라는?',
      options: ['아이슬란드', '사우디아라비아', '케냐'],
      answer: '아이슬란드',
      explanation: '아이슬란드는 빙하와 화산이 공존하는 곳으로, 땅속의 뜨거운 지하수와 마그마 열을 활용한 친환경 지열 발전과 난방이 매우 발달했습니다.'
    }
  },

  // [16]
  { name: '지형 퀴즈', symbol: '⛰️', type: 'special-landform', tag: '지형탐험', isSpecial: true, cost: 0,
    desc: '산지, 하천, 해안, 화산 등 지구상의 다양한 지형 경관 퀴즈를 풀고 장학금 ₩30,000을 획득하는 특수칸입니다.' },

  // [17~23]
  { name: '스위스', symbol: '△', type: 'accent-yellow', tag: '알프스고산', cost: 70000,
    desc: '험준한 알프스 산지 지형을 산악 톱니바퀴 열차와 케이블카로 극복하여 세계적인 산악 관광국이 되었습니다.',
    quiz: {
      question: '스위스 알프스 산지 지형에서 눈 덮인 산을 오르내리며 관광객을 수송하는 대표적인 교통수단은?',
      options: ['산악 열차와 케이블카', '낙타 대상', '대형 유조선'],
      answer: '산악 열차와 케이블카',
      explanation: '스위스는 험준한 알프스 산지를 극복하기 위해 톱니바퀴 산악 열차와 케이블카를 건설하여 세계적인 산악 관광 대국이 되었습니다.'
    }
  },
  { name: '이집트', symbol: '◌', type: 'accent-mint', tag: '건조/사막', cost: 55000,
    desc: '사막 기후로 일교차가 커서 두꺼운 흙벽돌과 작은 창문의 가옥을 짓고 나일강 주변에서 관개 농업을 합니다.',
    quiz: {
      question: '이집트와 같은 건조 기후 지역에서 낮의 뜨거운 열기와 밤의 추위를 막기 위해 짓는 집의 특징은?',
      options: ['벽이 두껍고 창문이 작으며 지붕이 평평하다.', '유리로 사방이 트여 있다.', '벽을 얇은 천으로만 만든다.'],
      answer: '벽이 두껍고 창문이 작으며 지붕이 평평하다.',
      explanation: '건조 기후 지역은 비가 거의 오지 않고 일교차가 매우 크므로, 흙벽돌로 두꺼운 벽을 쌓고 모래바람과 햇빛을 막기 위해 창문을 작게 만듭니다.'
    }
  },
  { name: '사우디', symbol: '≈', type: 'accent-mint', tag: '오아시스', cost: 60000,
    desc: '광활한 사막 가운데 지하수가 솟아나는 오아시스를 중심으로 대추야자를 재배하고 촌락을 형성합니다.',
    quiz: {
      question: '사막 지대에서 지하수가 솟아나와 물을 얻을 수 있어 대추야자를 재배하고 사람이 모여 사는 곳은?',
      options: ['오아시스', '피오르', '빙하'],
      answer: '오아시스',
      explanation: '사막 가운데 물이 있는 오아시스 주변에서는 대추야자나 밀 등을 재배하는 오아시스 농업이 이루어지고 취락이 형성됩니다.'
    }
  },
  { name: '케냐', symbol: '✦', type: 'accent-mint', tag: '열대사바나', cost: 50000,
    desc: '건기와 우기가 뚜렷한 사바나 초원 지대에서 야생동물을 보호하며 진행하는 사파리 생태 관광이 활발합니다.',
    quiz: {
      question: '케냐의 열대 사바나 기후 지역에서 사자, 얼룩말, 기린 등 야생동물을 관찰하는 관광 활동은?',
      options: ['사파리 관광', '빙하 트레킹', '스키 투어'],
      answer: '사파리 관광',
      explanation: '건기와 우기가 뚜렷한 열대 사바나 초원 지대에는 다양한 초식동물과 맹수가 서식하여 국립공원을 둘러보는 사파리 생태 관광이 활발합니다.'
    }
  },
  { name: '콩고(공)', symbol: '◆', type: 'accent-mint', tag: '콩고강어업', cost: 45000,
    desc: '콩고강 급류의 바위틈에 거대한 대나무 원뿔형 통발 어구를 설치해 물고기를 잡는 전통 어업이 유명합니다.',
    quiz: {
      question: '교과서에 소개된 콩고강 급류에서 주민들이 물고기를 잡기 위해 사용하는 독특한 전통 어구는?',
      options: ['거대한 대나무 원뿔형 통발/그물', '다이너마이트', '얼음 낚싯대'],
      answer: '거대한 대나무 원뿔형 통발/그물',
      explanation: '콩고 민주 공화국 와게니아족 주민들은 콩고강 급류 바위틈에 거대한 나무 구조물과 대나무 원뿔형 통발을 설치해 물고기를 잡습니다.'
    }
  },
  { name: '모로코', symbol: '☾', type: 'accent-mint', tag: '사하라관문', cost: 50000,
    desc: '사하라 사막의 강한 자외선과 모래바람을 막기 위해 온몸을 헐렁하게 감싸는 전통 의상 젤라바를 입습니다.',
    quiz: {
      question: '모로코 등 북아프리카 건조 지역에서 강한 햇빛과 모래바람을 막기 위해 온몸을 감싸는 옷은?',
      options: ['젤라바(헐렁하고 긴 전통 옷)', '패딩 점퍼', '수영복'],
      answer: '젤라바(헐렁하고 긴 전통 옷)',
      explanation: '건조 기후 지역에서는 강한 자외선과 모래 먼지를 막고 땀 증발을 돕기 위해 온몸을 헐렁하게 감싸는 긴 옷을 입습니다.'
    }
  },
  { name: '네팔', symbol: '♧', type: 'accent-mint', tag: '히말라야', cost: 55000,
    desc: '세계 최고봉 에베레스트산이 있는 고산 지대로, 등산객의 안전한 등반을 돕는 셰르파의 터전입니다.',
    quiz: {
      question: '네팔 히말라야산맥의 에베레스트산을 오르는 등산객들의 짐을 나르고 길을 안내하는 고산 족은?',
      options: ['셰르파', '이누이트', '베두인'],
      answer: '셰르파',
      explanation: '네팔 고산 산지 지형에 사는 셰르파는 높은 해발 고도의 희박한 공기에 적응되어 등산객의 등반을 돕는 필수적인 역할을 합니다.'
    }
  },

  // [24]
  { name: '생태 쉼터', symbol: '🌿', type: 'special-eco', tag: '지구촌보호', isSpecial: true, cost: 0,
    desc: '지구촌 환경 보전 쉼터입니다. 자연을 가꾸고 환경을 지킨 보답으로 환경 보너스 ₩20,000을 받습니다.' },

  // [25~31]
  { name: '브라질', symbol: '●', type: 'accent-pink', tag: '이구아수/아마존', cost: 65000,
    desc: '세계 최대 하천인 아마존강과 세계 3대 폭포인 거대한 이구아수 폭포 지형 경관을 품고 있습니다.',
    quiz: {
      question: '브라질과 아르헨티나 국경에 위치한 거대한 폭포로, 세계 3대 폭포 중 하나인 지형 경관은?',
      options: ['이구아수 폭포', '나이아가라 폭포', '빅토리아 폭포'],
      answer: '이구아수 폭포',
      explanation: '이구아수 폭포는 거대한 하천 지형이 만들어낸 웅장한 폭포로, 유네스코 세계자연유산으로 지정된 세계적 관광 명소입니다.'
    }
  },
  { name: '페루', symbol: '◆', type: 'accent-pink', tag: '안데스고산', cost: 55000,
    desc: '해발 고도가 높은 안데스 고산 지대에서 알파카/라마 털로 짠 두꺼운 망토 모양 판초를 입고 생활합니다.',
    quiz: {
      question: '페루 안데스 고산 지대에서 춥고 일교차가 큰 날씨를 견디기 위해 입는 가운데 구멍이 뚫린 전통 옷은?',
      options: ['판초(Poncho)', '기모노', '사리'],
      answer: '판초(Poncho)',
      explanation: '해발 고도가 높은 안데스 고산 지대 주민들은 알파카나 라마의 털로 짠 두꺼운 망토 모양의 판초를 입어 체온을 유지합니다.'
    }
  },
  { name: '멕시코', symbol: '✦', type: 'accent-pink', tag: '열대/고산', cost: 50000,
    desc: '가뭄에 잘 견디는 옥수수를 주식으로 토르티야 등을 만들어 먹는 전통 음식 문화가 발달했습니다.',
    quiz: {
      question: '멕시코 등 아메리카 원산지로, 가뭄에 강해 전통 주식인 토르티야의 재료로 널리 쓰이는 작물은?',
      options: ['옥수수', '쌀', '대추야자'],
      answer: '옥수수',
      explanation: '옥수수는 멕시코 고대 문명 때부터 재배된 주식 작물로, 옥수숫가루를 반죽해 얇게 구운 토르티야는 대표적인 멕시코 전통 음식입니다.'
    }
  },
  { name: '미국', symbol: '△', type: 'accent-pink', tag: '평야/농업', cost: 80000,
    desc: '일리노이강 주변 등 비옥한 대평원에서 대형 농기계와 비행기를 활용한 대규모 기업적 농업을 합니다.',
    quiz: {
      question: '미국 일리노이강 주변 등 비옥한 대평원에서 대형 농기계와 비행기를 활용하여 이루어지는 농업 형태는?',
      options: ['대규모 상업적/기업적 농업', '전통 화전 농업', '계단식 논농사'],
      answer: '대규모 상업적/기업적 농업',
      explanation: '미국의 넓은 평야 지형에서는 트랙터, 콤바인, 비행기를 이용해 파종과 농약을 뿌리는 대규모 기업적 곡물 농업이 발달했습니다.'
    }
  },
  { name: '캐나다', symbol: '◇', type: 'accent-pink', tag: '냉대/침엽수', cost: 70000,
    desc: '겨울이 긴 냉대 기후로 타이가 침엽수림을 활용한 통나무집 건축과 목재/펄프 산업이 발달했습니다.',
    quiz: {
      question: '캐나다의 냉대 기후 지역에 넓게 펼쳐진 침엽수림(타이가)을 활용하여 발달한 대표적인 산업은?',
      options: ['임업 및 목재/펄프 가공업', '대추야자 재배업', '산호초 양식업'],
      answer: '임업 및 목재/펄프 가공업',
      explanation: '냉대 기후 지역의 타이가(침엽수림)는 목재가 단단하고 질이 좋아 통나무집 건축과 가구, 종이 펄프 제조 산업이 크게 발달했습니다.'
    }
  },
  { name: '호주', symbol: '♧', type: 'accent-blue', tag: '산호초해안', cost: 70000,
    desc: '북동부 해안에 세계 최대 산호초 지대인 그레이트 배리어 리프가 있어 해양 생태계 관광이 발달했습니다.',
    quiz: {
      question: '호주 북동부 해안에 위치한 세계 최대의 산호초 지대로 해양 생태계의 보고인 곳은?',
      options: ['그레이트 배리어 리프(대보초)', '사하라 사막', '에베레스트산'],
      answer: '그레이트 배리어 리프(대보초)',
      explanation: '그레이트 배리어 리프는 수많은 산호초와 해양 생물이 서식하는 세계 최대의 해안 지형으로 스쿠버 다이빙 등 관광 명소입니다.'
    }
  },
  { name: '뉴질랜드', symbol: '▤', type: 'accent-blue', tag: '빙하/화산', cost: 65000,
    desc: '화산 활동으로 뿜어져 나오는 간헐천과 빙하 호수가 공존하는 경이로운 자연 지형의 나라입니다.',
    quiz: {
      question: '뉴질랜드에서 화산 활동으로 인해 지하에서 뜨거운 온천수와 수증기가 주기적으로 뿜어져 나오는 지형은?',
      options: ['간헐천', '사구', '염전'],
      answer: '간헐천',
      explanation: '뉴질랜드 북섬 로토루아 등 화산 지대에서는 간헐천과 머드 풀이 발달하여 독특한 자연 지형 관광 자원으로 활용됩니다.'
    }
  }
];

const climateSpecialQuizzes = [
  {
    question: '지구상에서 적도에서 극지방으로 갈수록 기온이 점차 낮아지는 근본적인 이유는?',
    options: ['지구가 둥글어 위도에 따라 햇볕을 받는 양(일사량)이 다르기 때문', '극지방에 얼음이 너무 많아서', '적도 지방에 바람이 불지 않아서'],
    answer: '지구가 둥글어 위도에 따라 햇볕을 받는 양(일사량)이 다르기 때문',
    explanation: '지구는 둥근 구형이므로 저위도(적도)는 햇볕을 수직으로 많이 받고, 고위도(극지방)는 비스듬히 적게 받아 기온 차이가 생깁니다.'
  },
  {
    question: '북극과 남극 주변의 한대 기후(툰드라)에서 여름철 얼었던 땅이 녹을 때 건물이 기울어지지 않게 하는 건축 방식은?',
    options: ['땅속 깊은 영구 동토층까지 단단한 말뚝(기둥)을 박아 짓는다.', '얼음 위에 그대로 집을 얹는다.', '모래로 바닥을 덮는다.'],
    answer: '땅속 깊은 영구 동토층까지 단단한 말뚝(기둥)을 박아 짓는다.',
    explanation: '한대 툰드라 지역은 여름에 표면 흙이 녹아 질퍽해지므로, 녹지 않는 깊은 영구 동토층까지 말뚝을 깊이 박아 가옥의 붕괴를 방지합니다.'
  },
  {
    question: '남아메리카 안데스산맥이나 아프리카 킬리만자로처럼 해발 고도가 높아 저위도 열대 지방인데도 연중 봄처럼 온화한 기후는?',
    options: ['고산 기후', '건조 기후', '냉대 기후'],
    answer: '고산 기후',
    explanation: '해발 고도가 1,000m 높아질 때마다 기온이 약 6.5℃씩 낮아지므로, 열대 지방의 높은 산지에서는 사계절 봄 날씨 같은 상춘(常春) 기후가 나타납니다.'
  }
];

const landformSpecialQuizzes = [
  {
    question: '다음 중 강물이 바다나 호수로 흘러들 때 유속이 느려지면서 흙과 모래가 쌓여 형성된 비옥한 평야 지형은?',
    options: ['삼각주(델타)', '피오르', '사구'],
    answer: '삼각주(델타)',
    explanation: '삼각주는 하천 하구에 퇴적물이 쌓여 삼각형 모양으로 만들어진 비옥한 평야로, 벼농사와 농업이 크게 발달합니다.'
  },
  {
    question: '해안가에 갯벌이 넓게 펼쳐진 지형에서 바닷물을 가두어 햇빛과 바람으로 증발시켜 소금을 얻는 시설은?',
    options: ['염전', '양식장', '수력 발전소'],
    answer: '염전',
    explanation: '조수 간만의 차가 크고 갯벌이 발달한 해안에서는 바닷물에서 천일염을 생산하는 염전이 발달합니다.'
  },
  {
    question: '산 정상에 화산 분화구가 함몰되거나 빗물이 고여 만들어진 호수를 무엇이라고 부를까요? (예: 백두산 천지, 한라산 백록담)',
    options: ['칼데라호 / 화구호', '피오르호', '오아시스'],
    answer: '칼데라호 / 화구호',
    explanation: '화산 폭발 후 분화구에 물이 고여 형성된 호수로, 독특하고 웅장한 자연 경관을 형성합니다.'
  }
];

const landmarkPhotos = [
  'photo-1548919973-5cef591cdbc9', // 한국
  'photo-1493976040374-85c8e12f0c0e', // 일본
  'photo-1528127269322-539801943592', // 베트남
  'photo-1506665531195-3566af2b4dfa', // 태국
  'photo-1518684079-3c830dcef090', // 필리핀
  'photo-1537996194471-e657df975ab4', // 인도네시아
  'photo-1524231757912-21f4fe3a7200', // 인도
  '', // 기후
  'photo-1533105079780-92b9be482077', // 이탈리아
  'photo-1533105079780-92b9be482077', // 그리스
  'photo-1502602898657-3e91760cbb34', // 프랑스
  'photo-1513635269975-59663e0ac1ad', // 영국
  'photo-1467269204594-9661b134dd2b', // 독일
  'photo-1519681393784-d120267933ba', // 노르웨이
  'photo-1500530855697-b586d89ba3ee', // 아이슬란드
  '', // 지형
  'photo-1530789253388-582c481c54b0', // 스위스
  'photo-1555993539-1732b0258235', // 이집트
  'photo-1518638150340-f706e86654de', // 사우디
  'photo-1516026672322-bc52d61a55d5', // 케냐
  'photo-1483729558449-99ef09a8c325', // 콩고
  'photo-1485738422979-f5c462d49f74', // 모로코
  'photo-1587595431973-160d0d94add1', // 네팔
  '', // 생태
  'photo-1483729558449-99ef09a8c325', // 브라질
  'photo-1526778548025-fa2f459cd5c1', // 페루
  'photo-1518638150340-f706e86654de', // 멕시코
  'photo-1485738422979-f5c462d49f74', // 미국
  'photo-1503614472-8c93d56e92ce', // 캐나다
  'photo-1523482580672-f109ba8cb9be', // 호주
  'photo-1469521669194-babb45599def'  // 뉴질랜드
];

// 보드판 외곽 인덱스 (9x9 둘레 32칸)
const route = [];
for (let column = 0; column < 9; column += 1) route.push(column);
for (let row = 1; row < 9; row += 1) route.push(row * 9 + 8);
for (let column = 7; column >= 0; column -= 1) route.push(8 * 9 + column);
for (let row = 7; row >= 1; row -= 1) route.push(row * 9);

const tileElements = [];
const perimeterSpaces = new Map(spaces.map((space, index) => [route[index], { ...space, spaceIndex: index }]));

// 보드 타일 생성
for (let index = 0; index < 81; index += 1) {
  const spaceInfo = perimeterSpaces.get(index);
  const tile = document.createElement('div');
  tile.dataset.gridIndex = index;

  if (!spaceInfo) {
    tile.className = 'tile empty';
  } else {
    tile.className = `tile ${spaceInfo.type} ${spaceInfo.isSpecial ? 'special-tile ' + spaceInfo.type : 'photo-tile'}`;
    tile.dataset.space = spaceInfo.spaceIndex;

    if (!spaceInfo.isSpecial) {
      const photoId = landmarkPhotos[spaceInfo.spaceIndex] || 'photo-1500530855697-b586d89ba3ee';
      tile.style.backgroundImage = `url("https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=400&q=80")`;
    }

    const tagHtml = spaceInfo.tag ? `<span class="tile-category-tag">${spaceInfo.tag}</span>` : '';
    const badgeHtml = spaceInfo.isSpecial ? `<span class="special-badge">${spaceInfo.symbol}</span>` : '';
    const nameClass = spaceInfo.name.length >= 6 ? ' long-name' : spaceInfo.name.length >= 4 ? ' medium-name' : '';
    
    // 4개 플레이어 말 슬롯 컨테이너 (겹침 방지)
    tile.innerHTML = `
      ${tagHtml}
      <span class="tile-name${nameClass}">${spaceInfo.name}</span>
      ${badgeHtml}
      <div class="piece-container">
        <div class="piece-slot slot-0"></div>
        <div class="piece-slot slot-1"></div>
        <div class="piece-slot slot-2"></div>
        <div class="piece-slot slot-3"></div>
      </div>
    `;

    // 타일 클릭 시 국가 정보 카드 미리보기
    tile.addEventListener('click', () => {
      showInfoModal(spaceInfo.spaceIndex);
    });
  }

  board.appendChild(tile);
  tileElements.push(tile);
}

const propertyState = spaces.map(() => ({ owner: null, buildings: 0 }));

// 정보 모달 열기
function showInfoModal(spaceIndex) {
  const space = spaces[spaceIndex];
  const state = propertyState[spaceIndex];
  const infoTitle = document.querySelector('#info-title');
  const infoTag = document.querySelector('#info-tag');
  const infoPhoto = document.querySelector('#info-photo');
  const infoDesc = document.querySelector('#info-desc');
  const infoCost = document.querySelector('#info-cost');
  const infoOwner = document.querySelector('#info-owner');
  const infoToll = document.querySelector('#info-toll');

  infoTitle.textContent = `${space.symbol} ${space.name}`;
  infoTag.textContent = space.tag ? `[${space.tag}]` : '탐험 특수칸';
  infoDesc.textContent = space.desc || '세계의 기후와 지형을 탐험해보세요.';

  if (!space.isSpecial) {
    const photoId = landmarkPhotos[spaceIndex] || 'photo-1500530855697-b586d89ba3ee';
    infoPhoto.style.backgroundImage = `url("https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&q=80")`;
    infoPhoto.style.display = 'block';
    infoCost.textContent = `₩${space.cost.toLocaleString()}`;
    if (state.owner !== null) {
      const owner = gamePlayers[state.owner];
      infoOwner.textContent = `${owner.name} (건물 ${state.buildings}단계)`;
      const toll = Math.round((space.cost * (state.buildings + 1)) * 0.5);
      infoToll.textContent = `₩${toll.toLocaleString()}`;
    } else {
      infoOwner.textContent = '구매 가능 (빈 땅)';
      infoToll.textContent = `₩${Math.round(space.cost * 0.5).toLocaleString()} (기본)`;
    }
  } else {
    infoPhoto.style.display = 'none';
    infoCost.textContent = '특수칸';
    infoOwner.textContent = '공용 구역';
    infoToll.textContent = '없음';
  }

  infoModal.classList.remove('hidden');
}

closeInfoBtn.addEventListener('click', () => {
  infoModal.classList.add('hidden');
});

// 말 엘리먼트 생성 및 배치
function renderPlayerPiece(playerIndex, position) {
  const tile = tileElements[route[position]];
  const slot = tile.querySelector(`.slot-${playerIndex}`);
  if (!slot) return;

  let piece = slot.querySelector('.piece');
  if (!piece) {
    piece = document.createElement('span');
    piece.className = `piece p-${playerIndex}`;
    piece.textContent = String(playerIndex + 1);
    slot.appendChild(piece);
  }
  return piece;
}

function removePlayerPiece(playerIndex, position) {
  const tile = tileElements[route[position]];
  const slot = tile?.querySelector(`.slot-${playerIndex}`);
  slot?.querySelector('.piece')?.remove();
}

function updateCurrentTurnUI() {
  if (!gamePlayers.length) return;
  const current = gamePlayers[currentPlayerIndex];
  currentTurnAvatar.className = `avatar p-${currentPlayerIndex}`;
  currentTurnAvatar.textContent = String(currentPlayerIndex + 1);
  currentTurnLabel.textContent = `${current.name} 차례`;
  currentTurnName.textContent = `${current.name} 턴`;

  playerRows.forEach((row, index) => {
    row.classList.toggle('active', index === currentPlayerIndex);
  });
}

function addActivityLog(text) {
  const p = document.createElement('p');
  const now = new Date();
  const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  p.innerHTML = `<span>${timeStr}</span> ${text}`;
  logList.prepend(p);
}

// 총자산 계산 도우미 (현금 + 소유 토지/건물 가치)
function calculateTotalAssets(playerIndex) {
  const player = gamePlayers[playerIndex];
  let propertyVal = 0;
  propertyState.forEach((st, idx) => {
    if (st.owner === playerIndex) {
      const baseCost = spaces[idx].cost;
      const buildingCost = Math.round(baseCost * 0.5) * st.buildings;
      propertyVal += (baseCost + buildingCost);
    }
  });
  return player.money + propertyVal;
}

function updatePlayerRow(index) {
  const row = playerRows[index];
  const player = gamePlayers[index];
  if (!row || !player) return;
  row.querySelector('.money').textContent = `₩${player.money.toLocaleString()}`;
  row.querySelector('.player-location').textContent = spaces[player.position].name;
  const totalAssets = calculateTotalAssets(index);
  row.querySelector('.asset-total').textContent = `총 ₩${totalAssets.toLocaleString()}`;
}

function updatePropertyTile(spaceIndex) {
  const state = propertyState[spaceIndex];
  const tile = tileElements[route[spaceIndex]];
  tile.classList.remove('owner-0', 'owner-1', 'owner-2', 'owner-3');
  tile.querySelector('.owner-badge')?.remove();
  if (state.owner === null) return;
  tile.classList.add(`owner-${state.owner}`);
  const badge = document.createElement('span');
  badge.className = 'owner-badge';
  badge.textContent = `${gamePlayers[state.owner].name}${state.buildings ? ` · 건물${state.buildings}` : ''}`;
  tile.appendChild(badge);
}

function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createPlayers(names) {
  gamePlayers = names.map((name, index) => {
    renderPlayerPiece(index, 0);
    return {
      name,
      money: startingMoney,
      position: 0
    };
  });

  playerRows.forEach((row, index) => {
    const visible = index < gamePlayers.length;
    row.style.display = visible ? 'flex' : 'none';
    if (visible) {
      row.querySelector('.player-name').textContent = gamePlayers[index].name;
      row.querySelector('.money').textContent = `₩${startingMoney.toLocaleString()}`;
      row.querySelector('.player-location').textContent = '출발지';
      row.querySelector('.asset-total').textContent = `총 ₩${startingMoney.toLocaleString()}`;
      const av = row.querySelector('.avatar');
      av.className = `avatar p-${index}`;
      av.textContent = String(index + 1);
    }
  });

  playerCountNum.textContent = `${String(gamePlayers.length).padStart(2, '0')} / 04`;
  boardLegend.innerHTML = gamePlayers.map((p, i) => `<i class="legend-dot p-${i}"></i> ${p.name}`).join(' ');

  maxRoundText.textContent = String(targetMaxRounds);
  targetRoundDisplay.textContent = `목표: ${targetMaxRounds}라운드`;

  updateCurrentTurnUI();
  addActivityLog(`<b>${gamePlayers.map(p => p.name).join(', ')}</b>님이 ${targetMaxRounds}라운드 탐험을 시작했습니다.`);
}

// 최종 게임 종료 및 시상대 팝업
function checkGameOver() {
  if (currentRound > targetMaxRounds && !isGameFinished) {
    isGameFinished = true;
    rollButton.disabled = true;
    sounds.playFanfare();

    const ranking = gamePlayers.map((p, idx) => ({
      index: idx,
      name: p.name,
      totalAssets: calculateTotalAssets(idx),
      cash: p.money
    })).sort((a, b) => b.totalAssets - a.totalAssets);

    const victoryRanking = document.querySelector('#victory-ranking');
    const medals = ['🥇 1위 (우승)', '🥈 2위', '🥉 3위', '4위'];

    victoryRanking.innerHTML = ranking.map((r, rankIdx) => `
      <div class="victory-rank-row ${rankIdx === 0 ? 'rank-1' : ''}">
        <span class="victory-rank-badge">${medals[rankIdx]}</span>
        <span class="victory-rank-name"><b>${r.name}</b> (현금 ₩${r.cash.toLocaleString()})</span>
        <span class="victory-rank-val">₩${r.totalAssets.toLocaleString()}</span>
      </div>
    `).join('');

    gameOverModal.classList.remove('hidden');
    addActivityLog(`🏆 게임 종료! <b>${ranking[0].name}</b>님이 총자산 ₩${ranking[0].totalAssets.toLocaleString()}으로 최종 우승을 차지했습니다!`);
    return true;
  }
  return false;
}

// 턴 종료
function endTurn() {
  currentPlayerIndex = (currentPlayerIndex + 1) % gamePlayers.length;
  if (currentPlayerIndex === 0) {
    currentRound += 1;
    roundNumber.textContent = String(currentRound).padStart(2, '0');
  }

  gamePlayers.forEach((_, idx) => updatePlayerRow(idx));

  if (!checkGameOver()) {
    updateCurrentTurnUI();
    rollButton.disabled = false;
  }
}

// 착륙 처리
function resolveLanding(playerIndex) {
  const player = gamePlayers[playerIndex];
  const spaceIndex = player.position;
  const space = spaces[spaceIndex];
  const state = propertyState[spaceIndex];

  updatePlayerRow(playerIndex);

  // 1. 특수칸 착륙
  if (space.isSpecial) {
    activeQuizSpace = spaceIndex;

    if (space.type === 'special-start') {
      player.money += salaryBonus;
      sounds.playCoin();
      updatePlayerRow(playerIndex);
      centerMessage.textContent = `[출발지 도착] 세계 일주 보너스 ₩${salaryBonus.toLocaleString()}을 받았습니다!`;
      addActivityLog(`<b>${player.name}</b>님이 출발지에 도착하여 <b>₩${salaryBonus.toLocaleString()}</b>을 획득했습니다.`);
      endTurn();
      return;
    }

    if (space.type === 'special-eco') {
      const reward = 20000;
      player.money += reward;
      sounds.playCoin();
      updatePlayerRow(playerIndex);
      centerMessage.textContent = `[지구촌 생태 쉼터] 환경 보전 보너스 ₩${reward.toLocaleString()}을 획득했습니다!`;
      addActivityLog(`<b>${player.name}</b>님이 생태 쉼터에서 힐링하고 <b>₩${reward.toLocaleString()}</b>을 받았습니다.`);
      endTurn();
      return;
    }

    // 기후/지형 퀴즈 특수칸
    const isClimate = space.type === 'special-climate';
    const pool = isClimate ? climateSpecialQuizzes : landformSpecialQuizzes;
    const quiz = pool[Math.floor(Math.random() * pool.length)];

    quizEyebrow.textContent = isClimate ? 'CLIMATE EXPLORATION CHALLENGE' : 'LANDFORM GEOGRAPHY CHALLENGE';
    quizTitle.textContent = isClimate ? '🌍 세계 기후 탐험 퀴즈' : '⛰️ 세계 지형 탐험 퀴즈';
    quizQuestion.textContent = quiz.question;
    quizResult.textContent = '문제를 맞히면 탐험 장학금 ₩30,000을 획득합니다!';
    quizExplanation.classList.add('hidden');
    purchaseActions.classList.add('hidden');
    specialActions.classList.add('hidden');

    quizOptions.innerHTML = '';
    const shuffled = shuffleArray(quiz.options);

    shuffled.forEach((option) => {
      const btn = document.createElement('button');
      btn.textContent = option;
      btn.addEventListener('click', () => {
        [...quizOptions.querySelectorAll('button')].forEach(b => b.disabled = true);
        quizExplanation.textContent = `💡 학습 쏙쏙: ${quiz.explanation}`;
        quizExplanation.classList.remove('hidden');

        if (option === quiz.answer) {
          btn.classList.add('correct');
          sounds.playCorrect();
          const bonus = 30000;
          player.money += bonus;
          updatePlayerRow(playerIndex);
          quizResult.textContent = `🎉 정답입니다! 탐험 장학금 ₩${bonus.toLocaleString()} 획득!`;
          addActivityLog(`<b>${player.name}</b>님이 ${space.name}를 맞혀 <b>₩${bonus.toLocaleString()}</b>을 획득했습니다.`);
        } else {
          btn.classList.add('incorrect');
          sounds.playIncorrect();
          quizResult.textContent = '아쉽게도 정답이 아닙니다.';
          addActivityLog(`<b>${player.name}</b>님이 ${space.name}에서 오답을 선택했습니다.`);
        }
        specialActions.classList.remove('hidden');
      });
      quizOptions.appendChild(btn);
    });

    quizModal.classList.remove('hidden');
    return;
  }

  // 2. 일반 국가 타일 착륙
  if (state.owner === null) {
    activeQuizSpace = spaceIndex;
    const quiz = space.quiz;

    quizEyebrow.textContent = `WORLD GEOGRAPHY · [${space.tag}]`;
    quizTitle.textContent = `${space.name} 지리 탐험 퀴즈`;
    quizQuestion.textContent = quiz.question;
    quizResult.textContent = '정답을 맞히면 이 땅을 구매할 자격이 주어집니다.';
    quizExplanation.classList.add('hidden');
    purchaseActions.classList.add('hidden');
    specialActions.classList.add('hidden');

    purchaseQuestion.textContent = `${space.name} 땅을 ₩${space.cost.toLocaleString()}에 구매하시겠습니까?`;

    quizOptions.innerHTML = '';
    const shuffled = shuffleArray(quiz.options);

    shuffled.forEach((option) => {
      const btn = document.createElement('button');
      btn.textContent = option;
      btn.addEventListener('click', () => {
        [...quizOptions.querySelectorAll('button')].forEach(b => b.disabled = true);
        quizExplanation.textContent = `💡 교과서 탐구: ${quiz.explanation}`;
        quizExplanation.classList.remove('hidden');

        if (option === quiz.answer) {
          btn.classList.add('correct');
          sounds.playCorrect();
          quizResult.textContent = '🎉 정답입니다! 땅을 구매할 수 있습니다.';
          purchaseActions.classList.remove('hidden');
        } else {
          btn.classList.add('incorrect');
          sounds.playIncorrect();
          quizResult.textContent = '아쉽게도 틀렸습니다. 이번 턴에는 구매할 수 없습니다.';
          addActivityLog(`<b>${player.name}</b>님이 ${space.name} 퀴즈에서 오답을 선택했습니다.`);
          setTimeout(() => {
            quizModal.classList.add('hidden');
            endTurn();
          }, 1800);
        }
      });
      quizOptions.appendChild(btn);
    });

    quizModal.classList.remove('hidden');
  } else if (state.owner === playerIndex) {
    // 본인 땅: 건물 증축
    const buildingCost = Math.round(space.cost * 0.5);
    if (state.buildings < 3 && player.money >= buildingCost) {
      state.buildings += 1;
      player.money -= buildingCost;
      sounds.playCoin();
      updatePlayerRow(playerIndex);
      updatePropertyTile(spaceIndex);
      centerMessage.textContent = `${player.name}님이 ${space.name}에 건물을 증축했습니다. (건물 ${state.buildings}단계)`;
      addActivityLog(`<b>${player.name}</b>님이 <b>${space.name}</b>에 건물(${state.buildings}단계)을 증축했습니다.`);
    } else {
      centerMessage.textContent = `${player.name}님이 본인 소유의 ${space.name}에서 휴식합니다.`;
    }
    endTurn();
  } else {
    // 타인 땅: 통행세 지불
    const owner = gamePlayers[state.owner];
    const toll = Math.round((space.cost * (state.buildings + 1)) * 0.5);
    const paidToll = Math.min(player.money, toll);

    player.money -= paidToll;
    owner.money += paidToll;
    sounds.playCoin();

    updatePlayerRow(playerIndex);
    updatePlayerRow(state.owner);

    centerMessage.textContent = `${player.name}님이 ${owner.name}의 ${space.name}에 도착해 통행세 ₩${paidToll.toLocaleString()}를 지불했습니다.`;
    addActivityLog(`<b>${player.name}</b> → <b>${owner.name}</b>: ${space.name} 통행세 ₩${paidToll.toLocaleString()} 지불`);
    endTurn();
  }
}

// 말 1칸씩 순차적 점프 이동 애니메이션
async function movePlayerStepByStep(playerIndex, steps) {
  isMoving = true;
  const player = gamePlayers[playerIndex];

  for (let s = 1; s <= steps; s++) {
    const prevPos = player.position;
    const nextPos = (prevPos + 1) % spaces.length;

    removePlayerPiece(playerIndex, prevPos);
    player.position = nextPos;
    const piece = renderPlayerPiece(playerIndex, nextPos);

    piece.classList.add('stepping');
    sounds.playStep();

    // 0번(출발지)을 통과하는 순간 월급 보너스 실시간 지급
    if (nextPos === 0) {
      player.money += salaryBonus;
      sounds.playCoin();
      updatePlayerRow(playerIndex);
      addActivityLog(`<b>${player.name}</b>님이 출발지를 통과하여 월급 <b>₩${salaryBonus.toLocaleString()}</b>을 받았습니다.`);
    }

    await new Promise(resolve => setTimeout(resolve, 240));
    piece.classList.remove('stepping');
  }

  isMoving = false;
  resolveLanding(playerIndex);
}

// 주사위 굴리기 (단일 주사위)
rollButton.addEventListener('click', () => {
  if (!gamePlayers.length || isGameFinished || isMoving) return;
  rollButton.disabled = true;
  dieOne.classList.add('is-rolling');
  sounds.playRoll();

  let ticks = 0;
  const animation = setInterval(() => {
    const rolledValue = Math.ceil(Math.random() * 6);
    dieOneFace.textContent = rolledValue;
    ticks += 1;

    if (ticks >= 7) {
      clearInterval(animation);
      dieOne.classList.remove('is-rolling');

      const finalRoll = Number(dieOneFace.textContent);
      rollSum.textContent = finalRoll;

      const player = gamePlayers[currentPlayerIndex];
      addActivityLog(`🎲 <b>${player.name}</b> 주사위 <b>${finalRoll}</b> 나옴`);

      setTimeout(() => {
        movePlayerStepByStep(currentPlayerIndex, finalRoll);
      }, 350);
    }
  }, 65);
});

// 땅 구매
buyProperty.addEventListener('click', () => {
  const player = gamePlayers[currentPlayerIndex];
  const state = propertyState[activeQuizSpace];
  const space = spaces[activeQuizSpace];

  if (player.money >= space.cost) {
    player.money -= space.cost;
    state.owner = currentPlayerIndex;
    sounds.playCoin();
    updatePlayerRow(currentPlayerIndex);
    updatePropertyTile(activeQuizSpace);
    quizResult.textContent = `구매 완료! ₩${space.cost.toLocaleString()}을 지불했습니다.`;
    addActivityLog(`<b>${player.name}</b>님이 <b>${space.name}</b> 토지를 ₩${space.cost.toLocaleString()}에 매입했습니다.`);
  } else {
    sounds.playIncorrect();
    quizResult.textContent = '잔액이 부족하여 토지를 구매할 수 없습니다.';
  }

  purchaseActions.classList.add('hidden');
  setTimeout(() => {
    quizModal.classList.add('hidden');
    endTurn();
  }, 1000);
});

// 땅 구매 건너뛰기
skipProperty.addEventListener('click', () => {
  quizResult.textContent = '토지를 구매하지 않았습니다.';
  purchaseActions.classList.add('hidden');
  setTimeout(() => {
    quizModal.classList.add('hidden');
    endTurn();
  }, 600);
});

// 특수칸 모달 확인
claimSpecial.addEventListener('click', () => {
  specialActions.classList.add('hidden');
  quizModal.classList.add('hidden');
  endTurn();
});

// 다시하기 버튼
restartGameBtn.addEventListener('click', () => {
  location.reload();
});

// 플레이어 설정 모달 관리
function renderNameFields() {
  nameFields.innerHTML = '';
  for (let index = 0; index < selectedPlayerCount; index += 1) {
    const input = document.createElement('input');
    input.className = 'name-field';
    input.name = `player-${index + 1}`;
    input.maxLength = 10;
    input.placeholder = `플레이어 ${index + 1} 이름`;
    input.value = `플레이어 ${index + 1}`;
    nameFields.appendChild(input);
  }
}

document.querySelectorAll('.player-count-select .setup-count').forEach((button) => {
  button.addEventListener('click', () => {
    selectedPlayerCount = Number(button.dataset.count);
    document.querySelectorAll('.player-count-select .setup-count').forEach((item) => item.classList.toggle('active', item === button));
    renderNameFields();
  });
});

document.querySelectorAll('.round-count-select .setup-round').forEach((button) => {
  button.addEventListener('click', () => {
    targetMaxRounds = Number(button.dataset.rounds);
    document.querySelectorAll('.round-count-select .setup-round').forEach((item) => item.classList.toggle('active', item === button));
  });
});

document.querySelector('#start-game').addEventListener('click', () => {
  sounds.init();
  const names = [...nameFields.querySelectorAll('input')].map((input, index) => input.value.trim() || `플레이어 ${index + 1}`);
  createPlayers(names);
  setupModal.classList.add('hidden');
  centerMessage.textContent = `${names.length}명이 모덕마블(${targetMaxRounds}R)을 시작합니다! 주사위를 굴려주세요.`;
});

renderNameFields();

// 게임 타이머
let seconds = 0;
setInterval(() => {
  if (!isGameFinished) {
    seconds += 1;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    timer.textContent = `${m}:${s}`;
  }
}, 1000);

