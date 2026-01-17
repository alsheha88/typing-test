'use strict';
let domState;

const state = {
    cursorPosition: 0,
    passageLetters: [],
    testStartTime: null,
    intervalId: null,
    difficulty: null,
    startTest: false,
    errors: 0,
    netWPM: 0,
    accuracy: 0,
    mode: null,
    seconds: 0,
    personalBest: localStorage.getItem('personalBest') || '0',
}
function resetState(){
    state.cursorPosition = 0;
    state.passageLetters = [];
    state.testStartTime = null;
    state.difficulty = null;
    state.startTest = false;
    state.errors = 0;
    state.netWPM = 0;
    state.accuracy = 0;
    state.mode = null;
    state.seconds = 0;
    stopCurrentTimer()
}

function logState(){
    // console.table(state);
}

initializeDOM();
registerDOM();

(async () => {
    state.passageRes = await getPassage();
})();

function resetAll(){
    resetState();
    initializeDOM();
    registerDOM();
}

function toggleDropdown(e){
    if (e.target.id === 'difficulty-dropdown'){
        domState.difficultyDropdown.classList.toggle('show');
    } else if (e.target.id === 'mode-dropdown'){
        domState.modeDropdown.classList.toggle('show')
    }
}

function selectCat(e){
    const clickedBtn = e.target
    document.querySelectorAll('li').forEach((item) => {
        if (item.id === clickedBtn.id){
            item.querySelector('.outer-circle').classList.add('selected');
            item.parentElement.classList.remove('show')
            item.parentElement.previousElementSibling.innerHTML = `${item.textContent} <img src="./assets/images/icon-down-arrow.svg" alt="">`
            item.parentElement.previousElementSibling.classList.add('active')
            item.querySelector('.outer-circle').classList.remove('selected')
        }
    })
}

async function getData(){
    const fetchData = await fetch('./data.json');
    const data = await fetchData.json();

    return {easy: data.easy, medium: data.medium, hard: data.hard}
}
async function getPassage(){
	const getPassageRes = await getData();
	const data = await getPassageRes;
	const easyPassage = data.easy.map((passage) => passage.text);
	const mediumPassage = data.medium.map((passage) => passage.text);
	const hardPassage = data.hard.map((passage) => passage.text);
    
    return {easyPassage, mediumPassage, hardPassage}
}

function displayRandomPassage(e){
    const clickedBtn = e.target;
    document.querySelector('.passage-not-started').style.display = 'flex';
    document.querySelectorAll('.difficulty-btn').forEach((btn) => {
        if (btn == clickedBtn) {
            btn.classList.add('active')
        } else {
            btn.classList.remove('active')
        }
    })
    domState.passageDisplay.textContent = '';
    const randomPassageIndex = Math.floor((Math.random() * 9) + 1)
    if (e.target.id === 'easy-btn' || e.target.id === 'easy') {
        state.difficulty = 'easy';
        renderPassage(state.passageRes.easyPassage[randomPassageIndex]);
        document.querySelector('#medium-btn').disabled = true
        document.querySelector('#hard-btn').disabled = true
        domState.difficultyDropdown.classList.remove('show')
    } else if (e.target.id === 'medium-btn' || e.target.id === 'medium') {
        state.difficulty = 'medium';
        renderPassage(state.passageRes.mediumPassage[randomPassageIndex])
        document.querySelector('#easy-btn').disabled = true
        document.querySelector('#hard-btn').disabled = true
        domState.difficultyDropdown.classList.remove('show')
    } else if (e.target.id === 'hard-btn' || e.target.id === 'hard') {
        state.difficulty = 'hard'
        renderPassage(state.passageRes.hardPassage[randomPassageIndex])
        document.querySelector('#medium-btn').disabled = true
        document.querySelector('#easy-btn').disabled = true
        domState.difficultyDropdown.classList.remove('show')
    }
}

function renderPassage(passage){
    
    for (let i = 0; i < passage.length; i++){
        let span = document.createElement('span')
        span.classList.add("passage-letter");
        span.innerText = passage[i];
        domState.passageDisplay.append(span);
        state.passageLetters.push({
            letter: passage[i],
            correct: undefined,
            mistake: 0,
            span
        });
    }
}

