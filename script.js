// 2022 개정 초등 사회과 교육과정 [6사10-01], [6사10-02], [6사09-01] 연계 <교실 속 세계일주> 게임 로직
// 문제 데이터는 questions.js에 있습니다 (index.html에서 이 파일보다 먼저 읽습니다).

const board = document.querySelector('#board');
const rollButton = document.querySelector('#roll-button');
const rollBtnText = document.querySelector('#roll-btn-text');
const diceElements = [document.querySelector('#die-one'), document.querySelector('#die-two')].filter(Boolean);
const rollSum = document.querySelector('#roll-sum');
const timer = document.querySelector('#timer');
const roundNumber = document.querySelector('#round-number');
const maxRoundText = document.querySelector('#max-round-text');
const targetRuleDisplay = document.querySelector('#target-rule-display');
const roundCaptionBox = document.querySelector('#round-caption-box');
const playerCards = document.querySelectorAll('.player-card[data-player-card]');
const playerCountNum = document.querySelector('#player-count-num');
const setupModal = document.querySelector('#setup-modal');
const quizModal = document.querySelector('#quiz-modal');
const infoModal = document.querySelector('#info-modal');
const gameOverModal = document.querySelector('#game-over-modal');
const gameOverTitle = document.querySelector('#game-over-title');
const gameOverDesc = document.querySelector('#game-over-desc');
const nameFields = document.querySelector('#name-fields');
const quizEyebrow = document.querySelector('#quiz-eyebrow');
const quizTitle = document.querySelector('#quiz-title');
const aiQuizBanner = document.querySelector('#ai-quiz-banner');
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
const centerTurnDot = document.querySelector('#center-turn-dot');
const centerTurnText = document.querySelector('#center-turn-text');
const soundToggleBtn = document.querySelector('#sound-toggle');
const closeInfoBtn = document.querySelector('#close-info');
const restartGameBtn = document.querySelector('#restart-game');
const toastArea = document.querySelector('#toast-area');

// 토지 매각 모달 요소
const sellModal = document.querySelector('#sell-modal');
const sellRequiredToll = document.querySelector('#sell-required-toll');
const sellCurrentMoney = document.querySelector('#sell-current-money');
const sellDeficitMoney = document.querySelector('#sell-deficit-money');
const sellLandsList = document.querySelector('#sell-lands-list');
const payTollBtn = document.querySelector('#pay-toll-btn');
const bankruptBtn = document.querySelector('#bankrupt-btn');

// 보너스 카드 / 선택 모달 요소
const cardModal = document.querySelector('#card-modal');
const cardEyebrow = document.querySelector('#card-eyebrow');
const cardIcon = document.querySelector('#card-icon');
const cardTitle = document.querySelector('#card-title');
const cardDesc = document.querySelector('#card-desc');
const cardChoices = document.querySelector('#card-choices');
const cardActions = document.querySelector('#card-actions');

// 설정 모달 요소
const modeRoundBtn = document.querySelector('#mode-round-btn');
const modeTimeBtn = document.querySelector('#mode-time-btn');
const roundOptionsGroup = document.querySelector('#round-options-group');
const timeOptionsGroup = document.querySelector('#time-options-group');

let selectedPlayerCount = 2;
let gameMode = 'round'; // 'round' 또는 'time'
let targetMaxRounds = 10;       // 0이면 무제한 — 파산으로 한 명만 남을 때까지 계속합니다.
let targetTimeMinutes = 5;
let remainingSeconds = 300;
let elapsedSeconds = 0;
let soundEnabled = true;
let gamePlayers = [];
let currentPlayerIndex = 0;
let activeQuizSpace = -1;
let currentRound = 1;
let isGameFinished = false;
let isMoving = false;
let timerInterval = null;
const extraRollQueue = [];       // 한 번 더 굴릴 사유가 쌓입니다 ('double' = 더블, 'card' = 카드)
let pendingPurchaseDiscount = 1; // '반값 매입권' 적용 여부
let afterQuizAction = null;      // 퀴즈 확인 버튼을 눌렀을 때 이어서 할 일

// 라운드 수를 정하지 않은 '무제한' 모드인지
function isUnlimitedRounds() { return gameMode === 'round' && targetMaxRounds === 0; }

// 화면에 표시할 라운드 글자 (무제한이면 목표치로 자르지 않습니다)
function roundLabel() {
  return isUnlimitedRounds() ? String(currentRound).padStart(2, '0')
                             : String(Math.min(currentRound, targetMaxRounds)).padStart(2, '0');
}

const startingMoney = 350000;    // 초기 자금
const salaryBonus = 70000;       // 출발지 통과 월급
const lapBonus = 30000;          // 출발지에 정확히 도착했을 때 완주 보너스
const specialQuizReward = 30000; // 기후/지형 퀴즈 정답 장학금
const landQuizReward = 5000;     // 나라 칸 퀴즈를 맞혔을 때 주는 탐험 수당
const WRONG_TOLL_RATE = 1.2;     // 통행세 퀴즈를 틀리면 1.2배

// 통행세 = 땅값 × 건물 단계별 배율. 빈 땅은 가볍게, 건물을 올린 땅은 무섭게.
const TOLL_RATES = [0.4, 1.5, 2.8, 4.5];

// 건물은 단계가 올라갈수록 더 크고 비싼 건물을 짓습니다 (땅값 대비 배율).
const BUILD_RATES = [0.5, 0.9, 1.5];
const BUILD_NAMES = ['🏠 집', '🏘️ 마을', '🏰 랜드마크'];

// 급하게 파는 땅은 은행이 제값을 쳐주지 않습니다.
const SELL_REFUND_RATE = 0.6;

// 나라 칸에 도착했을 때 자연재해가 일어날 확률
const DISASTER_CHANCE = 0.25;

function won(n) { return `₩${n.toLocaleString()}`; }
function tollOf(spaceIndex) {
  return Math.round(spaces[spaceIndex].cost * TOLL_RATES[Math.min(propertyState[spaceIndex].buildings, 3)]);
}
// 다음에 지을 건물 한 채 값
function nextBuildCostOf(spaceIndex) {
  const stage = Math.min(propertyState[spaceIndex].buildings, BUILD_RATES.length - 1);
  return Math.round(spaces[spaceIndex].cost * BUILD_RATES[stage]);
}
// 지금까지 그 땅에 지은 건물 값의 합
function buildValueOf(spaceIndex) {
  let sum = 0;
  for (let i = 0; i < propertyState[spaceIndex].buildings; i += 1) sum += spaces[spaceIndex].cost * BUILD_RATES[i];
  return Math.round(sum);
}
// 장부상 가치 (자산 순위에 쓰는 값)
function bookValueOf(spaceIndex) { return spaces[spaceIndex].cost + buildValueOf(spaceIndex); }
// 급매로 팔았을 때 실제로 받는 돈
function sellValueOf(spaceIndex) { return Math.round(bookValueOf(spaceIndex) * SELL_REFUND_RATE); }

// Web Audio API 사운드 합성기 (크롬북 정책 호환 및 예외 처리)
class SoundManager {
  constructor() { this.ctx = null; }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }
  }

  tone(freq, type, dur, vol, delay) {
    setTimeout(() => {
      try {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
      } catch (err) {}
    }, delay);
  }

  play(notes, type = 'sine', dur = 0.2, vol = 0.14, gap = 90) {
    if (!soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      notes.forEach((f, i) => this.tone(f, type, dur, vol, i * gap));
    } catch (e) {}
  }

  playRoll() { this.play([170, 210, 185, 225], 'triangle', 0.06, 0.08, 65); }
  playStep() { this.play([660], 'sine', 0.08, 0.12, 0); }
  playCorrect() { this.play([523.25, 659.25, 783.99, 1046.5], 'sine', 0.25, 0.15, 90); }
  playIncorrect() { this.play([220, 175, 140], 'sawtooth', 0.2, 0.12, 80); }
  playCoin() { this.play([987.77, 1318.51], 'sine', 0.18, 0.14, 80); }
  playCard() { this.play([784, 988, 1175], 'triangle', 0.22, 0.15, 70); }
  playFanfare() { this.play([523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5], 'triangle', 0.3, 0.18, 130); }
  playBankrupt() { this.play([392, 330, 262, 196], 'sawtooth', 0.35, 0.14, 160); }
}

const sounds = new SoundManager();

soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggleBtn.textContent = soundEnabled ? '🔊 소리 ON' : '🔇 소리 OFF';
  if (soundEnabled) sounds.playStep();
});

