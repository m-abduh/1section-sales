import type { LearningLevel } from "@prisma/client";

export const niches = [
  {
    slug: "career",
    name: "Career",
    tagline: "Make sense of the uncertainty shaping your working life.",
    description:
      "Focused explanations for adults facing job insecurity, stalled growth, burnout, difficult workplace dynamics, or a job search that is not moving. Each guide examines one situation and the factors that may shape it, without promising career outcomes.",
    audience:
      "Adults navigating a job search, workplace pressure, a career change, or uncertainty about what comes next.",
    problems: [
      "Applying for months without hearing back",
      "Resumes getting filtered out by software",
      "Fear that AI will replace your job",
      "Anxiety about getting laid off",
      "Burnout from a growing workload",
      "Salary stuck for years",
    ],
    accentColor: "#F59E0B",
    sortOrder: 1,
  },
  {
    slug: "finance",
    name: "Finance",
    tagline: "Understand the pressures behind everyday money problems.",
    description:
      "Focused explanations of situations like money running out before payday, debt payments piling up, rising costs outpacing raises, or not knowing where your income goes. Each guide explores the context and trade-offs behind one money problem; it is educational, not personalized financial advice.",
    audience:
      "Adults dealing with day-to-day money pressure who want to understand their options before deciding what to do.",
    problems: [
      "Money running out before the next paycheck",
      "Raises that never catch up to rising prices",
      "No emergency fund while layoffs loom",
      "Buy-now-pay-later payments piling up",
      "Paying only the minimum on credit cards",
      "Pay off debt first or save first?",
    ],
    accentColor: "#10B981",
    sortOrder: 2,
  },
  {
    slug: "learning",
    name: "Learning",
    tagline: "Understand why learning feels stuck.",
    description:
      "Clear explanations for adult learners who feel overwhelmed by a large subject, keep re-reading without retaining much, or are unsure whether they understand what they studied. Guides explore how learning can break down and ways to examine it more deliberately.",
    audience:
      "Adults learning independently while balancing study with work, family, or other responsibilities.",
    problems: [
      "A course feels too big to know where to begin.",
      "Re-reading notes takes hours, but little of it sticks.",
      "You recognize the material but struggle to explain it without your notes.",
      "You have limited study time after work and do not know what to prioritize.",
      "Practice questions expose gaps, but it is unclear what to review next.",
      "Too many courses and resources make it hard to choose a learning path.",
    ],
    accentColor: "#3B82F6",
    sortOrder: 3,
  },
  {
    slug: "health",
    name: "Health",
    tagline: "Make sense of why everyday health routines are hard to sustain.",
    description:
      "Evidence-aware explanations for adults whose plans for sleep, movement, or meals keep falling apart when work, stress, or family life gets busy. Guides examine the circumstances around a routine without offering diagnosis or individualized medical advice.",
    audience:
      "Adults trying to understand everyday health habits in the context of busy or changing lives.",
    problems: [
      "A new routine disappears as soon as the workweek gets busy.",
      "Conflicting health advice makes it hard to know what applies to you.",
      "One missed day turns into abandoning the whole plan.",
      "You are too tired after work to follow the routine you planned.",
      "Sleep timing shifts whenever your schedule changes.",
      "Meal plans feel difficult to maintain with limited time or budget.",
    ],
    accentColor: "#EF4444",
    sortOrder: 4,
  },
  {
    slug: "psychology",
    name: "Psychology",
    tagline: "Understand the patterns shaping how you feel and respond.",
    description:
      "Evidence-aware explanations for adults navigating burnout, overthinking, loneliness, anxiety, procrastination, or self-doubt. Guides explore possible contributing factors and perspectives; they do not diagnose or replace mental-health care.",
    audience:
      "Adults trying to make sense of recurring emotional or behavioral patterns in everyday life.",
    problems: [
      "Burned out but unable to stop",
      "Overthinking at bedtime",
      "Procrastinating because you're overwhelmed",
      "Feeling lonely while surrounded by people",
      "Perfectionism that paralyzes you",
      "Feeling guilty when you rest",
    ],
    accentColor: "#EC4899",
    sortOrder: 5,
  },
  {
    slug: "technology",
    name: "Technology",
    tagline: "Understand the digital risks woven into everyday life.",
    description:
      "Plain-language explanations for situations like scam messages, account takeovers, privacy worries, AI-generated media, and habits that make it hard to put a phone down. Guides focus on how these problems work and what to consider, without recommending specific apps or tools.",
    audience:
      "Adults who use digital services every day and want to understand the risks without needing technical expertise.",
    problems: [
      "Scam calls and texts posing as your bank or a delivery company",
      "AI cloning a family member's voice to ask for money",
      "Social media account getting hacked",
      "Can't tell real photos and videos from AI-generated ones",
      "Personal data leaked and not knowing what to do",
      "Compulsive scrolling you can't stop",
    ],
    accentColor: "#8B5CF6",
    sortOrder: 6,
  },
  {
    slug: "parenting",
    name: "Parenting",
    tagline: "Understand the friction behind difficult family routines.",
    description:
      "Evidence-aware explanations for parents dealing with recurring friction around mornings, homework, screen time, boundaries, or bedtime. Guides explore the situation and family context without diagnosing children or promising a one-size-fits-all fix.",
    audience:
      "Adult parents trying to understand recurring challenges in everyday family life.",
    problems: [
      "Mornings turn into the same argument before everyone leaves home.",
      "Homework becomes a nightly conflict, even when you want to help.",
      "Bedtime keeps stretching later despite repeated reminders.",
      "Screen-time limits turn into arguments whenever it is time to stop.",
      "Getting out the door is hard because transitions keep getting resisted.",
      "You and your co-parent disagree about how to respond to the same behavior.",
    ],
    accentColor: "#F97316",
    sortOrder: 7,
  },
  {
    slug: "relationship",
    name: "Relationship",
    tagline: "Understand the patterns behind difficult relationships.",
    description:
      "Thoughtful explanations of situations like recurring arguments, emotional distance, fading friendships, jealousy, or uncertainty about where a relationship stands. Guides explore communication and boundaries without presenting themselves as therapy or minimizing unsafe situations.",
    audience:
      "Adults navigating tension, distance, uncertainty, or changing boundaries in close relationships.",
    problems: [
      "A partner who's busy and feels distant",
      "Fighting about the same thing again and again",
      "Struggling to express your feelings",
      "Struggling to trust after being cheated on",
      "Feeling lonely inside a relationship",
      "Struggling to set boundaries",
    ],
    accentColor: "#F43F5E",
    sortOrder: 8,
  },
  {
    slug: "business",
    name: "Business",
    tagline: "Make sense of the problems that keep a small business stuck.",
    description:
      "Focused explanations for adults trying to find first customers, set prices, manage cash, stand out from competitors, or understand why steady effort is not turning into sales. Guides examine one business situation without promising revenue or success.",
    audience:
      "Aspiring founders, solo operators, and small business owners facing practical uncertainty in their work.",
    problems: [
      "Having a business idea but being afraid to start",
      "Not knowing how to price what you sell",
      "Struggling to land your first customer",
      "Posting regularly but online sales stay quiet",
      "Running out of cash before breaking even",
      "Not knowing if you're profitable or just busy",
    ],
    accentColor: "#6366F1",
    sortOrder: 9,
  },
  {
    slug: "investing",
    name: "Investing",
    tagline: "Understand the uncertainty behind investing decisions.",
    description:
      "Plain-language education for adults unsure when to start, worried about market swings, comparing themselves with other investors, or trying to understand risk, fees, and different kinds of investments. Guides do not recommend assets or promise returns.",
    audience:
      "Adults who are new to investing or uncertain about risk and want to understand general concepts before making their own decisions.",
    problems: [
      "Scared to buy because prices are high, scared to sell because they're falling",
      "Panic selling when your portfolio turns red",
      "Following influencer picks without understanding the risk",
      "Falling for scams that promise unrealistic returns",
      "Mixing up savings accounts, CDs, index funds, and stocks",
      "Missing hidden costs like fees, spreads, and taxes",
    ],
    accentColor: "#0EA5E9",
    sortOrder: 10,
  },
];

