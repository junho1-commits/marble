const board = document.querySelector('#board');
const rollButton = document.querySelector('#roll-button');
const dieOne = document.querySelector('#die-one');
const dieTwo = document.querySelector('#die-two');
const rollSum = document.querySelector('#roll-sum');
const timer = document.querySelector('#timer');
const roundNumber = document.querySelector('#round-number');
const centerMessage = document.querySelector('#center-message');
const playerRows = document.querySelectorAll('.player-row[data-player-row]');
const playerCountLabel = document.querySelector('.players-panel .section-kicker span');
const dieOneFace = dieOne.querySelector('.front');
const dieTwoFace = dieTwo.querySelector('.front');
const setupModal = document.querySelector('#setup-modal');
const quizModal = document.querySelector('#quiz-modal');
const nameFields = document.querySelector('#name-fields');
const quizTitle = document.querySelector('#quiz-title');
const quizQuestion = document.querySelector('#quiz-question');
const quizOptions = document.querySelector('#quiz-options');
const quizResult = document.querySelector('#quiz-result');
const purchaseActions = document.querySelector('#purchase-actions');
const purchaseQuestion = document.querySelector('#purchase-question');
const buyProperty = document.querySelector('#buy-property');
const skipProperty = document.querySelector('#skip-property');
let selectedPlayerCount = 2;
let gamePlayers = [];
let currentPlayerIndex = 0;
let activeQuizSpace = -1;
let activeQuizPlayer = -1;
const startingMoney = 200000;

const landmarkPhotos = [
  'photo-1638964663550-e2123ac8900b', 'photo-1493976040374-85c8e12f0c0e', 'photo-1548919973-5cef591cdbc9',
  'photo-1508804185872-d7badad00f7d', 'photo-1518684079-3c830dcef090', 'photo-1506665531195-3566af2b4dfa',
  'photo-1528127269322-539801943592', 'photo-1537996194471-e657df975ab4', 'photo-1500530855697-b586d89ba3ee', 'photo-1523906834658-6e24ef2386f9',
  'photo-1502602898657-3e91760cbb34', 'photo-1533105079780-92b9be482077', 'photo-1513635269975-59663e0ac1ad',
  'photo-1519681393784-d120267933ba', 'photo-1530789253388-582c481c54b0', 'photo-1524231757912-21f4fe3a7200',
  'photo-1555993539-1732b0258235', 'photo-1467269204594-9661b134dd2b', 'photo-1469474968028-56623f02e42e', 'photo-1516026672322-bc52d61a55d5',
  'photo-1470770841072-f978cf4d019e', 'photo-1529260830199-42c24126f198', 'photo-1519681393784-d120267933ba',
  'photo-1469521669194-babb45599def', 'photo-1483729558449-99ef09a8c325', 'photo-1587595431973-160d0d94add1',
  'photo-1518638150340-f706e86654de', 'photo-1503614472-8c93d56e92ce', 'photo-1485738422979-f5c462d49f74',
  'photo-1500530855697-b586d89ba3ee', 'photo-1469521669194-babb45599def', 'photo-1507525428034-b723cf961d3e'
];

const spaces = [
  ['한국', '◒', 'accent-blue'], ['일본', '✿', 'accent-blue'], ['중국', '▦', 'accent-blue'], ['인도', '↗', 'accent-blue'], ['아랍에미리트', '≈', 'accent-blue'], ['태국', '◆', 'accent-blue'], ['베트남', '✦', 'accent-blue'], ['인도네시아', '●', 'accent-blue'], ['필리핀', '◇', 'accent-blue'],
  ['이탈리아', '●', 'accent-yellow'], ['프랑스', '✦', 'accent-yellow'], ['스페인', '◇', 'accent-yellow'], ['영국', '△', 'accent-yellow'], ['노르웨이', '▣', 'accent-yellow'], ['아이슬란드', '☕', 'accent-yellow'], ['튀르키예', '◇', 'accent-yellow'], ['그리스', '△', 'accent-yellow'], ['독일', '♢', 'accent-yellow'],
  ['이집트', '◌', 'accent-mint'], ['케냐', '✦', 'accent-mint'], ['남아공', '◆', 'accent-mint'], ['모로코', '☾', 'accent-mint'], ['탄자니아', '♧', 'accent-mint'], ['나미비아', '◇', 'accent-mint'],
  ['브라질', '●', 'accent-pink'], ['페루', '◆', 'accent-pink'], ['멕시코', '✦', 'accent-pink'], ['캐나다', '◇', 'accent-pink'], ['미국', '△', 'accent-pink'],
  ['호주', '♧', 'accent-blue'], ['뉴질랜드', '▤', 'accent-blue'], ['피지', '≈', 'accent-blue']
];

