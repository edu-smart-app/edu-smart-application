const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "edusmart_v1";
const GRADES = ["Grade 9","Grade 10","Grade 11","Grade 12"];
const STREAM_SUBJECTS = {
  "Social Science": ["English", "Mathematics", "History", "Economics", "Geography"],
  "Natural Science": ["English", "Mathematics", "Biology", "Chemistry", "Physics"]
};

/* EDIT THIS CURRICULUM OBJECT after checking your textbooks.
   Add/remove subjects and unit names for each grade.
   Example: "Grade 9": { "Biology": ["Unit 1 title", "Unit 2 title"] }
*/
const CURRICULUM = {
  "Grade 9": {
    "Mathematics":["Unit 1 - Add textbook unit name"],
    "English":["Unit 1 - Add textbook unit name"],
    "Biology":[
  "Unit 1: Introduction to Biology",
  "Unit 2: Characteristics and Classification of Organisms",
  "Unit 3: Cells",
  "Unit 4: Reproduction",
  "Unit 5: Human Health, Nutrition and Disease",
  "Unit 6: Ecology"
],
    "Chemistry":["Unit 1 - Add textbook unit name"],
    "Physics":["Unit 1 - Add textbook unit name"],
    "History":["unit 1 add "],
    "Geography":["unit 1 add"],
    "Economics":["unit 1 add]
      },
  "Grade 10": {
    "Mathematics":["Unit 1 - Add textbook unit name"],
    "English":["Unit 1 - Add textbook unit name"],
    "Biology":[  "Unit 1: add"],
    "Chemistry":["Unit 1 - Add textbook unit name"],
    "Physics":["Unit 1 - Add textbook unit name"],
    "History":["unit 1 add "],
    "Geography":["unit 1 add"],
    "Economics":["unit 1 add]
                 
  },
  "Grade 11": {
    "Mathematics":["Unit 1 - Add textbook unit name"],
    "English":["Unit 1 - Add textbook unit name"],
    "Biology":["Unit 1 - Add textbook unit name"],
    "Chemistry":["Unit 1 - Add textbook unit name"],
    "Physics":["Unit 1 - Add textbook unit name"],
    "History":["Unit 1 - Add textbook unit name"],
    "Economics":["Unit 1 - Add textbook unit name"],
    "Geography":["Unit 1 - Add textbook unit name"]
  },
  "Grade 12": {
    "Mathematics":["Unit 1 - Add textbook unit name"],
    "English":["Unit 1 - Add textbook unit name"],
    "Biology":["Unit 1 - Add textbook unit name"],
    "Chemistry":["Unit 1 - Add textbook unit name"],
    "Physics":["Unit 1 - Add textbook unit name"],
    "History":["Unit 1 - Add textbook unit name"],
    "Economics":["Unit 1 - Add textbook unit name"],
    "Geography":["Unit 1 - Add textbook unit name"]
  }
};

const defaultState = {
  profile:{name:"Student",grade:"Grade 10",photo:""},
  gradeChosen:false,
  dark:false,
  sound:false,
  history:[],
  schedule:[],
  assessments:[],
  studyMinutes:0
};
let state = loadState();
let selectedDifficulty = "Easy";
let quiz = null;
let timerInterval = null;
let toastTimeout = null;

function loadState(){
  try { return {...defaultState,...JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}; }
  catch(e){ return structuredClone(defaultState); }
}
function saveState(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
function toast(message){
  const el=$("toast"); el.textContent=message; el.classList.add("show");
  clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>el.classList.remove("show"),2400);
}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function goPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+name));
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  const titles={home:"Dashboard",learn:"Study materials",quiz:"Quiz centre",schedule:"Study schedule",calculator:"Grade calculator",performance:"Performance",achievements:"Achievements",profile:"My profile",settings:"Settings"};
  $("pageTitle").textContent=titles[name]||"EDU SMART";
  $("sidebar").classList.remove("open");
  if(name==="home") renderDashboard();
  if(name==="performance") renderPerformance();
  if(name==="schedule") renderSchedule();
  if(name==="calculator") { fillSelect($("calcSubject"),subjectsFor(state.profile.grade),$("calcSubject").value); renderAssessments(); }
  if(name==="achievements") renderAchievements();
}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>goPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>goPage(b.dataset.go)));
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});