// ============================================================
// 32개 보드칸 데이터 (특수칸 4개 + 국가 28개)
//
// 사진은 각 칸 안의 photo 값으로 직접 지정합니다. 별도 배열을 쓰지 않으므로
// 칸을 넣거나 빼도 나라와 사진이 어긋나지 않습니다.
// 사진을 바꾸려면 images 폴더에 파일을 넣고 그 나라 줄의 photo 값만 고치면 됩니다.
// 28장 모두 실제로 열어 나라와 맞는지 확인했습니다 (2026-08-20).
// ============================================================
const spaces = [
  { name: '출발지', symbol: '🚩', type: 'special-start', tag: '시작점', isSpecial: true, cost: 0, photo: null,
    desc: '세계 일주가 시작되고 끝나는 곳입니다. 보드를 한 바퀴 돌아 이곳을 지나갈 때마다 월급 ₩70,000을 받고, 주사위 눈이 딱 맞아 이 칸에 정확히 도착하면 완주 보너스 ₩30,000을 더 받습니다. 모든 탐험가는 여기에서 출발해 아시아, 유럽, 아프리카, 아메리카, 오세아니아를 차례로 여행하게 됩니다.' },

  { name: '한국', symbol: '◒', type: 'accent-blue', tag: '온대기후', cost: 70000, photo: 'images/korea.jpg', code: 'kr', lat: 36.5, lon: 127.8,
    desc: '중위도에 자리해 사계절이 뚜렷한 온대 계절풍 기후입니다. 여름에는 남동쪽 바다에서 덥고 습한 계절풍이 불어와 기온이 높고 비가 많이 내리며, 겨울에는 북서쪽 대륙에서 차갑고 건조한 바람이 붑니다. 국토의 70%가 산지여서 뒤에 산을 두고 앞에 하천을 둔 배산임수 자리에 마을을 이루었고, 남쪽의 넓은 평야에서는 벼농사가 발달했습니다. 추운 겨울을 나기 위한 온돌과 김장은 기후에 적응한 대표적인 생활 문화입니다.' },
  { name: '일본', symbol: '✿', type: 'accent-blue', tag: '화산/온천', cost: 65000, photo: 'images/japan.jpg', code: 'jp', lat: 36.2, lon: 138.3,
    desc: '네 개의 큰 섬과 수천 개의 작은 섬으로 이루어진 섬나라로, 여러 판이 부딪치는 경계에 놓여 있습니다. 그래서 화산과 지진이 매우 잦고, 후지산 같은 원뿔 모양 화산과 곳곳의 온천이 만들어졌습니다. 지진에 대비해 흔들림을 견디는 건물을 짓고 학교에서 대피 훈련을 자주 합니다. 사방이 바다라 신선한 해산물을 쉽게 구할 수 있어 초밥과 회 같은 음식 문화가 발달했습니다.' },
  { name: '베트남', symbol: '✦', type: 'accent-blue', tag: '열대기후', cost: 50000, photo: 'images/vietnam.jpg', code: 'vn', lat: 16.0, lon: 107.0,
    desc: '남북으로 길게 뻗은 나라로, 고온 다습한 열대 계절풍 기후가 나타나 우기와 건기가 뚜렷합니다. 남부의 메콩강 하구에는 강물이 실어 온 흙이 쌓여 만들어진 넓고 비옥한 삼각주가 펼쳐집니다. 일 년 내내 기온이 높아 같은 땅에서 벼를 두세 번 심고 거두는 2기작과 3기작이 이루어집니다. 강한 햇빛과 소나기를 함께 막아 주는 원뿔 모양 모자 논라를 쓰고, 물가에는 수상 가옥을 지어 살아갑니다.' },
  { name: '태국', symbol: '◆', type: 'accent-blue', tag: '열대/하천', cost: 55000, photo: 'images/thailand.jpg', code: 'th', lat: 15.0, lon: 101.0,
    desc: '일 년 내내 덥고 비가 많은 열대 기후로, 망고와 두리안 같은 열대 과일이 잘 자랍니다. 수도 방콕을 흐르는 짜오프라야강과 여기서 갈라진 수많은 운하가 사람과 물건을 실어 나르는 길이 되어, 배 위에서 물건을 사고파는 수상 시장 문화가 자리 잡았습니다. 우기에 비가 집중되면 하천이 넘쳐 홍수가 잦기 때문에 바닥을 땅에서 띄운 고상 가옥을 짓습니다. 국민 대부분이 불교를 믿어 황금빛 사원이 많고 중요한 관광 자원이 되었습니다.' },
  { name: '필리핀', symbol: '◇', type: 'accent-blue', tag: '해안/환경', cost: 45000, photo: 'images/philippines.jpg', code: 'ph', lat: 12.9, lon: 122.0,
    desc: '7,000개가 넘는 섬으로 이루어진 섬나라로, 바다의 영향을 받아 일 년 내내 덥고 기온 차가 작습니다. 얕고 따뜻한 바다에는 산호초가 발달해 수많은 바다 생물의 보금자리가 되고 파도를 막아 줍니다. 보라카이섬은 아름다운 백사장으로 유명하지만 지나친 관광 개발과 쓰레기 오염 때문에 섬을 일시적으로 닫고 정화 작업을 했습니다. 태풍이 지나는 길목에 있어 해마다 강한 바람과 폭우 피해에 대비합니다.' },
  { name: '인도네시아', symbol: '●', type: 'accent-blue', tag: '열대우림', cost: 50000, photo: 'images/indonesia.jpg', code: 'id', lat: -2.2, lon: 117.9,
    desc: '적도가 나라를 가로질러 일 년 내내 덥고 비가 많은 열대 우림 기후가 나타나며, 오후마다 스콜이라는 짧고 강한 소나기가 쏟아집니다. 땅에서 올라오는 열기와 습기, 뱀과 해충을 피하려고 기둥을 세워 바닥을 높인 고상 가옥을 짓고, 지붕은 비가 잘 흘러내리도록 경사를 급하게 만듭니다. 여러 판이 만나는 불의 고리에 속해 화산이 많은데, 화산재가 쌓인 땅은 농사에 유리하기도 합니다. 다만 농장 개발과 벌목으로 열대 우림이 빠르게 줄어드는 문제를 안고 있습니다.' },
  { name: '인도', symbol: '↗', type: 'accent-blue', tag: '계절풍/하천', cost: 60000, photo: 'images/india.jpg', code: 'in', lat: 21.0, lon: 78.0,
    desc: '계절에 따라 방향이 바뀌는 계절풍의 영향을 크게 받아, 여름 계절풍이 바다에서 습기를 몰고 와 많은 비를 뿌립니다. 히말라야의 눈과 빙하가 녹은 물이 큰 하천을 이루어 북부에 넓고 비옥한 평야를 만들었습니다. 그중 갠지스강은 농사와 생활에 물을 대 줄 뿐 아니라 힌두교도들이 성스럽게 여겨 목욕 의식을 치르는 강입니다. 더운 기후에서 음식이 상하는 것을 늦추려고 향신료를 많이 쓰고, 통풍이 잘되는 긴 천을 몸에 둘러 입는 사리를 입습니다.' },

  { name: '기후 퀴즈', symbol: '🌍', type: 'special-climate', tag: '기후탐험', isSpecial: true, cost: 0, photo: null,
    desc: '세계의 기후를 탐구하는 특수칸입니다. 열대, 건조, 온대, 냉대, 한대, 고산 기후의 특징과 그 속에서 살아가는 사람들의 의식주 생활에 대한 문제가 나옵니다. 문제를 맞히면 탐험 장학금 ₩30,000을 받습니다. 위도와 해발 고도, 바다와의 거리가 기후를 어떻게 바꾸는지 떠올리며 풀어 보세요.' },

  { name: '이탈리아', symbol: '●', type: 'accent-yellow', tag: '지중해성', cost: 65000, photo: 'images/italy.jpg', code: 'it', lat: 42.8, lon: 12.6,
    desc: '지중해로 길게 뻗은 장화 모양의 반도 나라로, 여름에는 덥고 건조하며 겨울에 비가 내리는 지중해성 기후입니다. 여름 가뭄을 견디도록 잎이 작고 두꺼운 올리브와 포도, 오렌지를 기르는 수목 농업이 발달했습니다. 밀과 올리브유, 토마토가 풍부해 파스타와 피자 같은 음식 문화가 만들어져 세계로 퍼졌습니다. 로마의 콜로세움을 비롯한 유적과 물 위의 도시 베네치아는 오늘날 중요한 관광 자원입니다.' },
  { name: '그리스', symbol: '△', type: 'accent-yellow', tag: '지중해섬', cost: 60000, photo: 'images/greece.jpg', code: 'gr', lat: 39.1, lon: 22.0,
    desc: '에게해에 수많은 섬이 흩어져 있어 예로부터 배가 오가며 해상 무역과 해운업이 발달했습니다. 지중해성 기후라 여름이 덥고 건조한데, 강한 햇빛과 열기를 반사해 실내를 시원하게 하려고 집 외벽을 하얗게 칠합니다. 산이 많고 평야가 좁아 곡물 농사 대신 올리브를 길러 기름을 짜서 요리에 두루 씁니다. 아테네의 파르테논 신전 같은 고대 유적과 맑고 건조한 여름 날씨가 함께 어우러져 관광객이 많이 찾습니다.' },
  { name: '프랑스', symbol: '✦', type: 'accent-yellow', tag: '서안해양성', cost: 75000, photo: 'images/france.jpg', code: 'fr', lat: 46.6, lon: 2.4,
    desc: '서쪽에서 부는 편서풍이 따뜻한 북대서양 해류 위를 지나며 열과 습기를 실어 와, 여름은 서늘하고 겨울은 온화하며 비가 고르게 내리는 서안 해양성 기후가 나타납니다. 파리 분지의 넓고 평평한 평야에서는 유럽 최대 규모로 밀을 생산합니다. 남부는 지중해의 영향을 받아 포도가 잘 자라며 이를 이용한 포도주 생산이 지역의 대표 산업이 되었습니다. 알프스산맥과 에펠탑, 루브르 박물관 등 자연과 문화 자원이 풍부해 세계에서 관광객이 가장 많이 찾는 나라 가운데 하나입니다.' },
  { name: '영국', symbol: '◇', type: 'accent-yellow', tag: '서안해양성', cost: 70000, photo: 'images/uk.jpg', code: 'gb', lat: 54.0, lon: -2.4,
    desc: '섬나라이면서 편서풍과 따뜻한 해류의 영향을 받아, 위도가 높은데도 겨울이 우리나라보다 온화합니다. 바다의 습기 때문에 안개가 끼고 보슬비가 자주 내려 우산과 방수 코트가 일상 필수품이 되었고, 흐리고 서늘한 날씨 속에서 오후에 차를 마시는 문화가 자리 잡았습니다. 비가 계절에 관계없이 고르게 내려 풀이 마르지 않으므로 목초지와 낙농업이 발달했습니다. 석탄과 철이 풍부하고 항구가 발달한 조건을 바탕으로 세계 최초로 산업 혁명이 일어난 곳이기도 합니다.' },
  { name: '독일', symbol: '♢', type: 'accent-yellow', tag: '하천교통', cost: 65000, photo: 'images/germany.jpg', code: 'de', lat: 51.1, lon: 10.4,
    desc: '유럽 한가운데에 자리해 여러 나라와 국경을 맞대고 있어 도로와 철도, 하천이 모이는 교통의 요지입니다. 나라를 가로지르는 라인강은 여러 나라를 거쳐 흐르는 국제 하천으로, 화물선이 오가는 수상 교통의 대동맥 역할을 합니다. 석탄이 풍부하고 라인강 수운을 쓸 수 있는 루르 지역에는 제철과 기계 공업이 크게 발달했고, 그 전통 위에서 세계적인 자동차 산업이 자랐습니다. 남서부에는 침엽수가 우거진 흑림이 넓게 펼쳐져 목재와 관광 자원이 됩니다.' },
  { name: '노르웨이', symbol: '▣', type: 'accent-yellow', tag: '피오르', cost: 65000, photo: 'images/norway.jpg', code: 'no', lat: 61.5, lon: 9.0,
    desc: '과거 빙하가 깎아 만든 깊은 U자 골짜기에 바닷물이 차오르면서 절벽이 솟은 피오르 해안이 발달했습니다. 하천이 만드는 V자곡과 달리 빙하는 바닥을 넓게 갈아 U자 모양 골짜기를 남깁니다. 파도가 잔잔하고 물이 차가운 피오르는 연어를 기르기에 알맞아 세계적인 연어 수출국이 되었습니다. 산이 높고 비와 눈이 많아 전기의 대부분을 수력 발전으로 얻으며, 북극권에서는 여름에 해가 지지 않는 백야와 겨울밤의 오로라를 볼 수 있습니다.' },
  { name: '아이슬란드', symbol: '☕', type: 'accent-yellow', tag: '화산/지열', cost: 60000, photo: 'images/iceland.jpg', code: 'is', lat: 64.9, lon: -18.6,
    desc: '대서양 한가운데 판이 서로 갈라지는 경계 위에 있어 마그마가 솟아오르며 화산과 온천이 발달한, 불과 얼음의 나라입니다. 땅속에서 데워진 지하수가 압력을 받아 주기적으로 솟구치는 간헐천이 대표적인 관광 자원입니다. 석유나 석탄을 태우는 대신 땅속 열을 그대로 쓰는 지열 발전으로 난방을 해결하고, 그 열로 온실을 데워 추운 곳에서도 채소를 기릅니다. 빙하 아래에서 화산이 터지면 얼음이 빠르게 녹아 큰 홍수가 나기도 합니다.' },

  { name: '지형 퀴즈', symbol: '⛰️', type: 'special-landform', tag: '지형탐험', isSpecial: true, cost: 0, photo: null,
    desc: '지구의 다양한 지형을 탐구하는 특수칸입니다. 산지와 하천, 해안, 화산, 빙하가 만들어 낸 지형과 그것을 이용하는 사람들의 생활에 대한 문제가 나옵니다. 문제를 맞히면 탐험 장학금 ₩30,000을 받습니다. 삼각주, 피오르, 갯벌, 협곡처럼 무엇이 어떻게 깎고 쌓아 만든 지형인지 생각하며 풀어 보세요.' },

  { name: '스위스', symbol: '△', type: 'accent-yellow', tag: '알프스', cost: 70000, photo: 'images/switzerland.jpg', code: 'ch', lat: 46.8, lon: 8.2,
    desc: '바다와 맞닿은 곳이 전혀 없는 내륙국이면서 국토 대부분이 험준한 알프스 산지입니다. 해발 고도가 100m 높아질 때마다 기온이 약 0.6도씩 낮아지므로 같은 지역이라도 산 위와 아래의 기후가 다릅니다. 경사진 땅은 밭농사에 불리하지만 풀은 잘 자라, 여름에 높은 초원에서 소를 기르고 우유로 치즈를 만드는 낙농업이 발달했습니다. 톱니바퀴 산악 열차와 케이블카로 험한 지형을 극복해 겨울에는 스키, 여름에는 등산 관광이 일 년 내내 이어집니다.' },
  { name: '이집트', symbol: '◌', type: 'accent-mint', tag: '건조/사막', cost: 55000, photo: 'images/egypt.jpg', code: 'eg', lat: 26.8, lon: 29.9,
    desc: '국토 대부분이 사막인 건조 기후 지역이지만, 사막 한가운데를 흐르는 나일강이 물과 비옥한 흙을 가져다주어 문명이 자랐습니다. 강물을 끌어와 농경지에 대는 관개 농업 덕분에 비가 거의 오지 않는 땅에서도 농사를 지을 수 있습니다. 구름과 수증기가 적어 낮에는 몹시 덥고 밤에는 갑자기 추워지므로, 흙벽돌로 벽을 두껍게 쌓고 창문을 작게 내어 열기와 모래바람을 막습니다. 나일강 유역의 피라미드는 고대 문명을 보여 주는 유산이자 중요한 관광 자원입니다.' },
  { name: '사우디', symbol: '≈', type: 'accent-mint', tag: '오아시스', cost: 60000, photo: 'images/saudi.jpg', code: 'sa', lat: 24.0, lon: 45.0,
    desc: '내리는 비보다 증발하는 물이 더 많은 건조 기후로, 국토 대부분이 모래와 자갈로 덮인 사막입니다. 사막 가운데 지하수가 솟아나는 오아시스 주변에서는 대추야자와 밀을 기르는 오아시스 농업이 이루어지고 사람들이 모여 마을을 이룹니다. 대추야자는 뿌리를 깊이 뻗어 지하수를 빨아들이고 강한 햇빛을 잘 견뎌 이곳에서 기르기에 알맞습니다. 물과 풀을 찾아 가축을 몰고 옮겨 다니는 유목 생활이 이어져 왔고, 사막 아래 묻힌 석유가 개발되면서 나라의 모습이 크게 바뀌었습니다.' },
  { name: '케냐', symbol: '✦', type: 'accent-mint', tag: '사바나', cost: 50000, photo: 'images/kenya.jpg', code: 'ke', lat: 0.5, lon: 37.9,
    desc: '적도 부근에 있지만 국토의 상당 부분이 높은 고원이라 수도 나이로비처럼 연중 서늘한 곳이 많습니다. 비가 집중되는 우기와 비가 거의 오지 않는 건기가 뚜렷한 열대 사바나 기후로, 키 큰 풀 사이에 나무가 드문드문 서 있는 초원이 펼쳐집니다. 초식동물과 맹수가 함께 살아가 국립공원을 둘러보며 야생동물을 관찰하는 사파리 생태 관광이 활발합니다. 서늘하고 물이 잘 빠지는 고원에서는 커피와 차를 길러 세계로 수출합니다.' },
  { name: '콩고(공)', symbol: '◆', type: 'accent-mint', tag: '콩고강', cost: 45000, photo: 'images/congo.jpg', code: 'cd', lat: -2.9, lon: 23.6,
    desc: '적도가 지나 일 년 내내 덥고 비가 많아, 세계에서 두 번째로 넓은 열대 우림이 펼쳐집니다. 나무들이 이산화 탄소를 빨아들이고 산소를 내보내 지구의 허파라 불리며, 숲을 지키는 일은 기후 변화를 늦추는 데 도움이 됩니다. 경사가 급한 곳에서 물살이 빨라진 콩고강 급류의 바위틈에는 주민들이 거대한 나무 구조물과 대나무 원뿔형 통발을 설치해 물고기를 잡는 전통 어업이 이어집니다. 덥고 습한 기후에서 잘 자라고 척박한 땅도 견디는 카사바가 중요한 식량입니다.' },
  { name: '모로코', symbol: '☾', type: 'accent-mint', tag: '사하라', cost: 50000, photo: 'images/morocco.jpg', code: 'ma', lat: 31.8, lon: -6.5,
    desc: '북쪽 해안은 겨울에 비가 내리는 지중해성 기후라 올리브와 밀을 기를 수 있지만, 아틀라스산맥 남쪽은 세계에서 가장 넓은 사하라 사막이 시작되는 매우 건조한 땅입니다. 한 나라 안에서도 산맥을 경계로 기후와 농사 모습이 크게 달라집니다. 강한 자외선과 모래바람을 막고 땀이 잘 증발하도록 온몸을 헐렁하게 감싸는 긴 전통 옷 젤라바를 입습니다. 옛날에는 낙타를 이끈 대상이 오아시스를 따라 사막을 건너며 소금과 금을 실어 날랐고, 그 길목에 시장과 도시가 자랐습니다.' },
  { name: '네팔', symbol: '♧', type: 'accent-mint', tag: '히말라야', cost: 55000, photo: 'images/nepal.jpg', code: 'np', lat: 28.3, lon: 84.1,
    desc: '인도판이 유라시아판과 부딪쳐 밀어 올린 히말라야산맥이 나라 북쪽을 가로지르며, 세계 최고봉 에베레스트산이 자리합니다. 산맥은 지금도 조금씩 높아지고 있습니다. 고도가 높아질수록 공기가 희박해지고 기온이 낮아지는데, 이곳에 사는 셰르파는 그 환경에 적응해 등산객의 짐을 나르고 길을 안내합니다. 산비탈을 계단처럼 깎아 만든 계단식 경작지는 빗물에 흙이 쓸려 내려가는 것을 막고 물을 가두어 농사를 가능하게 합니다.' },

  { name: '생태 쉼터', symbol: '🌿', type: 'special-eco', tag: '보너스카드', isSpecial: true, cost: 0, photo: null,
    desc: '지구촌 환경을 지키는 쉼터입니다. 이 칸에 도착하면 보너스 카드를 한 장 뽑습니다. 통행세를 한 번 내지 않아도 되는 면제권, 건물을 공짜로 짓는 무료 증축권, 땅을 절반 값에 사는 반값 매입권, 출발지로 이동, 원하는 나라로 날아가는 여행권, 환경 장학금, 한 번 더 굴리기, 가진 땅마다 지원금을 받는 숲 보호 보너스까지 여덟 가지가 들어 있습니다.' },

  { name: '브라질', symbol: '●', type: 'accent-pink', tag: '아마존강', cost: 65000, photo: 'images/brazil.jpg', code: 'br', lat: -10.3, lon: -53.1,
    desc: '흐르는 물의 양이 세계에서 가장 많은 아마존강이 흐르며, 그 주변에 지구에서 가장 넓은 열대 우림이 펼쳐집니다. 이 숲은 이산화 탄소를 흡수하고 산소를 내보내 지구 전체의 공기와 기후에 큰 영향을 주지만, 목장과 농장을 넓히려는 개발로 빠르게 줄어들고 있습니다. 아르헨티나와의 국경에는 하천이 만들어 낸 웅장한 이구아수 폭포가 있어 세계자연유산으로 지정되었습니다. 남동부의 서늘한 고원에서는 커피가 잘 자라 세계 최대의 커피 생산국이 되었습니다.' },
  { name: '페루', symbol: '◆', type: 'accent-pink', tag: '안데스', cost: 55000, photo: 'images/peru.jpg', code: 'pe', lat: -9.8, lon: -75.5,
    desc: '남아메리카 서쪽을 남북으로 약 7,000km 뻗은 안데스산맥이 사람들의 생활을 좌우합니다. 적도에 가까운 저위도인데도 해발 고도가 높아 일 년 내내 봄 같은 고산 기후가 나타나며, 그런 곳에 큰 도시가 자리하기도 합니다. 춥고 일교차가 큰 날씨를 견디려고 알파카와 라마의 털로 짠 두꺼운 망토 판초를 입고, 이 가축들에게 짐을 나르게 합니다. 서늘한 고산 지대에서 처음 재배되어 세계로 퍼진 감자의 원산지이며, 산등성이에 세운 잉카의 도시 마추픽추가 남아 있습니다.' },
  { name: '멕시코', symbol: '✦', type: 'accent-pink', tag: '열대/고산', cost: 50000, photo: 'images/mexico.jpg', code: 'mx', lat: 23.6, lon: -102.5,
    desc: '북부는 비가 적은 건조 지역이라 잎을 가시로 바꾸고 두꺼운 줄기에 물을 저장하는 선인장이 자랍니다. 수도 멕시코시티는 해발 2,000m가 넘는 고원에 있어 저위도인데도 서늘하고 살기 좋습니다. 가뭄에 강한 옥수수는 고대 문명 때부터 길러 온 주식으로, 옥수숫가루를 얇게 펴서 구운 토르티야는 밥과 같은 역할을 합니다. 옥수수 농사를 바탕으로 큰 도시와 신전을 세운 마야와 아스텍 문명의 피라미드가 오늘날까지 남아 있고, 강한 햇빛을 막는 챙 넓은 모자 솜브레로가 유명합니다.' },
  { name: '미국', symbol: '△', type: 'accent-pink', tag: '평야/농업', cost: 80000, photo: 'images/usa.jpg', code: 'us', lat: 39.5, lon: -98.4,
    desc: '국토가 매우 넓어 위도와 고도, 바다와의 거리에 따라 열대부터 한대까지 다양한 기후가 나타납니다. 중앙부에는 넓고 평평한 대평원이 펼쳐져 세계적인 곡창 지대가 되었고, 큰 농기계와 비행기를 이용해 적은 사람으로 아주 넓은 면적을 짓는 기업적 농업이 발달했습니다. 여러 지류를 모아 흐르는 미시시피강은 내륙 수운의 중심이 되어 대평원의 곡물을 항구까지 실어 나릅니다. 콜로라도강이 오랜 세월 땅을 깎아 만든 그랜드 캐니언은 하천 침식이 만든 대표적인 지형입니다.' },
  { name: '캐나다', symbol: '◇', type: 'accent-pink', tag: '냉대침엽', cost: 70000, photo: 'images/canada.jpg', code: 'ca', lat: 56.1, lon: -106.3,
    desc: '위도가 높아 겨울이 춥고 길며 눈이 오래 쌓여 있는 냉대 기후가 넓게 나타납니다. 잎이 좁고 뾰족해 수분 손실이 적고 눈이 잘 미끄러지는 침엽수가 잘 자라 타이가라 불리는 거대한 숲을 이룹니다. 이 목재는 단단하고 질이 좋아 통나무집 건축과 가구, 종이 펄프를 만드는 임업이 크게 발달했습니다. 서부의 로키산맥에는 만년설과 빙하가 녹아 만든 호수가 있어 손꼽히는 자연 관광지가 되었고, 단풍나무 수액을 졸여 만든 메이플 시럽이 특산물입니다.' },
  { name: '호주', symbol: '♧', type: 'accent-blue', tag: '산호초', cost: 70000, photo: 'images/australia.jpg', code: 'au', lat: -25.3, lon: 133.4,
    desc: '남반구에 있어 북반구와 계절이 반대라 한여름에 크리스마스를 맞이합니다. 내륙에는 비가 매우 적어 붉은 흙과 관목만 보이는 아웃백이 넓게 펼쳐지고, 그 한가운데 오랜 풍화와 침식을 견디고 남은 거대한 바위 울루루가 솟아 있습니다. 건조한 초원은 풀을 뜯는 양을 기르기에 알맞아 세계적인 양모 생산국이 되었습니다. 북동부 해안의 그레이트 배리어 리프는 세계 최대의 산호초 지대이며, 오랫동안 다른 대륙과 떨어져 있어 캥거루와 코알라 같은 고유한 동물이 살아남았습니다.' },
  { name: '뉴질랜드', symbol: '▤', type: 'accent-blue', tag: '빙하/화산', cost: 65000, photo: 'images/newzealand.jpg', code: 'nz', lat: -41.3, lon: 172.8,
    desc: '태평양판과 인도-오스트레일리아판이 만나는 경계에 있어 화산과 지진 활동이 활발합니다. 북섬의 로토루아 일대에서는 땅속에서 데워진 물이 주기적으로 솟구치는 간헐천과 머드 풀을 볼 수 있습니다. 남섬 남서부에는 빙하가 파낸 깊은 골짜기에 바닷물이 들어와 절벽이 솟은 피오르가 발달해 있습니다. 바다의 영향과 편서풍 덕분에 연중 온화하고 비가 고르게 내려 풀이 잘 자라므로 양과 소를 기르는 목축업과 유제품 산업이 발달했으며, 원주민 마오리족이 고유한 언어와 문화를 이어 오고 있습니다.' }
];

