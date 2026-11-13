import type { LearningLevel } from "@prisma/client";

export const niches = [
  {
    slug: "career",
    name: "Career",
    tagline: "Navigate uncertainty at work.",
    description:
      "Practical guides for job insecurity, burnout, stalled growth, and difficult work situations.",
    accentColor: "#F59E0B",
    sortOrder: 1,
  },
  {
    slug: "finance",
    name: "Finance",
    tagline: "Make sense of everyday money pressure.",
    description:
      "Guides for budgeting strain, debt, rising costs, and everyday money decisions.",
    accentColor: "#10B981",
    sortOrder: 2,
  },
  {
    slug: "learning",
    name: "Learning",
    tagline: "Understand why learning feels stuck.",
    description:
      "Guides for overwhelm, poor retention, and studying more effectively as an adult.",
    accentColor: "#3B82F6",
    sortOrder: 3,
  },
  {
    slug: "health",
    name: "Health",
    tagline: "Build health routines that last.",
    description:
      "Guides for sleep, movement, and meal habits that fit busy, changing lives.",
    accentColor: "#EF4444",
    sortOrder: 4,
  },
  {
    slug: "psychology",
    name: "Psychology",
    tagline: "Understand patterns in how you feel.",
    description:
      "Guides for burnout, overthinking, anxiety, loneliness, and recurring emotional patterns.",
    accentColor: "#EC4899",
    sortOrder: 5,
  },
  {
    slug: "technology",
    name: "Technology",
    tagline: "Stay safer in everyday digital life.",
    description:
      "Guides for scams, account security, privacy, AI-generated media, and screen habits.",
    accentColor: "#8B5CF6",
    sortOrder: 6,
  },
  {
    slug: "parenting",
    name: "Parenting",
    tagline: "Ease friction in family routines.",
    description:
      "Guides for mornings, homework, screen time, boundaries, and bedtime challenges.",
    accentColor: "#F97316",
    sortOrder: 7,
  },
  {
    slug: "relationship",
    name: "Relationship",
    tagline: "Understand difficult relationship patterns.",
    description:
      "Guides for conflict, distance, boundaries, trust, and changing relationships.",
    accentColor: "#F43F5E",
    sortOrder: 8,
  },
  {
    slug: "business",
    name: "Business",
    tagline: "Work through common small-business hurdles.",
    description:
      "Guides for first customers, pricing, cash flow, and turning effort into sales.",
    accentColor: "#6366F1",
    sortOrder: 9,
  },
  {
    slug: "investing",
    name: "Investing",
    tagline: "Understand investing decisions with clarity.",
    description:
      "Guides on risk, fees, market swings, and core investing concepts.",
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
  /** File name inside the local PDF directory (default: `pdf/`). */
  pdfFile?: string;
};

export const products: SeedProduct[] = [
  {
    nicheSlug: "business",
    slug: "proven-sales-techniques-overcome-buyer-resistance",
    name: "7 Proven Sales Techniques to Overcome Buyer Resistance and Close More Sales",
    summary:
      "Understand buyer resistance and use seven trust-based sales techniques to move conversations forward without pressure.",
    description:
      "This guide breaks down the psychology behind buyer hesitation and walks through seven practical techniques: asking the questions buyers avoid, revealing drawbacks before they become objections, making value pull instead of push, showing the cost of inaction, controlling tone, selling the outcome, and following up strategically. Each chapter includes examples you can adapt to your own offer.",
    audience:
      "Salespeople, founders, and freelancers who need to close deals without relying on aggressive tactics.",
    notFor:
      "Teams looking for scripts that pressure buyers or guarantee a sale.",
    outcome:
      "A clearer sales conversation you can run from first objection to confident follow-up.",
    learnings: [
      "How to surface the concerns buyers rarely volunteer.",
      "How to communicate value and drawbacks without losing trust.",
      "How to follow up consistently without becoming intrusive.",
    ],
    limitations:
      "Sales results depend on your offer, market, and execution. No outcome is guaranteed.",
    license: "Personal and internal business use. Do not resell.",
    level: "PRACTICAL",
    priceAmount: 100,
    compareAtAmount: 1000,
    features: [
      "Seven techniques with worked examples",
      "Objection and follow-up scripts",
      "Tone and value-framing checklist",
      "Lifetime access to the PDF",
    ],
    sortOrder: 1,
    pdfFile:
      "7 Proven Sales Techniques to Overcome Buyer Resistance and Close More Sales.pdf",
  },
  {
    nicheSlug: "finance",
    slug: "stop-wasting-money-build-financial-security-in-90-days",
    name: "12 Steps to Stop Wasting Money Build Lasting Financial Security in 90 Days",
    summary:
      "A 90-day plan to cut wasted spending, reduce debt, and build savings you can keep.",
    description:
      "This guide turns personal finance into twelve concrete steps you can work through over 90 days: tracking where money goes, cutting the biggest leaks, automating savings, tackling high-interest debt, building an emergency fund, starting simple investing, increasing income, and creating a long-term roadmap. Each step includes practical actions and checkpoints.",
    audience:
      "Adults who feel their money disappears each month and want a structured plan to regain control.",
    notFor:
      "People seeking personalized financial advice, tax guidance, or guaranteed investment returns.",
    outcome:
      "A written 90-day money plan covering spending, debt, savings, and next steps.",
    learnings: [
      "How to find the expenses that drain your budget fastest.",
      "How to order savings, debt payoff, and investing.",
      "How to review progress and keep the plan going after 90 days.",
    ],
    limitations:
      "Educational content only. It is not personalized financial advice.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 100,
    compareAtAmount: 1000,
    features: [
      "12-step 90-day action plan",
      "Spending and net-worth trackers",
      "Debt and savings priority worksheet",
      "Lifetime access to the PDF",
    ],
    sortOrder: 1,
    pdfFile:
      "12 Steps to Stop Wasting Money Build Lasting Financial Security in 90 Days.pdf",
  },
  {
    nicheSlug: "investing",
    slug: "manage-investments-from-readiness-to-independence",
    name: "7 Steps to Manage Your Investments From Financial Readiness to Financial Independence",
    summary:
      "Match investment decisions to your stage of financial readiness instead of chasing returns.",
    description:
      "This guide maps seven stages of financial progress, from clearing high-interest debt and building a buffer to maintaining a simple portfolio, surviving the boring middle, handling taxes and structure, avoiding poor market timing, and knowing when wealth is enough. It focuses on the decisions that matter at each stage rather than stock tips.",
    audience:
      "Beginner and intermediate investors who want a staged framework for managing their money.",
    notFor:
      "People seeking personalized investment advice, specific asset recommendations, or return guarantees.",
    outcome:
      "A staged investment plan tied to your debt, buffer, portfolio, and life goals.",
    learnings: [
      "Why debt payoff and an emergency buffer come before chasing returns.",
      "How to build and maintain a simple portfolio through the boring middle.",
      "How to judge when your wealth can support the life you want.",
    ],
    limitations:
      "Educational content only. It is not financial advice; investments can lose value.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 100,
    compareAtAmount: 1000,
    features: [
      "Seven-stage readiness framework",
      "Portfolio maintenance checklist",
      "Tax and risk review prompts",
      "Lifetime access to the PDF",
    ],
    sortOrder: 1,
    pdfFile:
      "7 Steps to Manage Your Investments From Financial Readiness to Financial Independence.pdf",
  },
  {
    nicheSlug: "technology",
    slug: "stay-intellectually-sharp-in-the-age-of-ai",
    name: "How to Stay Intellectually Sharp, Build Expertise, and Think Independently in the Age of AI",
    summary:
      "Use AI as a thinking partner without outsourcing your judgment or expertise.",
    description:
      "This guide examines the hidden cost of letting AI do your thinking and shows how to keep your edge: understanding work rather than just producing it, mastering your craft first, building cross-disciplinary knowledge, using AI for first drafts, keeping human judgment in important decisions, and becoming remarkable instead of merely efficient.",
    audience:
      "Professionals, students, and independent workers who use AI daily and want to stay capable.",
    notFor:
      "People looking for prompt libraries, tool tutorials, or predictions about which jobs will disappear.",
    outcome:
      "A practical set of habits for using AI while protecting your expertise and judgment.",
    learnings: [
      "How to spot when AI is replacing your thinking instead of accelerating it.",
      "How to build expertise that remains valuable as tools improve.",
      "How to keep human judgment in high-stakes decisions.",
    ],
    limitations:
      "Technology and workplace expectations change quickly. This guide offers principles, not guarantees.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 100,
    compareAtAmount: 1000,
    features: [
      "Seven habits for thinking with AI",
      "Judgment and verification checklist",
      "Cross-disciplinary learning prompts",
      "Lifetime access to the PDF",
    ],
    sortOrder: 1,
    pdfFile:
      "How to Stay Intellectually Sharp, Build Expertise, and Think Independently in the Age of AI.pdf",
  },
  {
    nicheSlug: "career",
    slug: "build-a-personal-brand-that-opens-career-opportunities",
    name: "Build a Personal Brand That Opens Career Opportunities Before You Need Them",
    summary:
      "Build a credible professional presence that creates opportunities before you start looking.",
    description:
      "This guide shows how to make your expertise visible without becoming an influencer: separating branding from self-promotion, overcoming the fear of looking inexperienced, sharing what you know, protecting your reputation, building a sustainable presence, networking without constantly reaching out, and turning content into a learning advantage.",
    audience:
      "Professionals who want more control over their career options and visibility.",
    notFor:
      "People looking for follower-growth hacks, viral content formulas, or guaranteed job offers.",
    outcome:
      "A realistic personal-brand plan you can run alongside your current job.",
    learnings: [
      "Why good work alone rarely makes your expertise visible.",
      "How to share what you know before you feel like an expert.",
      "How to build career equity that survives a job change.",
    ],
    limitations:
      "Career outcomes depend on your field, effort, and circumstances. No result is guaranteed.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 100,
    compareAtAmount: 1000,
    features: [
      "12-chapter personal brand framework",
      "Content and networking cadence template",
      "Reputation risk checklist",
      "Lifetime access to the PDF",
    ],
    sortOrder: 1,
    pdfFile:
      "Build a Personal Brand That Opens Career Opportunities Before You Need Them.pdf",
  },
  {
    nicheSlug: "psychology",
    slug: "make-important-tasks-easier-to-start",
    name: "15 Strategies to Make Important Tasks Easier to Start and Harder to Put Off",
    summary:
      "Understand avoidance and use fifteen practical strategies to start difficult work consistently.",
    description:
      "This guide explains why important tasks get postponed and gives you fifteen strategies to make starting easier: shrinking the first step, separating identity from behavior, turning vague goals into actions, designing your environment, acting before motivation arrives, recovering after missed days, and building a system that survives bad days.",
    audience:
      "Adults who procrastinate on meaningful work and want practical ways to begin.",
    notFor:
      "People seeking clinical diagnosis or treatment for anxiety, depression, or executive-function conditions.",
    outcome:
      "A toolkit of start rituals and a simple system for consistent follow-through.",
    learnings: [
      "How avoidance provides short-term relief and keeps the loop going.",
      "How to make the first action small and specific enough to start.",
      "How to recover quickly after missing a day without self-blame.",
    ],
    limitations:
      "Educational content only. It is not a substitute for professional mental-health care.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 100,
    compareAtAmount: 1000,
    features: [
      "15 start strategies with examples",
      "First-step and environment planner",
      "Missed-day recovery protocol",
      "Lifetime access to the PDF",
    ],
    sortOrder: 1,
    pdfFile:
      "15 Strategies to Make Important Tasks Easier to Start and Harder to Put Off.pdf",
  },
  {
    nicheSlug: "health",
    slug: "walking-mistakes-after-50",
    name: "7 Walking Mistakes After 50 That Can Undermine Your Health and Safety",
    summary:
      "Walk more safely and comfortably after 50 by fixing seven common mistakes.",
    description:
      "This guide looks at seven everyday walking mistakes — starting too fast, poor posture, worn-out shoes, inconsistent routines, ignoring arm movement and balance, phone use, and skipping recovery — and explains practical, research-informed ways to correct each one. It is general guidance, not a diagnosis.",
    audience:
      "Adults over 50 who want to stay active through walking without unnecessary strain.",
    notFor:
      "Anyone seeking medical diagnosis, treatment, or a personalized rehabilitation plan.",
    outcome:
      "A safer walking routine with warm-up, posture, footwear, balance, and recovery checks.",
    learnings: [
      "How to warm up and pace a walk appropriately.",
      "How posture, arm movement, and footwear affect comfort and balance.",
      "How to notice warning signs and build recovery into your routine.",
    ],
    limitations:
      "Educational content only. It is not medical advice; consult a professional for health concerns.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 100,
    compareAtAmount: 1000,
    features: [
      "Seven mistakes and fixes",
      "Warm-up and posture checklist",
      "Recovery and warning-sign guide",
      "Lifetime access to the PDF",
    ],
    sortOrder: 1,
    pdfFile:
      "7 Walking Mistakes After 50 That Can Undermine Your Health and Safety.pdf",
  },
  {
    nicheSlug: "parenting",
    slug: "stop-overparenting-raise-resilient-children",
    name: "Stop Overparenting: Raise Independent, Resilient Children Without Making Grades Their Worth",
    summary:
      "Reduce academic pressure and give children room to build competence and resilience.",
    description:
      "This guide explains how good intentions can turn into overparenting and offers a practical framework for stepping back: separating grades from a child's worth, building self-efficacy through action, replacing overprotection with age-appropriate responsibility, letting children make decisions, protecting play and rest, and guiding without controlling.",
    audience:
      "Parents who want to support their children without managing every part of their lives.",
    notFor:
      "Families seeking clinical or behavioral diagnosis, therapy, or school placement advice.",
    outcome:
      "A calmer parenting framework with age-appropriate responsibilities and boundaries.",
    learnings: [
      "How academic pressure can become a measure of a child's worth.",
      "How to build self-efficacy by letting children act and recover.",
      "How to guide without controlling as decisions get bigger.",
    ],
    limitations:
      "Educational content only. Every child and family differs; it is not clinical advice.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 100,
    compareAtAmount: 1000,
    features: [
      "Overparenting self-check",
      "Age-appropriate responsibility guide",
      "Guide-without-controlling framework",
      "Lifetime access to the PDF",
    ],
    sortOrder: 1,
    pdfFile:
      "Stop Overparenting_ Raise Independent, Resilient Children Without Making Grades Their Worth.pdf",
  },
  {
    nicheSlug: "relationship",
    slug: "truths-about-love-stop-choosing-wrong-relationships",
    name: "9 Truths About Love That Can Help You Stop Choosing the Wrong Relationships",
    summary:
      "Recognize unhealthy patterns, tell chemistry from compatibility, and choose relationships deliberately.",
    description:
      "This guide explores nine principles for approaching love with clarity: stop investing in relationships that never move forward, look beyond chemistry, stop treating being single as falling behind, recognize the patterns that draw you to the wrong people, become the partner you hope to find, choose someone who chooses you back, let go before the past takes your future, and love without losing yourself.",
    audience:
      "Adults who keep repeating unhealthy relationship patterns and want clearer criteria.",
    notFor:
      "Anyone in an unsafe relationship or seeking couples therapy; contact a professional or support service.",
    outcome:
      "A clearer set of criteria for evaluating a relationship and recognizing recurring patterns.",
    learnings: [
      "How to evaluate a relationship through observable behavior.",
      "How to distinguish attraction from compatibility.",
      "How to recognize recurring patterns and mutual commitment.",
    ],
    limitations:
      "Educational content only. It is not therapy and cannot assess safety or clinical needs.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 100,
    compareAtAmount: 1000,
    features: [
      "Nine principles with reflection prompts",
      "Compatibility and behavior checklist",
      "Pattern-recognition worksheet",
      "Lifetime access to the PDF",
    ],
    sortOrder: 1,
    pdfFile:
      "9 Truths About Love That Can Help You Stop Choosing the Wrong Relationships.pdf",
  },
  {
    nicheSlug: "learning",
    slug: "smarter-way-to-learn-in-the-age-of-ai",
    name: "The Smarter Way to Learn and Understand More in an Era of AI and Information Overload",
    summary:
      "Learn by explaining, questioning, and connecting ideas instead of collecting more information.",
    description:
      "This guide explains why exposure to information is not learning and gives you a repeatable method: stop collecting and start working with what you know, explain difficult ideas in your own words, connect existing knowledge to new problems, ask questions that reveal real understanding, tell familiarity apart from comprehension, use explanations to decide what to learn next, and treat AI as a learning partner rather than a substitute for thinking.",
    audience:
      "Self-directed learners, students, and professionals overwhelmed by information.",
    notFor:
      "People looking for subject-specific tutoring, exam guarantees, or AI prompt lists.",
    outcome:
      "A repeatable self-explanation habit and a way to test what you actually understand.",
    learnings: [
      "How to tell the feeling of knowing from real understanding.",
      "How to use self-explanation to reveal gaps.",
      "How to make AI support your thinking instead of replacing it.",
    ],
    limitations:
      "Learning outcomes depend on consistent practice. No grade or result is guaranteed.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 100,
    compareAtAmount: 1000,
    features: [
      "Eight-step learning method",
      "Self-explanation prompts",
      "Knowledge-gap review template",
      "Lifetime access to the PDF",
    ],
    sortOrder: 1,
    pdfFile:
      "The Smarter Way to Learn and Understand More in an Era of AI and Information Overload.pdf",
  },
];
