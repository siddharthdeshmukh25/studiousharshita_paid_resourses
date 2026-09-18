/**
 * Free study guides.
 *
 * Owned, original educational content is what earns E-E-A-T (experience,
 * expertise, authoritativeness, trust) with search engines and gives AI answer
 * engines something concrete to cite. Content lives here so the hub page, the
 * article pages, the sitemap and llms.txt all stay in sync.
 */

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  /** Meta title, written for search results. */
  metaTitle: string;
  /** Meta description / social description. */
  description: string;
  excerpt: string;
  category: string;
  keywords: string[];
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  sections: GuideSection[];
};

export const GUIDES: Guide[] = [
  {
    slug: 'how-to-build-a-study-plan-that-actually-works',
    title: 'How to Build a Study Plan That Actually Works',
    metaTitle: 'How to Build a Study Plan That Actually Works (2026 Guide)',
    description:
      'A practical, week-by-week method for building a study plan that survives real school and college life: time-blocking, spaced repetition, weekly reviews and honest buffers.',
    excerpt:
      'Most study timetables collapse within a week because they are built for a perfect day, not a real one. Here is a planning method that holds up.',
    category: 'Study Habits',
    keywords: [
      'how to make a study plan',
      'study timetable for students',
      'spaced repetition schedule',
      'weekly study plan India',
      'exam preparation planning',
    ],
    publishedAt: '2026-07-28',
    updatedAt: '2026-09-17',
    readingMinutes: 8,
    sections: [
      {
        heading: 'Why most study timetables fail in the first week',
        paragraphs: [
          'A timetable written on Sunday evening usually assumes three things that will not be true: that you will have the same energy every day, that nothing unexpected will happen, and that you can study one subject for two unbroken hours. When any of those assumptions break, the whole plan feels unusable and gets abandoned.',
          'A study plan that works is not a stricter timetable. It is a system for deciding what to study next, with enough slack that a bad day costs you one session instead of the entire schedule.',
        ],
      },
      {
        heading: 'Start with your syllabus, not your calendar',
        paragraphs: [
          'Before you allocate a single hour, list what actually has to be learned. Take each subject and write down its units or chapters, then mark every one as Red, Amber or Green.',
        ],
        bullets: [
          'Red: you cannot explain this topic to someone else, and it has appeared in previous question papers.',
          'Amber: you understand it in class but lose marks under time pressure.',
          'Green: you can solve problems or answer questions correctly without notes.',
        ],
      },
      {
        heading: 'Give every week one job',
        paragraphs: [
          'Instead of spreading six subjects across seven days, give each week a primary job: two Red topics fully learned, one Amber topic converted to Green, and one revision pass over last week\'s material. Covering fewer topics properly beats touching everything shallowly, and it gives you a measurable finish line every seven days.',
          'Write that one-line job at the top of the week. If by Friday the job is done, the week was a success regardless of how many hours you clocked.',
        ],
      },
      {
        heading: 'Time-block in 45-minute sessions',
        paragraphs: [
          'Study in focused blocks of 45 minutes with a 10-minute break, and schedule a real 30-minute rest after three blocks. Deep work on maths, physics or accounting problems belongs in your first block of the day, when concentration is cheapest to buy.',
          'Low-energy slots are for mechanical work: rewriting formula sheets, making flashcards, sorting notes into a revision folder. Read-only revision also fits here, because it does not need the same intensity as problem solving.',
        ],
        bullets: [
          'Block 1 (sharpest focus): hardest subject, problem solving, no phone in the room.',
          'Block 2: the second-hardest subject, followed by a recall test of what you just learned.',
          'Block 3: homework and assignments that have deadlines.',
          'Block 4: flashcards, formula sheets and revision of older chapters.',
        ],
      },
      {
        heading: 'Build spaced repetition into the plan',
        paragraphs: [
          'Spaced repetition simply means reviewing material at increasing gaps: the same day, then after two days, then after a week, then after a month. Most students revise once before an exam and wonder why nothing sticks. Plan the first three reviews in your calendar the moment you finish a chapter, while it is still fresh.',
          'A simple tracker works: a page with chapter names down the left and review dates across the top. Tick a box after each review. The ticks tell you honestly which chapters are actually retained.',
        ],
      },
      {
        heading: 'Protect two buffers every week',
        paragraphs: [
          'Keep one buffer evening for whatever slipped and one buffer slot that is genuinely free. A plan with no slack breaks the first time a test is rescheduled or a friend needs help, and once broken, plans rarely restart.',
        ],
      },
      {
        heading: 'Review and score your week',
        paragraphs: [
          'On the same evening each week, spend ten minutes answering three questions: what did I actually finish, what did I avoid, and what will next week\'s one-line job be? The pattern of what you avoid is the most useful data you will ever collect about your own studying.',
          'Students who want the structure pre-built can use the planners and revision material in our study resource library, then adapt the template to their own subjects.',
        ],
      },
    ],
  },
  {
    slug: 'note-taking-methods-for-faster-revision',
    title: 'Note-Taking Methods That Make Revision Faster',
    metaTitle: 'Best Note-Taking Methods for Faster Revision | Studious Harshita',
    description:
      'Cornell notes, mind maps, the Feynman technique and question-based note formats explained, with guidance on which method fits which subject and how to revise from each.',
    excerpt:
      'Notes are not a transcript of class. They are a revision tool, and the format you choose decides how fast revision goes.',
    category: 'Note Taking',
    keywords: [
      'best note taking methods',
      'Cornell notes method',
      'mind map notes',
      'Feynman technique studying',
      'how to take study notes',
    ],
    publishedAt: '2026-08-05',
    updatedAt: '2026-09-17',
    readingMinutes: 7,
    sections: [
      {
        heading: 'Notes are a revision tool, not a transcript',
        paragraphs: [
          'Copying a lecture word for word feels productive but produces something you can only read, never use. Good notes are built to be tested. That means they contain cues and questions, not just statements, and they are short enough that re-reading one chapter takes minutes rather than an hour.',
          'Whatever method you choose, keep two rule of thumb: capture ideas in your own words, and leave space on the page for questions you will answer later.',
        ],
      },
      {
        heading: 'Cornell notes: the best default for school and college',
        paragraphs: [
          'Divide the page into three zones. The narrow left column holds keywords and questions. The wide right column holds the explanation. The bottom strip holds a two-line summary written after class.',
          'During revision, cover the right column and answer only from the cues in the left column. You get an instant self-test on every page with zero extra preparation, which is why Cornell notes are the strongest all-round format for theory subjects.',
        ],
      },
      {
        heading: 'Mind maps: for relationships and whole chapters',
        paragraphs: [
          'Use mind maps when a topic is a network rather than a list: the causes of a historical event, organ systems, or the internal links between chapters in a commerce subject. One A4 sheet per chapter forces you to compress and shows what is missing at a glance.',
          'Mind maps are excellent for the last week before an exam and weak as a first-pass learning method, because the compression happens only after you already understand the detail.',
        ],
      },
      {
        heading: 'The Feynman technique: for topics that refuse to stick',
        paragraphs: [
          'Write the topic name at the top of a blank page and explain it in plain language as if teaching a ten-year-old. When you get stuck, you have found the exact gap in your understanding. Go back to the source, then rewrite that section.',
          'Two rounds of this will do more for a stubborn topic than an hour of re-reading, because it forces production instead of recognition.',
        ],
      },
      {
        heading: 'Question-based notes for numerical subjects',
        paragraphs: [
          'Maths, physics, chemistry and accounting are learned by solving, so your notes should be a problem set rather than a summary. For each worked example, write the question, the method in two or three lines, then a deliberately varied practice problem.',
          'Keep a separate error log listing every mistake and its cause: sign error, wrong formula, misread question, forgotten unit. Before a test, revise the error log instead of the whole chapter.',
        ],
      },
      {
        heading: 'Making notes that are worth revising from',
        paragraphs: [
          'A few habits separate notes that help from notes that sit unread:',
        ],
        bullets: [
          'Write the date and chapter number on every page and number the pages, so nothing goes missing.',
          'Use one colour for definitions, one for formulas and one for examples. Colour carries meaning only if it is consistent.',
          'Digitise or reorganise notes within 48 hours of the class. The reorganisation is itself the revision.',
          'Keep a one-page running summary per subject of everything learned so far.',
        ],
      },
      {
        heading: 'When ready-made notes help',
        paragraphs: [
          'Handwritten notes you produce yourself are still the strongest for recall. Ready-made digital notes are most useful as a structure, a checklist of what your syllabus expects, and a revision sheet when time is short. Our subject-wise digital study notes combine both: a clean structure you can annotate with your own cues and questions.',
        ],
      },
    ],
  },
  {
    slug: 'how-to-revise-before-board-exams',
    title: 'How to Revise Effectively Before Board Exams',
    metaTitle: 'How to Revise Before Board Exams: A Week-by-Week Plan',
    description:
      'A revision plan for Class 10 and Class 12 board exams: what to cover eight weeks out, how to use mock tests, and what to do in the final seven days.',
    excerpt:
      'Revision is a skill with a schedule. Here is what to do eight weeks, four weeks and seven days before a board exam.',
    category: 'Exam Preparation',
    keywords: [
      'how to revise for board exams',
      'class 10 revision plan',
      'class 12 board exam preparation',
      'mock test strategy',
      'last week revision tips',
    ],
    publishedAt: '2026-08-18',
    updatedAt: '2026-09-17',
    readingMinutes: 9,
    sections: [
      {
        heading: 'Revision is not re-reading',
        paragraphs: [
          'Re-reading the same textbook feels safe because it is easy. But recognising a paragraph is not the same as being able to produce an answer under exam conditions. Effective revision always has output: you write, solve, explain or answer, and then you check against the mark scheme.',
          'Every revision session should end with something written down that you can evaluate. If you cannot point to what you produced, that session was reading, not revision.',
        ],
      },
      {
        heading: 'Eight weeks out: map the syllabus against past papers',
        paragraphs: [
          'Download the last five years of question papers and the official syllabus. For each chapter, note how often it appears and how many marks it usually carries. Ranking chapters by marks per hour of study will tell you exactly where to spend your time.',
        ],
        bullets: [
          'High frequency and high marks: revise first, and revise more than once.',
          'High frequency and low marks: handle with short, efficient revision sheets.',
          'Low frequency and high marks: prepare the core questions only.',
          'Low frequency and low marks: read once, then leave.',
        ],
      },
      {
        heading: 'Four weeks out: switch to questions, not chapters',
        paragraphs: [
          'Stop planning revision chapter by chapter and start planning by question type. Aim to finish a full past paper every week under timed conditions, following the real exam clock and the real paper pattern.',
          'Mark your own paper honestly against the marking scheme. Score your answers twice: once for content and once for presentation, because in board exams neatly structured answers with the required keywords earn marks that raw knowledge alone does not.',
        ],
      },
      {
        heading: 'Two weeks out: fix the leaky topics',
        paragraphs: [
          'By now your error log should be long enough to show patterns. Make a list of every question you could not finish or got wrong, group them by cause, and clear the list one group at a time.',
          'Keep writing full answers. Reading a solved problem and reproducing it on paper are different skills, and the difference only shows up when the answer must be produced in seventeen minutes.',
        ],
      },
      {
        heading: 'The final seven days',
        paragraphs: [
          'The last week is for consolidation, not for new chapters. Trying to learn a difficult new topic in the final days usually costs marks in topics you already knew.',
        ],
        bullets: [
          'Revise one-page summaries and formula sheets, one subject per day, in exam order.',
          'Re-solve the questions you got wrong, not the ones you already find easy.',
          'Sleep seven to eight hours. Memory consolidation happens during sleep, and a tired brain loses marks in exactly the places you cannot afford.',
          'Visit the exam centre route in advance so the morning itself is routine.',
          'Keep the last day before each paper light: summary sheets, formula revision and an early night.',
        ],
      },
      {
        heading: 'Managing exam-day nerves',
        paragraphs: [
          'Start with the reading time, mark the questions you will attempt, and begin with the question you know best. That first confident answer settles the nerves and buys time for the harder ones later.',
          'If a question blocks you, write down what you do know and move on. Partial attempts with correct method often earn partial credit, and blank space never does.',
        ],
      },
      {
        heading: 'Use ready-made revision material to save time',
        paragraphs: [
          'Building revision sheets from scratch takes weeks. Our premium study notes and revision material are designed as ready-made one-page summaries per chapter, so your remaining time goes into solving papers instead of copying definitions.',
        ],
      },
    ],
  },
  {
    slug: 'digital-study-notes-vs-coaching',
    title: 'Digital Study Notes vs. Traditional Coaching: What Should You Pay For?',
    metaTitle: 'Digital Study Notes vs Coaching Classes: Which Is Worth It?',
    description:
      'A practical comparison of digital study notes, coaching classes and free YouTube content: cost, accountability, syllabus coverage and how to choose the right mix for your goals.',
    excerpt:
      'Coaching, digital notes and free videos solve different problems. Most students are better off paying for the one that fills their actual gap.',
    category: 'Study Resources',
    keywords: [
      'digital study notes vs coaching',
      'are paid study notes worth it',
      'online study material India',
      'best study resources for students',
      'study material Ahmedabad',
    ],
    publishedAt: '2026-09-02',
    updatedAt: '2026-09-17',
    readingMinutes: 7,
    sections: [
      {
        heading: 'Three options, three different jobs',
        paragraphs: [
          'Coaching classes sell structure and accountability: a fixed timetable, a teacher checking your work and a peer group moving at the same pace. Free video content sells explanation, usually chapter by chapter, with no schedule attached. Digital study notes sell compression: the syllabus, summarised and organised for revision.',
          'None of these replaces the other. The question is which one fills the specific gap in your preparation right now.',
        ],
      },
      {
        heading: 'What coaching is genuinely good at',
        paragraphs: [
          'If you cannot make yourself study without external pressure, or you need someone to explain a difficult concept live, coaching earns its fee. Doubt clearing and forced consistency are hard to replicate alone.',
          'The weakness is that coaching cannot personalise revision. A classroom moves at the pace of the average student, so students ahead of the room waste time and students behind it fall further behind.',
        ],
      },
      {
        heading: 'What free content is genuinely good at',
        paragraphs: [
          'Free videos are excellent for building the first understanding of a topic, and for second explanations when the classroom one did not land. Used with a specific question in mind, they are fast and effective.',
          'The failure mode is passive watching. An hour of video can feel like study while producing nothing you can be tested on. Without notes and problems appended to it, video watching alone rarely converts into marks.',
        ],
      },
      {
        heading: 'What good digital notes give you',
        paragraphs: [
          'Well-made notes remove the blank-page problem. You get a syllabus mapped chapter by chapter, the definitions and formulas in one place, and a revision sheet you can run through in minutes the night before a test.',
          'They also make progress visible. When every chapter has a page and a checklist, you can see exactly what remains instead of guessing. For students balancing school, tuition and other commitments, that compressed format is the difference between revising everything and revising only what you have time for.',
        ],
        bullets: [
          'Choose notes over coaching when your concepts are fine but your revision is disorganised.',
          'Choose notes alongside coaching when you want faster revision using the same syllabus your class follows.',
          'Choose coaching when you need live teaching and someone to hold you accountable.',
        ],
      },
      {
        heading: 'How to judge any paid study material',
        paragraphs: [
          'Before paying for anything, check five things:',
        ],
        bullets: [
          'Syllabus match: does it name the board, class or exam it covers, and is it current for this academic year?',
          'Depth: does it include worked examples and practice questions, or only summaries?',
          'Format: can you open it on the device you actually study on, and is printing allowed for personal use?',
          'Refund and support terms: how quickly does the seller respond, and what happens if a file is damaged?',
          'Reviews: look for reviews that mention the subject and class, not just praise for fast delivery.',
        ],
      },
      {
        heading: 'Building a mix that fits your budget',
        paragraphs: [
          'A workable approach for most students in Ahmedabad and across India: free videos for first understanding, coaching or self-study for practice and doubt clearing, and a compact set of paid notes for revision. That way money goes to the part of the process that is hardest to do yourself.',
          'Browse our free resources first to test whether our note style matches how you study, then upgrade to a paid set when you need the deeper coverage.',
        ],
      },
    ],
  },
  {
    slug: 'study-habits-for-college-students',
    title: 'Study Habits for College Students in India',
    metaTitle: 'Study Habits for College Students in India | Studious Harshita',
    description:
      'How to keep up with internal assessments, assignments and semester exams at once: attendance strategy, two-week internal prep, assignment batching and exam-week routines.',
    excerpt:
      'College rewards consistency far more than last-night effort. These habits keep internals, assignments and semester exams from colliding.',
    category: 'Study Habits',
    keywords: [
      'study habits for college students',
      'how to prepare for internals',
      'semester exam preparation India',
      'college time management',
      'study tips for degree students',
    ],
    publishedAt: '2026-09-10',
    updatedAt: '2026-09-17',
    readingMinutes: 8,
    sections: [
      {
        heading: 'College marks come from many small things',
        paragraphs: [
          'Unlike school, a semester grade is usually assembled from internal tests, assignments, practicals, presentations and attendance, with the final exam carrying only part of the weight. Students who treat college like school, studying only before the semester exam, hand away marks that were easy to collect.',
          'The fix is not more hours. It is keeping a live view of everything that is graded, so nothing arrives as a surprise.',
        ],
      },
      {
        heading: 'Keep one tracker for every graded item',
        paragraphs: [
          'Maintain a single list, digital or on paper, with four columns: subject, task, due date, weight. Update it weekly. Ten minutes on a Sunday prevents the classic panic of discovering a submission deadline two days before it closes.',
        ],
      },
      {
        heading: 'Prepare for internals in two weeks, not two nights',
        paragraphs: [
          'Internal exams usually cover one or two units. Two weeks out, split the unit into daily chunks and finish one chunk each day, doing a short recall test at the end. A recall test is anything where you write the answer without looking: a question from the textbook, a past paper, or a friend quizzing you.',
          'Revisit each chunk twice after learning it, roughly two days then seven days later. Two focused passes build more durable memory than five hours in one night.',
        ],
      },
      {
        heading: 'Batch assignments, do not trickle them',
        paragraphs: [
          'Assignments involving writing follow a predictable sequence: collect sources, outline, write, check formatting. Give each stage a separate slot rather than attempting everything in one sitting. Two 60-minute slots produce better work than an exhausting four-hour block.',
        ],
        bullets: [
          'Keep a template file for reports so formatting is never a fresh task.',
          'Do the easiest assignment first when motivation is low; momentum is worth more than optimal ordering.',
          'Finish written work a day before the deadline to absorb the inevitable printing or upload problem.',
        ],
      },
      {
        heading: 'Protect attentiveness in lectures',
        paragraphs: [
          'Attendance is often graded, so make the hours count. Sit where you can see the board, take cues-and-explanation notes rather than a transcript, and write your two-line summary at the end of the lecture while the mental picture is still clear.',
          'In a dull lecture, use the time to convert earlier notes into questions. You are present anyway; converting the hour into revision is a free win.',
        ],
      },
      {
        heading: 'Semester exam month: one subject per day, in exam order',
        paragraphs: [
          'During the study leave before semester exams, rotate subjects in the same order they will be examined. That way the subject you sit for first gets the freshest attention, and the last one gets a pass closer to its exam date.',
          'Keep problem solving and formula revision in the first half of each day and use the evening for summaries and flashcards. Sleep is part of the plan, not a reward for finishing it.',
        ],
      },
      {
        heading: 'Consistency beats intensity',
        paragraphs: [
          'The dependable college routine is small: two focused hours on weekdays, one longer session on the weekend, one weekly review, and a tracker that is always current. Students who run that routine for a full semester finish exam month far calmer than those who depended on last-minute effort.',
          'Our study planners and subject notes are built to plug straight into that routine: a weekly page for the tracker, and compact chapter summaries for revision.',
        ],
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