function subjectsFor(grade){
  if(grade==="Grade 11"||grade==="Grade 12") return STREAM_SUBJECTS[state.profile.stream]||[];
  return Object.keys(CURRICULUM[grade]||{});
}
function unitsFor(grade,subject){return (CURRICULUM[grade]||{})[subject]||[];}
function fillSelect(select,items,preferred){
  select.innerHTML=items.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join("");
  if(items.includes(preferred))select.value=preferred;
}
function setupSelectors(){
  updateSubjects("learn"); updateSubjects("quiz");
  $("learnSubject").addEventListener("change",()=>{updateUnits("learn");renderLesson();});
  $("learnUnit").addEventListener("change",renderLesson);
  $("quizSubject").addEventListener("change",()=>{updateUnits("quiz");updateAvailability();});
  $("quizUnit").addEventListener("change",updateAvailability);
}
function updateSubjects(prefix){
  const grade=state.profile.grade;
  const list=subjectsFor(grade);
  const old=$(prefix+"Subject").value;
  fillSelect($(prefix+"Subject"),list,old||"Chemistry");
  updateUnits(prefix);
}
function updateUnits(prefix){
  const grade=state.profile.grade,subject=$(prefix+"Subject").value;
  const units=unitsFor(grade,subject);
  const old=$(prefix+"Unit").value;
  fillSelect($(prefix+"Unit"),units,old);
}
function currentSelection(prefix){return {grade:state.profile.grade,subject:$(prefix+"Subject").value,unit:$(prefix+"Unit").value};}
function matchingQuestions(selection,difficulty){
  return (QUESTION_BANK||[]).filter(q=>q.grade===selection.grade&&q.subject===selection.subject&&q.unit===selection.unit&&q.difficulty===difficulty);
}

function renderLesson(){
  const s=currentSelection("learn");
  const qs=(QUESTION_BANK||[]).filter(q=>q.grade===s.grade&&q.subject===s.subject&&q.unit===s.unit);

  $("lessonContent").innerHTML=`
    <span class="eyebrow">${escapeHTML(s.grade)} • ${escapeHTML(s.subject)}</span>
    <h3>${escapeHTML(s.unit)}</h3>

    <div class="lesson-content">
      <h4>About this unit</h4>
      <p>This is the study-material area for <b>${escapeHTML(s.unit)}</b>. Add your textbook notes, definitions, formulas, worked examples and diagrams here as you build your content.</p>

      <h4>Suggested study method</h4>
      <ul>
        <li>Read the textbook explanation carefully.</li>
        <li>Write important terms and definitions in your own notes.</li>
        <li>Study examples and diagrams.</li>
        <li>Try practice questions after reviewing the topic.</li>
      </ul>

      <p><b>Questions currently added for this unit:</b> ${qs.length}. Add more in <code>js/questions.js</code>.</p>
    </div>

    <div class="lesson-actions">
      <button class="btn btn-primary reading-start-btn" id="readNoteBtn" type="button">
        Start reading fullscreen
      </button>

      <button class="btn btn-outline" id="lessonQuizBtn" type="button">
        Practise this unit →
      </button>
    </div>
  `;

  $("readNoteBtn").onclick=()=>{
    enterStudyMode("reading");

    if(!$("exitReadingMode")){
      const b=document.createElement("button");
      b.id="exitReadingMode";
      b.className="btn btn-outline study-exit reading-exit";
      b.type="button";
      b.textContent="Exit fullscreen";
      b.onclick=exitStudyMode;
      $("lessonContent").prepend(b);
    }
  };

  $("lessonQuizBtn").onclick=()=>{
    updateSubjects("quiz");
    $("quizSubject").value=s.subject;
    updateUnits("quiz");
    $("quizUnit").value=s.unit;
    updateAvailability();
    goPage("quiz");
  };
}

