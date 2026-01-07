'use strict';

const domState = {
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

    resetDOM(){
        this.timer.textContent = '0:00';
        this.timer.style.color = 'white';
        this.passageDisplay.innerHTML = '';
        this.WPMProgress.innerHTML = '0';
        this.accuracyProgress.innerHTML = '0%';
        this.accuracyProgress.style.color = 'white';
        this.passageLetter.forEach(passage => passage.innerHTML = '');
        this.PBResults.style.display = 'none';
        this.baselineResults.style.display = 'none';
        this.testCompleteResults.style.display = 'none';
        this.main.style.display = 'block';
        this.onLoadPage.style.display = 'flex';
        this.restartTest.style.display = 'none'
        this.difficulties.forEach((difficulty) => {
            difficulty.classList.remove('active');
            difficulty.disabled = false;
        });
        this.modes.forEach((mode) => {
            mode.classList.remove('active');
            mode.disabled = false;
        })
    }
}
const state = {
    cursorPosition: 0,
    passageLetters: [],
    testStartTime: null,
    intervalId: null,
    value: 0,
    difficulty: null,
    startTest: false,
    errors: 0,
    netWPM: 0,
    accuracy: 0,
    mode: null,
}
function resetState(){
    state.cursorPosition = 0;
    state.passageLetters = [];
    state.testStartTime = null;
    state.value = 0;
    state.difficulty = null;
    state.startTest = false;
    state.errors = 0;
    state.netWPM = 0;
    state.accuracy = 0;
    state.mode = null;
}
function logState(){
    // console.table(state);
}

domState.PBDisplay.textContent = `${parseInt(localStorage.getItem('personalBest') || '0')} WPM`

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.passage-not-started').style.display = 'flex';

})
document.querySelector('#restart-test').style.display = 'none'

document.querySelectorAll('li').forEach((item) => {
    item.addEventListener('click', selectCat)
})
document.querySelector('#difficulty-dropdown').addEventListener('click', toggleDropdown)
document.querySelector('#mode-dropdown').addEventListener('click', toggleDropdown)
document.querySelector('#start-test').addEventListener('click', startTest2)
document.querySelector('.passage-not-started').addEventListener('click', startTest2)
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

(async () => {
    state.passageRes = await getPassage();
})();

function resetAll(){
    resetState()
    domState.resetDOM()
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
            item.parentElement.style.opacity = '0';
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
    } else if (e.target.id === 'medium-btn' || e.target.id === 'medium') {
        state.difficulty = 'medium';
        renderPassage(state.passageRes.mediumPassage[randomPassageIndex])
        document.querySelector('#easy-btn').disabled = true
        document.querySelector('#hard-btn').disabled = true
    } else if (e.target.id === 'hard-btn' || e.target.id === 'hard') {
        state.difficulty = 'hard'
        renderPassage(state.passageRes.hardPassage[randomPassageIndex])
        document.querySelector('#medium-btn').disabled = true
        document.querySelector('#easy-btn').disabled = true
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
            }
            console.log('correct', state.passageLetters[state.cursorPosition]);
        }  else {
            state.passageLetters[state.cursorPosition].correct = false;
            state.passageLetters[state.cursorPosition].mistake++
            state.passageLetters[state.cursorPosition].span.classList.add("mistake");
            console.log('mistake', state.passageLetters[state.cursorPosition]);
        }
        state.cursorPosition++;
    }
    wPMAccuracyCalc();
    logState();
}