type SeedProduct = {
  nicheSlug: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  audience: string;
  notFor: string;
  outcome: string;
  learnings: string[];
  limitations: string;
  license: string;
  level: LearningLevel;
  priceAmount: number;
  compareAtAmount: number | null;
  features: string[];
  sortOrder: number;
};

export const products: SeedProduct[] = [
  {
    nicheSlug: "finance",
    slug: "budgeting-with-irregular-income",
    name: "Budgeting With Irregular Income",
    summary:
      "A practical method to plan and review money when income changes month to month.",
    description:
      "This guide walks you through building a budget that survives variable pay: understanding your real baseline, planning for low months, and running a short monthly review. It includes worked examples and a review routine you can reuse.",
    audience:
      "Freelancers, gig workers, and anyone whose monthly income is not fixed.",
    notFor:
      "People looking for investment or tax advice, or personalized financial recommendations.",
    outcome:
      "Leave with a working budgeting method you can review each month.",
    learnings: [
      "How to find your true minimum monthly baseline.",
      "How to plan spending across high and low months.",
      "A repeatable monthly review routine.",
    ],
    limitations:
      "Educational material only. It does not provide personalized financial advice.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 1000,
    compareAtAmount: 3000,
    features: [
      "The full budgeting method explained step by step",
      "Worked example with irregular monthly income",
      "A one-page monthly review checklist",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "business",
    slug: "customer-discovery-sprint",
    name: "Customer Discovery Sprint",
    summary:
      "A short, focused process to test whether customers actually need your idea.",
    description:
      "Before investing heavily, run a focused discovery sprint: choose who to talk to, ask non-leading questions, and interpret what you hear. This guide includes scripts, a note-taking structure, and a decision checkpoint.",
    audience: "First-time founders and solo builders with an early idea.",
    notFor: "Teams looking for a full go-to-market or fundraising plan.",
    outcome: "Evidence-based decision on whether to continue, pivot, or stop.",
    learnings: [
      "How to recruit the right people to interview.",
      "How to ask questions that reveal real behavior.",
      "How to read the signals and make a decision.",
    ],
    limitations:
      "A small sample can mislead. Interpret findings with source and sample size in mind.",
    license: "Personal and internal business use. Do not resell.",
    level: "PRACTICAL",
    priceAmount: 1000,
    compareAtAmount: 3000,
    features: [
      "Interview scripts and question bank",
      "Note-taking and synthesis structure",
      "A clear go / pivot / stop decision checkpoint",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "psychology",
    slug: "habit-rebuild-kit",
    name: "Habit Rebuild Kit",
    summary:
      "Understand why habits break, then test a routine that fits your real life.",
    description:
      "This guide explains common habit mechanisms, helps you diagnose the pattern behind repeated abandonment, and guides you through testing a smaller, more realistic routine.",
    audience: "People who repeatedly abandon a personal habit.",
    notFor:
      "Anyone seeking clinical, diagnostic, or therapeutic support.",
    outcome: "A smaller habit routine and a plan to test it for two weeks.",
    learnings: [
      "Common mechanisms behind habit breakdown.",
      "How to shrink a habit to something you can repeat.",
      "How to review and adjust without self-blame.",
    ],
    limitations:
      "Educational content only. It is not a substitute for professional mental-health care.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 1000,
    compareAtAmount: 3000,
    features: [
      "Habit breakdown diagnosis",
      "A two-week testing plan",
      "Review prompts that avoid self-blame",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "career",
    slug: "skill-plan-for-target-role",
    name: "Skill Plan For a Target Role",
    summary:
      "Compare the skills a role requires and build a learning plan you can start now.",
    description:
      "A practical way to break a target role into required skills, spot your most important gaps, and sequence a learning plan that fits limited time.",
    audience: "Early-career professionals and career switchers.",
    notFor: "People seeking guaranteed job placement or interview coaching.",
    outcome: "A prioritized skill development plan for a specific role.",
    learnings: [
      "How to break a role into concrete skills.",
      "How to find and rank your gaps.",
      "How to sequence a plan with limited time.",
    ],
    limitations:
      "Outcomes depend on your effort, market, and circumstances. No result is guaranteed.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 1000,
    compareAtAmount: 3000,
    features: [
      "Role-to-skills breakdown template",
      "Gap ranking worksheet",
      "A 30-day start plan",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "learning",
    slug: "learn-a-hard-subject-alone",
    name: "Learn a Hard Subject Alone",
    summary:
      "Break a difficult subject into steps you can study, practise, and verify.",
    description:
      "This guide shows how to turn a hard subject into a workable plan: define what understanding means for it, split it into smaller ideas, practise retrieval instead of re-reading, and check what you actually know before moving on.",
    audience:
      "Self-directed learners and students tackling a difficult subject without a teacher.",
    notFor: "People looking for subject-specific tutoring or exam guarantees.",
    outcome:
      "A study plan with practice checkpoints and a way to verify understanding.",
    learnings: [
      "How to define what understanding means for your subject.",
      "How to break it into sequenced, testable pieces.",
      "How to practise and verify recall instead of re-reading.",
    ],
    limitations:
      "Learning outcomes depend on consistent practice. No grade or result is guaranteed.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 1000,
    compareAtAmount: 3000,
    features: [
      "Subject breakdown worksheet",
      "Retrieval practice schedule",
      "Self-check question templates",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "health",
    slug: "routine-that-survives-a-busy-week",
    name: "Build a Routine That Survives a Busy Week",
    summary:
      "Design sleep, movement, and food routines that hold up when life gets busy.",
    description:
      "This guide walks through designing a baseline routine you can keep on a normal week: choosing one anchor habit at a time, setting a minimum version for hard days, and reviewing progress without slipping into an all-or-nothing cycle.",
    audience:
      "Adults who start health routines and drop them once work or family gets busy.",
    notFor:
      "Anyone seeking medical advice, diagnosis, or treatment for a health condition.",
    outcome:
      "A realistic weekly routine with a minimum version for difficult days.",
    learnings: [
      "How to pick one anchor habit instead of overhauling everything.",
      "How to define a minimum version for hard days.",
      "How to review progress without all-or-nothing thinking.",
    ],
    limitations:
      "Educational content only. It is not medical advice; consult a professional for health concerns.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 1000,
    compareAtAmount: 3000,
    features: [
      "Anchor habit selector",
      "Hard-day minimum plan",
      "Weekly review template",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "technology",
    slug: "choose-tools-with-confidence",
    name: "Choose Tools With Confidence",
    summary:
      "Compare everyday tools on the criteria that actually matter to you.",
    description:
      "A practical method for evaluating software and devices: clarify the job to be done, weigh costs beyond the sticker price, check privacy and lock-in, and run a short trial before committing.",
    audience:
      "Non-specialists who use technology daily and want to choose tools deliberately.",
    notFor:
      "People seeking enterprise procurement, security audits, or vendor negotiations.",
    outcome: "A shortlist built on your own requirements and a trial plan.",
    learnings: [
      "How to define requirements before comparing options.",
      "How to spot hidden costs and lock-in.",
      "How to run a time-boxed trial.",
    ],
    limitations:
      "Tool features and pricing change. Verify current terms with each vendor.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 1000,
    compareAtAmount: 3000,
    features: [
      "Requirements checklist",
      "Cost and lock-in comparison sheet",
      "Two-week trial plan",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "parenting",
    slug: "calmer-daily-routines",
    name: "Calmer Daily Routines",
    summary:
      "Set routines and boundaries that hold up on ordinary, messy days.",
    description:
      "This guide helps you design family routines around the transitions that usually go wrong: mornings, homework, screens, and bedtime. You will set clear expectations, plan for predictable friction, and respond consistently instead of reacting in the moment.",
    audience:
      "Parents who want calmer routines and clearer boundaries at home.",
    notFor:
      "Families seeking clinical or behavioural diagnosis or therapy.",
    outcome:
      "A routine plan with scripts and responses for the hardest moments.",
    learnings: [
      "How to identify where a routine actually breaks.",
      "How to set boundaries the whole family understands.",
      "How to respond consistently without escalating.",
    ],
    limitations:
      "Educational content only. Every child and family differs; it is not clinical advice.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 1000,
    compareAtAmount: 3000,
    features: [
      "Morning and bedtime routine map",
      "Boundary-setting scripts",
      "Friction planning worksheet",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "relationship",
    slug: "break-the-repeating-argument",
    name: "Break the Argument That Keeps Repeating",
    summary:
      "Find the pattern behind recurring conflict and change how the conversation runs.",
    description:
      "A structured way to examine a recurring argument: mapping the trigger, the assumptions underneath, and the point where it escalates. You will practise a repair conversation and set boundaries that hold without escalation.",
    audience:
      "Adults stuck in the same recurring argument with a partner or family member.",
    notFor:
      "Anyone in an unsafe relationship or seeking couples therapy; contact a professional or support service.",
    outcome:
      "A mapped conflict pattern and a plan for a repair conversation.",
    learnings: [
      "How to map a recurring conflict without assigning blame.",
      "How to surface the assumptions that keep the loop going.",
      "How to open a repair conversation and set boundaries.",
    ],
    limitations:
      "Educational content only. It is not therapy and cannot assess safety or clinical needs.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 1000,
    compareAtAmount: 3000,
    features: [
      "Conflict pattern map",
      "Repair conversation script",
      "Boundary statements worksheet",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "investing",
    slug: "understand-risk-before-returns",
    name: "Understand Risk Before Returns",
    summary:
      "Assess what you could lose, how long you can wait, and what a plan must survive.",
    description:
      "This guide builds a beginner's framework for risk: separating speculation from a deliberate plan, checking concentration and liquidity, matching decisions to your time horizon, and writing down the conditions under which you would change course.",
    audience:
      "Beginners who want to understand investing risk before committing money.",
    notFor:
      "People seeking personalized investment advice, stock tips, or return guarantees.",
    outcome:
      "A written risk assessment tied to your goals and time horizon.",
    learnings: [
      "How to separate speculation from a deliberate plan.",
      "How to evaluate concentration, liquidity, and time horizon.",
      "How to pre-commit to a review rule.",
    ],
    limitations:
      "Educational content only. It is not financial advice; investments can lose value.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 1000,
    compareAtAmount: 3000,
    features: [
      "Risk assessment worksheet",
      "Goal and time-horizon mapping",
      "Pre-commitment review rule template",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
];