function typeCharacter(e){
    e.preventDefault()
    if (!state.startTest) {
        console.warn('Tried to type character when test wasn`t started')
        return
    }
    
    if (e.key === 'Backspace'){
        state.passageLetters[state.cursorPosition].correct = undefined;
        state.cursorPosition--
    } else {
        if (e.key.length !== 1) return;
        if (e.key === state.passageLetters[state.cursorPosition].letter) {
            state.passageLetters[state.cursorPosition].correct = true;
            if (!state.passageLetters[state.cursorPosition].mistake) {
                state.passageLetters[state.cursorPosition].span.classList.add("correct");
            } else {
                state.passageLetters[state.cursorPosition].span.classList.add('mistake-correction');
                state.passageLetters[state.cursorPosition].correct = undefined;
            }
        }  else {
            state.passageLetters[state.cursorPosition].correct = false;
            state.passageLetters[state.cursorPosition].mistake++
            state.passageLetters[state.cursorPosition].span.classList.add("mistake");
        }
        state.cursorPosition++;
        console.log(state.passageLetters)
    }
    // First remove cursor from all spans
    state.passageLetters.forEach(({ span }) => span.classList.remove('cursor'));

    // Then add cursor to current position
    if (state.passageLetters[state.cursorPosition]) {
        state.passageLetters[state.cursorPosition].span.classList.add('cursor');
    }
    wPMAccuracyCalc();
    // logState();
}

function elapsedTime(){
    const elapsedMs = Date.now() - state.testStartTime;
    const minutes = (elapsedMs / 60000);
    
    return minutes
}
function wPMAccuracyCalc(){
    let totalCount;
    for (let i = 0; i < state.passageLetters.length; i++) {
        if (state.passageLetters[i].correct === undefined && state.passageLetters[i].mistake === 0) {
            totalCount = i;
            break;
        } else {
            totalCount = state.passageLetters.length;
        }
    }

    const grossWPM = totalCount/ 5;
    state.netWPM = Math.round((grossWPM - errorsCount()) / elapsedTime());
    state.accuracy = ((correctCount() / totalCount) * 100).toFixed(1);
    
    displayStats()
}

function correctCount(){
    return state.passageLetters.reduce((acc, cur) => {
        return cur.correct ? ++acc : acc;
    },0);
}
function errorsCount(){
    return state.passageLetters.reduce((acc, cur) => {
        return acc + cur.mistake;
    },0);
}
function displayStats(){
    // if (state.netWPM < 0 || state.netWPM === Infinity){
    //     state.netWPM = '--'
    // }
    document.querySelector('#WPM').innerText = state.netWPM;
    document.querySelector("#accuracy").innerText = `${state.accuracy}%`;
    document.querySelector("#accuracy").style.color = `var(--Red-500)`;
    
}

function modeTimer(){
    if (state.mode !== 'timer' && state.mode !== 'passage') throw new Error('Mode must be Timer or Passage')
    stopCurrentTimer()
    state.intervalId = setInterval(evaluateTimer, 50);
}
function stopCurrentTimer() {
    if (state.intervalId !== null) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
}
function evaluateTimer(){
    let timerValue = Date.now() - state.testStartTime;
    console.log('Timer mode: ',state.mode)
    if (state.mode === 'timer'){
        timerValue = 60000 - timerValue;
    }
    timerValue = Math.floor(timerValue / 1000);
    renderTimer(timerValue);
    console.log(timerValue);
    if (state.cursorPosition === state.passageLetters.length || (state.mode === "timer" && timerValue <= 0)) {
        console.log('Test Complete')
        testComplete();
    }
}
function renderTimer(timerValue){
    const minutes = Math.floor(timerValue / 60);
    const seconds = timerValue % 60;
    domState.timer.textContent = `${minutes}:${seconds < 10 ? `0` : ''}${seconds}`;
    domState.timer.style.color = `var(--Yellow-400)`;
}
function testComplete(){
    stopCurrentTimer()
    state.startTest = false;
    
    if (state.netWPM > state.personalBest){
        updatePersonalBest(state.netWPM);
    }
    domState.main.style.display = 'none';
    domState.testCompleteResults.style.display = 'flex';
    domState.WPMResultsComplete.textContent = state.netWPM;
    domState.accuracyResultsComplete.textContent = `${state.accuracy}%`
    domState.correctCharComplete.textContent = correctCount();
    domState.mistakeCharComplete.textContent = errorsCount();
    domState.PBDisplay.textContent = `${state.personalBest} WPM`;
}