function elapsedTime(){
    if (state.testStartTime === null) {
        state.testStartTime = Date.now();
    }
    const elapsedMs = Date.now() - state.testStartTime;
    const minutes = (elapsedMs / 60000);
    
    return minutes
}
function wPMAccuracyCalc(){
    // const totalCount = state.cursorPosition;
    let totalCount;
    for (let i = 0; i < state.passageLetters.length; i++) {
        if (state.passageLetters[i].correct === undefined && state.passageLetters[i].mistake === 0) {
            totalCount = i;
            break;
        }
    }
    const correctCount = state.passageLetters.reduce((acc, cur) => {
        return cur.correct ? ++acc : acc;
    },0);
    const errorsCount = state.passageLetters.reduce((acc, cur) => {
        return acc + cur.mistake;
    },0);
    console.log(totalCount, correctCount, errorsCount);
    const grossWPM = totalCount/ 5;
    state.netWPM = Math.round((grossWPM - errorsCount) / elapsedTime());
    state.accuracy = ((correctCount/ totalCount) * 100).toFixed(1);
    
    displayStats()
}
function displayStats(){
    if (state.netWPM < 0 || state.netWPM === Infinity){
        state.netWPM = '--'
    }
    document.querySelector('#WPM').innerText = state.netWPM;
    document.querySelector("#accuracy").innerText = `${state.accuracy}%`;
    document.querySelector("#accuracy").style.color = `var(--Red-500)`;
}

function modeTimer(mode){
    if (mode !== 'timer' && mode !== 'passage') throw new Error('Mode must be Timer or Passage')
    stopCurrentTimer()
    if (mode === 'timer'){
        state.value = 60;
    } else {
        state.value = 0;
    }
    renderTimer()
    state.intervalId = setInterval(() => {
        if (mode === "timer") {
            state.value--;
            renderTimer();
            if (state.value <= 0 || state.cursorPosition === state.passageLetters.length) {
                testComplete();
            }
        } else {
            state.value++;
            renderTimer();
            if (state.cursorPosition === state.passageLetters.length) {
                testComplete();
            }
        }
    }, 1000);  
}
function stopCurrentTimer() {
    if (state.intervalId !== null) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
}

function renderTimer(){
    domState.timer.textContent = `0:${state.value}`;
    if (state.value < 10){
        domState.timer.textContent = `0:0${state.value}`;
    }
    domState.timer.style.color = `var(--Yellow-400)`;
}
function testComplete(){
    stopCurrentTimer()
    state.startTest = false;
    const currentWPM = state.netWPM;
    const currentAccuracy = state.accuracy;
    const correct = 0;
    const mistakes = 0;
    
    const personalBest = parseInt(localStorage.getItem('personalBest') || '0');
    
    if (personalBest === 0){
        domState.main.style.display = 'none';
        domState.baselineResults.style.display = 'flex';
        domState.WPMResultsBaseline.textContent = currentWPM;
        domState.accuracyResultsBaseline.textContent = `${currentAccuracy}%`;
        domState.correctCharBaseline.textContent = correct;
        domState.mistakeCharBaseline.textContent = mistakes;
        
        localStorage.setItem('personalBest', currentWPM)
    } else if (currentWPM > personalBest){
        domState.main.style.display = 'none';
        domState.PBResults.style.display = 'flex';
        domState.WPMResultsPB.textContent = currentWPM;
        domState.accuracyResultsPB.textContent = `${currentAccuracy}%`;
        domState.correctCharPB.textContent = correct;
        domState.mistakeCharPB.textContent = mistakes;
        localStorage.setItem('personalBest', currentWPM)
    } else {
        domState.main.style.display = 'none';
        domState.testCompleteResults.style.display = 'flex';
        domState.WPMResultsComplete.textContent = currentWPM;
        domState.accuracyResultsComplete.textContent = `${currentAccuracy}%`;
        domState.correctCharComplete.textContent = correct;
        domState.mistakeCharComplete.textContent = mistakes;
    }
}

function startTest2(){
    console.log('starting test2');
    state.startTest = true
    document.querySelector('.passage-not-started').style.display = 'none';
    document.querySelector('#restart-test').style.display = 'flex'

    modeTimer(state.mode)
}

function setMode(e){
    const clickedMode = e.target;
    document.querySelectorAll('.timer-mode').forEach((btn) => {if (btn == clickedMode)  {btn.classList.add('active')} else {btn.classList.remove('active')}  })
    if (clickedMode.id == 'timer-btn' || clickedMode.id == 'timed-mode'){
        state.mode = 'timer'
        document.querySelector('#passage-btn').disabled = true;
    } else if (clickedMode.id == 'passage-btn' || clickedBtn.id == 'passage-mode'){
        state.mode = 'passage'
        document.querySelector('#timer-btn').disabled = true;
    }
}



