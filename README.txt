EDU SMART - COMPUTER SETUP GUIDE
================================

WHAT YOU NEED
- A computer (Windows, Mac or Linux)
- A code editor such as Visual Studio Code
- A modern browser such as Chrome or Edge

PART 1: OPEN THE PROJECT
1. Download and extract EDU_SMART_APPLICATION.zip.
2. Open the extracted EDU_SMART_APPLICATION folder in Visual Studio Code.
3. In the left Explorer panel, you should see:
   index.html
   css/style.css
   js/app.js
   js/questions.js
   manifest.json
   service-worker.js
   README.txt
4. Open index.html and run it using the VS Code Live Server extension.
   If you do not have Live Server, install it from the VS Code Extensions panel.
   Then right-click index.html and choose "Open with Live Server".
5. The app should open in your browser. Most features also work by opening index.html directly,
   but offline installation/service-worker features need localhost or HTTPS.

PART 2: ADD YOUR TEXTBOOK SUBJECTS AND UNITS
1. Open js/app.js.
2. Find the object named CURRICULUM near the top.
3. Each grade has a list of subjects. Each subject has an array of unit names.
4. Replace the sample subjects/units with the exact names from your textbooks.
5. To add a subject, add a new subject key and its unit array inside that grade.
   Example:
   "Grade 9": {
     "Biology": ["Unit 1 - Introduction", "Unit 2 - Cells"],
     "Geography": ["Unit 1 - The Earth", "Unit 2 - Climate"]
   }
6. Keep the spelling of grade names exactly as shown: Grade 9, Grade 10, Grade 11, Grade 12.
7. Save the file and refresh the browser.

PART 3: ADD QUESTIONS
1. Open js/questions.js.
2. Find the QUESTION_BANK array.
3. Copy one complete example question object, including its opening { and closing }.
4. Paste it inside the array. Put a comma between question objects.
5. Change the fields:
   id: a unique question ID
   grade: Grade 9 / Grade 10 / Grade 11 / Grade 12
   subject: must exactly match a subject in CURRICULUM
   unit: must exactly match a unit in CURRICULUM
   difficulty: Easy / Medium / Hard
   question: the question text
   options: exactly four answer choices
   answer: correct option index (0=A, 1=B, 2=C, 3=D)
   explanation: why the answer is correct
6. Save and refresh. The question count will update automatically.

EXAMPLE QUESTION OBJECT
{
  id: "G9-BI-U1-E002",
  grade: "Grade 9",
  subject: "Biology",
  unit: "Unit 1 - Introduction",
  difficulty: "Easy",
  question: "Write your question here.",
  options: ["Option A", "Option B", "Option C", "Option D"],
  answer: 0,
  explanation: "Write why option A is correct."
}

IMPORTANT QUESTION RULES
- Each question ID must be unique.
- Use exactly four options.
- The answer index starts at zero: 0 means first option, 1 second, 2 third, 3 fourth.
- Grade, subject, unit and difficulty must match exactly.
- Add textbook-based questions and check each answer carefully.
- Do not paste thousands of questions into app.js. Keep them in questions.js or split into separate grade files later.

PART 4: ADD STUDY NOTES
1. Open js/app.js and find the renderLesson() function.
2. The lesson page currently shows a general placeholder.
3. Replace the placeholder text in that function with your textbook notes, definitions, formulas and examples.
4. For a large question bank and many notes, a later version can store each grade and subject in separate data files.

PART 5: ADD PICTURES
1. Put image files in the images folder.
2. In index.html, add an image where you want it, for example:
   <img src="images/science.jpg" alt="Science lesson" class="lesson-image">
3. Add styling in css/style.css, for example:
   .lesson-image { width: 100%; max-width: 600px; border-radius: 14px; }
4. Use images you created or have permission to use. Add meaningful alt text.