function renderUI(){
    // uiState.completionScreenDisplayed: boolean
    // uiState.completionType: (baseline | beaten | testComplete)
    // Note: pull code from gitHub for rendreing completion times.
}
function updatePersonalBest(personalBest){
    state.personalBest = personalBest;
    localStorage.setItem('personalBest', personalBest);
}

function startTest(){
    console.log('starting test');
    state.startTest = true
    state.testStartTime = Date.now();

    document.querySelector('.passage-not-started').style.display = 'none';
    document.querySelector('#restart-test').style.display = 'flex'

    modeTimer()
}

function setMode(e){
    const clickedMode = e.target;
    document.querySelectorAll('.timer-mode').forEach((btn) => {if (btn == clickedMode)  {btn.classList.add('active')} else {btn.classList.remove('active')}})
    if (clickedMode.id == 'timer-btn' || clickedMode.id == 'timed-mode'){
        state.mode = 'timer'
        document.querySelector('#passage-btn').disabled = true;
        domState.modeDropdown.classList.remove('show')
    } else if (clickedMode.id == 'passage-btn' || clickedMode.id == 'passage-mode'){
        state.mode = 'passage'
        document.querySelector('#timer-btn').disabled = true;
        domState.modeDropdown.classList.remove('show');
    }
}

function initializeDOM(){
    document.body.innerHTML = `<div class="wrapper">
    <header>
      <div class="logo-lg">
        <img src="./assets/images/logo-large.svg" alt="logo">
      </div>
      <div class="logo-sm">
        <img src="./assets/images/logo-small.svg" alt="logo">
      </div>
      <div class="personal-best" id="personal-best">
        <img src="./assets/images/icon-personal-best.svg" alt="trophy">
        <span >Personal best:</span>
        <p class="personal-record" id="personal-best-display">92 WPM</p>
      </div>
    </header>
    <main>
      <section class="stats-difficulty-modes">
        <div class="stats">
          <div class="progress-box">
            <span>WPM:</span>
            <p id="WPM">0</p>
          </div>
          <div class="progress-box">
            <span>Accuracy:</span>
            <p id="accuracy">0%</p>
          </div>
          <div class="progress-box">
            <span>Time:</span>
            <p id="timer">0:00</p>
          </div>
        </div>
        <div class="difficulty-mode">
          <span>Difficulty: </span>
          <div class="difficulty">
            <div class="difficulty-options">
              <button id="easy-btn" class="difficulty-btn">Easy</button>
              <button id="medium-btn" class="difficulty-btn">Medium</button>
              <button id="hard-btn" class="difficulty-btn">Hard</button>
            </div>
          </div>
          <div class="mode">
            <span>Mode: </span>
            <div class="mode-options">
              <button id="timer-btn" class="timer-mode">Timed (60s)</button>
              <button id="passage-btn" class="timer-mode">Passage</button>
            </div>
          </div>
        </div>
        <!-- Add Drop Down -->
        <div class="dropdowns">
          <div class="dropdown-box">
            <button class="dropdown-btn" id="difficulty-dropdown">Hard <img src="./assets/images/icon-down-arrow.svg" alt=""></button>
            <ul id="difficulty-ul">
              <li id="easy" class="difficulty-btn"><div class="outer-circle"><div class="inner-circle"></div></div>Easy</li>
              <li id="medium" class="difficulty-btn"><div class="outer-circle"><div class="inner-circle"></div></div>Medium</li>
              <li id="hard" class="difficulty-btn"><div class="outer-circle"><div class="inner-circle"></div></div>Hard</li>
            </ul>
          </div>
          <div class="dropdown-box">
            <button class="dropdown-btn" id="mode-dropdown">Timed (60s) <img src="./assets/images/icon-down-arrow.svg" alt="">
            </button>
            <ul id="mode-ul">
              <li id="timed-mode" class="modes timer-mode">
                <div class="outer-circle">
                  <div class="inner-circle"></div>
                </div>Timed
              </li>
              <li id="passage-mode" class="modes timer-mode">
                <div class="outer-circle">
                  <div class="inner-circle"></div>
                </div>Passage
              </li>
            </ul>
            </div>

        </div>
      </section>
      <section class="passage" >
        <div class="passage-display-box">
          <div class="passage-not-started">
              <button id="start-test">Start Typing Test</button>
              <p>Or click the text and start typing</p>
            </div>
          <div id="passage-display">
            
          </div>
          
          <button id="restart-test">Restart Test <img src="./assets/images/icon-restart.svg" alt=""></button>
        </div>
      </section>
    </main>
    <section id="baseline" class="test-page">
      <div class="star-2">
        <img class= 'star-2' src="./assets/images/pattern-star-2.svg" alt="">
      </div>
      <div class="results-page">
        <div class="checkmark-wrapper">
          <div class="outer-bg">
            <div class="inner-bg">
              <img src="./assets/images/icon-completed.svg" alt="">
            </div>
          </div>
        </div>
        <h1>Baseline Established</h1>
        <span>You've set the bar. Now the real challenge begins-time to beat it</span>
        <div class="results">
          <div class="results-box">
            <span>WPM:</span>
            <p id="WPM-results" class="WPM-results-baseline">85</p>
          </div>
          <div class="results-box">
            <span>Accuracy:</span>
            <p id="accuracy-results" class="accuracy-results-baseline">90%</p>
          </div>
          <div class="results-box">
            <span>Characters:</span>
            <div class="char-typed"><p class="typed-correct baseline-correct">0</p>/<p class="typed-mistake baseline-mistake">0</p></div>
          </div>
        </div>
        <button id="beat-score-btn1" class="results-button">Beat This Score <img src="./assets/images/icon-restart.svg"
            alt="" class="restart-img"></button>
      </div>
      <img  class= 'star-1' src="./assets/images/pattern-star-1.svg" alt="">
    </section>
    <section id="new-pb" class="test-page">
      <div class="results-page">
        <div class="pb-img">
          <img src="./assets/images/icon-new-pb.svg" alt="">
        </div>
        <h1>High Score Smashed!</h1>
        <span>You're getting faster. That was incredible typing</span>
        <div class="results">
          <div class="results-box">
            <span>WPM:</span>
            <p id="WPM-results" class="WPM-results-pb">85</p>
          </div>
          <div class="results-box">
            <span>Accuracy:</span>
            <p id="accuracy-results" class="accuracy-results-pb">90%</p>
          </div>
          <div class="results-box">
            <span>Characters:</span>
            <div class="char-typed"><p class="typed-correct pb-correct">0</p>/<p class="typed-mistake pb-mistake">0</p></div>
          </div>
        </div>
        <button id="beat-score-btn2" class="results-button">Beat This Score <img src="./assets/images/icon-restart.svg"
            alt="" class="restart-img"></button>
      </div>
      <div class="confetti"></div>
    </section>
    <section id="test-complete" class="test-page">
      <img class="star-2" src="./assets/images/pattern-star-2.svg" alt="">
      <div class="results-page">
        <div class="outer-bg">
          <div class="inner-bg">
            <img src="./assets/images/icon-completed.svg" alt="">
          </div>
        </div>
        <h1>Test Complete!</h1>
        <span>You're getting faster. That was incredible typing</span>
        <div class="results">
          <div class="results-box">
            <span>WPM:</span>
            <p id="WPM-results" class="WPM-results-complete">85</p>
          </div>
          <div class="results-box">
            <span>Accuracy:</span>
            <p id="accuracy-results" class="accuracy-results-complete">90%</p>
          </div>
          <div class="results-box">
            <span>Characters:</span>
            <div class="char-typed"><p class="typed-correct complete-correct">0</p>/<p class="typed-mistake complete-mistake">0</p></div>
          </div>
        </div>
        <button id="go-again-btn" class="results-button">Go Again <img src="./assets/images/icon-restart.svg"
            alt="" class="restart-img"></button>
      </div>
      <img class="star-1" src="./assets/images/pattern-star-1.svg" alt="">
    </section>
  </div>`
}