function setDifficulty(value){
  selectedDifficulty=value;
  document.querySelectorAll(".difficulty").forEach(b=>b.classList.toggle("selected",b.dataset.difficulty===value));
  updateAvailability();
}
document.querySelectorAll(".difficulty").forEach(b=>b.addEventListener("click",()=>setDifficulty(b.dataset.difficulty)));
function updateAvailability(){
  if(!state.profile.grade)return;
  const count=matchingQuestions(currentSelection("quiz"),selectedDifficulty).length;
  $("questionAvailability").textContent=`${count} ${selectedDifficulty.toLowerCase()} question(s) currently available for this unit. Add your own questions to expand the bank.`;
}
$("startQuiz").addEventListener("click",startQuiz);
function startQuiz(){
  const s=currentSelection("quiz");
  let pool=matchingQuestions(s,selectedDifficulty);
  if(!pool.length){toast("No questions for this selection yet. Add questions in js/questions.js.");return;}
  pool=[...pool].sort(()=>Math.random()-.5);
  const requested=$("questionCount").value;
  const amount=requested==="All available"?pool.length:Number(requested);
  pool=pool.slice(0,amount);
  quiz={selection:s,difficulty:selectedDifficulty,questions:pool,answers:{},index:0,seconds:$("timerToggle").checked?600:null,finished:false};
  $("quizPanel").classList.remove("hidden");$("quizResult").classList.add("hidden");
  enterStudyMode("quiz");
  $("quizContext").textContent=`${s.grade.toUpperCase()} • ${s.subject.toUpperCase()} • ${s.unit.toUpperCase()} • ${selectedDifficulty.toUpperCase()}`;
  renderQuestion();
  if(timerInterval)clearInterval(timerInterval);
  if(quiz.seconds!==null){updateTimer();timerInterval=setInterval(()=>{if(!quiz||quiz.finished)return;quiz.seconds--;updateTimer();if(quiz.seconds<=0)finishQuiz(true);},1000);}
  else $("timerDisplay").textContent="No timer";
  $("quizPanel").scrollIntoView({behavior:"smooth",block:"start"});
}
function updateTimer(){
  const m=Math.floor(quiz.seconds/60),s=quiz.seconds%60;
  $("timerDisplay").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  $("timerDisplay").style.color=quiz.seconds<60?"#c33b42":"";
}
function renderQuestion(){
  const q=quiz.questions[quiz.index],total=quiz.questions.length;
  $("quizProgress").textContent=`Question ${quiz.index+1} of ${total}`;
  $("quizProgressBar").style.width=`${((quiz.index+1)/total)*100}%`;
  $("answeredCount").textContent=`${Object.keys(quiz.answers).length} answered`;
  $("questionArea").innerHTML=`<div class="question-title">${escapeHTML(q.question)}</div><div class="answer-list">${q.options.map((op,i)=>`<button class="answer-option ${quiz.answers[quiz.index]===i?"chosen":""}" data-answer="${i}"><span class="letter">${String.fromCharCode(65+i)}</span><span>${escapeHTML(op)}</span></button>`).join("")}</div>`;
  document.querySelectorAll("[data-answer]").forEach(b=>b.addEventListener("click",()=>{quiz.answers[quiz.index]=Number(b.dataset.answer);renderQuestion();}));
  $("prevQuestion").disabled=quiz.index===0;
  $("nextQuestion").classList.toggle("hidden",quiz.index===total-1);
  $("finishQuiz").classList.toggle("hidden",quiz.index!==total-1);
}
$("prevQuestion").addEventListener("click",()=>{if(quiz&&quiz.index>0){quiz.index--;renderQuestion();}});
$("nextQuestion").addEventListener("click",()=>{if(quiz&&quiz.index<quiz.questions.length-1){quiz.index++;renderQuestion();}});
$("finishQuiz").addEventListener("click",()=>finishQuiz(false));
function finishQuiz(timeUp){
  if(!quiz||quiz.finished)return;
  quiz.finished=true;if(timerInterval)clearInterval(timerInterval);
  let correct=0;
  quiz.questions.forEach((q,i)=>{if(quiz.answers[i]===q.answer)correct++;});
  const total=quiz.questions.length,percent=Math.round(correct/total*100);
  const result={date:new Date().toISOString(),grade:quiz.selection.grade,subject:quiz.selection.subject,unit:quiz.selection.unit,difficulty:quiz.difficulty,correct,total,percent};
  state.history.unshift(result);state.history=state.history.slice(0,100);saveState();
  $("quizPanel").classList.add("hidden");$("quizResult").classList.remove("hidden");
  $("quizResult").innerHTML=`<div class="result-exit-row"><button class="btn btn-outline" id="exitQuizResultMode" type="button">Exit fullscreen</button></div><div class="eyebrow" style="text-align:center">QUIZ COMPLETED ${timeUp?"• TIME UP":""}</div><div class="result-score">${percent}%</div><div class="result-summary">${correct} correct out of ${total} • ${escapeHTML(result.grade)} • ${escapeHTML(result.subject)} • ${escapeHTML(result.unit)} • ${escapeHTML(result.difficulty)}</div><h3 style="margin-top:25px">Answer review</h3>${quiz.questions.map((q,i)=>{const ok=quiz.answers[i]===q.answer;return `<div class="review-item"><b>${i+1}. ${escapeHTML(q.question)}</b><span class="${ok?"correct-text":"wrong-text"}">${ok?"Correct":"Not correct"}.</span> Correct answer: ${escapeHTML(q.options[q.answer])}<div class="muted small">${escapeHTML(q.explanation||"Review this topic in your textbook.")}</div></div>`;}).join("")}<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-primary" id="retrySame">Try again</button><button class="btn btn-outline" id="changeDifficulty">Change difficulty</button></div>`;
  $("exitQuizResultMode").onclick=exitStudyMode;
  $("retrySame").onclick=()=>startQuiz();
  $("changeDifficulty").onclick=()=>{setDifficulty(selectedDifficulty==="Easy"?"Medium":selectedDifficulty==="Medium"?"Hard":"Easy");$("quizResult").classList.add("hidden");$("quizPanel").classList.add("hidden");toast("Difficulty changed. Start the next quiz when ready.");};
  renderDashboard();renderAchievements();
}