PART 6: TEST THE APPLICATION
Check all of these:
- Every grade can be selected.
- Subjects change when grade changes.
- Units change when subject changes.
- Easy, Medium and Hard each load only matching questions.
- A student can change difficulty without returning to the dashboard.
- Timer counts down and ends the quiz.
- Answers and explanations appear in the review.
- Quiz history updates.
- Schedule entries can be added and deleted.
- Grade calculator works.
- Profile and dark mode save after refreshing.
- Export data downloads a JSON file.

PART 7: MAKE IT INSTALLABLE / OFFLINE
- Open through Live Server or another local web server, not file://.
- The service worker caches the core app files.
- A service worker generally requires localhost or HTTPS.
- The Google font in the stylesheet needs internet; the app uses fallback fonts if offline.
- This starter version stores information only in the current browser on the current device.

IMPORTANT LIMITATIONS
- The included questions are a few demonstration examples only, not 6,000 questions.
- The curriculum unit names are examples/placeholders. Replace them using your own textbooks.
- Do not collect passwords, home addresses, phone numbers or other unnecessary personal information.
- The grade calculator computes a weighted average from the marks and weights you enter. Ensure the weights reflect your teacher's grading system.

SUGGESTED BUILD ORDER
Day 1: Replace curriculum units, test grade/subject/unit selection, customise app title/logo/colours.
Day 2: Add textbook questions and study notes, test all difficulty levels and timer.
Day 3: Add pictures, test every page, fix errors, prepare your club demonstration.

If something does not work:
- Check spelling of grade, subject, unit and difficulty.
- Check commas and quotation marks in questions.js.
- Open browser developer tools (F12) and check the Console for red error messages.
- Save files and refresh the browser.


PART 8: INSTALL EDU SMART ON ANDROID AND COMPUTER

IMPORTANT: Installation and offline support require HTTPS or localhost.
Double-clicking index.html (file://) will not enable installation.

TEST ON YOUR COMPUTER
1. Install Visual Studio Code and open the extracted EDU_SMART_APPLICATION folder.
2. Install the Live Server extension.
3. Right-click index.html and choose "Open with Live Server".
4. This localhost address is for computer testing; it is not a public website.

INSTALL ON BOTH DEVICES
1. Publish the complete EDU_SMART_APPLICATION folder to an HTTPS static host.
   Keep index.html, css, js, icons, manifest.json and service-worker.js together.
2. On Android, open the HTTPS website in Chrome. Open the three-dot menu and
   choose "Install app" or "Add to Home screen", then confirm.
3. On a computer, open the same HTTPS address in Chrome or Edge. Use the
   install icon in the address bar, or the browser menu > Install EDU SMART.
4. Open the app once while online. The service worker then caches core files
   and icons for supported offline use.

Both devices use the same project; no separate Android/computer codebase is needed.
The profile, schedule and quiz history are stored separately on each device/browser
and do not automatically synchronize.

This is an installable PWA, not yet a Play Store APK or native Windows installer.
Browser support and install-menu wording may vary.

PROFILE PHOTO AND STUDY FOCUS MODE
- Students can choose a profile photo from their device in My Profile.
- Photos are resized to a maximum 512-pixel edge and saved locally in this browser.
- The photo appears in the profile card and the top navigation avatar.
- Students can replace or remove the photo at any time.
- Use "Start reading fullscreen" on a study note to enter focused reading mode.
- Starting a quiz opens focused quiz mode. Use "Exit fullscreen" to return.
- Browsers that support the Fullscreen API use native fullscreen. If it is unavailable or blocked, the app still hides navigation and uses a distraction-free full-page layout.

RESTORED FEATURES (latest update)
- 41 achievement milestones unlock automatically from quiz results, assessment entries and study schedule activity.
- Dashboard subject-progress bar tracks how many subjects in the student's current grade/stream have at least one completed quiz.
- Grade calculator records marks by subject and assessment type, supports marks obtained/out of and a relative subject weight, calculates weighted averages per subject, and calculates an equal-weight overall average across subjects with marks.
- Older assessment entries without a subject are retained under "Unassigned older marks" and excluded from the new subject averages until re-entered with a subject.