// 사진은 images 폴더의 파일을 씁니다. 인터넷이 없거나 학교 망이 막혀도 그대로 보입니다.
function photoUrl(space) {
  return space.photo || '';
}

// ============================================================
// 문제 출제기 — 한 게임 안에서 같은 문제가 두 번 나오지 않게 관리합니다.
// ============================================================
const usedQuizzes = {};

function pickQuiz(poolKey, pool) {
  if (!pool || !pool.length) return null;
  if (!usedQuizzes[poolKey]) usedQuizzes[poolKey] = new Set();
  const used = usedQuizzes[poolKey];
  if (used.size >= pool.length) used.clear();   // 그 풀을 다 풀었을 때만 초기화
  const candidates = [];
  for (let i = 0; i < pool.length; i += 1) if (!used.has(i)) candidates.push(i);
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  used.add(picked);
  const row = pool[picked];
  return { key: `${poolKey}#${picked}`, question: row[0], options: row[1], answer: row[1][row[2]], explanation: row[3] };
}

function countryQuiz(spaceName) { return pickQuiz(spaceName, COUNTRY_QUIZZES[spaceName]); }
function climateQuiz() { return pickQuiz('__climate', CLIMATE_QUIZZES); }
function landformQuiz() { return pickQuiz('__landform', LANDFORM_QUIZZES); }

// ============================================================
// 보너스 카드 (생태 쉼터)
// ============================================================
const BONUS_CARDS = [
  { id: 'toll-free', icon: '🎫', name: '통행세 면제권', keep: true,
    desc: '다른 사람의 땅에 도착했을 때 통행세를 한 번 내지 않아도 됩니다. 원하는 때에 사용하세요.' },
  { id: 'free-build', icon: '🏗️', name: '무료 증축권', keep: true,
    desc: '내 땅에 건물을 한 채 공짜로 지을 수 있습니다. 통행세가 크게 오릅니다.' },
  { id: 'half-price', icon: '🏷️', name: '반값 매입권', keep: true,
    desc: '다음에 땅을 살 때 땅값의 절반만 내면 됩니다.' },
  { id: 'go-start', icon: '🚩', name: '출발지로 이동', keep: false,
    desc: '지금 바로 출발지로 이동하고 월급 ₩70,000을 받습니다.' },
  { id: 'go-anywhere', icon: '✈️', name: '세계 어디든 이동', keep: false,
    desc: '가고 싶은 나라를 골라 그곳으로 바로 이동합니다. 빈 땅이면 퀴즈를 풀고 살 수 있습니다. 가는 길에 출발지를 지나면 월급도 받습니다.' },
  { id: 'scholarship', icon: '💰', name: '환경 장학금', keep: false,
    desc: '지구를 지킨 보답으로 ₩40,000을 받습니다.' },
  { id: 'one-more', icon: '🎲', name: '한 번 더 굴리기', keep: false,
    desc: '이번 차례에 주사위를 한 번 더 굴릴 수 있습니다.' },
  { id: 'forest', icon: '🌳', name: '숲 보호 보너스', keep: false,
    desc: '내가 가진 땅 한 곳마다 ₩12,000씩 환경 지원금을 받습니다.' }
];

const ITEM_INFO = {};
BONUS_CARDS.forEach(c => { if (c.keep) ITEM_INFO[c.id] = c; });

// ============================================================
// 보드판 생성
// ============================================================
const route = [];
for (let column = 0; column < 9; column += 1) route.push(column);
for (let row = 1; row < 9; row += 1) route.push(row * 9 + 8);
for (let column = 7; column >= 0; column -= 1) route.push(8 * 9 + column);
for (let row = 7; row >= 1; row -= 1) route.push(row * 9);

const tileElements = [];
const perimeterSpaces = new Map(spaces.map((space, index) => [route[index], { ...space, spaceIndex: index }]));

for (let index = 0; index < 81; index += 1) {
  const spaceInfo = perimeterSpaces.get(index);
  const tile = document.createElement('div');
  tile.dataset.gridIndex = index;

  if (!spaceInfo) {
    tile.className = 'tile empty';
  } else {
    tile.className = `tile ${spaceInfo.type} ${spaceInfo.isSpecial ? 'special-tile ' + spaceInfo.type : 'photo-tile'}`;
    tile.dataset.space = spaceInfo.spaceIndex;

    if (!spaceInfo.isSpecial) tile.style.backgroundImage = `url("${photoUrl(spaceInfo)}")`;

    const tagHtml = spaceInfo.tag ? `<span class="tile-category-tag">${spaceInfo.tag}</span>` : '';
    const badgeHtml = spaceInfo.isSpecial ? `<span class="special-badge">${spaceInfo.symbol}</span>` : '';
    // 글자 수가 많을수록 작은 글씨를 써서 칸 밖으로 넘치지 않게 합니다.
    const nameClass = spaceInfo.name.length >= 5 ? ' long-name' : spaceInfo.name.length >= 4 ? ' medium-name' : '';

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

    // 말이 움직이는 중에는 정보창을 열지 않습니다 (진행 방해 방지).
    tile.addEventListener('click', () => {
      if (isMoving) return;
      showInfoModal(spaceInfo.spaceIndex);
    });
  }

  board.appendChild(tile);
  tileElements.push(tile);
}

const propertyState = spaces.map(() => ({ owner: null, buildings: 0 }));


// ============================================================
// 중앙 지구본 — 정사영(orthographic) 도법으로 대륙과 위경선을 그립니다.
// 말이 도착한 나라가 정면으로 오도록 지구본이 천천히 돌아갑니다.
// ============================================================
const globeSvg = document.querySelector('#globe');
const globeCaption = document.querySelector('#globe-caption');
const GLOBE_R = 78;           // 지구 반지름 (viewBox 200 기준)
const GLOBE_CX = 100, GLOBE_CY = 100;

let globeLon = 120, globeLat = 15;      // 현재 보고 있는 중심 (경도, 위도)
let globeTargetLon = 120, globeTargetLat = 15;
let globeMarker = null;                 // { lat, lon, name }
let globeAnim = null;

const rad = d => d * Math.PI / 180;

// 위경도를 3차원 단위벡터로 바꾼다. 회전할 때마다 삼각함수를 다시 계산하지 않도록
// 해안선·위경선 좌표는 처음 한 번만 벡터로 만들어 두고, 매 프레임에는 곱셈만 한다.
function vecOf(lat, lon) {
  const p = rad(lat), l = rad(lon);
  return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
}

// 고리가 어느 쪽으로 감겨 있는지 (구면 부호 면적). 양수면 땅, 음수면 땅에 뚫린
// 호수(카스피해)입니다. 감긴 방향은 가장자리를 이어 붙일 때 어느 쪽으로 돌지 정합니다.
function ringSignedArea(points) {
  let sum = 0, lon0 = null, cosHalf0 = 1, sinHalf0 = 0;
  points.forEach(([lon, lat]) => {
    const l = rad(lon), half = rad(lat) / 2 + Math.PI / 4;
    const sinHalf = Math.sin(half), cosHalf = Math.cos(half);
    if (lon0 !== null) {
      const dl = l - lon0, sign = dl >= 0 ? 1 : -1, adl = sign * dl;
      const k = sinHalf0 * sinHalf;
      sum += Math.atan2(k * sign * Math.sin(adl), cosHalf0 * cosHalf + k * Math.cos(adl));
    }
    lon0 = l; cosHalf0 = cosHalf; sinHalf0 = sinHalf;
  });
  return 2 * sum;
}

const landRings = (typeof WORLD_LAND === 'string' ? WORLD_LAND : '')
  .split(';').filter(Boolean)
  .map((r) => {
    const pts = r.split(',').map(pt => { const [lon, lat] = pt.split(' '); return [Number(lon), Number(lat)]; });
    return { vecs: pts.map(([lon, lat]) => vecOf(lat, lon)), hole: ringSignedArea(pts) < 0 };
  })
  .sort((a, b) => Number(a.hole) - Number(b.hole));   // 호수는 대륙 위에 덧그린다

// 위선 · 경선 · 적도 · 회귀선도 미리 벡터로 만들어 둔다
function ringOfLat(lat) { const v = []; for (let lon = -180; lon <= 180; lon += 3) v.push(vecOf(lat, lon)); return v; }
function ringOfLon(lon) { const v = []; for (let lat = -90; lat <= 90; lat += 3) v.push(vecOf(lat, lon)); return v; }
const parallels = [-60, -30, 30, 60].map(ringOfLat);
const meridians = []; for (let lon = -180; lon < 180; lon += 30) meridians.push(ringOfLon(lon));
const tropics = [23.5, -23.5].map(ringOfLat);
const equator = ringOfLat(0);

// 현재 보고 있는 방향의 회전 계수 (drawGlobe 첫머리에서 갱신)
let viewCosLon = 1, viewSinLon = 0, viewCosLat = 1, viewSinLat = 0;

// 정사영 도법. cosC가 0보다 작으면 지구 뒤편이라 보이지 않는다.
function projectVec(v) {
  const east  = v[1] * viewCosLon - v[0] * viewSinLon;   // 중심 경선 기준 동서 성분
  const front = v[0] * viewCosLon + v[1] * viewSinLon;   // 중심 경선 방향 성분
  return {
    x: GLOBE_CX + GLOBE_R * east,
    y: GLOBE_CY - GLOBE_R * (viewCosLat * v[2] - viewSinLat * front),
    cosC: viewSinLat * v[2] + viewCosLat * front
  };
}

// 보이는 점과 안 보이는 점 사이에서 '지구 가장자리'를 이분법으로 찾는다.
// 이렇게 해야 선이 테두리에 딱 붙어 끊기고, 가장자리 앞에서 미리 잘리지 않는다.
function limbBetween(visibleVec, hiddenVec) {
  let a = visibleVec, b = hiddenVec;
  for (let i = 0; i < 14; i += 1) {
    let mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, mz = (a[2] + b[2]) / 2;
    const len = Math.hypot(mx, my, mz) || 1;
    const m = [mx / len, my / len, mz / len];
    if (projectVec(m).cosC >= 0) a = m; else b = m;
  }
  // 이어 붙일 호와 정확히 맞물리도록 반지름을 가장자리에 맞춘다
  const q = projectVec(a);
  const dx = q.x - GLOBE_CX, dy = q.y - GLOBE_CY;
  const len = Math.hypot(dx, dy) || 1;
  return { x: GLOBE_CX + dx / len * GLOBE_R, y: GLOBE_CY + dy / len * GLOBE_R, cosC: 0 };
}