function renderDashboard(){
  const h=state.history,avg=h.length?Math.round(h.reduce((a,x)=>a+x.percent,0)/h.length):0;
  $("statQuizzes").textContent=h.length;$("statAverage").textContent=avg+"%";
  $("statMinutes").textContent=state.studyMinutes||0;
  $("statBest").textContent=h.length?Math.max(...h.map(x=>x.percent))+"%":"—";
  $("recentResults").innerHTML=h.length?h.slice(0,4).map(x=>`<div class="history-entry"><div><b>${escapeHTML(x.subject)} · ${escapeHTML(x.unit)}</b><small>${escapeHTML(x.grade)} • ${new Date(x.date).toLocaleDateString()}</small></div><b>${x.percent}%</b></div>`).join(""):'<div class="empty-state compact">Your completed quizzes will appear here.</div>';
  const activeSubjects=subjectsFor(state.profile.grade);
  const practised=new Set(h.filter(x=>x.grade===state.profile.grade&&activeSubjects.includes(x.subject)).map(x=>x.subject));
  const progress=activeSubjects.length?Math.round(practised.size/activeSubjects.length*100):0;
  if($("learningProgressBar")) $("learningProgressBar").style.width=progress+"%";
  if($("learningProgressLabel")) $("learningProgressLabel").textContent=`${practised.size}/${activeSubjects.length} subjects practised`;
  if($("learningProgressHint")) $("learningProgressHint").textContent=progress===100?"Great work — you have practised every subject in your selected grade.":"Complete at least one quiz in each subject to fill your learning progress bar.";
}
function renderPerformance(){
  const h=state.history,avg=h.length?Math.round(h.reduce((a,x)=>a+x.percent,0)/h.length):0,best=h.length?Math.max(...h.map(x=>x.percent))+"%":"—";
  $("perfTotal").textContent=h.length;$("perfAverage").textContent=avg+"%";$("perfBest").textContent=best;
  $("historyList").innerHTML=h.length?h.map(x=>`<div class="history-entry"><div><b>${escapeHTML(x.grade)} · ${escapeHTML(x.subject)}</b><small>${escapeHTML(x.unit)} • ${escapeHTML(x.difficulty)} • ${new Date(x.date).toLocaleString()}</small></div><b>${x.correct}/${x.total} (${x.percent}%)</b></div>`).join(""):'<div class="empty-state">No quiz results yet.</div>';
}
$("clearHistory").addEventListener("click",()=>{if(confirm("Clear all quiz history?")){state.history=[];saveState();renderPerformance();renderDashboard();}});
function renderSchedule(){
  const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const list=[...state.schedule].sort((a,b)=>days.indexOf(a.day)-days.indexOf(b.day)||a.time.localeCompare(b.time));
  $("scheduleList").innerHTML=list.length?list.map(x=>`<div class="schedule-entry"><div><b>${escapeHTML(x.day)} · ${escapeHTML(x.time)}</b><small>${escapeHTML(x.subject)} — ${escapeHTML(x.topic||"Study session")}</small></div><button class="delete-btn" data-delete-session="${x.id}" aria-label="Delete session">×</button></div>`).join(""):'<div class="empty-state">No sessions added yet.</div>';
  document.querySelectorAll("[data-delete-session]").forEach(b=>b.onclick=()=>{state.schedule=state.schedule.filter(x=>x.id!==b.dataset.deleteSession);saveState();renderSchedule();});
}
$("scheduleForm").addEventListener("submit",e=>{
  e.preventDefault();state.schedule.push({id:Date.now().toString(),subject:$("scheduleSubject").value.trim(),day:$("scheduleDay").value,time:$("scheduleTime").value,topic:$("scheduleTopic").value.trim()});
  saveState();e.target.reset();renderSchedule();toast("Study session added.");
});
$("clearSchedule").addEventListener("click",()=>{if(confirm("Clear your entire study schedule?")){state.schedule=[];saveState();renderSchedule();}});
function assessmentSubjectAverage(items){
  const weight=items.reduce((sum,item)=>sum+Number(item.weight||0),0);
  return weight?items.reduce((sum,item)=>sum+item.percent*item.weight,0)/weight:0;
}
function renderAssessments(){
  const subjects=subjectsFor(state.profile.grade),records=state.assessments.filter(x=>x.subject&&subjects.includes(x.subject));
  const legacy=state.assessments.filter(x=>!x.subject||!subjects.includes(x.subject));
  const subjectData=subjects.map(subject=>{
    const items=records.filter(x=>x.subject===subject),average=items.length?assessmentSubjectAverage(items):null;
    return {subject,items,average};
  });
  const active=subjectData.filter(x=>x.average!==null);
  const overall=active.length?active.reduce((sum,x)=>sum+x.average,0)/active.length:0;
  $("weightedAverage").textContent=overall.toFixed(1)+"%";
  $("subjectsWithMarks").textContent=`${active.length}/${subjects.length}`;
  $("assessmentCount").textContent=records.length;
  $("subjectResults").innerHTML=subjectData.map(x=>`<div class="subject-result"><div class="subject-result-head"><b>${escapeHTML(x.subject)}</b><strong>${x.average===null?"—":x.average.toFixed(1)+"%"}</strong></div><div class="subject-result-track"><div style="width:${x.average===null?0:Math.max(0,Math.min(100,x.average))}%"></div></div><small>${x.items.length} assessment${x.items.length===1?"":"s"}</small></div>`).join("");
  const grouped=subjects.map(subject=>({subject,items:records.filter(x=>x.subject===subject)})).filter(x=>x.items.length);
  let html=grouped.map(group=>`<section class="assessment-group"><h4>${escapeHTML(group.subject)}</h4>${group.items.map(x=>`<div class="assessment-entry"><div><b>${escapeHTML(x.name)}</b><small>${escapeHTML(x.type||"Assessment")} • ${x.mark}/${x.outOf} (${x.percent.toFixed(1)}%) • ${x.weight}% weight</small></div><button class="delete-btn" data-delete-mark="${x.id}" aria-label="Delete assessment">×</button></div>`).join("")}</section>`).join("");
  if(legacy.length) html+=`<section class="assessment-group legacy-assessments"><h4>Unassigned older marks</h4><p class="muted small">These older records have no subject, so they are kept here but are not included in subject or overall averages.</p>${legacy.map(x=>`<div class="assessment-entry"><div><b>${escapeHTML(x.name||"Older assessment")}</b><small>Previous mark: ${escapeHTML(x.mark)}% • ${escapeHTML(x.weight)}% weight</small></div><button class="delete-btn" data-delete-mark="${x.id}" aria-label="Delete assessment">×</button></div>`).join("")}</section>`;
  $("assessmentList").innerHTML=html||'<div class="empty-state">No marks entered yet.</div>';
  document.querySelectorAll("[data-delete-mark]").forEach(b=>b.onclick=()=>{state.assessments=state.assessments.filter(x=>x.id!==b.dataset.deleteMark);saveState();renderAssessments();});
}
$("calcForm").addEventListener("submit",e=>{
  e.preventDefault();
  const subject=$("calcSubject").value,type=$("assessmentType").value,name=$("assessmentName").value.trim();
  const mark=Number($("markObtained").value),outOf=Number($("markOutOf").value),weight=Number($("markWeight").value);
  if(!subjectsFor(state.profile.grade).includes(subject)){toast("Choose a subject from your selected grade.");return;}
  if(!name||!Number.isFinite(mark)||!Number.isFinite(outOf)||!Number.isFinite(weight)||outOf<=0||mark<0||mark>outOf||weight<=0||weight>100){toast("Check the mark, maximum mark and weight values.");return;}
  state.assessments.push({id:Date.now().toString(),subject,type,name,mark,outOf,percent:mark/outOf*100,weight});
  saveState();e.target.reset();$("markOutOf").value=100;$("markWeight").value=100;renderAssessments();toast("Assessment added to "+subject+".");
});
$("clearMarks").addEventListener("click",()=>{if(confirm("Clear all assessment marks, including older unassigned records?")){state.assessments=[];saveState();renderAssessments();}});
function renderAchievements(){
  const h=state.history,avg=h.length?h.reduce((a,x)=>a+x.percent,0)/h.length:0;
  const uniqueSubjects=new Set(h.filter(x=>x.grade===state.profile.grade).map(x=>x.subject));
  const schedules=state.schedule||[],marks=state.assessments||[];
  const easy=h.filter(x=>x.difficulty==="Easy").length,medium=h.filter(x=>x.difficulty==="Medium").length,hard=h.filter(x=>x.difficulty==="Hard").length;
  const high=h.filter(x=>x.percent>=90).length,perfect=h.filter(x=>x.percent===100).length;
  const days=new Set(schedules.map(x=>x.day)).size;
  const items=[
    ["🌱","First step","Complete your first quiz",h.length>=1],
    ["📘","Practice learner","Complete 3 quizzes",h.length>=3],
    ["🏅","Quiz explorer","Complete 5 quizzes",h.length>=5],
    ["🔥","Consistent learner","Complete 10 quizzes",h.length>=10],
    ["🚀","Learning streak","Complete 15 quizzes",h.length>=15],
    ["🎓","Dedicated student","Complete 20 quizzes",h.length>=20],
    ["🧭","Quiz navigator","Complete 25 quizzes",h.length>=25],
    ["💪","Determined learner","Complete 30 quizzes",h.length>=30],
    ["🏆","Quiz master","Complete 40 quizzes",h.length>=40],
    ["👑","Quiz legend","Complete 50 quizzes",h.length>=50],
    ["🌟","Good result","Score at least 70%",h.some(x=>x.percent>=70)],
    ["🥉","Strong result","Score at least 80%",h.some(x=>x.percent>=80)],
    ["🥈","Excellent result","Score at least 90%",h.some(x=>x.percent>=90)],
    ["🎯","Perfect result","Get 100% in a quiz",perfect>=1],
    ["💯","Perfect pair","Get 100% twice",perfect>=2],
    ["✨","Perfectionist","Get 100% five times",perfect>=5],
    ["📈","Rising average","Reach a 70% quiz average",h.length>=3&&avg>=70],
    ["⭐","High achiever","Reach an 80% quiz average",h.length>=3&&avg>=80],
    ["💎","Top performer","Reach a 90% quiz average",h.length>=5&&avg>=90],
    ["🌠","Outstanding average","Reach a 95% quiz average",h.length>=5&&avg>=95],
    ["📚","Subject starter","Quiz in 1 current-grade subject",uniqueSubjects.size>=1],
    ["🧪","Two-subject learner","Quiz in 2 current-grade subjects",uniqueSubjects.size>=2],
    ["🗂️","Three-subject learner","Quiz in 3 current-grade subjects",uniqueSubjects.size>=3],
    ["🌍","Four-subject learner","Quiz in 4 current-grade subjects",uniqueSubjects.size>=4],
    ["🌈","All-round learner","Quiz in every subject for your grade",uniqueSubjects.size>=subjectsFor(state.profile.grade).length],
    ["☀️","Easy does it","Complete 5 Easy quizzes",easy>=5],
    ["⚡","Challenge accepted","Complete 5 Medium quizzes",medium>=5],
    ["🧠","Hard-work hero","Complete 5 Hard quizzes",hard>=5],
    ["🔀","Flexible thinker","Complete quizzes at all 3 difficulty levels",easy>0&&medium>0&&hard>0],
    ["📝","First assessment","Add your first grade assessment",marks.length>=1],
    ["📋","Assessment planner","Add 5 grade assessments",marks.length>=5],
    ["📊","Assessment pro","Add 10 grade assessments",marks.length>=10],
    ["🏵️","Mark tracker","Add 20 grade assessments",marks.length>=20],
    ["🗓️","Plan ahead","Add your first study schedule session",schedules.length>=1],
    ["📅","Weekly organiser","Add 3 study schedule sessions",schedules.length>=3],
    ["⏰","Routine builder","Add 5 study schedule sessions",schedules.length>=5],
    ["🧩","Study planner","Add 10 study schedule sessions",schedules.length>=10],
    ["🌤️","Week explorer","Schedule study across 3 different days",days>=3],
    ["🌻","Weekly balance","Schedule study across 5 different days",days>=5],
    ["🏁","Long-term learner","Complete 75 quizzes",h.length>=75],
    ["🏰","Ultimate scholar","Complete 100 quizzes",h.length>=100]
  ];
  const unlocked=items.filter(x=>x[3]).length;
  $("achievementGrid").innerHTML=`<div class="achievement-summary"><strong>${unlocked}/41</strong><span>achievements unlocked</span><div class="achievement-summary-track"><div style="width:${unlocked/41*100}%"></div></div></div>`+items.map(x=>`<article class="achievement ${x[3]?"":"locked"}"><div class="medal">${x[0]}</div><h3>${x[1]}</h3><p>${x[2]}</p><small>${x[3]?"Unlocked":"Not yet unlocked"}</small></article>`).join("");
}