function registerDOM(){
    domState = {
        passageDisplay: document.querySelector('#passage-display'),
        timer: document.querySelector('#timer'),
        passageModeBtn: document.querySelector('#passage-btn'),
        timedModeBtn: document.querySelector('#timer-btn'),
        modeDropdown: document.querySelector('#mode-ul'),
        difficultyDropdown: document.querySelector('#difficulty-ul'),
        dropdownBtn: document.querySelectorAll('.dropdown-btn'),
        resultsBtn: document.querySelectorAll('.results-button'),
        WPMProgress: document.querySelector('#WPM'),
        accuracyProgress: document.querySelector("#accuracy"),
        passageLetter: document.querySelectorAll('.passage-letter'),
        baselineResults: document.querySelector('#baseline'),
        PBResults: document.querySelector('#new-pb'),
        testCompleteResults: document.querySelector('#test-complete'),
        main: document.querySelector('main'),
        PBDisplay: document.querySelector('#personal-best-display'),
        correctCharBaseline: document.querySelector('.baseline-correct'),
        mistakeCharBaseline: document.querySelector('.baseline-mistake'),
        accuracyResultsBaseline: document.querySelector('.accuracy-results-baseline'),
        WPMResultsBaseline: document.querySelector('.WPM-results-baseline'),
        correctCharPB: document.querySelector('.pb-correct'),
        mistakeCharPB: document.querySelector('.pb-mistake'),
        accuracyResultsPB: document.querySelector('.accuracy-results-pb'),
        WPMResultsPB: document.querySelector('.WPM-results-pb'),
        correctCharComplete: document.querySelector('.complete-correct'),
        mistakeCharComplete: document.querySelector('.complete-mistake'),
        accuracyResultsComplete: document.querySelector('.accuracy-results-complete'),
        WPMResultsComplete: document.querySelector('.WPM-results-complete'),
        tryAgainBtns: document.querySelectorAll('.results-button'),
        onLoadPage: document.querySelector('.passage-not-started'),
        difficulties: document.querySelectorAll('.difficulty-btn'),
        modes: document.querySelectorAll('.timer-mode'),
        restartTest: document.querySelector('#restart-test'),
    }
    domState.PBDisplay.textContent = `${state.personalBest} WPM`;

    document.querySelector('.passage-not-started').style.display = 'flex';

    document.querySelector('#restart-test').style.display = 'none'

    document.querySelector('#restart-test').addEventListener('click', resetAll)

    document.querySelectorAll('li').forEach((item) => {
        item.addEventListener('click', selectCat)
    })
    document.querySelector('#difficulty-dropdown').addEventListener('click', toggleDropdown)
    document.querySelector('#mode-dropdown').addEventListener('click', toggleDropdown)
    document.querySelector('#start-test').addEventListener('click', startTest)
    document.querySelector('.passage-not-started').addEventListener('click', startTest)
    document.querySelectorAll('.timer-mode').forEach((mode) => {
        mode.addEventListener('click', setMode)
    })
    document.querySelectorAll('.difficulty-btn').forEach((difficulty) => {
        difficulty.addEventListener('click', displayRandomPassage);
    })
    document.body.addEventListener("keyup", typeCharacter)
    document.getElementById('beat-score-btn1').addEventListener('click', resetAll)
    document.getElementById('beat-score-btn2').addEventListener('click', resetAll)
    document.getElementById('go-again-btn').addEventListener('click', resetAll);

}
