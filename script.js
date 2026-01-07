class TypingTest {
  constructor() {
    // DOM Elements
    this.passageDisplay = document.getElementById('passage-display');
    this.startBtn = document.getElementById('start-test');
    this.restartBtn = document.getElementById('restart-test');
    this.WPMDisplay = document.getElementById('WPM');
    this.accuracyDisplay = document.getElementById('accuracy');
    this.timerDisplay = document.getElementById('timer');

    this.baselineSection = document.getElementById('baseline');
    this.newPBSection = document.getElementById('new-pb');
    this.testCompleteSection = document.getElementById('test-complete');

    // Difficulty buttons
    this.easyBtn = document.getElementById('easy-btn');
    this.mediumBtn = document.getElementById('medium-btn');
    this.hardBtn = document.getElementById('hard-btn');
    this.difficultyDropdownBtn = document.getElementById('difficulty-dropdown');
    this.difficultyDropdownList = document.getElementById('difficulty-ul');



    // Mode buttons
    this.timedBtn = document.getElementById('timer-btn');
    this.passageBtn = document.getElementById('passage-btn');
    this.modeDropdownBtn = document.getElementById('mode-dropdown');
    this.modeDropdownList = document.getElementById('mode-ul');

    // State Variables
    this.passageArr = [];        // Current passage as an array
    this.typedChars = [];        // User typed characters
    this.currentIndex = 0;       // Current typing index
    this.timer = 60;             // Timer in seconds
    this.WPM = 0;
    this.accuracy = 0;
    this.currentDifficulty = 'medium';
    this.mode = 'timed';         // 'timed' or 'passage'
    this.testStarted = false;
    this.letterCount = 0;
    this.correctLetters = [];

    this.timerValue = 0;
    this.intervalId = null;

    // Restart button event listener
    this.restartBtn.addEventListener('click', () => this.restartTest());

    // Difficulty button events
    [this.easyBtn, this.mediumBtn, this.hardBtn].forEach(btn => {
        btn.addEventListener('click', () => this.setDifficulty(btn.id));
    });

    // Mode button events
    [this.timedBtn, this.passageBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            this.setMode(btn.id); // update mode
            // start the appropriate timer immediately
            if(this.mode === 'timed') this.timedModeTimer();
            if(this.mode === 'passage') this.passageModeTimer();
        });
    });
  }
    async getPassage(){
    const fetchData = await fetch('./data.json');
    const data = await fetchData.json();

    this.passageArr = [
        ...data.easy,
        ...data.medium,
        ...data.hard
    ].map(passage => passage.text);

    return {
        easyPassage: data.easy.map(p => p.text),
        mediumPassage: data.medium.map(p => p.text),
        hardPassage: data.hard.map(p => p.text)
    };
    }
  elapsedTime(){
    if (typingState.testStartTime === null) {
        typingState.testStartTime = Date.now();
    }
    const elapsedMs = Date.now() - typingState.testStartTime;
    const minutes = (elapsedMs / 60000).toFixed(2);

    return minutes
  }
  WPMAccuracyCalc(totalCount, correctCount){
    
    const grossWPM = totalCount / 5;
    const error = totalCount - correctCount;
    const netWPM = Math.round((grossWPM - error) / this.elapsedTime());
    const accuracy = ((correctCount / totalCount) * 100).toFixed(1);

    this.displayStats(netWPM, accuracy)  
  }
  displayStats(WPM, accuracy){
    if (WPM < 0 || WPM === Infinity){
        WPM = '--'
    }
    this.WPMDisplay.innerText = WPM;
    this.accuracyDisplay.innerText = `${accuracy}%`;
  }
  renderTimer(){
    this.timerDisplay.textContent = `${this.timerValue}s`;
  }
  stopCurrentTimer() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  timedModeTimer(){
    this.stopCurrentTimer();
    this.timerValue = 60;
    this.renderTimer();
    this.intervalId = setInterval(() => {
        this.timerValue--;
        this.renderTimer();

        if(this.timerValue <= 0){
            this.completeTest();
        }
    }, 1000);
  }

  passageModeTimer(){
    this.stopCurrentTimer();
    this.timerValue = 0;
    this.renderTimer();
    this.intervalId = setInterval(() => {
        this.timerValue++;
        this.renderTimer();

        // Stop the timer if the user finishes typing the passage
        if(this.letterCount >= this.passageArr.length){
            this.completeTest();
        }
    }, 1000);
  }

  createSpan(passage){
    typingState.spanArr = [];
    this.passageDisplay.innerHTML = '';

    // Convert passage to array of characters
    this.passageArr = passage.split('');

    for (let i = 0; i < this.passageArr.length; i++){
        let span = document.createElement('span');
        span.classList.add("passage-letter");
        span.innerText = this.passageArr[i];
        this.passageDisplay.append(span);
        typingState.spanArr.push(span);
    }

    // Reset typing counters
    this.letterCount = 0;
    this.correctLetters = [];
    typingState.reset();
  }

  async displayRandomPassage(){
    const passageRes = await this.getPassage();

    // Pick a random passage for initial load based on current difficulty
    let passages;
    if(this.currentDifficulty === 'easy') passages = passageRes.easyPassage;
    if(this.currentDifficulty === 'medium') passages = passageRes.mediumPassage;
    if(this.currentDifficulty === 'hard') passages = passageRes.hardPassage;

    let randomPassage = passages[Math.floor(Math.random() * passages.length)];
    this.createSpan(randomPassage);

    // Setup difficulty button listeners to reload passages
    [this.easyBtn, this.mediumBtn, this.hardBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            this.setDifficulty(btn.id);
        });
    });
  }

  async onClickPassage(){
    if(!this.passageArr.length) {
        await this.displayRandomPassage();
    }
  }

  handleTyping(e){
    if (!this.passageArr.length) return; // No passage yet
    if (e.key.length !== 1) return; // Ignore non-character keys

    let currentChar = this.passageArr[this.letterCount];
    if (!currentChar) return; // Prevent overflow

    let typedChar = e.key;

    if (typedChar === currentChar) {
        typingState.spanArr[this.letterCount].classList.add("correct");
        this.correctLetters.push(currentChar);
    } else {
        typingState.spanArr[this.letterCount].classList.add("mistake");
    }

    this.letterCount++;

    this.WPMAccuracyCalc(this.letterCount, this.correctLetters.length);
  }

  restartTest() {
    this.stopCurrentTimer();
    this.letterCount = 0;
    this.correctLetters = [];
    typingState.reset();
    this.displayRandomPassage();
    this.timerValue = this.mode === 'timed' ? 60 : 0;
    this.renderTimer();
  }

  setDifficulty(difficultyId) {
      if(difficultyId === 'easy-btn' || difficultyId === 'easy') this.currentDifficulty = 'easy';
      if(difficultyId === 'medium-btn' || difficultyId === 'medium') this.currentDifficulty = 'medium';
      if(difficultyId === 'hard-btn' || difficultyId === 'hard') this.currentDifficulty = 'hard';
      this.restartTest();
  }

  setMode(modeId) {
      if(modeId === 'timer-btn' || modeId === 'timed-mode') this.mode = 'timed';
      if(modeId === 'passage-btn' || modeId === 'passage-mode') this.mode = 'passage';
      // Removed restartTest() to prevent passage reload
  }
  completeTest() {
    this.stopCurrentTimer();

    // Calculate final WPM and accuracy
    const grossWPM = this.letterCount / 5;
    const error = this.letterCount - this.correctLetters.length;
    const finalWPM = Math.round((grossWPM - error) / this.elapsedTime());
    const finalAccuracy = ((this.correctLetters.length / this.letterCount) * 100).toFixed(1);
    // Format characters typed with inline styles for correct/mistakes
    const charactersHTML = `<span style="color: hsl(140, 63%, 57%)">${this.correctLetters.length}</span>/<span style="color: hsl(354, 63%, 57%)">${error}</span>`;

    this.displayStats(finalWPM, finalAccuracy);

    // Hide passage section
    this.passageDisplay.parentElement.style.display = 'none';

    // Hide all results sections initially
    this.baselineSection.style.display = 'none';
    this.newPBSection.style.display = 'none';
    this.testCompleteSection.style.display = 'none';

    const personalBest = parseInt(localStorage.getItem('personalBest') || '0');

    if(personalBest === 0) {
        // First try, show baseline
        this.baselineSection.style.display = 'flex';
        this.baselineSection.querySelector('#WPM-results').innerText = finalWPM;
        this.baselineSection.querySelector('#accuracy-results').innerText = `${finalAccuracy}%`;
        this.baselineSection.querySelector('#characters-results').innerHTML = charactersHTML;
        localStorage.setItem('personalBest', finalWPM);
    } else if(finalWPM <= personalBest) {
        // Did not beat personal best
        this.testCompleteSection.style.display = 'flex';
        this.testCompleteSection.querySelector('#WPM-results').innerText = finalWPM;
        this.testCompleteSection.querySelector('#accuracy-results').innerText = `${finalAccuracy}%`;
        this.testCompleteSection.querySelector('#characters-results').innerHTML = charactersHTML;
    } else {
        // New personal best
        this.newPBSection.style.display = 'flex';
        this.newPBSection.querySelector('#WPM-results').innerText = finalWPM;
        this.newPBSection.querySelector('#accuracy-results').innerText = `${finalAccuracy}%`;
        this.newPBSection.querySelector('#characters-results').innerHTML = charactersHTML;
        localStorage.setItem('personalBest', finalWPM);
    }
}
}

class TypingTestState{
    constructor(){
        // this.cursorPosition = 0;
        this.passageArr = [];
        this.spanArr = [];
        this.testStartTime = null;
    }

    reset(){
        // this.cursorPosition = 0;
        this.testStartTime = null;

        this.spanArr.forEach(span => {
            span.classList.remove('correct', 'mistake');
            span.style.color = '';
            span.style.border = '';
        });
    }
}
const typingState = new TypingTestState();

const typingTest = new TypingTest();





const passageDisplay = document.querySelector('#passage-display');
const timer = document.querySelector('#timer');
const passageModeBtn = document.querySelector('#passage-btn');
const timedModeBtn = document.querySelector('#timer-btn');

function focusButton(button){
    button.classList.add('active') 
}
async function getData(){
    const fetchData = await fetch('./data.json');
    const data = await fetchData.json();

    return {easy: data.easy, medium: data.medium, hard: data.hard}
}


document.body.addEventListener("keyup", (e) => typingTest.handleTyping(e));

document.querySelector('#start-test').addEventListener('click', () => {
    document.querySelector('.passage-not-started').style.display = 'none'
    typingTest.onClickPassage()
})
typingTest.displayRandomPassage()
