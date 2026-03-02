/**
 * Client-side NLP engine for CloudShare's virtual assistant.
 * Generates empathetic, contextually-aware, human-like responses.
 */

export type ConversationContext = {
  lastTopic: string | null;
  messageCount: number;
  userName?: string;
  assistantName: string;
};

type ResponsePattern = {
  patterns: RegExp[];
  responses: string[];
  topic: string;
  followUps?: string[];
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickContextual<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

const NLP_PATTERNS: ResponsePattern[] = [
  // Crisis - highest priority
  {
    topic: "crisis",
    patterns: [
      /\b(suicid|kill myself|end my life|want to die|hurt myself|self.harm|don'?t want to (be here|exist|live))\b/i,
    ],
    responses: [
      "I hear you, and I want you to know this matters deeply. You're not alone in this moment. Please reach out to a crisis helpline — in many countries you can call or text 988 (US), 116 123 (UK), or search 'crisis helpline [your country]'. I'm here with you.",
      "What you're feeling is real, and it sounds incredibly painful. I'm glad you shared this with me. Please don't face this alone — a crisis counselor can be with you right now. You deserve support beyond what I can offer. Will you reach out?",
      "That takes courage to say out loud. You matter, and this moment doesn't have to define your story. Please contact a crisis support line — they're available 24/7 and trained to help. I'm here too, whenever you want to talk.",
    ],
  },

  // Greetings
  {
    topic: "greeting",
    patterns: [
      /^(hey|hi|hello|howdy|good (morning|afternoon|evening)|what'?s up|how are you|how'?s it going|greetings)[\s!?.]*$/i,
    ],
    responses: [
      "Hey, good to hear from you. How are you feeling today — what's on your mind?",
      "Hi! I'm glad you're here. How has your day been treating you?",
      "Hello! I'm here and listening. What would you like to talk about?",
      "Hey there — it's good to connect. How are things going for you right now?",
      "Hi! Take your time. What's coming up for you today?",
    ],
  },

  // How are you (assistant-directed)
  {
    topic: "inquiry",
    patterns: [/\b(how are you|how do you feel|are you okay|you good)\b/i],
    responses: [
      "I'm here and fully present for you — that's what matters most right now. How about you? How are you doing today?",
      "I'm doing well, thank you for asking! More importantly though, how are *you* feeling? What's brought you here today?",
      "I'm here and ready to listen. Tell me — what's going on with you?",
    ],
  },

  // Farewells
  {
    topic: "farewell",
    patterns: [
      /\b(bye|goodbye|see you|take care|farewell|good night|gotta go|talk later|ttyl|cya)\b/i,
    ],
    responses: [
      "Take care of yourself — you deserve it. Come back whenever you need to talk. 💙",
      "Wishing you a peaceful rest of your day. I'll be here whenever you need me.",
      "Goodbye for now. Remember, you've got this. Come back anytime.",
      "Take care! I'm always here whenever you want to share or talk something through.",
    ],
  },

  // Gratitude - fixed to not always say "thank you for sharing"
  {
    topic: "gratitude",
    patterns: [
      /\b(thank you|thanks|appreciate|grateful|so helpful|that helped|you'?re (great|amazing|wonderful)|this helped)\b/i,
    ],
    responses: [
      "I'm really glad that was helpful. You're doing well by taking the time to talk through things.",
      "Of course — this is what I'm here for. How are you feeling now?",
      "It means a lot to hear that. You've been doing the real work here, and that takes courage.",
      "I'm happy to help. Is there anything else you'd like to explore or talk about?",
      "That warms my heart. You deserve support, and I'm glad you reached out.",
    ],
  },

  // Sadness / depression
  {
    topic: "sadness",
    patterns: [
      /\b(sad|crying|cry|cried|depressed|depression|unhappy|heartbroken|miserable|feel(ing)? (down|awful|terrible|horrible|low)|tearful|blue|devastated)\b/i,
    ],
    responses: [
      "I'm sorry you're carrying that. Sadness can feel so heavy. Can you tell me a bit more about what's been happening?",
      "That sounds really hard. It's okay to feel this way — you don't have to push it away. What's been on your mind lately?",
      "I hear you. Feeling sad doesn't mean something is wrong with you. How long have you been feeling this way?",
      "It takes something to admit you're feeling down. I'm here and listening — what do you think is behind it?",
      "Those feelings are real and they matter. Tell me what's been going on — you don't have to hold it in.",
    ],
  },

  // Anxiety / worry
  {
    topic: "anxiety",
    patterns: [
      /\b(anxious|anxiety|panic|worried|worry|nervous|scared|afraid|fear|overthink|stress(ed|ful)?|overwhelm(ed)?|dread|on edge|can'?t relax)\b/i,
    ],
    responses: [
      "Anxiety can be exhausting, especially when the thoughts just won't quiet down. What's been worrying you most lately?",
      "I hear you. That restless, on-edge feeling is really difficult to carry. Can you tell me what's been triggering it?",
      "It makes sense to feel overwhelmed. You're not alone in this. What does the anxiety feel like for you — is it more physical, or more racing thoughts?",
      "Stress and anxiety often build up quietly before we notice them. What's been going on in your life recently?",
      "That's a lot to hold onto. Let's slow down a little — what feels most pressing right now?",
    ],
  },

  // Anger / frustration
  {
    topic: "anger",
    patterns: [
      /\b(angry|anger|furious|pissed|rage|frustrated|frustration|mad|hate|irritated|annoyed|snapped|livid)\b/i,
    ],
    responses: [
      "Anger is a completely valid feeling. Something clearly isn't sitting right — what happened?",
      "I can hear the frustration. Sometimes anger is just pain that doesn't know where to go. What's at the root of it for you?",
      "It sounds like something really got to you. Can you walk me through what happened?",
      "Feeling angry is human — it usually means something important to you was crossed. What was it?",
    ],
  },

  // Loneliness
  {
    topic: "loneliness",
    patterns: [
      /\b(lonely|alone|isolated|no one (cares?|understands?|listens?)|nobody (here|understands?)|left out|disconnected|by myself|invisible)\b/i,
    ],
    responses: [
      "Loneliness can feel so isolating, even when you're surrounded by people. I want you to know I'm here with you right now. What's been making you feel this way?",
      "That feeling of not being seen or understood is one of the hardest things. You're not alone in feeling that way. Tell me more about what's going on.",
      "I hear you — and I'm glad you reached out instead of sitting with that alone. What does your support network look like right now?",
      "You matter, even when it doesn't feel that way. What's been happening that's made you feel so isolated?",
    ],
  },

  // Stress / burnout
  {
    topic: "stress",
    patterns: [
      /\b(burned? out|burnout|drained|exhausted|no energy|running on empty|too much|can'?t cope|under pressure|too many things|juggling)\b/i,
    ],
    responses: [
      "Burnout is real, and it sounds like you've been giving a lot of yourself. What's been piling up for you lately?",
      "It's okay to feel depleted — that's your body and mind telling you something important. What does your day typically look like right now?",
      "Running on empty is unsustainable. Let's talk about what's taking the most out of you. What feels heaviest?",
      "That sounds exhausting. You deserve rest, not just productivity. What would feel like relief to you right now?",
    ],
  },

  // Self-worth / self-esteem
  {
    topic: "self-worth",
    patterns: [
      /\b(not good enough|worthless|failure|hate myself|useless|stupid|i'?m a burden|low self.esteem|insecure|self.hate|not worth it|can'?t do anything right)\b/i,
    ],
    responses: [
      "I'm really glad you shared that, even though I know it wasn't easy. Those thoughts can feel so convincing, but they're not the full truth. Can you tell me what's been happening to make you feel this way?",
      "That kind of inner criticism can be relentless. You're not those words. What's been going on that's brought these feelings up?",
      "Hearing you say that hurts me a little — because I can hear how much pain is behind it. You matter. What's been making you feel this way lately?",
      "Self-doubt is something so many people wrestle with quietly. You're brave for naming it. What's been weighing on you?",
    ],
  },

  // Sleep issues
  {
    topic: "sleep",
    patterns: [
      /\b(can'?t sleep|insomnia|sleep(less)?|nightmares?|tired|no energy|restless|up all night|wide awake|sleep issues?)\b/i,
    ],
    responses: [
      "Poor sleep affects everything — mood, energy, how you think. How long has this been going on?",
      "Not being able to sleep is its own kind of exhaustion. What happens when you try — does your mind race, or is it more physical?",
      "Sleep struggles often connect to other things we're carrying. Is there something on your mind that tends to keep you up?",
      "Rest is so important, and it sounds like yours has been disrupted. Let's talk about what might be behind it.",
    ],
  },

  // Relationships
  {
    topic: "relationships",
    patterns: [
      /\b(relationship|breakup|broke up|ex(-partner)?|boyfriend|girlfriend|marriage|divorce|cheated|partner|dating|love life|heartbreak)\b/i,
    ],
    responses: [
      "Relationship stuff can be really emotionally complicated. What's been happening?",
      "That sounds like a lot to carry. Whether it's connection, conflict, or loss — these things really affect us deeply. Can you tell me more?",
      "Matters of the heart are never simple. I'm here to listen without judgment. What's going on?",
      "Relationships can be our greatest source of joy and pain. What's come up for you?",
    ],
  },

  // Family
  {
    topic: "family",
    patterns: [
      /\b(family|parents?|mom|dad|mother|father|sibling|brother|sister|toxic|home life|upbringing|childhood)\b/i,
    ],
    responses: [
      "Family dynamics can be deeply complex and sometimes deeply painful. What's been going on there?",
      "Our family shapes so much of who we are — it makes sense that this would come up. Tell me more about the situation.",
      "Home and family relationships carry a lot of weight. What's been happening that you wanted to talk about?",
      "It takes courage to look at family stuff honestly. What's on your mind?",
    ],
  },

  // Work / school
  {
    topic: "work",
    patterns: [
      /\b(work|job|boss|colleague|coworker|school|exam|deadline|career|university|college|class|homework|fired|resign|study|academic)\b/i,
    ],
    responses: [
      "Work and school put so much pressure on us. What's been going on — what's weighing on you most?",
      "Academic or professional stress is real and it matters. What's coming up for you?",
      "That sounds like a lot of pressure. What specifically has been the hardest part lately?",
      "Balancing responsibilities can feel impossible sometimes. Tell me what's been going on.",
    ],
  },

  // Identity / purpose / existential
  {
    topic: "existential",
    patterns: [
      /\b(what'?s the point|meaning of life|purpose|feel(ing)? empty|numb|no direction|lost in life|existential|who am i|don'?t know who i am|questioning everything)\b/i,
    ],
    responses: [
      "Those are some of the deepest, most human questions there are. Feeling lost or without direction is more common than people admit — and more meaningful than it feels in the moment. What's been stirring these thoughts?",
      "That emptiness or searching — it often arrives when something in your life is shifting, even if you can't name it yet. What's been going on lately?",
      "Questioning your direction takes a kind of courage, even if it just feels like confusion. Tell me more — when did this start?",
      "Feeling unmoored is hard. Sometimes it signals that old answers no longer fit and new ones haven't arrived yet. What does 'purpose' look like for you — or what did it look like before?",
    ],
  },

  // Confusion / decision-making
  {
    topic: "confusion",
    patterns: [
      /\b(confused|don'?t know what to do|uncertain|indecisive|can'?t decide|torn|at a crossroads|what should i do|not sure which way)\b/i,
    ],
    responses: [
      "It's okay to not have it figured out right now. Sometimes sitting with the uncertainty is part of the process. What's the decision you're wrestling with?",
      "Confusion can feel uncomfortable, but it often means you're thinking carefully about something that matters. What's on your mind?",
      "Being torn between options usually means something real is at stake. Tell me about the situation — let's think through it together.",
    ],
  },

  // Who is the assistant
  {
    topic: "assistant",
    patterns: [
      /\b(who are you|are you (real|human|an? ?ai|a (robot|bot|program))|what are you|how do you work|can you (really )?understand)\b/i,
    ],
    responses: [
      "I'm an AI — but one designed to listen carefully and respond with genuine care. I won't pretend I feel things the way you do, but I'm fully here for this conversation. What's on your mind?",
      "I'm a virtual companion, not a human — but I take every conversation seriously. What you share here matters. What would you like to talk about?",
      "Honest answer: I'm an AI. I can't fully understand what it feels like to be you, but I'm here to listen without judgment and help you think through things. What's coming up for you?",
    ],
  },

  // Positive emotions / good day
  {
    topic: "positive",
    patterns: [
      /\b(happy|great|good day|amazing|wonderful|excited|thrilled|proud|joy|grateful|blessed|fantastic|loving life|going well|things are good)\b/i,
    ],
    responses: [
      "That's genuinely nice to hear. What's been making things feel good lately?",
      "I love hearing that. What happened — or what's been contributing to that feeling?",
      "Hold onto that feeling! What's been going right for you?",
      "That's wonderful. Tell me more — what's been making you feel this way?",
    ],
  },

  // Trauma / difficult past
  {
    topic: "trauma",
    patterns: [
      /\b(trauma|abuse|assault|violated|ptsd|flashback|trigger(ed)?|can'?t get over it|haunted by|bad memories|something happened to me)\b/i,
    ],
    responses: [
      "Thank you for trusting me with something so personal. That takes real courage. I want to hear more if you're comfortable sharing — what happened?",
      "What you went through matters, and you deserve to be heard. Take your time — I'm not going anywhere. What would you like to share?",
      "I'm really sorry you've been carrying that. It's okay to go at whatever pace feels right for you. I'm listening.",
    ],
  },

  // Short replies needing more context
  {
    topic: "elaboration",
    patterns: [
      /^(yes|no|maybe|idk|yeah|nope|not really|fine|okay|ok|sure|mhm|hmm|idk what to say|i guess)[\s.!?]*$/i,
    ],
    responses: [
      "Take your time — there's no rush. What's on your mind?",
      "It's okay if it's hard to put into words. What's been going on for you?",
      "Even if you're not sure where to start, I'm here. What feels most present for you right now?",
      "Sometimes the words don't come easily. That's okay. What's brought you here today?",
    ],
  },
];

// Patterns that feel like someone sharing something deeply personal / general sharing
const PERSONAL_SHARING_PATTERNS = [
  /\b(i feel|i'?ve been|i'?m going through|i have been|lately i|recently i|i can'?t stop|i keep|i want to talk|i need to|i'?ve been struggling|something happened)\b/i,
  /\b(my (life|mind|heart|mental health|day|week|month|year)|everything (feels?|seems?|is)|nothing (helps?|works?|matters?))\b/i,
];

// Context-aware follow-up prompts based on topic
const TOPIC_FOLLOW_UPS: Record<string, string[]> = {
  sadness: [
    "How long have you been feeling this way?",
    "Is there a specific moment or event that brought this on?",
    "What does the sadness feel like — is it more of a heaviness, or something else?",
    "Is there anyone in your life you've been able to talk to about this?",
  ],
  anxiety: [
    "Are there specific situations that tend to trigger it, or does it feel more constant?",
    "How is it showing up in your body — tight chest, racing thoughts, stomach?",
    "When you're at your most anxious, what tends to help, even a little?",
  ],
  loneliness: [
    "What does connection look like for you right now?",
    "Has it always felt this way, or is this more recent?",
    "Is there someone in your life you wish understood you better?",
  ],
  stress: [
    "What's taking up the most of your energy right now?",
    "When did you last feel like you truly rested?",
    "Are you able to set any boundaries around your time and energy?",
  ],
  relationships: [
    "How long have things been this way between you two?",
    "Is this something you've been able to talk to them about directly?",
    "What do you wish they understood about how you're feeling?",
  ],
  anger: [
    "What would a fair resolution look like to you?",
    "Is this something that's been building for a while?",
    "When you're angry, what do you usually do with that feeling?",
  ],
  grief: [
    "Grief takes so many forms. How has it been showing up for you?",
    "Is there anything in particular you find yourself missing most?",
    "Are there moments when it feels lighter, even briefly?",
  ],
  work: [
    "Is it the workload, the environment, or something specific about your role?",
    "How are you managing to rest amidst all of it?",
    "Have you been able to talk to anyone at work or school about how you're feeling?",
  ],
  family: [
    "How long has this dynamic been going on?",
    "Have you been able to set any distance or boundaries when things get hard?",
    "Is there someone in your family who does understand you, even a little?",
  ],
  general: [
    "What would feel most helpful to you right now — to vent, to be heard, or to think through something?",
    "What's been the heaviest thing on your mind lately?",
    "Is there something specific you were hoping to talk through today?",
    "What would make today even a little bit better?",
    "How are you taking care of yourself through all of this?",
  ],
};

function getFollowUp(topic: string): string {
  const pool = TOPIC_FOLLOW_UPS[topic] ?? TOPIC_FOLLOW_UPS.general;
  return pick(pool);
}

function isPersonalSharing(text: string): boolean {
  return PERSONAL_SHARING_PATTERNS.some((p) => p.test(text));
}

function matchesPattern(text: string, pattern: ResponsePattern): boolean {
  return pattern.patterns.some((p) => p.test(text));
}

export type NLPResult = {
  response: string;
  topic: string;
  shouldSaveToBackend: boolean;
};

export function generateNLPResponse(
  userMessage: string,
  context: ConversationContext,
): NLPResult | null {
  const trimmed = userMessage.trim();
  if (!trimmed) return null;

  // Try each pattern in priority order
  for (const pattern of NLP_PATTERNS) {
    if (matchesPattern(trimmed, pattern)) {
      const baseResponse = pick(pattern.responses);

      // For most topics, append a follow-up question to keep conversation going
      const shouldAddFollowUp =
        pattern.topic !== "farewell" &&
        pattern.topic !== "crisis" &&
        pattern.topic !== "greeting" &&
        pattern.topic !== "assistant" &&
        Math.random() > 0.35;

      const response = shouldAddFollowUp
        ? `${baseResponse}\n\n${getFollowUp(pattern.topic)}`
        : baseResponse;

      return {
        response,
        topic: pattern.topic,
        shouldSaveToBackend: true,
      };
    }
  }

  // Personal sharing fallback - deeply empathetic, open-ended
  if (isPersonalSharing(trimmed)) {
    const empathyResponses = [
      "That sounds like a lot to carry. I'm really glad you felt you could share that. Can you tell me more about what's been going on?",
      "I hear you — what you're describing sounds genuinely hard. I want to understand better. What's been the toughest part of it?",
      "Thank you for opening up about that. It takes something to put these things into words. What's been sitting with you the most?",
      "That resonates deeply. It sounds like something important is happening for you right now. How long have you been feeling this way?",
      "I'm here and listening. What you're going through matters. Where would you like to start?",
    ];
    const seed = trimmed.length + context.messageCount;
    return {
      response: pickContextual(empathyResponses, seed),
      topic: "personal-sharing",
      shouldSaveToBackend: true,
    };
  }

  // Long messages - engage thoughtfully rather than with a generic reply
  if (trimmed.length > 80) {
    const engagingResponses = [
      "That's a lot to process, and I can hear how much is going on for you. What feels like the most important thread to pull on first?",
      "Thank you for sharing all of that. It sounds like there's a lot layered here. What's the part that feels heaviest?",
      "I want to make sure I'm really understanding what you're going through. Out of everything you've shared, what matters most to you right now?",
      "That's really meaningful — and it sounds complex. Let's slow down and look at it together. What would feel most useful?",
    ];
    const seed = trimmed.charCodeAt(0) + context.messageCount;
    return {
      response: pickContextual(engagingResponses, seed),
      topic: "general",
      shouldSaveToBackend: true,
    };
  }

  // No match — let the backend handle it
  return null;
}
