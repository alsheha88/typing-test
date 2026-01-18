'use strict';
let domState;

const uiState = {
    completionScreenDisplayed: false,
    completionType: undefined,
    results: {
        wpm: undefined,
        accuracy: undefined,
        correct: undefined,
        mistakes: undefined,
    },
    personalBest: undefined,
}
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

renderUI();

(async () => {
    state.passageRes = await getPassage();
})();

function resetAll(){
    resetState();
    renderUI();
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
    uiState.completionScreenDisplayed = true;
    if (state.netWPM > state.personalBest){
        if (state.personalBest === 0){
            uiState.completionType = 'baseline';
        } else {
            uiState.completionType = 'beaten';
        }
        updatePersonalBest(state.netWPM);
    } else {
        uiState.completionType = 'testComplete';
    }
    uiState.results.wpm = state.netWPM;
    uiState.results.accuracy = state.accuracy
    uiState.results.correct = correctCount();
    uiState.results.mistakes = errorsCount();
    renderUI();
}

function renderUI(){
    let ui;
    if (uiState.completionScreenDisplayed){
        ui = cloneTemplate('completionScreen');
        const inserts = {};
        if (uiState.completionType === 'baseline'){
            inserts.heading = 'Baseline Established';
            inserts.completionScreenHeaderImg = cloneTemplate('completionScreenHeaderImg-baseline-testComplete');
            inserts.subheading = 'You\'ve set the bar. Now the real challenge begins-time to beat it';
            inserts.buttonText = 'Beat this score';

        } else if (uiState.completionType === 'beaten'){
            inserts.heading = 'High Score Smashed!';
            inserts.completionScreenHeaderImg = cloneTemplate('completionScreenHeaderImg-beaten');
            inserts.subheading = 'You\'re getting faster. That was incredible typing';
            inserts.buttonText = 'Beat this score';

        } else if (uiState.completionType === 'testComplete'){
            inserts.heading = 'Test Complete!';
            inserts.completionScreenHeaderImg = cloneTemplate('completionScreenHeaderImg-baseline-testComplete');
            inserts.subheading = 'You\'re getting faster. That was incredible typing';
            inserts.buttonText = 'Go Again';
        } else {
            throw new Error('Completion type not supported: ' + uiState.completionType);
        }
        ui.querySelector('h1').innerText = inserts.heading;
        ui.querySelector('.results-page').prepend(inserts.completionScreenHeaderImg );
        ui.querySelector('.subheading').innerText = inserts.subheading;
        ui.querySelector('button').prepend(`${inserts.buttonText} `);
        ui.querySelector('#WPM-results').innerText = uiState.results.wpm;
        ui.querySelector('#accuracy-results').prepend(`${uiState.results.accuracy}`);
        ui.querySelector('.typed-correct').innerText = uiState.results.correct;
        ui.querySelector('.typed-mistake').innerText = uiState.results.mistakes;

    } else{
        ui = cloneTemplate('testScreen');
    }
    const headerTemplate = cloneTemplate('headerTemplate');
    headerTemplate.querySelector('#personal-best-display').prepend(uiState.personalBest)
    ui.prepend(headerTemplate)
    document.body.innerHTML = ``;
    document.body.appendChild(ui);

    registerDOM();
}

function cloneTemplate(templateId){
    console.log('Cloning', templateId);
    const templateElement = document.getElementById(templateId);
    return templateElement.content.cloneNode(true);
}
function updatePersonalBest(personalBest){
    state.personalBest = personalBest;
    uiState.personalBest = personalBest;
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

function registerDOM(){
    if (uiState.completionScreenDisplayed) {
        domState = {}
        document.getElementById('beat-score-btn').addEventListener('click', resetAll)
        return
    }
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


}