function loadProfile(){
  $("profileName").value=state.profile.name||"Student";$("profileGrade").value=state.profile.grade||"Grade 10";
  $("profileStream").value=state.profile.stream||"";toggleStreamField("profileGrade","profileStreamWrap");
  const initial=(state.profile.name||"S").trim().charAt(0).toUpperCase()||"S";
  $("avatar").firstChild?.nodeType===3 ? $("avatar").firstChild.textContent=initial : $("avatar").insertBefore(document.createTextNode(initial),$("avatar").firstChild);
  $("profileAvatar").firstChild?.nodeType===3 ? $("profileAvatar").firstChild.textContent=initial : $("profileAvatar").insertBefore(document.createTextNode(initial),$("profileAvatar").firstChild);
  const photo=state.profile.photo||"";
  [$("avatarPhoto"),$("profilePhoto")].forEach(img=>{img.src=photo;img.classList.toggle("hidden",!photo);});
  $("avatar").classList.toggle("has-photo",!!photo);$("profileAvatar").classList.toggle("has-photo",!!photo);
  $("removeProfilePhoto").disabled=!photo;
}
// Profile photos are resized before saving to keep local storage usage small.
$("profilePhotoInput").addEventListener("change",e=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  if(!file.type.startsWith("image/")){toast("Please choose an image file.");e.target.value="";return;}
  const reader=new FileReader();
  reader.onload=()=>{
    const image=new Image();
    image.onload=()=>{
      const max=512,scale=Math.min(1,max/Math.max(image.width,image.height));
      const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
      canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
      state.profile.photo=canvas.toDataURL("image/jpeg",0.82);
      try{saveState();loadProfile();toast("Profile photo saved on this device.");}
      catch(err){state.profile.photo="";toast("The photo could not be saved. Try a smaller image.");}
      e.target.value="";
    };
    image.onerror=()=>toast("That image could not be opened. Try another photo.");image.src=reader.result;
  };
  reader.onerror=()=>toast("Could not read that photo.");reader.readAsDataURL(file);
});
$("removeProfilePhoto").addEventListener("click",()=>{state.profile.photo="";saveState();loadProfile();toast("Profile photo removed.");});