const route = [];
for (let column = 0; column < 9; column += 1) route.push(column);
for (let row = 1; row < 9; row += 1) route.push(row * 9 + 8);
for (let column = 7; column >= 0; column -= 1) route.push(8 * 9 + column);
for (let row = 7; row >= 1; row -= 1) route.push(row * 9);

const tileElements = [];
const perimeterSpaces = new Map(spaces.map((space, index) => [route[index], space]));
for (let index = 0; index < 81; index += 1) {
  const [name, symbol, color] = perimeterSpaces.get(index) || ['', '', ''];
  const routeNumber = route.indexOf(index);
  const tile = document.createElement('div');
  tile.className = `tile ${color} ${routeNumber < 0 ? 'empty' : ''}`;
  tile.dataset.space = index;
  if (routeNumber >= 0) {
    tile.classList.add('photo-tile');
    tile.style.backgroundImage = `url("https://images.unsplash.com/${landmarkPhotos[routeNumber]}?auto=format&fit=crop&w=500&q=80")`;
  }
  const nameClass = name.length >= 6 ? ' long-name' : name.length >= 4 ? ' medium-name' : '';
  tile.innerHTML = routeNumber >= 0 ? `<span class="tile-name${nameClass}">${name}</span>` : '';
  board.appendChild(tile);
  tileElements.push(tile);
}

const propertyState = spaces.map(() => ({ owner: null, buildings: 0 }));
const propertyCosts = [
  80000, 70000, 65000, 60000, 55000, 45000, 40000, 38000, 35000,
  70000, 65000, 60000, 55000, 50000, 45000, 50000, 45000, 48000,
  30000, 28000, 26000, 24000, 22000, 20000,
  50000, 40000, 45000, 42000, 55000,
  35000, 38000, 25000
];

function addPiece(position, label, className) {
  const piece = document.createElement('span');
  piece.className = `piece ${className}`;
  piece.textContent = label;
  tileElements[route[position]].appendChild(piece);
  return piece;
}

function createPlayers(names) {
  const colors = ['you-piece', 'maya', 'player-three', 'player-four'];
  gamePlayers = names.map((name, index) => ({ name, money: startingMoney, position: 0, piece: addPiece(0, String(index + 1), colors[index]) }));
  playerRows.forEach((row, index) => {
    const visible = index < gamePlayers.length;
    row.style.display = visible ? 'flex' : 'none';
    if (visible) {
      row.querySelector('.player-name').textContent = gamePlayers[index].name;
      row.querySelector('.money').textContent = `₩${startingMoney.toLocaleString()}`;
    }
  });
  playerCountLabel.textContent = `${String(gamePlayers.length).padStart(2, '0')} / 04`;
}