// 위경선처럼 '이어진 선'을 그린다. 뒤편 구간은 건너뛰되 가장자리에서 정확히 끊는다.
function linePath(vecs) {
  let d = '', pen = false, prev = null, prevVisible = false;
  const at = (q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;

  for (let i = 0; i < vecs.length; i += 1) {
    const v = vecs[i];
    const q = projectVec(v);
    const visible = q.cosC >= 0;

    if (visible && !pen) {
      if (prev && !prevVisible) d += `M${at(limbBetween(v, prev))}L${at(q)}`;  // 가장자리에서 시작
      else d += `M${at(q)}`;
      pen = true;
    } else if (visible) {
      d += `L${at(q)}`;
    } else if (pen) {
      d += `L${at(limbBetween(prev, v))}`;                                     // 가장자리에서 끝
      pen = false;
    }
    prev = v; prevVisible = visible;
  }
  return d;
}

// 대륙 한 덩어리를 채워진 다각형으로 그린다.
//
// 뒤편으로 넘어간 점을 그냥 건너뛰면 다각형이 조각나면서 대륙 사이를 가로지르는
// 직선이 생기고, 조각들의 회전 방향이 엇갈려 땅이 통째로 사라지거나 바다가 땅으로
// 칠해진다(남극 대륙처럼 지구를 한 바퀴 도는 덩어리에서 특히 심하다).
// 그래서 앞면에 보이는 구간만 잘라 내고, 잘린 자리끼리는 '지구 가장자리를 따라'
// 이어 붙여 다시 닫힌 도형으로 만든다.
const TWO_PI = Math.PI * 2;

function limbAngle(q) { return Math.atan2(q.y - GLOBE_CY, q.x - GLOBE_CX); }
function xy(q) { return `${q.x.toFixed(1)} ${q.y.toFixed(1)}`; }

function landPath(ringData) {
  const ring = ringData.vecs;
  const limbDir = ringData.hole ? -1 : 1;   // 감긴 방향에 맞춰 가장자리를 돈다
  const n = ring.length;
  const proj = new Array(n);
  let visibleCount = 0;
  for (let i = 0; i < n; i += 1) {
    proj[i] = projectVec(ring[i]);
    if (proj[i].cosC >= 0) visibleCount += 1;
  }

  if (visibleCount === 0) return '';                    // 통째로 지구 뒤편

  if (visibleCount === n) {                             // 통째로 앞면 — 그대로 그린다
    let d = '';
    for (let i = 0; i < n; i += 1) d += (i ? 'L' : 'M') + xy(proj[i]);
    return d + 'Z';
  }

  // 뒤편에서 앞면으로 넘어오는 지점을 시작으로 잡아야 조각이 깔끔하게 나뉜다
  let startIndex = 0;
  for (let i = 0; i < n; i += 1) {
    if (proj[i].cosC >= 0 && proj[(i - 1 + n) % n].cosC < 0) { startIndex = i; break; }
  }

  // 앞면에 보이는 구간(조각)들을 모은다. 조각의 처음과 끝은 지구 가장자리 위의 점이다.
  const pieces = [];
  let piece = null;
  for (let k = 0; k < n; k += 1) {
    const i = (startIndex + k) % n;
    const prev = (i - 1 + n) % n;
    const visible = proj[i].cosC >= 0;
    const prevVisible = proj[prev].cosC >= 0;

    if (visible && !prevVisible) { piece = [limbBetween(ring[i], ring[prev]), proj[i]]; pieces.push(piece); }
    else if (visible && piece) { piece.push(proj[i]); }
    else if (!visible && prevVisible && piece) { piece.push(limbBetween(ring[prev], ring[i])); piece = null; }
  }
  if (piece && piece.length) piece.push(limbBetween(ring[(startIndex - 1 + n) % n], ring[startIndex]));

  if (!pieces.length) return '';

  const inAngle = pieces.map(pt => limbAngle(pt[0]));
  const outAngle = pieces.map(pt => limbAngle(pt[pt.length - 1]));
  const used = new Array(pieces.length).fill(false);
  let d = '';

  for (let seed = 0; seed < pieces.length; seed += 1) {
    if (used[seed]) continue;

    let index = seed, first = true;
    while (!used[index]) {
      used[index] = true;
      pieces[index].forEach((q, i) => { d += (first && i === 0 ? 'M' : 'L') + xy(q); });
      first = false;

      // 가장자리를 따라 한 방향으로 돌다가 처음 만나는 조각의 시작점으로 잇는다
      let next = index, sweep = Infinity;
      for (let j = 0; j < pieces.length; j += 1) {
        let delta = ((inAngle[j] - outAngle[index]) * limbDir) % TWO_PI;
        if (delta < 0) delta += TWO_PI;
        if (delta < sweep) { sweep = delta; next = j; }
      }

      const steps = Math.max(1, Math.ceil(sweep / (Math.PI / 60)));   // 호를 3도씩 잘라 잇는다
      for (let t = 1; t <= steps; t += 1) {
        const a = outAngle[index] + limbDir * sweep * (t / steps);
        d += `L${(GLOBE_CX + GLOBE_R * Math.cos(a)).toFixed(1)} ${(GLOBE_CY + GLOBE_R * Math.sin(a)).toFixed(1)}`;
      }
      index = next;
    }
    d += 'Z';
  }

  return d;
}

function drawGlobe() {
  if (!globeSvg) return;

  viewCosLon = Math.cos(rad(globeLon)); viewSinLon = Math.sin(rad(globeLon));
  viewCosLat = Math.cos(rad(globeLat)); viewSinLat = Math.sin(rad(globeLat));

  const parts = [];

  // 바다
  parts.push(`<circle cx="${GLOBE_CX}" cy="${GLOBE_CY}" r="${GLOBE_R}" fill="url(#seaGrad)"/>`);

  // 대륙 — 덩어리마다 따로 그린다. 하나의 path에 몰아넣으면 겹친 부분이
  // 서로 상쇄되어 구멍이 뚫린 것처럼 보인다.
  landRings.forEach((ring) => {
    const d = landPath(ring);
    if (!d) return;
    const fill = ring.hole ? 'url(#seaGrad)' : '#7fa87f';   // 카스피해 같은 내륙호는 바다색으로 덮는다
    parts.push(`<path d="${d}" fill="${fill}" stroke="#4d7350" stroke-width="0.5" stroke-linejoin="round"/>`);
  });

  // 위선 (30도 간격)
  parallels.forEach((pts) => {
    const d = linePath(pts);
    if (d) parts.push(`<path d="${d}" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="0.5"/>`);
  });
  // 경선 (30도 간격)
  meridians.forEach((pts) => {
    const d = linePath(pts);
    if (d) parts.push(`<path d="${d}" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="0.5"/>`);
  });
  // 북회귀선 / 남회귀선 (23.5도)
  tropics.forEach((pts) => {
    const d = linePath(pts);
    if (d) parts.push(`<path d="${d}" fill="none" stroke="#f4c84e" stroke-width="0.8" stroke-dasharray="3 2.5" opacity=".85"/>`);
  });
  // 적도
  const eqD = linePath(equator);
  if (eqD) parts.push(`<path d="${eqD}" fill="none" stroke="#ef6a43" stroke-width="1.4"/>`);

  // 현재 칸 표시 (반짝임)
  if (globeMarker) {
    const q = projectVec(vecOf(globeMarker.lat, globeMarker.lon));
    if (q.cosC >= 0) {
      parts.push(`<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="7" fill="none" stroke="#ef6a43" stroke-width="1.6" class="globe-ping"/>`);
      parts.push(`<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="3.2" fill="#ef6a43" stroke="#fffdf7" stroke-width="1.2"/>`);
    }
  }

  globeSvg.innerHTML = `
    <defs>
      <radialGradient id="seaGrad" cx="35%" cy="30%">
        <stop offset="0%" stop-color="#bcd8e8"/>
        <stop offset="65%" stop-color="#8fbcd4"/>
        <stop offset="100%" stop-color="#5b8ba6"/>
      </radialGradient>
      <clipPath id="globeClip">
        <circle cx="${GLOBE_CX}" cy="${GLOBE_CY}" r="${GLOBE_R}"/>
      </clipPath>
    </defs>
    <g class="globe-body" clip-path="url(#globeClip)">${parts.join('')}</g>
    <circle cx="${GLOBE_CX}" cy="${GLOBE_CY}" r="${GLOBE_R}" fill="none" stroke="rgba(32,35,31,.5)" stroke-width="1.2"/>`;
}

// 목표 지점이 정면으로 오도록 부드럽게 회전
function spinGlobeTo(lat, lon, marker) {
  globeTargetLat = Math.max(-60, Math.min(60, lat));
  let delta = lon - globeLon;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  globeTargetLon = globeLon + delta;
  globeMarker = marker || null;

  if (globeAnim) cancelAnimationFrame(globeAnim);
  const fromLon = globeLon, fromLat = globeLat, t0 = performance.now(), dur = 900;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);          // 끝에서 부드럽게 감속
    globeLon = fromLon + (globeTargetLon - fromLon) * e;
    globeLat = fromLat + (globeTargetLat - fromLat) * e;
    drawGlobe();
    if (k < 1) globeAnim = requestAnimationFrame(step); else globeAnim = null;
  };
  globeAnim = requestAnimationFrame(step);
}

// 지구본이 도는 데 0.9초, 학생들이 위치를 확인할 시간 0.7초.
// 지구본에 표시할 좌표가 없는 특수칸은 기다리지 않는다.
const GLOBE_SPIN_MS = 900, GLOBE_LOOK_MS = 700;
function globePauseFor(space) {
  return (space && typeof space.lat === 'number') ? GLOBE_SPIN_MS + GLOBE_LOOK_MS : 0;
}

// 현재 차례인 사람이 서 있는 칸을 지구본에 표시
function updateGlobeForSpace(space) {
  if (!globeSvg) return;
  if (space && typeof space.lat === 'number') {
    spinGlobeTo(space.lat, space.lon, { lat: space.lat, lon: space.lon });
    if (globeCaption) {
      const ns = space.lat >= 0 ? '북위' : '남위';
      const ew = space.lon >= 0 ? '동경' : '서경';
      globeCaption.innerHTML = `<b>${space.name}</b> · ${ns} ${Math.abs(space.lat).toFixed(0)}° ${ew} ${Math.abs(space.lon).toFixed(0)}°`;
      globeCaption.classList.remove('hidden');
    }
  } else {
    globeMarker = null;
    drawGlobe();
    if (globeCaption) globeCaption.classList.add('hidden');
  }
}

drawGlobe();