function enterStudyMode(mode) {
  document.body.classList.remove("reading-mode", "quiz-mode");
  document.body.classList.add(
    mode === "reading" ? "reading-mode" : "quiz-mode"
  );

  const request = document.documentElement.requestFullscreen;

  if (request) {
    try {
      const result = request.call(document.documentElement);
      if (result && result.catch) {
        result.catch(() => {
          document.body.classList.remove("reading-mode", "quiz-mode");
        });
      }
    } catch (e) {
      document.body.classList.remove("reading-mode", "quiz-mode");
    }
  }
}

function exitStudyMode() {
  document.body.classList.remove("reading-mode", "quiz-mode");

  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

$("exitQuizMode").addEventListener("click", exitStudyMode);

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    document.body.classList.remove("reading-mode", "quiz-mode");
  }
});

function toggleStreamField(gradeId,wrapId){
  const needsStream=$(gradeId).value==="Grade 11"||$(gradeId).value==="Grade 12";
  $(wrapId).classList.toggle("hidden",!needsStream);
  const streamId=gradeId==="firstGrade"?"firstStream":"profileStream";
  if(needsStream && !$(streamId).value) $(streamId).value="Social Science";
  if(!needsStream) $(streamId).value="Social Science";
}
function refreshGradeContent(){
  updateSubjects("learn");updateSubjects("quiz");
  if($("calcSubject")) fillSelect($("calcSubject"),subjectsFor(state.profile.grade),$("calcSubject").value);
  const scheduleSelect=$("scheduleSubject");
  if(scheduleSelect){const old=scheduleSelect.value;fillSelect(scheduleSelect,subjectsFor(state.profile.grade),old);}
  renderLesson();updateAvailability();renderDashboard();renderAchievements();
}
function showGradeWelcome(){
  const dialog=$("gradeWelcome");
  if(!state.gradeChosen||((state.profile.grade==="Grade 11"||state.profile.grade==="Grade 12")&&!STREAM_SUBJECTS[state.profile.stream])){
    dialog.classList.remove("hidden");document.body.classList.add("grade-setup-open");
    if(state.gradeChosen) $("firstGrade").value=state.profile.grade;
    $("firstStream").value=state.profile.stream||"Social Science";
    toggleStreamField("firstGrade","firstStreamWrap");
  }
  $("firstGrade").addEventListener("change",()=>toggleStreamField("firstGrade","firstStreamWrap"));
  $("gradeWelcomeForm").addEventListener("submit",e=>{
    e.preventDefault();const grade=$("firstGrade").value;const stream=$("firstStream").value||"Social Science";
    if(!GRADES.includes(grade))return;
    if((grade==="Grade 11"||grade==="Grade 12")&&!STREAM_SUBJECTS[stream]){toast("Please choose Social Science or Natural Science.");return;}
    state.profile.grade=grade;state.profile.stream=(grade==="Grade 11"||grade==="Grade 12")?stream:"";state.gradeChosen=true;saveState();loadProfile();refreshGradeContent();
    dialog.classList.add("hidden");document.body.classList.remove("grade-setup-open");toast("Your grade and stream have been saved.");
  });
}
$("profileGrade").addEventListener("change",()=>{toggleStreamField("profileGrade","profileStreamWrap");});
$("profileForm").addEventListener("submit",e=>{e.preventDefault();const grade=$("profileGrade").value;const stream=$("profileStream").value||"Social Science";if((grade==="Grade 11"||grade==="Grade 12")&&!STREAM_SUBJECTS[stream]){toast("Please choose Social Science or Natural Science.");return;}state.profile={name:$("profileName").value.trim()||"Student",grade,stream:(grade==="Grade 11"||grade==="Grade 12")?stream:""};state.gradeChosen=true;saveState();loadProfile();refreshGradeContent();toast("Profile saved. Your grade, stream and subjects have been updated.");});
function applyTheme(){
  document.body.classList.toggle("dark",!!state.dark);
  $("darkToggle").checked=!!state.dark;$("themeBtn").textContent=state.dark?"☀":"☾";
}
$("themeBtn").addEventListener("click",()=>{state.dark=!state.dark;saveState();applyTheme();});
$("darkToggle").addEventListener("change",e=>{state.dark=e.target.checked;saveState();applyTheme();});
$("soundToggle").addEventListener("change",e=>{state.sound=e.target.checked;saveState();toast("Preference saved.");});
$("exportData").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="edu-smart-my-data.json";a.click();URL.revokeObjectURL(url);
});
$("resetData").addEventListener("click",()=>{if(confirm("This will erase your saved profile, quiz history, schedule and marks from this browser. Continue?")){localStorage.removeItem(STORAGE_KEY);state=structuredClone(defaultState);location.reload();}});
if("serviceWorker" in navigator && location.protocol!=="file:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
}
setupSelectors();loadProfile();refreshGradeContent();applyTheme();renderLesson();renderDashboard();updateAvailability();renderSchedule();renderAssessments();showGradeWelcome();