function movePiece(piece, position) {
  const destination = tileElements[route[position]];
  destination.appendChild(piece);
  piece.animate([{ transform: 'scale(.8) translateY(-5px)' }, { transform: 'scale(1) translateY(0)' }], { duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

function updatePlayerRow(index) {
  const row = playerRows[index];
  if (!row || !gamePlayers[index]) return;
  row.querySelector('.money').textContent = `₩${gamePlayers[index].money.toLocaleString()}`;
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
  badge.textContent = `${gamePlayers[state.owner].name}${state.buildings ? ` · 건물 ${state.buildings}` : ''}`;
  tile.appendChild(badge);
}

function resolveLanding(playerIndex) {
  const player = gamePlayers[playerIndex];
  const spaceIndex = player.position;
  const state = propertyState[spaceIndex];
  if (!state) return;
  if (state.owner === null) {
    activeQuizSpace = spaceIndex;
    activeQuizPlayer = playerIndex;
    const country = spaces[spaceIndex][0];
    const distractors = spaces.filter((_, index) => index !== spaceIndex).slice(spaceIndex % 3, (spaceIndex % 3) + 2).map((space) => space[0]);
    const quiz = { question: `${country}의 랜드마크 사진이 있는 나라 이름은?`, options: [country, ...distractors], answer: country };
    quizTitle.textContent = `${spaces[spaceIndex][0]} 땅 퀴즈`;
    quizQuestion.textContent = quiz.question;
    quizResult.textContent = '정답을 맞히면 이 땅을 살 수 있습니다.';
    purchaseActions.classList.add('hidden');
    purchaseQuestion.textContent = `이 땅을 ₩${propertyCosts[spaceIndex].toLocaleString()}에 구매하시겠습니까?`;
    quizOptions.innerHTML = '';
    quiz.options.forEach((option) => {
      const answerButton = document.createElement('button');
      answerButton.textContent = option;
      answerButton.addEventListener('click', () => {
        if (option === quiz.answer) {
          quizResult.textContent = '정답입니다!';
          purchaseActions.classList.remove('hidden');
        } else quizResult.textContent = '아쉬워요. 이번에는 땅을 살 수 없습니다.';
        if (option !== quiz.answer) setTimeout(() => quizModal.classList.add('hidden'), 900);
      });
      quizOptions.appendChild(answerButton);
    });
    quizModal.classList.remove('hidden');
  } else if (state.owner === playerIndex) {
    if (state.buildings < 3 && player.money >= propertyCosts[spaceIndex] / 2) {
      const buildingCost = propertyCosts[spaceIndex] / 2;
      state.buildings += 1;
      player.money -= buildingCost;
      updatePlayerRow(playerIndex);
      updatePropertyTile(spaceIndex);
      centerMessage.textContent = `${spaces[spaceIndex][0]}에 건물을 지었습니다. (${state.buildings}/3)`;
    }
  } else {
    const toll = propertyCosts[spaceIndex] * (state.buildings + 1) / 2;
    const owner = gamePlayers[state.owner];
    player.money = Math.max(0, player.money - toll);
    owner.money += toll;
    updatePlayerRow(playerIndex);
    updatePlayerRow(state.owner);
    centerMessage.textContent = `${owner.name}의 ${spaces[spaceIndex][0]}에 도착해 통행세 ₩${toll.toLocaleString()}를 냈습니다.`;
  }
}

rollButton.addEventListener('click', () => {
  if (!gamePlayers.length) return;
  rollButton.disabled = true;
  dieOne.classList.add('is-rolling');
  dieTwo.classList.add('is-rolling');
  let ticks = 0;
  const animation = setInterval(() => {
    dieOneFace.textContent = Math.ceil(Math.random() * 6);
    dieTwoFace.textContent = Math.ceil(Math.random() * 6);
    ticks += 1;
    if (ticks >= 7) {
      clearInterval(animation);
      dieOne.classList.remove('is-rolling');
      dieTwo.classList.remove('is-rolling');
      const first = Number(dieOneFace.textContent);
      const second = Number(dieTwoFace.textContent);
      const total = first + second;
      rollSum.textContent = total;
      const player = gamePlayers[currentPlayerIndex];
      player.position = (player.position + total) % spaces.length;
      movePiece(player.piece, player.position);
      resolveLanding(currentPlayerIndex);
      roundNumber.textContent = String(Number(roundNumber.textContent) + 1).padStart(2, '0');
      currentPlayerIndex = (currentPlayerIndex + 1) % gamePlayers.length;
      rollButton.disabled = false;
    }
  }, 75);
});

buyProperty.addEventListener('click', () => {
  const player = gamePlayers[activeQuizPlayer];
  const state = propertyState[activeQuizSpace];
  const cost = propertyCosts[activeQuizSpace];
  if (player.money >= cost) {
    player.money -= cost;
    state.owner = activeQuizPlayer;
    updatePlayerRow(activeQuizPlayer);
    updatePropertyTile(activeQuizSpace);
    quizResult.textContent = `구매 완료! ₩${cost.toLocaleString()}을 지불했습니다.`;
  } else quizResult.textContent = '돈이 부족해서 구매할 수 없습니다.';
  purchaseActions.classList.add('hidden');
  setTimeout(() => quizModal.classList.add('hidden'), 900);
});

skipProperty.addEventListener('click', () => {
  quizResult.textContent = '이번에는 구매하지 않았습니다.';
  purchaseActions.classList.add('hidden');
  setTimeout(() => quizModal.classList.add('hidden'), 700);
});

function renderNameFields() {
  nameFields.innerHTML = '';
  for (let index = 0; index < selectedPlayerCount; index += 1) {
    const input = document.createElement('input');
    input.className = 'name-field';
    input.name = `player-${index + 1}`;
    input.maxLength = 12;
    input.placeholder = `플레이어 ${index + 1} 이름`;
    nameFields.appendChild(input);
  }
}

document.querySelectorAll('.setup-count').forEach((button) => {
  button.addEventListener('click', () => {
    selectedPlayerCount = Number(button.dataset.count);
    document.querySelectorAll('.setup-count').forEach((item) => item.classList.toggle('active', item === button));
    renderNameFields();
  });
});

document.querySelector('#start-game').addEventListener('click', () => {
  const names = [...nameFields.querySelectorAll('input')].map((input, index) => input.value.trim() || `플레이어 ${index + 1}`);
  createPlayers(names);
  setupModal.classList.add('hidden');
  centerMessage.textContent = `${names.length}명이 모덕마블을 시작합니다.`;
});

renderNameFields();

let seconds = 222;
setInterval(() => {
  seconds += 1;
  timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}, 1000);
