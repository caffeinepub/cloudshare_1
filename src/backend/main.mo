import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Message = {
    role : {
      #user;
      #assistant;
    };
    content : Text;
    timestamp : Int;
  };

  public type UserProfile = {
    assistantName : ?Text;
  };

  type UserData = {
    assistantName : ?Text;
    chatHistory : List.List<Message>;
    lastTopic : ?Text;
  };

  let users = Map.empty<Principal, UserData>();

  func containsAnyWithSpaces(text : Text, keywords : [Text]) : Bool {
    keywords.any(
      func(keyword) {
        text.contains(#text keyword) or
        text.contains(#text (" " # keyword)) or
        text.contains(#text (keyword # " ")) or
        text.contains(#text (" " # keyword # " "));
      }
    );
  };

  func randomIndex(arraySize : Nat) : Nat {
    let time = Time.now();
    let modIndex = Int.abs(time) % arraySize;
    modIndex;
  };

  func getRandomResponse(responses : [Text]) : Text {
    let index = randomIndex(responses.size());
    responses[index];
  };

  func provideFollowUp(userMessage : Text, lastTopic : ?Text) : Text {
    switch (lastTopic, userMessage) {
      case (_, "yes" or "yeah" or "yep") {
        switch (lastTopic) {
          case (?topic) { return topic };
          case (null) { return "Can you tell me more about what's going on?" };
        };
        return "I'm glad to hear that. Is there anything else you would like to share?";
      };
      case (_, "no" or "nope" or "not really") {
        switch (lastTopic) {
          case (?topic) { return topic };
          case (null) { return "That's okay, we can talk about something else if you'd like." };
        };
        return "No worries at all. Feel free to bring up anything else on your mind.";
      };
      case (_, "idk" or "not sure") {
        switch (lastTopic) {
          case (?topic) { return topic };
          case (null) { return "It's okay not to have all the answers. Take your time and share whatever you're comfortable with." };
        };
        return "It's completely normal to feel uncertain. We can take things step by step.";
      };
      case (_, "maybe") {
        switch (lastTopic) {
          case (?topic) { return topic };
          case (null) { return "Feeling unsure is okay. We can take things one step at a time." };
        };
        return "We can explore this together at your own pace.";
      };
      case (_, "tell me more") {
        switch (lastTopic) {
          case (?topic) { return topic };
          case (null) { return "Of course. Is there a specific topic or feeling you'd like to discuss?" };
        };
        return "I'm happy to share more. Let me know what you're interested in hearing about.";
      };
      case (_, "why" or "how" or "help" or "i need help") {
        switch (lastTopic) {
          case (?topic) { return topic };
          case (null) { return "I'm here to provide support. Can you tell me a bit more so I can best understand your needs?" };
        };
        return "I'm here to support you. Let's work through this together.";
      };
      case (?topic, _) {
        if (userMessage.size() < 20) {
          return "Regarding \"" # topic # "\", would you like to share more details? I'm here to listen.";
        };
      };
      case (_, _) {
        if (userMessage.size() < 20) {
          return "Could you tell me a bit more about your thoughts or feelings?";
        };
      };
    };
    "Please feel free to elaborate or ask any questions. I'm here to support you.";
  };

  func generateReply(userMessage : Text, lastTopic : ?Text, _assistantName : ?Text) : (Text, Text) {
    let lowerMessage = userMessage.toLower();

    // Validate input contains at least 2 characters that are not spaces or punctuation
    func isValidInput(text : Text) : Bool {
      let trimmed = text.chars().filter(func(c) { c != ' ' and c != '.' and c != ',' and c != '?' and c != '!' }).toArray();
      trimmed.size() >= 2;
    };

    let crisisKeywords = ["suicide", "kill myself", "end my life", "want to die", "hurt myself"];
    if (containsAnyWithSpaces(lowerMessage, crisisKeywords)) {
      let crisisTopic = "crisis";
      let crisisResponses = [
        "I'm deeply sorry you're feeling this way. You matter and are not alone. If you need immediate help, please reach out to a crisis support line in your country.",
        "Your feelings are valid and important. If you're in danger, please call a trusted friend, family member, or a crisis hotline. We're here to support you.",
        "Finding it hard to cope is nothing to be ashamed of. Please consider talking to a mental health professional or reaching out to a crisis helpline for support.",
        "I'm here for you. Please remember that support is available and things can get better, even if it doesn't feel that way right now.",
      ];
      return (getRandomResponse(crisisResponses), crisisTopic);
    };

    // Greeting detection with full sentence matching
    let greetingPhrases = [
      "hello there",
      "hello",
      "hi",
      "hey",
      "good morning",
      "good evening",
      "good afternoon",
      "how are you",
      "what's up",
      "how's it going",
    ];
    for (phrase in greetingPhrases.values()) {
      if (lowerMessage == phrase) {
        let greetingTopic = "greeting";
        let greetingResponses = [
          "Hello! How can I support you today?",
          "Hi there. I'm here to listen and help in any way I can.",
          "Hey, it's great to connect with you. What would you like to talk about?",
          "Good day! I'm ready whenever you are.",
        ];
        return (getRandomResponse(greetingResponses), greetingTopic);
      } else if (
        lowerMessage.contains(#text phrase) or
        lowerMessage.startsWith(#text phrase)
      ) {
        let greetingTopic = "greeting";
        let greetingResponses = [
          "It's always nice to receive a greeting. How are you feeling today?",
          "Hi there! What's on your mind?",
          "Hello! Let's talk about whatever you want to discuss.",
          "Greetings! I'm here to help you through anything.",
        ];
        return (getRandomResponse(greetingResponses), greetingTopic);
      };
    };

    let farewellKeywords = [
      "bye",
      "goodbye",
      "see you",
      "good night",
      "take care",
      "farewell",
      "have a nice day",
      "see you later",
    ];
    for (phrase in farewellKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let farewellTopic = "farewell";
        let farewellResponses = [
          "Take care! Remember, I'm always here if you want to talk.",
          "Goodbye for now. Wishing you a peaceful rest of your day.",
          "See you later! Feel free to reach out whenever you need support.",
          "Good night! May you find rest and comfort.",
        ];
        return (getRandomResponse(farewellResponses), farewellTopic);
      };
    };

    let gratitudeKeywords = [
      "thank you",
      "thanks",
      "appreciate",
      "grateful",
      "that helped",
      "thanks so much",
      "so helpful",
      "thankful",
    ];
    for (phrase in gratitudeKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let gratitudeTopic = "gratitude";
        let gratitudeResponses = [
          "You're very welcome! If there's anything more I can do, just let me know.",
          "I'm glad I could help in some way. Your well-being is important to me.",
          "It's my pleasure to support you. You're not alone in this.",
          "Thank you for your kind words. I'm here for you always.",
        ];
        return (getRandomResponse(gratitudeResponses), gratitudeTopic);
      };
    };

    let apologyKeywords = [
      "sorry",
      "my fault",
      "i messed up",
      "i failed",
      "blame myself",
      "apologize",
      "regret",
      "shouldn't have",
      "my mistake",
      "i'm sorry",
    ];
    for (phrase in apologyKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let apologyTopic = "apology";
        let apologyResponses = [
          "It's okay to make mistakes. Be gentle with yourself.",
          "Your feelings are valid, but try not to be too hard on yourself.",
          "We're all human and it's normal to feel this way. Remember, you're doing your best.",
          "Self-compassion is important. What can we learn from this experience?",
        ];
        return (getRandomResponse(apologyResponses), apologyTopic);
      };
    };

    let lonelinessKeywords = [
      "lonely",
      "alone",
      "no one cares",
      "isolated",
      "nobody understands",
      "nobody here",
      "feel left out",
      "all by myself",
    ];
    for (phrase in lonelinessKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let lonelinessTopic = "loneliness";
        let lonelinessResponses = [
          "Feeling lonely is something many people experience. It's okay to reach out for support.",
          "You're not truly alone, even if it feels that way. There are people who care about you.",
          "Isolation can be challenging. Let's explore ways to help you feel more connected.",
          "These feelings are valid. How much connection do you currently have with others?",
        ];
        return (getRandomResponse(lonelinessResponses), lonelinessTopic);
      };
    };

    let sadnessKeywords = [
      "sad",
      "crying",
      "depressed",
      "unhappy",
      "heartbroken",
      "miserable",
      "down",
      "blue",
      "tearful",
    ];
    for (phrase in sadnessKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let sadnessTopic = "sadness";
        let sadnessResponses = [
          "I'm sorry you're feeling sad. It's important to acknowledge your feelings.",
          "Crying and expressing sadness are healthy ways to cope. How long have you been feeling this way?",
          "Your emotions are valid. Want to share more about what's making you feel this way?",
          "It's okay to not be okay. Let's talk through this together.",
        ];
        return (getRandomResponse(sadnessResponses), sadnessTopic);
      };
    };

    let anxietyKeywords = [
      "anxious",
      "anxiety",
      "nervous",
      "worried",
      "panic",
      "scared",
      "afraid",
      "overthinking",
      "overthink",
      "stressed",
      "stressful",
      "panic attack",
      "worried about",
      "panic disorder",
    ];
    for (phrase in anxietyKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let anxietyTopic = "anxiety";
        let anxietyResponses = [
          "Anxiety can be overwhelming, but you're not alone in feeling this way.",
          "Let's work through your worries together. Do you want to talk about specific triggers?",
          "Breathing exercises might help calm you if you're experiencing physical symptoms.",
          "Your feelings are valid. Can you identify the cause of your anxiety?",
        ];
        return (getRandomResponse(anxietyResponses), anxietyTopic);
      };
    };

    let angerKeywords = [
      "angry",
      "furious",
      "pissed",
      "hate",
      "mad",
      "mad at",
      "snapped",
      "rage",
      "frustration",
      "mad",
      "furious",
    ];
    for (phrase in angerKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let angerTopic = "anger";
        let angerResponses = [
          "Feeling angry is a normal human emotion. Let's discuss what might be behind it.",
          "Anger can be overwhelming. Can you share more about the situation that triggered your feelings?",
          "It's okay to express anger in healthy ways. How do you typically manage these emotions?",
          "Sometimes anger masks other emotions. Can you tell me more about what's going on?",
        ];
        return (getRandomResponse(angerResponses), angerTopic);
      };
    };

    let stressKeywords = [
      "stressed",
      "overwhelmed",
      "too much",
      "burned out",
      "exhausted",
      "drained",
      "under pressure",
      "can't cope",
    ];
    for (phrase in stressKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let stressTopic = "stress";
        let stressResponses = [
          "Burnout is becoming increasingly common. Taking breaks and practicing self-care can be helpful.",
          "Feeling overwhelmed is natural. It's okay to ask for help or delegate tasks if possible.",
          "Stress can impact your mental and physical health. What activities normally help you relax?",
          "I'm here to support you through this tough time. Let's create a plan to help manage stress.",
        ];
        return (getRandomResponse(stressResponses), stressTopic);
      };
    };

    let selfWorthKeywords = [
      "not good enough",
      "worthless",
      "failure",
      "hate myself",
      "useless",
      "stupid",
      "i'm a burden",
      "low self-esteem",
      "insecure",
      "self-hate",
    ];
    for (phrase in selfWorthKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let selfWorthTopic = "self-worth";
        let selfWorthResponses = [
          "Experiencing self-doubt is common. You're important and valued.",
          "Try to challenge negative self-talk with gentle reminders. You have strengths and abilities.",
          "You're not as alone or worthless as you may feel. Seeking support is a sign of courage.",
          "Remember to practice self-compassion. Even small achievements matter.",
        ];
        return (getRandomResponse(selfWorthResponses), selfWorthTopic);
      };
    };

    let motivationKeywords = [
      "motivation",
      "goal",
      "dream",
      "giving up",
      "want to quit",
      "lost motivation",
      "lack motivation",
      "uninspired",
      "unmotivated",
    ];
    for (phrase in motivationKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let motivationTopic = "motivation";
        let motivationResponses = [
          "Motivation can fluctuate based on energy levels and stress. Focus on taking small steps.",
          "Losing motivation doesn't mean you're failing. Recognizing it is an opportunity to reassess your needs.",
          "Set realistic, manageable goals and celebrate small wins. It can help boost motivation.",
          "Sometimes we need rest and self-care before tackling big dreams. What motivates you on a good day?",
        ];
        return (getRandomResponse(motivationResponses), motivationTopic);
      };
    };

    let sleepKeywords = [
      "can't sleep",
      "insomnia",
      "nightmares",
      "no energy",
      "tired",
      "sleep issues",
      "restless",
      "physically drained",
    ];
    for (phrase in sleepKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let sleepTopic = "sleep";
        let sleepResponses = [
          "Sleep issues can significantly impact mental health. Have you tried relaxation techniques before bed?",
          "Keeping a consistent sleep schedule and staying hydrated can help with sleep patterns.",
          "Your body may be signaling the need for self-care. What helps you wind down at night?",
          "If you're struggling with persistent sleep problems, it might be helpful to consult a professional.",
        ];
        return (getRandomResponse(sleepResponses), sleepTopic);
      };
    };

    let relationshipsKeywords = [
      "relationship",
      "breakup",
      "broke up",
      "ex",
      "boyfriend",
      "girlfriend",
      "marriage",
      "divorce",
      "cheated",
      "partner",
    ];
    for (phrase in relationshipsKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let relationshipsTopic = "relationships";
        let relationshipsResponses = [
          "Relationship struggles are tough. Remember that it's normal for emotions to fluctuate.",
          "Communicating openly with your partner or loved ones is important for resolving conflicts.",
          "Heartbreak can feel overwhelming. It's okay to grieve and take time to heal.",
          "Healthy relationships require effort from both sides. What qualities are most important to you in your relationships?",
        ];
        return (getRandomResponse(relationshipsResponses), relationshipsTopic);
      };
    };

    let familyKeywords = [
      "family",
      "parents",
      "mom",
      "dad",
      "sibling",
      "toxic family",
      "strained family",
      "relationship with family",
    ];
    for (phrase in familyKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let familyTopic = "family";
        let familyResponses = [
          "Family dynamics are complex. Sometimes healthy boundaries are necessary.",
          "It's normal to have disagreements with family. Prioritize your own well-being in tough situations.",
          "Family support can be comforting during difficult times. Can you relate to any specific family member in a positive way?",
          "Open communication can help resolve conflicts with loved ones. Would you like tips on starting a conversation?",
        ];
        return (getRandomResponse(familyResponses), familyTopic);
      };
    };

    let workKeywords = [
      "work",
      "job",
      "boss",
      "school",
      "exam",
      "deadline",
      "career",
      "university",
      "lose my job",
      "workplace stress",
      "student life",
    ];
    for (phrase in workKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let workTopic = "work";
        let workResponses = [
          "Balancing work or school responsibilities can be challenging. Establishing a routine may help.",
          "If you're worried about exams or deadlines, try to break tasks into manageable parts.",
          "Addressing workplace conflicts early is important. Would you like tips on communication?",
          "Work-life balance is crucial for well-being. What activities help you manage stress at work or school?",
        ];
        return (getRandomResponse(workResponses), workTopic);
      };
    };

    let existentialKeywords = [
      "what's the point",
      "meaning of life",
      "purpose",
      "feel empty",
      "numb",
      "no direction",
      "lost in life",
      "existential crisis",
    ];
    for (phrase in existentialKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let existentialTopic = "existential";
        let existentialResponses = [
          "Feeling lost or questioning meaning is a common human experience. Taking time for self-reflection can be helpful.",
          "It's okay to feel disconnected sometimes. Try to identify small things that bring you happiness or purpose.",
          "Exploring your values and interests may offer clarity during times of confusion.",
          "Everyone experiences periods of uncertainty. I'm here to support you in finding purpose and direction.",
        ];
        return (getRandomResponse(existentialResponses), existentialTopic);
      };
    };

    let confusionKeywords = [
      "confused",
      "don't know what to do",
      "uncertain",
      "lost",
      "what should i do",
      "indecisive",
      "possible solutions",
      "can't make a decision",
    ];
    for (phrase in confusionKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let confusionTopic = "confusion";
        let confusionResponses = [
          "Decision-making can be tough, especially when emotions are high. Take your time and go easy on yourself.",
          "It's okay to feel uncertain. Let me know more about the situation and together we can find options.",
          "Clarifying your goals and priorities can help when faced with difficult choices.",
          "When you're ready, talking through your indecision may offer clarity and peace of mind.",
        ];
        return (getRandomResponse(confusionResponses), confusionTopic);
      };
    };

    let assistantKeywords = [
      "who are you",
      "are you real",
      "are you human",
      "are you an AI",
      "where do you live",
      "how do you work",
      "what can you do",
    ];
    for (phrase in assistantKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let assistantTopic = "assistant";
        let assistantResponses = [
          "I'm here to offer a supportive, listening ear and help you navigate life's challenges.",
          "I'm always available to chat and provide guidance when needed. You can count on me.",
          "Think of me as a caring companion. My main role is to be here for you whenever you need to talk.",
          "I'm designed to be a safe, welcoming space for you to share your thoughts and feelings.",
        ];
        return (getRandomResponse(assistantResponses), assistantTopic);
      };
    };

    let complimentKeywords = [
      "you're great",
      "you're amazing",
      "you're helpful",
      "you understand me",
      "wonderful support",
      "awesome assistant",
      "so intelligent",
      "kind hearted",
      "great listener",
    ];
    for (phrase in complimentKeywords.values()) {
      if (lowerMessage.contains(#text phrase)) {
        let complimentTopic = "compliment";
        let complimentResponses = [
          "Thank you so much for your kind words. Your well-being is important to me.",
          "I appreciate your feedback and will continue providing the best support I can.",
          "\"Your happiness and growth mean the world to me.",
          "Hearing this makes my day. Let me know how I can continue to assist you.",
        ];
        return (getRandomResponse(complimentResponses), complimentTopic);
      };
    };

    if (not isValidInput(userMessage)) {
      return (
        "Could you clarify your request? I'm not sure I understood.",
        "unclear"
      );
    };

    if (
      lowerMessage == "yes"
      or lowerMessage == "no"
      or lowerMessage == "idk"
      or lowerMessage == "maybe"
      or lowerMessage.size() < 20
    ) {
      switch (lastTopic) {
        case (?topic) {
          let followUp = provideFollowUp(lowerMessage, ?topic);
          return (followUp, topic);
        };
        case (null) {
          let followUp = provideFollowUp(lowerMessage, null);
          return (followUp, "general");
        };
      };
    };

    let defaultTopic = "general";
    let defaultResponses = [
      "I'm here to listen and support you. Whatever is on your mind, feel free to share.",
      "Thank you for opening up to me. Can you tell me more about how you're feeling?",
      "Your thoughts and feelings are valid. What would you like to focus on today?",
      "Remember, it's okay to have difficult days. How can I help you right now?",
      "I'm happy to listen and help work through any challenges you may be facing.",
      "Let's work together to find ways to improve your well-being. Is there a specific area you'd like support with?",
      "I'm here as a non-judgmental space. You can be completely open and honest with me.",
      "Your mental health is important. Taking this step to talk is something to be proud of.",
    ];
    return (
      getRandomResponse(defaultResponses),
      defaultTopic
    );
  };

  func getUserData(caller : Principal) : UserData {
    switch (users.get(caller)) {
      case (?data) { data };
      case (null) {
        let newData : UserData = {
          assistantName = null;
          chatHistory = List.empty<Message>();
          lastTopic = null;
        };
        users.add(caller, newData);
        newData;
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    let userData = switch (users.get(caller)) {
      case (?data) { data };
      case (null) { return null };
    };
    ?{
      assistantName = userData.assistantName;
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    let userData = switch (users.get(user)) {
      case (?data) { data };
      case (null) { return null };
    };
    ?{
      assistantName = userData.assistantName;
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let userData = getUserData(caller);
    users.add(caller, {
      assistantName = profile.assistantName;
      chatHistory = userData.chatHistory;
      lastTopic = userData.lastTopic;
    });
  };

  public shared ({ caller }) func sendMessage(content : Text) : async Message {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    if (content.size() == 0) {
      Runtime.trap("Message content cannot be empty");
    };

    let userData = getUserData(caller);
    let userMessage : Message = {
      role = #user;
      content;
      timestamp = Time.now();
    };
    userData.chatHistory.add(userMessage);

    let lastTopic = userData.lastTopic;
    let (replyContent, newTopic) = generateReply(content, lastTopic, userData.assistantName);
    let assistantMessage : Message = {
      role = #assistant;
      content = replyContent;
      timestamp = Time.now();
    };
    userData.chatHistory.add(assistantMessage);

    users.add(caller, {
      assistantName = userData.assistantName;
      chatHistory = userData.chatHistory;
      lastTopic = ?newTopic;
    });

    assistantMessage;
  };

  public query ({ caller }) func getMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access messages");
    };
    let userData = getUserData(caller);
    userData.chatHistory.toArray();
  };

  public shared ({ caller }) func clearHistory() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear history");
    };
    let userData = getUserData(caller);
    users.add(caller, {
      assistantName = userData.assistantName;
      chatHistory = List.empty<Message>();
      lastTopic = userData.lastTopic;
    });
  };

  public shared ({ caller }) func setAssistantName(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set assistant name");
    };
    let userData = getUserData(caller);
    users.add(caller, {
      assistantName = ?name;
      chatHistory = userData.chatHistory;
      lastTopic = userData.lastTopic;
    });
  };

  public query ({ caller }) func getAssistantName() : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access assistant name");
    };
    let userData = getUserData(caller);
    userData.assistantName;
  };

  public query ({ caller }) func hasAssistantName() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check assistant name");
    };
    let userData = getUserData(caller);
    userData.assistantName != null;
  };
};