/* EDU SMART - Gemini AI Assistant */

const aiToggle = document.getElementById("ai-toggle");
const aiClose = document.getElementById("ai-close");
const aiChat = document.getElementById("ai-chat");
const aiForm = document.getElementById("ai-form");
const aiInput = document.getElementById("ai-input");
const aiMessages = document.getElementById("ai-messages");
const aiSend = document.getElementById("ai-send");

if (aiToggle && aiClose && aiChat && aiForm) {

  aiToggle.addEventListener("click", () => {
    aiChat.classList.toggle("hidden");
  });

  aiClose.addEventListener("click", () => {
    aiChat.classList.add("hidden");
  });

function addAIMessage(message, type) {
  const bubble = document.createElement("div");
  bubble.className = "ai-message " + type;

  if (type === "bot") {
    // Temporarily protect complete LaTeX expressions
    const mathExpressions = [];

    const protectedMessage = message.replace(
      /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g,
      (match) => {
        const token = `MATHJAXEXPRESSIONTOKEN${mathExpressions.length}END`;
        mathExpressions.push(match);
        return token;
      }
    );

    // Format ordinary Markdown
    const html = marked.parse(protectedMessage);

    // Sanitize the generated HTML
    bubble.innerHTML = DOMPurify.sanitize(html);

    // Restore mathematical expressions as safe text nodes
    const walker = document.createTreeWalker(
      bubble,
      NodeFilter.SHOW_TEXT
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      const parts = node.nodeValue.split(
        /(MATHJAXEXPRESSIONTOKEN\d+END)/g
      );

      if (parts.length === 1) return;

      const fragment = document.createDocumentFragment();

      parts.forEach((part) => {
        const match = part.match(
          /^MATHJAXEXPRESSIONTOKEN(\d+)END$/
        );

        if (match) {
          fragment.appendChild(
            document.createTextNode(
              mathExpressions[Number(match[1])]
            )
          );
        } else if (part) {
          fragment.appendChild(document.createTextNode(part));
        }
      });

      node.parentNode.replaceChild(fragment, node);
    });

  } else {
    bubble.textContent = message;
  }

  aiMessages.appendChild(bubble);

  // Let MathJax format the restored expressions
  if (type === "bot" && window.MathJax) {
    MathJax.startup.promise
      .then(() => MathJax.typesetPromise([bubble]))
      .catch(error => console.error("MathJax error:", error));
  }

  aiMessages.scrollTop = aiMessages.scrollHeight;
  return bubble;
}
  
  aiForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = aiInput.value.trim();
    if (!question) return;

    addAIMessage(question, "user");
    aiInput.value = "";

    aiSend.disabled = true;
    const loading = addAIMessage("Thinking...", "bot");

    try {
      const response = await fetch(
        "https://edu-smart-app.vercel.app/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
        body: JSON.stringify({
  message: question,
  grade: state.profile.grade || "Not selected",
  stream: state.profile.stream || "Not applicable"
})
        }
      );

      const data = await response.json();
      loading.remove();

      if (!response.ok) {
        throw new Error(data.error || "AI request failed.");
      }

      addAIMessage(data.answer || "No answer received.", "bot");

    } catch (error) {
      loading.remove();
      addAIMessage(
        "Sorry, I couldn't connect to the AI service. Please try again.",
        "bot"
      );
      console.error("EDU SMART AI:", error);

    } finally {
      aiSend.disabled = false;
      aiInput.focus();
    }
  });
}