// ============================================================
// 토스트 알림 — 돈이 오가는 일을 화면에 바로 알려 줍니다.
// ============================================================
function showToast(icon, text, tone = 'info') {
  if (!toastArea) return;
  const el = document.createElement('div');
  el.className = `toast toast-${tone}`;
  el.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${text}</span>`;
  toastArea.appendChild(el);
  setTimeout(() => el.classList.add('toast-out'), 2600);
  setTimeout(() => el.remove(), 3100);
  while (toastArea.children.length > 4) toastArea.firstElementChild.remove();
}

// ============================================================
// 정보 모달
// ============================================================
function showInfoModal(spaceIndex) {
  const space = spaces[spaceIndex];
  const state = propertyState[spaceIndex];
  const infoTitle = document.querySelector('#info-title');
  const infoTag = document.querySelector('#info-tag');
  const infoPhoto = document.querySelector('#info-photo');
  const infoBody = document.querySelector('.info-body');
  const infoDesc = document.querySelector('#info-desc');
  const infoCost = document.querySelector('#info-cost');
  const infoOwner = document.querySelector('#info-owner');
  const infoToll = document.querySelector('#info-toll');

  // 나라 칸이면 이름 앞에 국기를 보여 줍니다.
  const infoFlag = document.querySelector('#info-flag');
  if (space.code) {
    infoFlag.src = `images/flags/${space.code}.png`;
    infoFlag.alt = `${space.name} 국기`;
    infoFlag.classList.remove('hidden');
  } else {
    infoFlag.classList.add('hidden');
  }

  infoTitle.textContent = space.isSpecial ? `${space.symbol} ${space.name}` : space.name;
  infoTag.textContent = space.tag ? `[${space.tag}]` : '탐험 특수칸';
  infoDesc.textContent = space.desc || '세계의 기후와 지형을 탐험해보세요.';

  if (!space.isSpecial) {
    infoPhoto.style.backgroundImage = `url("${photoUrl(space)}")`;
    infoPhoto.style.display = 'block';
    infoBody.classList.remove('no-photo');
    infoCost.textContent = won(space.cost);
    if (state.owner !== null && gamePlayers[state.owner]) {
      infoOwner.textContent = `${gamePlayers[state.owner].name} (건물 ${state.buildings}단계)`;
      infoToll.textContent = won(tollOf(spaceIndex));
    } else {
      infoOwner.textContent = '구매 가능 (빈 땅)';
      infoToll.textContent = `${won(Math.round(space.cost * TOLL_RATES[0]))} (건물 없을 때)`;
    }
  } else {
    infoPhoto.style.display = 'none';
    infoBody.classList.add('no-photo');
    infoCost.textContent = '특수칸';
    infoOwner.textContent = '공용 구역';
    infoToll.textContent = '없음';
  }

  infoModal.classList.remove('hidden');
}

closeInfoBtn.addEventListener('click', () => infoModal.classList.add('hidden'));

// ============================================================
// 말 배치
// ============================================================
function renderPlayerPiece(playerIndex, position) {
  const tile = tileElements[route[position]];
  const slot = tile && tile.querySelector(`.slot-${playerIndex}`);
  if (!slot) return null;
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
  const slot = tile && tile.querySelector(`.slot-${playerIndex}`);
  if (!slot) return;
  const piece = slot.querySelector('.piece');
  if (piece) piece.remove();
}

// ============================================================
// 공용 선택 모달 (보너스 카드, 증축 확인, 면제권 사용 등)
// ============================================================
function openChoiceModal({ eyebrow, icon, title, desc, descHtml, buttons = [], choices = null }) {
  cardEyebrow.textContent = eyebrow || '';
  cardIcon.textContent = icon || '';
  cardTitle.textContent = title || '';
  if (descHtml) cardDesc.innerHTML = descHtml; else cardDesc.textContent = desc || '';

  cardChoices.innerHTML = '';
  cardChoices.classList.toggle('hidden', !choices);
  if (choices) {
    choices.forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'card-choice-btn';
      btn.innerHTML = `<strong>${ch.label}</strong><span>${ch.sub || ''}</span>`;
      btn.addEventListener('click', () => { closeChoiceModal(); ch.onClick(); });
      cardChoices.appendChild(btn);
    });
  }

  cardActions.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = b.primary ? 'start-game' : 'card-sub-btn';
    btn.textContent = b.label;
    btn.addEventListener('click', () => { closeChoiceModal(); b.onClick(); });
    cardActions.appendChild(btn);
  });

  cardModal.classList.remove('hidden');
}

function closeChoiceModal() { cardModal.classList.add('hidden'); }

// ============================================================
// 플레이어 카드 갱신
// ============================================================
function calculateTotalAssets(playerIndex) {
  const player = gamePlayers[playerIndex];
  let propertyVal = 0;
  propertyState.forEach((st, idx) => {
    if (st.owner === playerIndex) propertyVal += bookValueOf(idx);
  });
  return player.money + propertyVal;
}

function updatePlayerRow(index) {
  const player = gamePlayers[index];
  const card = playerCards[index];
  if (!card || !player) return;

  card.classList.toggle('bankrupt', !!player.isBankrupt);
  card.querySelector('.money').textContent = won(player.money);
  card.querySelector('.player-location').textContent = player.isBankrupt
    ? '파산 — 게임에서 물러났습니다'
    : `위치: ${spaces[player.position].name}`;
  card.querySelector('.asset-total').textContent = won(calculateTotalAssets(index));

  const ownedLands = [];
  propertyState.forEach((st, sIdx) => {
    if (st.owner === index) ownedLands.push({ space: spaces[sIdx], buildings: st.buildings });
  });

  const landsCountEl = card.querySelector('.lands-count');
  const landsListEl = card.querySelector('.lands-list');
  if (landsCountEl) landsCountEl.textContent = String(ownedLands.length);
  if (landsListEl) {
    landsListEl.innerHTML = ownedLands.length === 0
      ? '<span class="no-lands">아직 소유한 땅이 없습니다.</span>'
      : ownedLands.map(l => `<span class="land-pill${l.buildings > 0 ? ` building-${l.buildings}` : ''}">${l.space.symbol} ${l.space.name}${l.buildings ? ` 🏠${l.buildings}` : ''}</span>`).join('');
  }

  // 보너스 카드는 가진 것이 있을 때만 보여 줍니다 (4인 플레이에서 카드가 길어지지 않도록).
  const itemsEl = card.querySelector('.player-items');
  const itemsSection = card.querySelector('.player-items-section');
  if (itemsEl && itemsSection) {
    const items = player.items || [];
    itemsSection.classList.toggle('hidden', items.length === 0);
    itemsEl.innerHTML = items.map(id => `<span class="item-pill">${ITEM_INFO[id].icon} ${ITEM_INFO[id].name}</span>`).join('');
  }
}

function updateAllRows() { gamePlayers.forEach((_, i) => updatePlayerRow(i)); }

function updatePropertyTile(spaceIndex) {
  const state = propertyState[spaceIndex];
  const tile = tileElements[route[spaceIndex]];
  tile.classList.remove('owner-0', 'owner-1', 'owner-2', 'owner-3');
  const old = tile.querySelector('.owner-badge');
  if (old) old.remove();
  if (state.owner === null) return;
  tile.classList.add(`owner-${state.owner}`);
  const badge = document.createElement('span');
  badge.className = 'owner-badge';
  badge.textContent = `${gamePlayers[state.owner].name}${state.buildings ? ` · 건물${state.buildings}` : ''}`;
  tile.appendChild(badge);
}

function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ============================================================
// 턴 관리
// ============================================================
function alivePlayers() { return gamePlayers.filter(p => !p.isBankrupt); }

function nextAliveIndex(from) {
  for (let step = 1; step <= gamePlayers.length; step += 1) {
    const idx = (from + step) % gamePlayers.length;
    if (!gamePlayers[idx].isBankrupt) return idx;
  }
  return -1;
}

function updateCurrentTurnUI() {
  if (!gamePlayers.length) return;
  const current = gamePlayers[currentPlayerIndex];
  if (!current) return;

  centerTurnDot.className = `center-turn-dot p-${currentPlayerIndex}`;
  centerTurnText.innerHTML = `<strong>${current.name}</strong> 님의 차례입니다`;

  if (current.isAI) {
    rollBtnText.textContent = `🤖 ${current.name} 생각 중...`;
    rollButton.disabled = true;
  } else {
    rollBtnText.textContent = `[${current.name}] 주사위 굴리기`;
    rollButton.disabled = isMoving || isGameFinished;
  }

  playerCards.forEach((card, index) => card.classList.toggle('active', index === currentPlayerIndex));

  if (current.isAI && !isGameFinished && !isMoving) {
    setTimeout(() => {
      if (currentPlayerIndex === current.index && !isGameFinished && !isMoving) triggerDiceRoll();
    }, 750);
  }
}

function addActivityLog(text) {
  console.log('[LOG]', String(text).replace(/<[^>]+>/g, ''));
}

function closeAllPlayModals() {
  quizModal.classList.add('hidden');
  sellModal.classList.add('hidden');
  cardModal.classList.add('hidden');
  infoModal.classList.add('hidden');
  aiQuizBanner.classList.add('hidden');
}

function checkGameOver(reason = 'round') {
  if (isGameFinished) return true;

  const alive = alivePlayers();
  const endByLastMan = gamePlayers.length > 1 && alive.length <= 1;
  const endByRound = gameMode === 'round' && targetMaxRounds > 0 && currentRound > targetMaxRounds;
  const endByTime = gameMode === 'time' && reason === 'time';
  if (!endByLastMan && !endByRound && !endByTime) return false;

  isGameFinished = true;
  rollButton.disabled = true;
  if (timerInterval) clearInterval(timerInterval);
  closeAllPlayModals();
  sounds.playFanfare();

  if (endByLastMan) {
    gameOverTitle.textContent = '🏁 최후의 탐험가!';
    gameOverDesc.textContent = `${currentRound}라운드 만에 ${alive[0] ? alive[0].name : '아무도'} 님을 남기고 모두 파산했습니다. 최종 자산 순위입니다.`;
  } else if (endByTime) {
    gameOverTitle.textContent = '⏱️ 제한 시간 종료!';
    gameOverDesc.textContent = `설정된 ${targetTimeMinutes}분의 탐험 시간이 모두 끝났습니다! 최종 자산 순위입니다.`;
  } else {
    gameOverTitle.textContent = '🏁 라운드 완주!';
    gameOverDesc.textContent = `목표한 ${targetMaxRounds}라운드를 모두 완주했습니다! 최종 자산 순위입니다.`;
  }

  // 파산자는 순위 맨 아래로 내립니다.
  const ranking = gamePlayers.map((p, idx) => ({
    index: idx, name: p.name, bankrupt: !!p.isBankrupt,
    totalAssets: p.isBankrupt ? -1 : calculateTotalAssets(idx), cash: p.money
  })).sort((a, b) => b.totalAssets - a.totalAssets);

  const victoryRanking = document.querySelector('#victory-ranking');
  const medals = ['🥇 1위 (우승)', '🥈 2위', '🥉 3위', '4위'];

  victoryRanking.innerHTML = ranking.map((r, rankIdx) => `
    <div class="victory-rank-row ${rankIdx === 0 ? 'rank-1' : ''} ${r.bankrupt ? 'rank-out' : ''}">
      <span class="victory-rank-badge">${r.bankrupt ? '💸 파산' : medals[rankIdx]}</span>
      <span class="victory-rank-name"><b>${r.name}</b> (현금 ${won(r.cash)})</span>
      <span class="victory-rank-val">${r.bankrupt ? '탈락' : won(r.totalAssets)}</span>
    </div>
  `).join('');

  gameOverModal.classList.remove('hidden');
  addActivityLog(`🏆 게임 종료! ${ranking[0].name} 우승`);
  return true;
}

function endTurn() {
  if (isGameFinished) return;

  // 더블을 굴렸거나 '한 번 더 굴리기' 카드를 뽑았다면 같은 사람이 한 번 더 굴립니다.
  // 단, 그 사이에 파산해 탈락했다면 기회는 사라집니다.
  const roller = gamePlayers[currentPlayerIndex];
  if (extraRollQueue.length && roller && !roller.isBankrupt) {
    const reason = extraRollQueue.shift();
    updateAllRows();
    showToast('🎲', reason === 'double'
      ? '<b>더블!</b> 같은 눈이 나와 한 번 더 굴립니다.'
      : '<b>한 번 더</b> 굴릴 수 있습니다!', 'good');
    updateCurrentTurnUI();
    return;
  }
  extraRollQueue.length = 0;

  const next = nextAliveIndex(currentPlayerIndex);
  if (next === -1) { checkGameOver('last'); return; }
  if (next <= currentPlayerIndex) {
    currentRound += 1;
    roundNumber.textContent = roundLabel();
  }
  currentPlayerIndex = next;

  updateAllRows();
  if (!checkGameOver('round')) updateCurrentTurnUI();
}

// ============================================================
// 파산 처리 — 파산한 사람은 탈락하고, 남은 사람끼리 게임을 이어 갑니다.
// ============================================================
function bankruptPlayer(playerIndex, creditorIndex) {
  const player = gamePlayers[playerIndex];
  if (player.isBankrupt) return;

  propertyState.forEach((st, i) => {
    if (st.owner === playerIndex) {
      if (creditorIndex === null || creditorIndex === undefined) { st.owner = null; st.buildings = 0; }
      else st.owner = creditorIndex;
      updatePropertyTile(i);
    }
  });

  if (creditorIndex !== null && creditorIndex !== undefined && gamePlayers[creditorIndex]) {
    gamePlayers[creditorIndex].money += player.money;
  }
  player.money = 0;
  player.items = [];
  player.isBankrupt = true;
  removePlayerPiece(playerIndex, player.position);

  sounds.playBankrupt();
  showToast('💸', `<b>${player.name}</b> 님이 파산하여 게임에서 물러났습니다.`, 'bad');
  addActivityLog(`${player.name} 파산`);
  updateAllRows();

  if (!checkGameOver('bankrupt')) endTurn();
}

// ============================================================
// 통행세 (사람 / AI 같은 규칙)
// ============================================================
// 남의 땅에 도착하면 그 나라 퀴즈를 먼저 낸다.
// 맞히면 통행세를 그대로, 틀리면 1.2배를 낸다.
function payToll(playerIndex, ownerIndex, spaceIndex) {
  const player = gamePlayers[playerIndex];
  const space = spaces[spaceIndex];
  const quiz = countryQuiz(space.name);
  if (!quiz) { settleToll(playerIndex, ownerIndex, spaceIndex, 1); return; }

  activeQuizSpace = spaceIndex;
  const baseToll = tollOf(spaceIndex);
  const wrongToll = Math.round(baseToll * WRONG_TOLL_RATE);

  if (player.isAI) {
    handleAIQuiz(playerIndex, spaceIndex, quiz, false, space, (correct) => {
      settleToll(playerIndex, ownerIndex, spaceIndex, correct ? 1 : WRONG_TOLL_RATE);
    });
    return;
  }

  aiQuizBanner.classList.add('hidden');
  quizEyebrow.textContent = `TOLL CHALLENGE · [${space.tag}]`;
  quizTitle.textContent = `${space.name} 통행세 문제`;
  quizQuestion.textContent = quiz.question;
  // 금액은 크게 보여 줍니다. 아이들이 문제를 풀기 전에 무엇이 걸려 있는지 알아야 합니다.
  quizResult.innerHTML = `맞히면 <b class="quiz-amount good">${won(baseToll)}</b> · 틀리면 <b class="quiz-amount bad">${won(wrongToll)}</b>`;
  quizExplanation.classList.add('hidden');
  purchaseActions.classList.add('hidden');
  specialActions.classList.add('hidden');

  quizOptions.innerHTML = '';
  shuffleArray(quiz.options).forEach((option) => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.addEventListener('click', () => {
      [...quizOptions.querySelectorAll('button')].forEach(b => { b.disabled = true; });
      quizExplanation.textContent = `💡 교과서 탐구: ${quiz.explanation}`;
      quizExplanation.classList.remove('hidden');
      const correct = option === quiz.answer;
      if (correct) {
        btn.classList.add('correct');
        sounds.playCorrect();
        quizResult.innerHTML = `🎉 정답! 통행세는 <b class="quiz-amount good">${won(baseToll)}</b> 그대로입니다.`;
      } else {
        btn.classList.add('incorrect');
        sounds.playIncorrect();
        quizResult.innerHTML = `아쉽습니다. 통행세가 1.2배인 <b class="quiz-amount bad">${won(wrongToll)}</b>이 됩니다.`;
      }
      afterQuizAction = () => settleToll(playerIndex, ownerIndex, spaceIndex, correct ? 1 : WRONG_TOLL_RATE);
      specialActions.classList.remove('hidden');
    });
    quizOptions.appendChild(btn);
  });

  quizModal.classList.remove('hidden');
}

// 실제로 통행세를 주고받는 부분
function settleToll(playerIndex, ownerIndex, spaceIndex, multiplier) {
  const player = gamePlayers[playerIndex];
  const owner = gamePlayers[ownerIndex];
  const toll = Math.round(tollOf(spaceIndex) * (multiplier || 1));
  const space = spaces[spaceIndex];

  const useFreePass = () => {
    player.items.splice(player.items.indexOf('toll-free'), 1);
    sounds.playCard();
    showToast('🎫', `<b>${player.name}</b> 님이 면제권 사용! ${space.name} 통행세 ${won(toll)}을 내지 않았습니다.`, 'good');
    updateAllRows();
    setTimeout(endTurn, 600);
  };

  const doPay = () => {
    player.money -= toll;
    owner.money += toll;
    sounds.playCoin();
    showToast('💸', `<b>${player.name}</b> → <b>${owner.name}</b> · ${space.name} 통행세 <b>${won(toll)}</b>`, 'bad');
    updateAllRows();
    setTimeout(endTurn, 700);
  };

  const hasPass = player.items.includes('toll-free');

  if (player.isAI) {
    if (hasPass && (toll >= 40000 || player.money < toll)) { useFreePass(); return; }
    if (player.money >= toll) { doPay(); return; }
    handleAIShortfall(playerIndex, ownerIndex, toll);
    return;
  }

  if (hasPass) {
    openChoiceModal({
      eyebrow: 'BONUS CARD · 통행세 면제권',
      icon: '🎫',
      title: '통행세 면제권을 사용할까요?',
      desc: `${space.name}의 통행세는 ${won(toll)}입니다. 면제권을 쓰면 이번 통행세를 내지 않아도 됩니다. 지금 가진 현금은 ${won(player.money)}입니다.`,
      buttons: [
        { label: '면제권 사용하기', primary: true, onClick: useFreePass },
        { label: `통행세 ${won(toll)} 내기`, onClick: () => (player.money >= toll ? doPay() : showSellModal(playerIndex, ownerIndex, toll)) }
      ]
    });
    return;
  }

  if (player.money >= toll) doPay();
  else showSellModal(playerIndex, ownerIndex, toll);
}

// AI가 통행세를 못 낼 때: 비싼 땅부터 팔아 마련하고, 그래도 모자라면 사람과 똑같이 파산합니다.
function handleAIShortfall(playerIndex, ownerIndex, toll, label) {
  const player = gamePlayers[playerIndex];
  const owner = ownerIndex === null || ownerIndex === undefined ? null : gamePlayers[ownerIndex];
  const what = label || '통행세';

  const owned = [];
  propertyState.forEach((st, i) => {
    if (st.owner === playerIndex) owned.push({ i, refund: sellValueOf(i) });
  });
  owned.sort((a, b) => b.refund - a.refund);

  for (const land of owned) {
    if (player.money >= toll) break;
    propertyState[land.i].owner = null;
    propertyState[land.i].buildings = 0;
    player.money += land.refund;
    updatePropertyTile(land.i);
    showToast('🏷️', `🤖 <b>${player.name}</b> 님이 ${spaces[land.i].name} 땅을 ${won(land.refund)}에 급히 팔았습니다.`, 'warn');
  }

  if (player.money >= toll) {
    player.money -= toll;
    if (owner) owner.money += toll;
    sounds.playCoin();
    showToast('💸', owner
      ? `<b>${player.name}</b> → <b>${owner.name}</b> · 통행세 <b>${won(toll)}</b>`
      : `<b>${player.name}</b> → 🏦 은행 · ${what} <b>${won(toll)}</b>`, 'bad');
    updateAllRows();
    setTimeout(endTurn, 800);
  } else {
    setTimeout(() => bankruptPlayer(playerIndex, ownerIndex === undefined ? null : ownerIndex), 800);
  }
}

// ============================================================
// 토지 매각 모달 (사람이 통행세를 못 낼 때)
// ============================================================
// ownerIndex 가 null 이면 은행에 내는 돈(재해·세금)입니다. 이 돈은 게임에서 사라집니다.
function showSellModal(playerIndex, ownerIndex, toll, label) {
  const player = gamePlayers[playerIndex];
  const owner = ownerIndex === null || ownerIndex === undefined ? null : gamePlayers[ownerIndex];
  const what = label || '통행세';

  const sellTitle = document.querySelector('#sell-title');
  const sellDesc = document.querySelector('#sell-desc');
  const sellLabel = document.querySelector('#sell-required-label');
  if (sellTitle) sellTitle.textContent = `💸 토지 매각 (${what} 마련)`;
  if (sellDesc) sellDesc.textContent = `내야 할 돈보다 가진 현금이 적습니다! 소유한 토지를 팔아 현금을 마련하세요. 급매라서 장부가의 ${Math.round(SELL_REFUND_RATE * 100)}%만 돌려받습니다.`;
  if (sellLabel) sellLabel.textContent = `내야 할 ${what}`;

  sellRequiredToll.textContent = won(toll);

  function renderSellStatus() {
    sellCurrentMoney.textContent = won(player.money);
    const deficit = toll - player.money;

    if (deficit <= 0) {
      sellDeficitMoney.textContent = '₩0 (마련 완료!)';
      sellDeficitMoney.className = 'val green';
      payTollBtn.disabled = false;
      payTollBtn.textContent = `${what} ${won(toll)} 내고 턴 종료`;
      bankruptBtn.classList.add('hidden');
    } else {
      sellDeficitMoney.textContent = won(deficit);
      sellDeficitMoney.className = 'val red';
      payTollBtn.disabled = true;
      payTollBtn.textContent = '부족한 금액을 토지 매각으로 마련하세요';
    }

    const ownedLands = [];
    propertyState.forEach((st, idx) => {
      if (st.owner === playerIndex) {
        ownedLands.push({ spaceIndex: idx, space: spaces[idx], buildings: st.buildings,
          refundVal: sellValueOf(idx) });
      }
    });

    if (ownedLands.length === 0) {
      if (deficit > 0) {
        sellLandsList.innerHTML = '<p class="no-lands" style="grid-column: 1/-1; color: #ef4343;">더 이상 매각할 토지가 없습니다. 파산을 선언해야 합니다.</p>';
        bankruptBtn.classList.remove('hidden');
      } else {
        sellLandsList.innerHTML = '<p class="no-lands" style="grid-column: 1/-1;">남은 토지가 없습니다.</p>';
      }
    } else {
      if (deficit > 0) bankruptBtn.classList.add('hidden');
      sellLandsList.innerHTML = ownedLands.map(l => `
        <div class="sell-land-item">
          <div class="sell-land-info">
            <span class="sell-land-name">${l.space.symbol} ${l.space.name}${l.buildings ? ` (건물${l.buildings})` : ''}</span>
            <span class="sell-land-val">매각가 ${won(l.refundVal)}</span>
          </div>
          <button class="sell-btn" data-space="${l.spaceIndex}" data-refund="${l.refundVal}">매각</button>
        </div>
      `).join('');

      sellLandsList.querySelectorAll('.sell-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const sIdx = Number(btn.dataset.space);
          const refund = Number(btn.dataset.refund);
          propertyState[sIdx].owner = null;
          propertyState[sIdx].buildings = 0;
          player.money += refund;
          sounds.playCoin();
          showToast('🏷️', `${spaces[sIdx].name} 땅을 <b>${won(refund)}</b>에 매각했습니다.`, 'warn');
          updateAllRows();
          updatePropertyTile(sIdx);
          renderSellStatus();
        });
      });
    }
  }

  renderSellStatus();
  sellModal.classList.remove('hidden');

  payTollBtn.onclick = () => {
    player.money -= toll;
    if (owner) owner.money += toll;
    sounds.playCoin();
    showToast('💸', owner
      ? `<b>${player.name}</b> → <b>${owner.name}</b> · 통행세 <b>${won(toll)}</b>`
      : `<b>${player.name}</b> → 🏦 은행 · ${what} <b>${won(toll)}</b>`, 'bad');
    updateAllRows();
    sellModal.classList.add('hidden');
    endTurn();
  };

  bankruptBtn.onclick = () => {
    sellModal.classList.add('hidden');
    bankruptPlayer(playerIndex, ownerIndex === undefined ? null : ownerIndex);
  };
}

// ============================================================
// 보너스 카드 처리
// ============================================================
function drawBonusCard(playerIndex) {
  const player = gamePlayers[playerIndex];
  const card = BONUS_CARDS[Math.floor(Math.random() * BONUS_CARDS.length)];
  sounds.playCard();

  if (player.isAI) {
    showToast(card.icon, `🤖 <b>${player.name}</b> 님이 <b>${card.name}</b> 카드를 뽑았습니다.`, 'good');
    setTimeout(() => applyBonusCard(playerIndex, card), 900);
    return;
  }

  openChoiceModal({
    eyebrow: '🌿 ECO REST · 지구촌 보너스 카드',
    icon: card.icon,
    title: card.name,
    desc: card.desc,
    buttons: [{ label: '카드 받기', primary: true, onClick: () => applyBonusCard(playerIndex, card) }]
  });
}

function applyBonusCard(playerIndex, card) {
  const player = gamePlayers[playerIndex];

  if (card.keep) {
    player.items.push(card.id);
    showToast(card.icon, `<b>${player.name}</b> 님이 <b>${card.name}</b>을(를) 얻었습니다.`, 'good');
    updateAllRows();
    setTimeout(endTurn, 500);
    return;
  }

  switch (card.id) {
    case 'go-start': {
      removePlayerPiece(playerIndex, player.position);
      player.position = 0;
      renderPlayerPiece(playerIndex, 0);
      player.money += salaryBonus;
      sounds.playCoin();
      showToast('🚩', `출발지로 이동! 월급 <b>${won(salaryBonus)}</b>을 받았습니다.`, 'good');
      updateAllRows();
      setTimeout(endTurn, 800);
      break;
    }
    case 'go-anywhere': {
      const targets = [];
      spaces.forEach((s, i) => { if (!s.isSpecial && i !== player.position) targets.push({ s, i }); });
      if (player.isAI) {
        const free = targets.filter(t => propertyState[t.i].owner === null);
        const pool = free.length ? free : targets;
        teleportTo(playerIndex, pool[Math.floor(Math.random() * pool.length)].i);
        break;
      }
      openChoiceModal({
        eyebrow: '✈️ WORLD TRAVEL TICKET',
        icon: '✈️',
        title: '어느 나라로 갈까요?',
        desc: '가고 싶은 나라를 고르면 그곳으로 바로 이동합니다. 도착한 곳에서는 평소처럼 퀴즈를 풀거나 통행세를 냅니다.',
        choices: targets.map(t => ({
          label: `${t.s.symbol} ${t.s.name}`,
          sub: (propertyState[t.i].owner === null
            ? `빈 땅 · ${won(t.s.cost)}`
            : `${gamePlayers[propertyState[t.i].owner].name}의 땅 · 통행세 ${won(tollOf(t.i))}`)
            + (passesStart(player.position, t.i) ? ` · 출발지 경유 월급 +${won(salaryBonus)}` : ''),
          onClick: () => teleportTo(playerIndex, t.i)
        }))
      });
      break;
    }
    case 'scholarship': {
      player.money += 40000;
      sounds.playCoin();
      showToast('💰', `환경 장학금 <b>${won(40000)}</b>을 받았습니다.`, 'good');
      updateAllRows();
      setTimeout(endTurn, 700);
      break;
    }
    case 'one-more': {
      extraRollQueue.push('card');
      setTimeout(endTurn, 500);
      break;
    }
    case 'forest': {
      const count = propertyState.filter(st => st.owner === playerIndex).length;
      const reward = count * 12000;
      player.money += reward;
      if (reward > 0) sounds.playCoin();
      showToast('🌳', `가진 땅 ${count}곳 × ${won(12000)} = <b>${won(reward)}</b> 환경 지원금!`, reward > 0 ? 'good' : 'info');
      updateAllRows();
      setTimeout(endTurn, 800);
      break;
    }
    default:
      setTimeout(endTurn, 300);
  }
}

// 말은 언제나 앞으로만 갑니다. 목적지 번호가 지금 칸보다 뒤라면 판을 한 바퀴 돌아
// 출발지(0번 칸)를 지나가게 되므로, 걸어갈 때와 똑같이 월급을 받아야 합니다.
function passesStart(fromIndex, toIndex) {
  return toIndex <= fromIndex;
}

function teleportTo(playerIndex, spaceIndex) {
  const player = gamePlayers[playerIndex];
  const passedStart = passesStart(player.position, spaceIndex);
  removePlayerPiece(playerIndex, player.position);
  player.position = spaceIndex;
  renderPlayerPiece(playerIndex, spaceIndex);
  showToast('✈️', `<b>${player.name}</b> 님이 <b>${spaces[spaceIndex].name}</b>(으)로 날아갔습니다.`, 'info');

  if (passedStart) {
    player.money += salaryBonus;
    sounds.playCoin();
    showToast('💵', `가는 길에 출발지를 지나 월급 <b>${won(salaryBonus)}</b>을 받았습니다.`, 'good');
  }

  updateGlobeForSpace(spaces[spaceIndex]);
  updateAllRows();
  setTimeout(() => resolveLanding(playerIndex), 400 + globePauseFor(spaces[spaceIndex]));
}

// ============================================================
// AI 퀴즈 풀이 연출
// ============================================================
function handleAIQuiz(playerIndex, spaceIndex, quiz, isSpecial, space, onDone, kind) {
  const player = gamePlayers[playerIndex];
  activeQuizSpace = spaceIndex;

  aiQuizBanner.classList.remove('hidden');
  aiQuizBanner.innerHTML = `<span class="ai-pulse-dot"></span> 🤖 <b>${player.name}</b>가 퀴즈를 읽고 있습니다...`;

  const isBuild = kind === 'build';
  quizEyebrow.textContent = isSpecial ? 'AI SPECIAL EXPLORATION CHALLENGE'
    : isBuild ? `BUILD PERMIT · [${space.tag}]`
    : (onDone ? `TOLL CHALLENGE · [${space.tag}]` : `WORLD GEOGRAPHY · [${space.tag}]`);
  quizTitle.textContent = isSpecial ? space.name
    : isBuild ? `${space.name} 건축 문제`
    : (onDone ? `${space.name} 통행세 문제` : `${space.name} 지리 탐험 퀴즈`);
  quizQuestion.textContent = quiz.question;
  quizResult.textContent = '지구봇 AI가 정답을 고민하고 있습니다...';
  quizExplanation.classList.add('hidden');
  purchaseActions.classList.add('hidden');
  specialActions.classList.add('hidden');

  quizOptions.innerHTML = '';
  const shuffled = shuffleArray(quiz.options);
  const optionButtons = shuffled.map(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.disabled = true;
    quizOptions.appendChild(btn);
    return { btn, option };
  });

  quizModal.classList.remove('hidden');

  setTimeout(() => {
    if (isGameFinished) return;
    const isCorrect = Math.random() < 0.78;
    const targetOption = isCorrect ? quiz.answer : (shuffled.find(o => o !== quiz.answer) || quiz.answer);
    const matched = optionButtons.find(o => o.option === targetOption);

    if (matched) {
      if (isCorrect) {
        matched.btn.classList.add('correct');
        sounds.playCorrect();
        quizResult.textContent = `🤖 ${player.name} 정답 선택!`;
        if (onDone) {
          // 통행세 문제처럼 이어질 동작이 따로 있는 경우
        } else if (isSpecial) {
          player.money += specialQuizReward;
          sounds.playCoin();
          showToast('🎓', `🤖 <b>${player.name}</b> 정답! 장학금 <b>${won(specialQuizReward)}</b>`, 'good');
          updateAllRows();
        } else {
          player.money += landQuizReward;
          const useHalf = player.items.includes('half-price');
          const price = useHalf ? Math.round(space.cost * 0.5) : space.cost;
          if (player.money >= price) {
            if (useHalf) player.items.splice(player.items.indexOf('half-price'), 1);
            player.money -= price;
            propertyState[spaceIndex].owner = playerIndex;
            sounds.playCoin();
            updateAllRows();
            updatePropertyTile(spaceIndex);
            quizResult.textContent = `🤖 ${player.name} 정답! 토지(${won(price)}) 매입 완료`;
            showToast('🏳️', `🤖 <b>${player.name}</b> 님이 ${space.name} 땅을 <b>${won(price)}</b>에 샀습니다.`, 'good');
          }
        }
      } else {
        matched.btn.classList.add('incorrect');
        sounds.playIncorrect();
        quizResult.textContent = isBuild ? `🤖 ${player.name} 오답! 건물을 짓지 못합니다.`
          : onDone ? `🤖 ${player.name} 오답! 통행세를 1.2배로 냅니다.`
          : `🤖 ${player.name} 오답 선택!`;
      }
    }

    quizExplanation.textContent = `💡 교과서 해설: ${quiz.explanation}`;
    quizExplanation.classList.remove('hidden');

    setTimeout(() => {
      if (isGameFinished) return;
      quizModal.classList.add('hidden');
      aiQuizBanner.classList.add('hidden');
      if (onDone) onDone(isCorrect); else endTurn();
    }, 2200);
  }, 1600);
}


// ============================================================
// 자연재해 — 나라 칸에서 가끔 일어나 복구비가 은행으로 빠져나갑니다.
// 플레이어끼리 주고받는 통행세와 달리 이 돈은 게임에서 사라지므로,
// 판이 길어질수록 모두의 지갑이 실제로 얇아집니다.
// 재해는 반드시 그 칸의 기후·지형에서 실제로 일어나는 것만 나옵니다.
// ============================================================
const DISASTERS = [
  { id: 'flood', icon: '🌊', name: '홍수', fits: ['계절풍', '온대기후', '하천', '강', '열대', '우림'],
    story: (s) => `${s.name}에 짧은 기간 동안 비가 몰아쳐 강이 넘쳤습니다. 물에 잠긴 마을을 돕는 복구 성금을 냅니다.`,
    learn: '비가 한 계절에 몰려 내리는 지역일수록 홍수 피해가 자주 일어납니다.',
    cost: (o) => 30000 + o.lands * 8000 },

  { id: 'quake', icon: '🌍', name: '지진', fits: ['화산', '지열', '히말라야', '안데스', '고산', '사하라'],
    story: (s) => `${s.name} 부근에서 땅이 크게 흔들렸습니다. 무너진 도로와 다리를 고치는 데 힘을 보탭니다.`,
    learn: '판과 판이 부딪치는 경계에서는 지진과 화산 활동이 활발합니다.',
    cost: (o) => 25000 + o.buildings * 25000 },

  { id: 'typhoon', icon: '🌀', name: '태풍', fits: ['열대', '해안', '계절풍', '온대기후', '산호초'], not: ['우림'],
    story: (s) => `거대한 태풍이 ${s.name}을(를) 지나갔습니다. 지붕과 배를 고치느라 가진 돈의 10%를 씁니다.`,
    learn: '따뜻한 바다에서 만들어진 태풍은 많은 비와 강한 바람을 몰고 옵니다.',
    cost: (o) => Math.max(20000, Math.round(o.money * 0.1 / 1000) * 1000) },

  { id: 'drought', icon: '🏜️', name: '가뭄', fits: ['건조', '사막', '사하라', '오아시스', '사바나', '지중해', '평야', '농업'],
    story: (s) => `${s.name}에 비가 오지 않아 우물과 저수지가 말랐습니다. 먼 곳에서 물을 실어 오는 값을 냅니다.`,
    learn: '강수량이 적은 지역에서는 물을 얻고 나누는 일이 가장 큰 과제입니다.',
    cost: () => 35000 },

  { id: 'volcano', icon: '🌋', name: '화산 폭발', fits: ['화산', '지열', '우림', '빙하'],
    story: (s) => `${s.name} 근처 화산이 화산재를 높이 뿜어냈습니다. 비행기가 멈춰 손해를 봅니다.`,
    learn: '화산재는 하늘 높이 올라가 항공기 운항을 막기도 합니다.',
    cost: () => 40000 },

  { id: 'wildfire', icon: '🔥', name: '산불', fits: ['지중해', '냉대', '침엽', '아마존', '우림', '산호초', '사바나'],
    story: (s) => `${s.name}에 메마른 바람이 이어져 큰 산불이 났습니다. 불을 끄는 비용을 함께 냅니다.`,
    learn: '여름이 덥고 건조한 지역과 넓은 침엽수림에서는 산불이 크게 번지기 쉽습니다.',
    cost: (o) => 25000 + o.lands * 10000 },

  { id: 'blizzard', icon: '❄️', name: '폭설과 한파', fits: ['냉대', '침엽', '피오르', '알프스', '히말라야', '온대기후'],
    story: (s) => `${s.name}에 기록적인 눈이 내리고 기온이 뚝 떨어졌습니다. 난방비와 눈 치우는 값이 늘었습니다.`,
    learn: '고위도 지역과 높은 산지는 겨울이 길고 추워 눈에 대비한 생활 방식이 발달합니다.',
    cost: () => 30000 },

  { id: 'landslide', icon: '🏔️', name: '산사태', fits: ['히말라야', '안데스', '알프스', '피오르', '고산'],
    story: (s) => `${s.name}의 가파른 산비탈이 무너져 마을로 가는 길이 끊겼습니다.`,
    learn: '경사가 급한 산지는 큰비나 지진이 오면 산사태 위험이 커집니다.',
    cost: (o) => 20000 + o.buildings * 20000 },

  { id: 'tornado', icon: '🌪️', name: '토네이도', fits: ['평야', '농업'],
    story: (s) => `${s.name}의 드넓은 평야에 회오리바람이 지나가 농장과 창고가 부서졌습니다.`,
    learn: '막힘없이 트인 넓은 평야에서는 회오리바람(토네이도)이 잘 발달합니다.',
    cost: () => 40000 },

  { id: 'sandstorm', icon: '🌫️', name: '모래폭풍', fits: ['사하라', '사막', '건조', '오아시스'],
    story: (s) => `${s.name}에 모래바람이 몰아쳐 하늘이 누렇게 변했습니다. 도로를 치우는 값을 냅니다.`,
    learn: '사막에서는 바람에 실린 모래가 마을과 도로를 덮어 생활을 어렵게 만듭니다.',
    cost: () => 30000 },

  { id: 'heatwave', icon: '🌡️', name: '폭염', fits: ['지중해', '서안해양성', '계절풍', '온대기후', '오아시스', '평야'],
    story: (s) => `${s.name}에 기록적인 더위가 이어졌습니다. 물과 전기를 사느라 가진 돈의 8%를 씁니다.`,
    learn: '지구의 평균 기온이 오르면서 예전에는 드물던 폭염이 자주 나타나고 있습니다.',
    cost: (o) => Math.max(20000, Math.round(o.money * 0.08 / 1000) * 1000) },

  { id: 'gale', icon: '🌬️', name: '대서양 폭풍', fits: ['서안해양성', '피오르'],
    story: (s) => `편서풍을 타고 온 강한 폭풍이 ${s.name}의 해안을 덮쳤습니다.`,
    learn: '바다에서 부는 편서풍의 영향을 받는 곳은 일 년 내내 비와 바람이 잦습니다.',
    cost: (o) => 30000 + o.lands * 6000 },

  { id: 'locust', icon: '🦗', name: '메뚜기 떼', fits: ['사바나', '건조'],
    story: (s) => `${s.name}에 메뚜기 떼가 몰려와 농작물을 먹어 치웠습니다.`,
    learn: '비가 갑자기 많이 내린 뒤 메뚜기가 크게 불어나 농사를 망치는 일이 있습니다.',
    cost: () => 35000 },

  { id: 'bleaching', icon: '🪸', name: '산호 백화', fits: ['산호초', '해안', '환경'],
    story: (s) => `바닷물이 따뜻해져 ${s.name}의 산호가 하얗게 변했습니다. 바다를 되살리는 일에 힘을 보탭니다.`,
    learn: '바닷물 온도가 오르면 산호가 색을 잃고 죽는 백화 현상이 일어납니다.',
    cost: () => 30000 }
];

// 어느 태그에도 걸리지 않는 칸에서 쓰는 재해
const GENERIC_DISASTER_IDS = ['heatwave', 'flood', 'gale'];

function ownedSummary(playerIndex) {
  let lands = 0, buildings = 0, landValue = 0;
  propertyState.forEach((st, i) => {
    if (st.owner !== playerIndex) return;
    lands += 1; buildings += st.buildings; landValue += spaces[i].cost;
  });
  return { lands, buildings, landValue, money: gamePlayers[playerIndex].money };
}

// 그 칸의 기후·지형에 실제로 일어나는 재해만 뽑습니다.
// 일본에서 토네이도가 나오면 아이들이 배운 것과 어긋나기 때문입니다.
function pickDisaster(space) {
  const tag = `${space.tag || ''} ${space.name || ''}`;
  const fitting = DISASTERS.filter(d => d.fits.some(k => tag.includes(k)) && !(d.not || []).some(k => tag.includes(k)));
  const pool = fitting.length ? fitting : DISASTERS.filter(d => GENERIC_DISASTER_IDS.includes(d.id));
  return pool[Math.floor(Math.random() * pool.length)];
}

function triggerDisaster(playerIndex, spaceIndex) {
  const player = gamePlayers[playerIndex];
  const space = spaces[spaceIndex];
  const card = pickDisaster(space);
  const amount = Math.max(10000, Math.round(card.cost(ownedSummary(playerIndex)) / 1000) * 1000);

  sounds.playIncorrect();
  const finish = () => payToBank(playerIndex, amount, `${card.name} 복구비`);

  if (player.isAI) {
    showToast(card.icon, `🤖 <b>${player.name}</b> · ${space.name}에 ${card.name}! 복구비 <b>${won(amount)}</b>`, 'bad');
    setTimeout(finish, 1200);
    return;
  }

  openChoiceModal({
    eyebrow: `NATURAL DISASTER · ${space.name}`,
    icon: card.icon,
    title: `${card.name} 발생!`,
    descHtml: `${card.story(space)}<br><br>복구비로 낼 돈은 <b class="quiz-amount bad">${won(amount)}</b><br><br><span class="disaster-learn">💡 ${card.learn}</span>`,
    buttons: [{ label: `${won(amount)} 납부하기`, primary: true, onClick: finish }]
  });
}

// 은행에 내는 돈 — 낼 수 없으면 땅을 팔거나 파산합니다.
function payToBank(playerIndex, amount, label) {
  const player = gamePlayers[playerIndex];

  if (player.isAI) {
    if (player.money >= amount) {
      player.money -= amount;
      sounds.playCoin();
      showToast('🏦', `🤖 <b>${player.name}</b> → 은행 · ${label} <b>${won(amount)}</b>`, 'bad');
      updateAllRows();
      setTimeout(endTurn, 700);
    } else {
      handleAIShortfall(playerIndex, null, amount, label);
    }
    return;
  }

  if (player.money >= amount) {
    player.money -= amount;
    sounds.playCoin();
    showToast('🏦', `<b>${player.name}</b> → 은행 · ${label} <b>${won(amount)}</b>`, 'bad');
    updateAllRows();
    setTimeout(endTurn, 700);
  } else {
    showSellModal(playerIndex, null, amount, label);
  }
}

// ============================================================
// 착륙 처리
// ============================================================
function resolveLanding(playerIndex) {
  if (isGameFinished) return;
  const player = gamePlayers[playerIndex];
  const spaceIndex = player.position;
  const space = spaces[spaceIndex];
  const state = propertyState[spaceIndex];

  updatePlayerRow(playerIndex);

  // ── 1. 특수칸
  if (space.isSpecial) {
    activeQuizSpace = spaceIndex;

    if (space.type === 'special-start') {
      // 월급은 이동 중에 이미 지급되었으므로 여기서는 완주 보너스만 더합니다.
      player.money += lapBonus;
      sounds.playCoin();
      showToast('🚩', `출발지에 정확히 도착! 완주 보너스 <b>${won(lapBonus)}</b>`, 'good');
      updateAllRows();
      setTimeout(endTurn, 700);
      return;
    }

    if (space.type === 'special-eco') { drawBonusCard(playerIndex); return; }

    const isClimate = space.type === 'special-climate';
    const quiz = isClimate ? climateQuiz() : landformQuiz();

    if (player.isAI) { handleAIQuiz(playerIndex, spaceIndex, quiz, true, space); return; }

    aiQuizBanner.classList.add('hidden');
    quizEyebrow.textContent = isClimate ? 'CLIMATE EXPLORATION CHALLENGE' : 'LANDFORM GEOGRAPHY CHALLENGE';
    quizTitle.textContent = isClimate ? '🌍 세계 기후 탐험 퀴즈' : '⛰️ 세계 지형 탐험 퀴즈';
    quizQuestion.textContent = quiz.question;
    quizResult.textContent = `문제를 맞히면 탐험 장학금 ${won(specialQuizReward)}을 획득합니다!`;
    quizExplanation.classList.add('hidden');
    purchaseActions.classList.add('hidden');
    specialActions.classList.add('hidden');

    quizOptions.innerHTML = '';
    shuffleArray(quiz.options).forEach((option) => {
      const btn = document.createElement('button');
      btn.textContent = option;
      btn.addEventListener('click', () => {
        [...quizOptions.querySelectorAll('button')].forEach(b => { b.disabled = true; });
        quizExplanation.textContent = `💡 학습 쏙쏙: ${quiz.explanation}`;
        quizExplanation.classList.remove('hidden');

        if (option === quiz.answer) {
          btn.classList.add('correct');
          sounds.playCorrect();
          player.money += specialQuizReward;
          updateAllRows();
          quizResult.textContent = `🎉 정답입니다! 탐험 장학금 ${won(specialQuizReward)} 획득!`;
          showToast('🎓', `정답! 장학금 <b>${won(specialQuizReward)}</b>을 받았습니다.`, 'good');
        } else {
          btn.classList.add('incorrect');
          sounds.playIncorrect();
          quizResult.textContent = '아쉽게도 정답이 아닙니다.';
        }
        specialActions.classList.remove('hidden');
      });
      quizOptions.appendChild(btn);
    });

    quizModal.classList.remove('hidden');
    return;
  }

  // ── 2. 자연재해 — 나라 칸에서 가끔 일어나고, 이번 차례는 여기서 끝납니다.
  if (Math.random() < DISASTER_CHANCE) { triggerDisaster(playerIndex, spaceIndex); return; }

  // ── 3. 빈 땅: 퀴즈를 맞히면 살 수 있습니다.
  if (state.owner === null) {
    activeQuizSpace = spaceIndex;
    const quiz = countryQuiz(space.name);
    if (!quiz) { setTimeout(endTurn, 200); return; }

    if (player.isAI) { handleAIQuiz(playerIndex, spaceIndex, quiz, false, space); return; }

    const hasHalf = player.items.includes('half-price');
    pendingPurchaseDiscount = hasHalf ? 0.5 : 1;
    const price = Math.round(space.cost * pendingPurchaseDiscount);

    aiQuizBanner.classList.add('hidden');
    quizEyebrow.textContent = `WORLD GEOGRAPHY · [${space.tag}]`;
    quizTitle.textContent = `${space.name} 지리 탐험 퀴즈`;
    quizQuestion.textContent = quiz.question;
    quizExplanation.classList.add('hidden');
    purchaseActions.classList.add('hidden');
    specialActions.classList.add('hidden');
    purchaseQuestion.textContent = hasHalf
      ? `🏷️ 반값 매입권 사용! ${space.name} 땅을 ${won(price)}에 구매하시겠습니까? (원래 ${won(space.cost)})`
      : `${space.name} 땅을 ${won(price)}에 구매하시겠습니까?`;
    quizResult.textContent = `정답을 맞히면 탐험 수당 ${won(landQuizReward)}을 받고 이 땅을 구매할 자격이 생깁니다.`;

    quizOptions.innerHTML = '';
    shuffleArray(quiz.options).forEach((option) => {
      const btn = document.createElement('button');
      btn.textContent = option;
      btn.addEventListener('click', () => {
        [...quizOptions.querySelectorAll('button')].forEach(b => { b.disabled = true; });
        quizExplanation.textContent = `💡 교과서 탐구: ${quiz.explanation}`;
        quizExplanation.classList.remove('hidden');

        if (option === quiz.answer) {
          btn.classList.add('correct');
          sounds.playCorrect();
          player.money += landQuizReward;
          updateAllRows();
          quizResult.textContent = `🎉 정답입니다! 탐험 수당 ${won(landQuizReward)}을 받고 땅을 구매할 수 있습니다.`;
          showToast('🎓', `정답! 탐험 수당 <b>${won(landQuizReward)}</b>을 받았습니다.`, 'good');
          purchaseActions.classList.remove('hidden');
        } else {
          btn.classList.add('incorrect');
          sounds.playIncorrect();
          quizResult.textContent = '아쉽게도 틀렸습니다. 이번 턴에는 구매할 수 없습니다.';
          setTimeout(() => { quizModal.classList.add('hidden'); endTurn(); }, 1800);
        }
      });
      quizOptions.appendChild(btn);
    });

    quizModal.classList.remove('hidden');
    return;
  }

  // ── 4. 내 땅: 문제를 맞혀야 건물을 지을 수 있습니다.
  if (state.owner === playerIndex) { offerBuild(playerIndex, spaceIndex); return; }

  // ── 5. 남의 땅: 통행세
  payToll(playerIndex, state.owner, spaceIndex);
}

// 내 땅에 도착했을 때 — 그 나라 문제를 맞혀야 건물을 지을 수 있습니다.
function offerBuild(playerIndex, spaceIndex) {
  const player = gamePlayers[playerIndex];
  const state = propertyState[spaceIndex];
  const space = spaces[spaceIndex];
  const cost = nextBuildCostOf(spaceIndex);
  const hasFree = player.items.includes('free-build');

  if (state.buildings >= 3) {
    showToast('🏠', `${space.name}은(는) 이미 건물 3단계(최대)입니다. 통행세 ${won(tollOf(spaceIndex))}`, 'info');
    setTimeout(endTurn, 600);
    return;
  }

  // 지을 돈도 무료 증축권도 없다면 문제를 낼 이유가 없습니다.
  if (!hasFree && player.money < cost) {
    showToast('🏠', `${space.name}에 건물을 지으려면 ${won(cost)}이 필요합니다. 이번에는 쉬어 갑니다.`, 'info');
    setTimeout(endTurn, 700);
    return;
  }

  const quiz = countryQuiz(space.name);
  if (!quiz) { showBuildChoice(playerIndex, spaceIndex); return; }   // 문제가 없는 칸은 그대로 진행
  activeQuizSpace = spaceIndex;

  if (player.isAI) {
    handleAIQuiz(playerIndex, spaceIndex, quiz, false, space, (correct) => {
      if (!correct) {
        showToast('🏠', `🤖 <b>${player.name}</b> 님이 건축 문제를 틀려 건물을 짓지 못했습니다.`, 'info');
        setTimeout(endTurn, 600);
        return;
      }
      player.money += landQuizReward;
      updateAllRows();
      showBuildChoice(playerIndex, spaceIndex);
    }, 'build');
    return;
  }

  const nextTollPreview = Math.round(space.cost * TOLL_RATES[Math.min(state.buildings + 1, 3)]);

  aiQuizBanner.classList.add('hidden');
  quizEyebrow.textContent = `BUILD PERMIT · [${space.tag}]`;
  quizTitle.textContent = `${space.name} 건축 문제`;
  quizQuestion.textContent = quiz.question;
  quizResult.innerHTML = `맞히면 <b class="quiz-amount good">${won(nextBuildCostOf(spaceIndex))}</b>짜리 ${BUILD_NAMES[Math.min(state.buildings, BUILD_NAMES.length - 1)]}을(를) 지을 수 있습니다 · 통행세 ${won(tollOf(spaceIndex))} → <b class="quiz-amount bad">${won(nextTollPreview)}</b>`;
  quizExplanation.classList.add('hidden');
  purchaseActions.classList.add('hidden');
  specialActions.classList.add('hidden');

  quizOptions.innerHTML = '';
  shuffleArray(quiz.options).forEach((option) => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.addEventListener('click', () => {
      [...quizOptions.querySelectorAll('button')].forEach(b => { b.disabled = true; });
      quizExplanation.textContent = `💡 교과서 탐구: ${quiz.explanation}`;
      quizExplanation.classList.remove('hidden');

      if (option === quiz.answer) {
        btn.classList.add('correct');
        sounds.playCorrect();
        player.money += landQuizReward;
        updateAllRows();
        quizResult.textContent = `🎉 정답입니다! 탐험 수당 ${won(landQuizReward)}을 받고 건물을 지을 수 있습니다.`;
        showToast('🎓', `정답! 탐험 수당 <b>${won(landQuizReward)}</b>을 받았습니다.`, 'good');
        afterQuizAction = () => showBuildChoice(playerIndex, spaceIndex);
        specialActions.classList.remove('hidden');
      } else {
        btn.classList.add('incorrect');
        sounds.playIncorrect();
        quizResult.textContent = '아쉽게도 틀렸습니다. 이번 턴에는 건물을 지을 수 없습니다.';
        setTimeout(() => { quizModal.classList.add('hidden'); endTurn(); }, 1800);
      }
    });
    quizOptions.appendChild(btn);
  });

  quizModal.classList.remove('hidden');
}

// 문제를 맞힌 뒤 실제로 지을지 고르는 단계
function showBuildChoice(playerIndex, spaceIndex) {
  const player = gamePlayers[playerIndex];
  const state = propertyState[spaceIndex];
  const space = spaces[spaceIndex];
  const cost = nextBuildCostOf(spaceIndex);
  const hasFree = player.items.includes('free-build');

  const build = (free) => {
    const builtName = BUILD_NAMES[Math.min(state.buildings, BUILD_NAMES.length - 1)];
    state.buildings += 1;
    if (free) player.items.splice(player.items.indexOf('free-build'), 1);
    else player.money -= cost;
    sounds.playCoin();
    showToast('🏠', free
      ? `무료 증축권으로 ${space.name}에 <b>${builtName}</b>을(를) 지었습니다! 통행세 ${won(tollOf(spaceIndex))}`
      : `${space.name}에 <b>${builtName}</b>을(를) 지었습니다. <b>-${won(cost)}</b> · 통행세 ${won(tollOf(spaceIndex))}`, 'good');
    updateAllRows();
    updatePropertyTile(spaceIndex);
    setTimeout(endTurn, 700);
  };

  if (player.isAI) {
    if (hasFree) build(true);
    else if (player.money - cost >= 60000) build(false);
    else { showToast('🏳️', `🤖 <b>${player.name}</b> 님이 ${space.name}에서 쉬어 갑니다.`, 'info'); setTimeout(endTurn, 700); }
    return;
  }

  const nextToll = Math.round(space.cost * TOLL_RATES[Math.min(state.buildings + 1, 3)]);
  const buildName = BUILD_NAMES[Math.min(state.buildings, BUILD_NAMES.length - 1)];
  const buttons = [];
  if (hasFree) buttons.push({ label: '🏗️ 무료 증축권으로 짓기', primary: true, onClick: () => build(true) });
  if (player.money >= cost) buttons.push({ label: `${won(cost)} 내고 짓기`, primary: !hasFree, onClick: () => build(false) });
  buttons.push({ label: '짓지 않기', onClick: () => setTimeout(endTurn, 100) });

  openChoiceModal({
    eyebrow: `MY LAND · ${space.name}`,
    icon: '🏠',
    title: `🎉 정답! ${buildName}을(를) 지을까요?`,
    desc: `${space.name}에 ${buildName}을(를) 지으면 통행세가 ${won(tollOf(spaceIndex))} → ${won(nextToll)}(으)로 오릅니다. 값은 ${won(cost)}이고, 단계가 올라갈수록 더 크고 비싼 건물을 짓습니다. 보유 현금은 ${won(player.money)}입니다.`,
    buttons
  });
}

// ============================================================
// 이동 애니메이션
// ============================================================
async function movePlayerStepByStep(playerIndex, steps) {
  isMoving = true;
  rollButton.disabled = true;
  const player = gamePlayers[playerIndex];

  for (let s = 1; s <= steps; s += 1) {
    const prevPos = player.position;
    const nextPos = (prevPos + 1) % spaces.length;

    removePlayerPiece(playerIndex, prevPos);
    player.position = nextPos;
    const piece = renderPlayerPiece(playerIndex, nextPos);

    if (piece) piece.classList.add('stepping');
    sounds.playStep();

    // 출발지를 지나거나 도착하면 월급을 1회 지급합니다 (도착 보너스는 착륙 처리에서 따로 줍니다).
    if (nextPos === 0) {
      player.money += salaryBonus;
      sounds.playCoin();
      updatePlayerRow(playerIndex);
      showToast('💵', `<b>${player.name}</b> 님이 출발지를 지나 월급 <b>${won(salaryBonus)}</b>을 받았습니다.`, 'good');
    }

    await new Promise(resolve => setTimeout(resolve, 240));
    if (piece) piece.classList.remove('stepping');
  }

  // 이동이 끝나면 지구본으로 위치를 먼저 보여 주고, 잠시 뒤 퀴즈를 연다
  const landed = spaces[player.position];
  updateGlobeForSpace(landed);
  await new Promise(resolve => setTimeout(resolve, globePauseFor(landed)));

  isMoving = false;
  resolveLanding(playerIndex);
}

// ============================================================
// 주사위 — 위에서 내려다보는 입체 주사위.
// 각 눈이 윗면으로 오는 회전각을 정해 두고, 여러 바퀴 돈 뒤 그 각도에 정확히 착지시킵니다.
// 면 배치: 1-6, 2-5, 3-4 가 서로 마주 봅니다(합이 7).
// ============================================================
// 주사위는 두 개를 굴리고, 두 눈의 합만큼 움직입니다 (2~12칸).
// 주사위 각 면에 눈(점)을 그린다. 숫자 대신 점을 써서 진짜 주사위처럼 보이게 한다.
const PIP_LAYOUT = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

(function drawDiePips() {
  diceElements.forEach((die) => {
    for (let v = 1; v <= 6; v += 1) {
      const face = die.querySelector('.f' + v);
      if (!face) continue;
      if (v === 1) face.classList.add('pip-red');   // 1은 빨간 눈 (전통 주사위)
      let html = '';
      for (let i = 0; i < 9; i += 1) {
        html += PIP_LAYOUT[v].includes(i) ? '<span class="die-pip"><i></i></span>' : '<span class="die-pip"></span>';
      }
      face.innerHTML = html;
    }
  });
})();

// 면 배치(CSS): f1=앞, f6=뒤, f2=위, f5=아래, f3=오른쪽, f4=왼쪽
// 어떤 눈을 윗면으로 올리려면 주사위를 아래 각도만큼 돌리면 된다.
const DIE_LANDING = {
  1: { x: 90, y: 0 },     // 앞면을 위로
  2: { x: 0, y: 0 },      // 이미 위
  3: { x: 90, y: -90 },   // 오른쪽 면을 위로
  4: { x: 90, y: 90 },    // 왼쪽 면을 위로
  5: { x: 180, y: 0 },    // 아랫면을 위로
  6: { x: 90, y: 180 }    // 뒷면을 위로
};

// 카메라를 위쪽으로 올려 윗면이 보이게 하는 고정 기울기
const DIE_TILT = -58;
// 주사위마다 지금까지 누적된 회전(도)을 따로 기억한다
const dieSpins = diceElements.map(() => ({ x: 0, y: 0 }));

function applyDieTransform(dieIndex) {
  const spin = dieSpins[dieIndex];
  diceElements[dieIndex].style.transform = `rotateX(${DIE_TILT + spin.x}deg) rotateY(${spin.y}deg)`;
}

function setDieFace(dieIndex, value, spins) {
  const land = DIE_LANDING[value];
  const turns = spins || 0;
  const spin = dieSpins[dieIndex];
  // 현재 각도보다 앞쪽에 있는, 착지각과 360도 배수만큼 떨어진 지점으로 보낸다
  spin.x = land.x + 360 * (Math.floor((spin.x - land.x) / 360) + turns + 1);
  spin.y = land.y + 360 * (Math.floor((spin.y - land.y) / 360) + turns + 1);
  applyDieTransform(dieIndex);
}

// 어떤 눈이 윗면에 있는지 되돌려 준다 (검증용)
function currentDieTopFace(dieIndex = 0) {
  const spin = dieSpins[dieIndex];
  if (!spin) return null;
  const nx = ((spin.x % 360) + 360) % 360;
  const ny = ((spin.y % 360) + 360) % 360;
  for (const v of [1, 2, 3, 4, 5, 6]) {
    const L = DIE_LANDING[v];
    if (((L.x % 360) + 360) % 360 === nx && ((L.y % 360) + 360) % 360 === ny) return v;
  }
  return null;
}

diceElements.forEach((_, i) => setDieFace(i, 1, 0));

function triggerDiceRoll() {
  if (!gamePlayers.length || isGameFinished || isMoving) return;
  rollButton.disabled = true;
  sounds.playRoll();

  const eyes = diceElements.map(() => Math.ceil(Math.random() * 6));
  const finalRoll = eyes.reduce((sum, v) => sum + v, 0);
  // 두 눈이 같으면(더블) 이번 차례를 다 끝낸 뒤 한 번 더 굴립니다.
  const isDouble = eyes.length > 1 && eyes.every(v => v === eyes[0]);
  if (isDouble) extraRollQueue.push('double');

  diceElements.forEach((die, i) => {
    die.classList.add('is-tumbling');
    setDieFace(i, eyes[i], 2 + Math.floor(Math.random() * 2));
  });

  setTimeout(() => {
    diceElements.forEach((die) => { die.classList.remove('is-tumbling'); die.classList.add('is-landing'); });
    rollSum.textContent = finalRoll;
    addActivityLog(`🎲 ${gamePlayers[currentPlayerIndex].name} 주사위 ${eyes.join(' + ')} = ${finalRoll}${isDouble ? ' (더블)' : ''}`);
    if (isDouble) showToast('🎲', `<b>더블!</b> ${eyes[0]}·${eyes[0]} — 이번 차례가 끝나면 한 번 더 굴립니다.`, 'good');
    setTimeout(() => diceElements.forEach((die) => die.classList.remove('is-landing')), 320);
    setTimeout(() => movePlayerStepByStep(currentPlayerIndex, finalRoll), 380);
  }, 1000);
}

rollButton.addEventListener('click', triggerDiceRoll);

// ============================================================
// 구매 / 건너뛰기 / 확인 버튼
// ============================================================
buyProperty.addEventListener('click', () => {
  const player = gamePlayers[currentPlayerIndex];
  const state = propertyState[activeQuizSpace];
  const space = spaces[activeQuizSpace];
  const price = Math.round(space.cost * pendingPurchaseDiscount);

  if (player.money >= price) {
    if (pendingPurchaseDiscount < 1) player.items.splice(player.items.indexOf('half-price'), 1);
    player.money -= price;
    state.owner = currentPlayerIndex;
    sounds.playCoin();
    updateAllRows();
    updatePropertyTile(activeQuizSpace);
    quizResult.textContent = `구매 완료! ${won(price)}을 지불했습니다.`;
    showToast('🏳️', `<b>${player.name}</b> 님이 ${space.name} 땅을 <b>${won(price)}</b>에 샀습니다.`, 'good');
  } else {
    sounds.playIncorrect();
    quizResult.textContent = '잔액이 부족하여 토지를 구매할 수 없습니다.';
    showToast('⚠️', '현금이 부족해 땅을 살 수 없습니다.', 'warn');
  }

  pendingPurchaseDiscount = 1;
  purchaseActions.classList.add('hidden');
  setTimeout(() => { quizModal.classList.add('hidden'); endTurn(); }, 1000);
});

skipProperty.addEventListener('click', () => {
  pendingPurchaseDiscount = 1;
  quizResult.textContent = '토지를 구매하지 않았습니다.';
  purchaseActions.classList.add('hidden');
  setTimeout(() => { quizModal.classList.add('hidden'); endTurn(); }, 600);
});

claimSpecial.addEventListener('click', () => {
  specialActions.classList.add('hidden');
  quizModal.classList.add('hidden');
  const next = afterQuizAction;
  afterQuizAction = null;
  if (next) next(); else endTurn();
});

restartGameBtn.addEventListener('click', () => location.reload());

// ============================================================
// 설정 화면
// ============================================================
function renderNameFields() {
  nameFields.innerHTML = '';
  if (selectedPlayerCount === 1) {
    const input = document.createElement('input');
    input.className = 'name-field';
    input.name = 'player-1';
    input.maxLength = 10;
    input.placeholder = '내 이름';
    input.value = '탐험가';
    nameFields.appendChild(input);

    const aiNotice = document.createElement('div');
    aiNotice.className = 'ai-notice';
    aiNotice.textContent = '🤖 상대: 지구봇 AI (자동 대전)';
    nameFields.appendChild(aiNotice);
  } else {
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
}

function createPlayers(playerConfigs) {
  extraRollQueue.length = 0;
  gamePlayers = playerConfigs.map((cfg, index) => {
    renderPlayerPiece(index, 0);
    return { index, name: cfg.name, isAI: cfg.isAI || false, money: startingMoney, position: 0, items: [], isBankrupt: false };
  });

  playerCards.forEach((card, index) => {
    const visible = index < gamePlayers.length;
    card.style.display = visible ? 'flex' : 'none';
    if (visible) {
      const p = gamePlayers[index];
      card.querySelector('.player-name').textContent = p.name + (p.isAI ? ' (AI)' : '');
      const av = card.querySelector('.avatar');
      av.className = `avatar p-${index}`;
      av.textContent = String(index + 1);
      updatePlayerRow(index);
    }
  });

  if (playerCountNum) playerCountNum.textContent = `${gamePlayers.length}명 참여 중`;

  if (gameMode === 'round') {
    if (maxRoundText) maxRoundText.textContent = isUnlimitedRounds() ? '∞' : String(targetMaxRounds);
    if (targetRuleDisplay) targetRuleDisplay.textContent = isUnlimitedRounds()
      ? '목표: 무제한 (마지막 한 명까지)' : `목표: ${targetMaxRounds}라운드`;
    if (roundNumber) roundNumber.textContent = roundLabel();
    if (roundCaptionBox) roundCaptionBox.style.display = 'inline-block';
  } else {
    if (targetRuleDisplay) targetRuleDisplay.textContent = `목표: ${targetTimeMinutes}분 타임어택`;
    if (roundCaptionBox) roundCaptionBox.style.display = 'none';
  }

  updateCurrentTurnUI();
}

document.querySelectorAll('.player-count-select .setup-count').forEach((button) => {
  button.addEventListener('click', () => {
    selectedPlayerCount = Number(button.dataset.count);
    document.querySelectorAll('.player-count-select .setup-count').forEach((item) => item.classList.toggle('active', item === button));
    renderNameFields();
  });
});

modeRoundBtn.addEventListener('click', () => {
  gameMode = 'round';
  modeRoundBtn.classList.add('active');
  modeTimeBtn.classList.remove('active');
  roundOptionsGroup.classList.remove('hidden');
  timeOptionsGroup.classList.add('hidden');
});

modeTimeBtn.addEventListener('click', () => {
  gameMode = 'time';
  modeTimeBtn.classList.add('active');
  modeRoundBtn.classList.remove('active');
  timeOptionsGroup.classList.remove('hidden');
  roundOptionsGroup.classList.add('hidden');
});

document.querySelectorAll('.round-count-select .setup-round').forEach((button) => {
  button.addEventListener('click', () => {
    targetMaxRounds = Number(button.dataset.rounds);
    document.querySelectorAll('.round-count-select .setup-round').forEach((item) => item.classList.toggle('active', item === button));
  });
});

document.querySelectorAll('.time-count-select .setup-round').forEach((button) => {
  button.addEventListener('click', () => {
    targetTimeMinutes = Number(button.dataset.minutes);
    remainingSeconds = targetTimeMinutes * 60;
    document.querySelectorAll('.time-count-select .setup-round').forEach((item) => item.classList.toggle('active', item === button));
  });
});

document.querySelector('#start-game').addEventListener('click', () => {
  sounds.init();
  let playerConfigs = [];
  if (selectedPlayerCount === 1) {
    const myName = nameFields.querySelector('input').value.trim() || '탐험가';
    playerConfigs = [{ name: myName, isAI: false }, { name: '지구봇 AI', isAI: true }];
  } else {
    playerConfigs = [...nameFields.querySelectorAll('input')].map((input, index) => ({
      name: input.value.trim() || `플레이어 ${index + 1}`, isAI: false
    }));
  }

  if (gameMode === 'time') remainingSeconds = targetTimeMinutes * 60;

  createPlayers(playerConfigs);
  setupModal.classList.add('hidden');

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isGameFinished) return;

    if (gameMode === 'round') {
      elapsedSeconds += 1;
      timer.textContent = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;
    } else {
      remainingSeconds -= 1;
      if (remainingSeconds <= 0) {
        remainingSeconds = 0;
        timer.textContent = '00:00';
        timer.classList.add('time-warning');
        checkGameOver('time');
        return;
      }
      timer.textContent = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
      if (remainingSeconds <= 30) timer.classList.add('time-warning');
    }
  }, 1000);
});

renderNameFields();
