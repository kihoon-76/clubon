import type { DeepPartial } from "@/lib/i18n/types";
import type { Dictionary } from "@/lib/i18n/dictionaries/ko";

/**
 * English — the fallback dictionary.
 *
 * Every locale that has no translations of its own lands here, so this file
 * should stay complete. Missing keys fall through to Korean, which most
 * readers of this file cannot read.
 */
export const en: DeepPartial<Dictionary> = {
  site: {
    title: "ClubOn — a private social club, wherever you are",
    description:
      "An adults-only online social club where you meet through conversation instead of swiping profiles. Walk in with your friends and meet new people — no travel, no waiting in line.",
    ogAlt: "ClubOn — tonight, switch the club on",
    ogLocale: "en_US",
  },
  common: {
    language: "Language",
    close: "Close",
    back: "Back",
    interests: "Interests",
    mock: "Mock",
    mockTitle:
      "This is a demo mock. The real external service is not connected yet.",
  },
  nav: {
    pricing: "Pricing",
    safety: "Safety",
    lobby: "Lobby",
    login: "Log in",
    signup: "Sign up",
    enterNow: "Enter now",
    logout: "Log out",
    dashboard: "My page",
    mainMenu: "Main menu",
    home: "Go to the ClubOn home page",
    toLobby: "Go to the club lobby",
    adminConsole: "Admin console",
    myDashboard: "My page",
    open: "Open",
    closed: "Closed",
  },
  auth: {
    signupTitle: "Sign up",
    email: "Email",
    password: "Password",
    passwordHint: "At least 8 characters. Use a password unique to this site.",
    passwordConfirm: "Confirm password",
    gender: "Gender",
    female: "Female",
    male: "Male",
    genderLocked:
      "Matching is based on this, so it cannot be changed after you sign up.",
    signupSubmit: "Sign up and verify age",
    signupPending: "Signing up…",

    demoTitle: "Demo accounts",
    demoIntro:
      "No database is connected yet, so this runs on in-memory demo data. Use the accounts below to look around — everything resets when the server restarts.",
    demoMember: "Member · Hana",
    demoHost: "Other lounge's host · Doyun",
    demoAdmin: "Admin",
    demoPassword: "Shared password",
    demoSwitchLabel: "Switch demo member",
    demoSwitchTitle: "Look around without logging in — switch demo member",
    demoSwitch: "Switch",
    roleAdmin: "Admin",
    roleModerator: "Moderator",
    roleUser: "Member",

    signupEyebrow: "Entry request",
    signupHeadline: "Join the club",
    signupIntro:
      "Adults 19 and over only. After signing up you go through an age check and consent.",
    googleSignup: "Sign up with Google",
    legalNoticeBefore: "When you sign up we ask, in the next step, for your consent to the",
    legalNoticeBetween: "and the",
    legalNoticeAfter: ".",
    haveAccount: "Already a member?",

    loginEyebrow: "Member entrance",
    loginTitle: "Welcome back",
    loginIntro: "We'll show you to tonight's seat.",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "At least 8 characters",
    loginSubmit: "Enter",
    loginPending: "Entering…",
    noAccount: "Not a member yet?",
    or: "or",
    google: "Continue with Google",
    errors: {
      google_unavailable: "Google sign-in is not set up yet.",
      google_cancelled: "You cancelled Google sign-in.",
      google_state:
        "That sign-in request has expired or is not valid. Please try again.",
      google_failed:
        "We could not verify your Google account. Please try again shortly.",
      account_restricted:
        "This account is restricted. Please contact the safety centre.",
    },
  },
  options: {
    gender: {
      female: "Women",
      male: "Men",
      any: "No preference",
      other: "Prefer not to say",
    },
    energy: { relaxed: "Relaxed", balanced: "Balanced", lively: "Lively" },
    interests: {
      travel: "Travel",
      food: "Food",
      music: "Music",
      jazz: "Jazz",
      movies: "Film",
      photography: "Photography",
      exhibitions: "Exhibitions",
      cafes: "Cafés",
      books: "Books",
      running: "Running",
      fitness: "Fitness",
      games: "Games",
    },
    ageBands: {
      "20s": "20s",
      "30s": "30s",
      "40s": "40s",
      "50s": "50s",
      "60s": "60s",
    },
  },
  products: {
    entry_pass: {
      name: "Lounge entry fee",
      tagline: "Comes with 5 room matches",
      f1: "5 room matches",
      f2: "1 match = one 30-minute conversation",
      f3: "Matched by an AI lounge manager",
      f4: "Same price for everyone",
    },
    match_1: {
      name: "1 room match",
      tagline: "When you need just one more seat",
      f1: "1 room match",
      f2: "One 30-minute conversation",
    },
    extend_30: {
      name: "Extend 30 minutes",
      description: "Keeps this room going for another 30 minutes.",
    },
    gift_extend_30: {
      name: "Gift 30 minutes",
      description:
        "Extends the room by 30 minutes on behalf of whoever opened it.",
    },
  },
  regions: {
    global: "Global · Worldwide",
    korea: "South Korea",
    "kr-seoul": "Seoul",
    "kr-gyeonggi": "Gyeonggi",
    "kr-incheon": "Incheon",
    "kr-daejeon": "Daejeon",
    "kr-daegu": "Daegu",
    "kr-busan": "Busan",
    "kr-gwangju": "Gwangju",
    "kr-jeju": "Jeju",
    "kr-chungnam": "South Chungcheong",
    "kr-chungbuk": "North Chungcheong",
    "kr-jeonbuk": "North Jeolla",
    "kr-jeonnam": "South Jeolla",
    "kr-gyeongbuk": "North Gyeongsang",
    "kr-gyeongnam": "South Gyeongsang",
    "kr-islands": "Outer islands (Baengnyeong, Yeonpyeong, Heuksan, Ulleung…)",
  },
  entry: {
    eyebrow: "Entry request",
    metaTitle: "Entry request",
    seatName: "{nickname}'s seat",
    title: "Open tonight's seat",
    intro:
      "The {price} entry fee includes {matches} room matches. One match is a {minutes}-minute conversation, and everyone pays the same regardless of gender.",
    remaining: "Room matches left",
    times: "{count}",
    step1Title: "Where would you like to meet?",
    step1Hint: "We connect members in the same region.",
    step2Title: "Who should host you?",
    step2Hint: "Your AI lounge manager finds people who fit your conditions.",
    step3Title: "Who would you like to meet?",
    step3Hint:
      "Your manager picks the lounge with the most in common with these answers.",
    country: "Country",
    krRegion: "Province · City",
    select: "Select",
    regionNote:
      "We only look within your region. Quieter regions may take longer to match.",
    globalNote:
      "Global mode can match your lounge with people anywhere in the world.",
    aiDisclaimer:
      "AI lounge managers are digital personas that help conversation. They are not real people.",
    desiredGender: "Preferred gender",
    energy: "Conversation energy",
    interests: "Interests (choose any number)",
    ageBands: "Preferred age range (choose any number)",
    submit: "Request entry",
    submitPending: "Submitting…",
    accepted: "Received",
    summaryTitle: "Your request",
    region: "Region",
    regionUnset: "No region set",
    manager: "AI lounge manager",
    managerUnset: "Not set",
    findMatch: "Find someone with these conditions",
    noMatch:
      "No one in this region matches your conditions right now. Try again shortly, or widen your conditions.",
    needPayment:
      "You have no room matches left. Pay the entry fee to get {matches} of them and start looking right away.",
    pay: "Pay for {name} · {price}",
    notConfigured: "Payments are not connected yet. Opening soon.",
    reset: "Change my conditions",
    toLobby: "Back to lobby",
    checking:
      "We are confirming your payment. Your matches will appear on this screen once it clears — please refresh in a moment.",
    deductNote:
      "A match is spent when you enter the video room, not when you request entry. If no one is found, or the two lounges never meet, nothing is spent. Once inside, one match is spent per participant.",
    errors: {
      region: "Please choose your region again.",
      invalid: "Please check the answers you gave.",
      unavailable: "That item is not on sale right now.",
      unknown: "We do not recognise that item.",
      not_configured: "Payments are not connected yet. Please try again shortly.",
      creem_error: "We could not open the checkout page. Please try again shortly.",
    },
  },
  tableState: {
    FORMING: "Forming",
    READY: "Ready to match",
    WAITING: "Waiting for a match",
    MATCH_PROPOSED: "Match proposed",
    MATCH_ACCEPTED: "Getting ready to meet",
    LIVE: "In conversation",
    PAUSED: "Paused",
    CLOSED: "Closed",
    MODERATION_LOCKED: "Locked",
  },
  dashboard: {
    eyebrow: "My page",
    greeting: "{nickname}",
    member: "Member",
    feedbackThanks: "Thank you for your feedback.",
    purchaseProcessing:
      "We are confirming your payment. Once it clears, your room matches land in your wallet automatically. Please refresh this page in a moment.",
    purchaseCancelled: "You cancelled the payment. No matches were spent.",

    club: "Club",
    open: "Open",
    closed: "Closed",
    toLounge: "Go to my lounge",
    toLobby: "Enter the club lobby",

    profile: "Profile",
    vibe: "Conversation style",
    reputation: "Reputation",
    points: "{count}",
    editProfile: "Edit profile",

    history: "Conversation history",
    historyEmpty: "You have not joined a conversation yet.",
    sessionEnded: "Ended",
    sessionLive: "Live",
    myRating: "You rated {rating}",
    leaveFeedback: "Leave feedback",

    safety: "Safety and consent",
    accountStatus: "Account status",
    statusActive: "Good standing",
    statusSuspended: "Suspended",
    statusRestricted: "Restricted",
    requiredConsent: "Required consent",
    completed: "Complete",
    blockedMembers: "Members you blocked",
    people: "{count}",
    optionalConsent: "Optional consent",
    granted: "Agreed",
    notGranted: "Not agreed",
    changeConsent: "Change consent settings",
    safetyCenter: "Safety centre",
  },
  club: {
    alwaysOpen: "Always open",
    until: "until {time}",
    opensAt: "opens {time}",
    open: "Open",
    hoursUnknown: "Hours to be announced",
  },
  legal: {
    updatedAt: "Last updated {date}",
    draft: "Draft",
  },
  safety: {
    metaTitle: "Safety centre",
    metaDescription:
      "ClubOn's safety principles, no-recording policy, and how to report.",
    eyebrow: "Safety centre",
    title: "A comfortable conversation starts with safety",
    intro:
      "Here are the principles ClubOn keeps to protect its members, and what you can do if something goes wrong.",

    p1Title: "You only meet as a group",
    p1Body:
      "Lounges meet as groups. A shared room starts with at least 2 people, and if the count drops below that the session pauses and everyone returns to a waiting lounge.",
    p2Title: "Your camera and mic are yours to control",
    p2Body:
      "You can turn your camera and microphone off at any time and stay in the conversation. If a moderation action limits your video, it is blurred or replaced by an avatar.",
    p3Title: "You can leave or report at any time",
    p3Body:
      "Reporting and blocking are always one tap away inside the room. Once you block someone, you never meet them in future matches either.",
    p4Title: "Filming and recording are prohibited",
    p4Body:
      "We confirm this twice: at sign-up and before entering a room. The screen carries a watermark with a user identifier and a timestamp.",

    recordingTitle: "No-recording policy",
    recordingBody:
      "Capturing, recording, filming, or sharing another participant's video, audio, or personal information is prohibited. Violations may lead to a permanent ban and legal liability under applicable law.",
    recordingLimits:
      "The platform cannot technically block every screenshot or recording made with a separate device. That is why dynamic watermarks, repeated confirmations, and reporting and enforcement all run together.",

    reportTitle: "How to report",
    report1: "Tap the report button on that participant inside the room.",
    report2: "Choose a reason, and describe what happened if you want to.",
    report3:
      "You can block the participant at the same time — once blocked, their messages stop reaching you.",
    report4:
      "Staff review the report and decide on a warning, a limit, a suspension, or another action.",
    reportUrgent:
      "If you believe there is an urgent risk, leave the session first and then report. Automated moderation cannot be guaranteed to catch every violation.",

    legalKoreanOnly:
      "This document is currently available in Korean only. A translation goes up once it has been through legal review.",
  },
  footer: {
    blurb:
      "An adults-only online social club. Group meetings through conversation — no alcohol, no travel.",
    groupClub: "Club",
    howItWorks: "How it works",
    groupSafety: "Safety and trust",
    safetyCenter: "Safety centre",
    recordingPolicy: "No-recording policy",
    groupLegal: "Legal",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    adultsOnly:
      "For adults aged 19 and over. This is not a dating-match or adult entertainment service — it is a social club for group conversation.",
    noRecording:
      "Capturing, recording, filming, or sharing another participant's video, audio, or personal information is prohibited. Violations may lead to a permanent ban and legal liability under applicable law.",
  },
  landing: {
    badge: "19+ · members only · alcohol-free",
    heroLine1: "Wherever you are,",
    heroLine2: "a private social club.",
    heroBody:
      "You meet through conversation, not by swiping profiles. Sit at one table with your friends, and start talking with the lounge you are matched with.",
    heroCta: "Request entry",
    heroSecondary: "See how it works",
    heroNote:
      "There is no 1-to-1 matching. Every conversation starts as a group of at least two.",
    liveNow: "Live on ClubOn",
    liveNote: "Signed-in users active within the last 90 seconds, refreshed every 15 seconds.",
    liveUsers: "Online now",
    waitingLounges: "Waiting",
    liveRooms: "In conversation",
    scrollDown: "Scroll down",

    uspEyebrow: "What makes ClubOn different",
    uspHeadline: "Tonight, the most memorable way to meet",
    uspHeadlineAccent: "someone new",
    uspSub1: "A private online lounge — no travel, no waiting in line.",
    uspSub2:
      "Walk in with your friends and meet new people at your own pace.",
    uspCta: "Explore the lounges",
    uspSignature: "CLUB ON — the online social lounge",

    priceEyebrow: "Lounge pricing",
    priceTitle: "Lounge pass ₩30,000",
    priceBody: "No extra charges — yours for the full session.",

    howEyebrow: "How it works",
    howTitle: "Start at one table, meet another",
    howBody:
      "ClubOn is not random video chat. It opens at set hours, you enter as a group, and a match happens only when both sides agree.",
    step1Title: "Verify your age, then enter",
    step1Body:
      "You register as a member after a year-of-birth check and item-by-item consent.",
    step2Title: "Form a table",
    step2Body:
      "Make a table of 1–4 people, or join a friend's table with their invite code. On your own, you can still look for another lounge right away.",
    step3Title: "An AI lounge manager matches you",
    step3Body:
      "Your manager finds a lounge that fits, based on interests, languages, and conversation energy.",
    step4Title: "Both tables accept",
    step4Body:
      "The shared room opens only when both tables agree. Neither side is pushed into it.",
    step5Title: "Talk in the shared room",
    step5Body:
      "The two lounges share one screen and one sound. You can turn your camera and mic off whenever you like.",
    step6Title: "For as long as the session runs",
    step6Body:
      "A seat runs 30 minutes. If the conversation is going well, you can pay to extend it.",

    waiterEyebrow: "AI lounge manager",
    waiterTitle: "Finds the lounge that fits and connects you",
    waiterBody:
      "Your AI lounge manager checks what your lounge enjoys and who you want to meet, finds the closest fit, and explains why. It never rates or ranks appearance, and never pushes you to accept.",
    waiterPromise1: "Never rates or ranks appearance",
    waiterPromise2: "Never reveals another member's private profile details",
    waiterPromise3: "Never promises a match or a romantic outcome",
    waiterSample: "Sample conversation",
    waiterLine1:
      "Good evening. Would you prefer a relaxed conversation, a lively one, or talk about travel tonight?",
    waiterLine2:
      "I have found the lounge that best fits what you asked for. Shall I introduce you?",
    waiterLine3:
      "Both lounges have accepted. Your shared room opens in 10 seconds.",

    safetyEyebrow: "Safety and trust",
    safetyTitle: "Comfort starts with safety",
    safety1Title: "Adults only",
    safety1Body:
      "Only members who have passed a year-of-birth and identity check can enter.",
    safety2Title: "Group conversation",
    safety2Body:
      "Lounges meet as groups. A shared room starts with at least two people.",
    safety3Title: "Live moderation",
    safety3Body:
      "Messages are screened before delivery, violations escalate in steps, and staff review them.",
    safety4Title: "No recording",
    safety4Body:
      "Consent and watermarks deter it, and reported violations lead to suspension or worse.",
    safetyNote:
      "Moderation combines automated screening with human review, but cannot be guaranteed to catch every violation. The platform also cannot technically block every screenshot or off-device recording. That is why watermarks and reporting run together.",

    hoursTitle: "Open 24/7",
    hoursBody: "Available worldwide at any time, regardless of time zone.",
    hoursCta: "Sign up ahead of time",

    closingLine1: "An evening where conversation comes first,",
    closingLine2: "opening tonight.",
    closingBody: "A truer kind of meeting, at a far lower cost.",
    closingSecondary: "See membership",
  },
  roomChat: {
    system: "System",
    opened:
      "The two lounges have met. {waiter} is hosting this evening's seat. Start with a hello and take it from there.",
    noRecording:
      "Capturing, recording, filming, or sharing another participant's video, audio, or personal information is prohibited.",
    left: "{nickname} has left.",
    ended: "The session has ended. ({reason})",
    endedByHost: "The host ended it.",
    paused:
      "The room dropped below the minimum of {min} participants, so the conversation is paused.",
    resumed: "Enough people are back — the conversation resumes.",

    action: "A community-standards action was applied to {nickname}: {action}",
    actionLogOnly: "logged only",
    actionReviewMute: "awaiting staff review · muted",
    actionMute: "muted",
    actionBlur: "video blurred",
    actionWarn: "warned",

    sim1: "Hi everyone, good to meet you :)",
    sim2: "How has your day been?",
    sim3: "Lately I love a walk after work.",
    sim4: "This lounge has a nice feel to it.",
    sim5: "Seen anything good recently you'd recommend?",
    sim6: "Get me started on travel and I'll be up all night.",
    sim7: "Feels like we have similar taste in music.",

    ice1: "What's the most recent moment that made you think 'that was really good'?",
    ice2: "Is there a city you would go back to in a heartbeat?",
    ice3: "Name one song you have had on repeat lately.",
    ice4: "If you could design one perfect weekend day, what would it look like?",
  },
  room: {
    extendHint:
      "If the conversation is going well, you can extend it. Extensions cost money rather than matches.",
    extendGiftHint:
      "You can extend the room on behalf of whoever opened this seat. The extra time applies to everyone here.",

    myLounge: "Our lounge",
    otherLoungeName: "The other lounge",
    alsoHere: "Also here",
    blockedTag: "Blocked",
    audienceNote:
      "One device in this lounge carries its picture and sound. Like a meeting-room camera, each room connects once — on this screen you use the chat and the timer.",
    audienceControls:
      "The microphone and camera are controlled from this lounge's device. Opening several microphones in one room causes echo.",

    stateLive: "Live",
    statePaused: "Paused",
    stateLocked: "Locked",
    stateEnded: "Ended",
    participantCount: "{count} here",
    pausedNote:
      "The room dropped below the minimum of 2 participants, so the conversation is paused. It resumes automatically once people are back.",
    endedNote: "This session has ended.",
    extendFailed: "We could not start the extension payment.",
    extendChecking:
      "We are confirming your extension payment. Once it clears, your remaining time grows automatically.",
    micOff: "Mute microphone",
    micOn: "Unmute microphone",
    camOff: "Turn camera off",
    camOn: "Turn camera on",
    endSession: "End session",
    leave: "Leave",
    mutedNote:
      "Your microphone is locked by a moderation action. It is unlocked after staff review.",
    extendErrors: {
      no_usage: "The video has not started yet, so there is no time to extend.",
      closed: "This seat has already closed, so it cannot be extended.",
      unavailable: "That item is not on sale right now.",
      not_configured: "Payments are not connected yet. Please try again shortly.",
      creem_error: "We could not open the checkout page. Please try again shortly.",
    },

    timerLabel: "Time left in the lounge",
    timeLeft: "Time left",
    extendedApplied: "{minutes} min added",
    warn1: "The video connection ends in 1 minute.",
    warn5: "The video connection ends in 5 minutes.",
    timeUp: "Your {minutes} minutes are up and the video connection has ended.",
    timeUpHasMatches:
      "You have {count} room matches left. Request entry again to start the next {minutes} minutes.",
    timeUpNoMatches: "Buy one more room match to open a new seat.",
    newSeat: "Request a new seat",
    topUpMatches: "Top up room matches",

    otherLounge: "the other lounge",

    chatTitle: "Chat",
    chatNotice:
      "Messages go through automated screening. Automated detection may not catch every violation.",
    chatLogLabel: "Chat history",
    chatBlocked: "not sent",
    chatFlagged: "under review",
    chatPlaceholder: "Type a message",
    chatPlaceholderDisabled: "You cannot send messages right now",
    chatSend: "Send message",

    me: "You",
    host: "Host",
    demo: "Demo",
    statusWarned: "Warned",
    statusRestricted: "Video limited",
    statusMuted: "Muted",
    statusRemoved: "Removed",
    blurredNote: "The video is blurred by a moderation action.",
    micIsOn: "Microphone on",
    micIsOff: "Microphone off",
    blockedNote: "You have blocked this participant.",
    report: "Report",
    block: "Block",

    reportTitle: "Report {nickname}",
    reportIntro:
      "A moderator reviews every report we receive. The related chat history is kept until the review is finished.",
    reportReason: "Reason",
    reportReasonPlaceholder: "Choose a reason",
    reportDetail: "Details (optional)",
    reportDetailPlaceholder:
      "Telling us what happened helps with the review.",
    reportBlockToo:
      "Block this member too. Once blocked, you stop seeing their messages and their video.",
    reportCancel: "Cancel",
    reportSubmit: "Submit report",
    reportPending: "Submitting…",

    videoConnecting: "Connecting video…",
    videoNoMatches: "You have no room matches left, so you cannot join the video.",
    videoNoMatchesBody:
      "Each person spends one match on entering the room. Buy one more and you can join straight away — the chat keeps going in the meantime.",
    videoTopUp: "Top up matches",
    videoExpired: "This lounge's {minutes} minutes are up.",
    videoUnconfigured:
      "The video server is not configured, so this runs as chat only, without audio or video.",
    videoError: "The video connection failed. Chat continues as normal.",
    cameraPreviewLabel: "My camera preview",
    cameraOff: "Camera off",
    cameraDenied: "Without camera permission you join as an avatar.",
    cameraOpening: "Opening camera…",
  },
  feedback: {
    metaTitle: "Session feedback",
    roomMetaTitle: "Lounge conversation room",
    eyebrow: "Wrapping up",
    title: "How was tonight's seat?",
    intro:
      "Your rating is used only to improve future matches, and is never shown to other participants.",
    already: "You have already left feedback for this session. ({rating}{vibe})",
    backToLobby: "Back to the lobby",
    myRecords: "See my history",

    editEyebrow: "Profile",
    editTitle: "Edit profile",
    editIntro:
      "This is what your lounge manager uses when finding you a seat. Saving applies it from your next match onward.",
    saveChanges: "Save changes",
    backToDashboard: "Back to my page",

    ratingLegend: "How was this seat?",
    ratingPoint: "{n}",
    vibeLegend: "Mood (optional)",
    vibeRelaxed: "Relaxing",
    vibeFun: "Fun",
    vibeDeep: "Meaningful",
    vibeDisappointing: "Disappointing",
    rematch: "I'd like to meet this lounge again.",
    comment: "Anything to add (optional)",
    commentPlaceholder: "Tell us anything that would help us run this better.",
    submit: "Send feedback",
    pending: "Sending…",
  },
  moderation: {
    minorContact: "References to minors are not allowed.",
    prostitution: "Language that reads as solicitation is not allowed.",
    threat: "Language that reads as a threat is not allowed.",
    sexualHarassment:
      "Language that reads as sexual harassment is not allowed.",
    hateSpeech: "Hate speech is not allowed.",
    harassment: "Insulting language is not allowed.",
    paymentSolicitation: "Language that reads as asking for money is not allowed.",
    contactInfo:
      "Phone numbers, email addresses, and other outside contact details cannot be shared — they raise the risk of harm outside the club.",
    socialHandle: "Sharing outside social accounts is discouraged.",
    spam: "External links are subject to review.",
    repeat: "Flooding by repeating the same character is not allowed.",
    blockedFallback: "This message could not be sent.",
    flaggedFallback: "This message is subject to review.",
    notParticipant: "You are not taking part in this room.",
    emptyMessage: "You cannot send an empty message.",
    reportInvalid: "Please check the details of your report.",
    reportSelf: "You cannot report yourself.",
    feedbackInvalid: "Please choose a rating.",
  },
  reportCategories: {
    harassment: "Harassment or insults",
    hate: "Hate speech",
    sexual: "Sexual harassment",
    threat: "Threats",
    recording: "Signs of recording",
    minor: "Suspected minor",
    spam: "Spam or off-platform solicitation",
    other: "Other",
  },
  wallet: {
    title: "My room matches",
    buyEntry: "Pay the entry fee",
    requestEntry: "Request entry",
    remaining: "Matches left",
    remainingHint: "1 match = one {minutes}-minute conversation",
    purchased: "Bought in total",
    purchasedHint: "Everything bought, including anything later refunded",
    times: "{count}",
    spendNote:
      "A match is spent when you actually enter the video room. Nothing is spent while you wait for a match.",
    pricingLink: "See pricing",

    payments: "Purchases",
    paymentsEmpty: "No purchases yet.",
    matchesGiven: "{count} room matches",
    refundedAt: "refunded {at}",
    statusPaid: "Paid",
    statusPending: "Confirming",
    statusRefunded: "Refunded",
    statusFailed: "Failed",

    seats: "Seats you opened",
    seatsHint:
      "Rooms you opened by asking for a match. Seats you joined by invitation are not listed here, but everyone still spends one match each.",
    seatsEmpty: "You have not opened a seat yet.",
    seat: "{minutes}-minute seat",
    extendedBy: "extended by {minutes} min",
    usageActive: "Live",
    usageEnded: "Ended",
    usageExpired: "Time up",
  },
  onboarding: {
    stepsLabel: "Steps before you enter",
    stepAdult: "Age check",
    stepConsent: "Consent",
    stepProfile: "Profile",
    stepDone: "done",

    adultTitle: "Age check",
    adultIntro:
      "ClubOn is for adults aged 19 and over. Enter your year of birth so we can confirm that.",
    birthYear: "Year of birth",
    birthYearHint:
      "We check the year only. We never store your full date of birth or any ID image.",
    birthYearPlaceholder: "e.g. 1994",
    adultCheckbox:
      "I am 19 or older and understand that ClubOn is an adults-only service.",
    adultSubmit: "Confirm and continue",
    adultPending: "Checking…",

    consentTitle: "Consent",
    consentIntro:
      "Please read each item and give your consent. You can enter without agreeing to the optional ones.",
    consentNotice:
      "Automated moderation cannot be guaranteed to catch every violation. The platform also cannot fully prevent screenshots or recording with a separate device.",
    required: "Required",
    optional: "Optional",
    consentAll: "Agree to all",
    consentSubmit: "Agree and set up my profile",
    consentPending: "Saving…",

    profileTitle: "Your profile",
    profileIntro:
      "This is what your lounge manager uses when finding you a seat. We do not collect anything about your appearance.",
  },
  consent: {
    terms_of_service: {
      title: "Terms of Service",
      body: "I agree to the ClubOn Terms of Service.",
    },
    privacy_policy: {
      title: "Privacy Policy",
      body: "I agree to how my personal data is collected, used, and retained.",
    },
    adult_only: {
      title: "Adults only",
      body: "I am 19 or older and understand this is an adults-only service.",
    },
    camera_microphone: {
      title: "Camera and microphone",
      body: "I agree to my camera and microphone being used for video conversation.",
    },
    ai_text_moderation: {
      title: "AI text moderation",
      body: "I agree that chat messages are subject to automated screening. Automated detection may not catch every violation.",
    },
    anti_recording: {
      title: "No recording",
      body: "I will not capture, record, film, or share another participant's video, audio, or personal information. Doing so may lead to a permanent ban and legal liability.",
    },
    community_standards: {
      title: "Community standards",
      body: "I will not harass, use hate speech, or sexually harass anyone, and I will take part in conversation with mutual respect.",
    },
    ai_video_moderation: {
      title: "AI video safety screening (optional)",
      body: "I agree to safety screening of video frames. The video itself is not stored — only the screening result is recorded.",
    },
  },
  profile: {
    nickname: "Nickname",
    nicknameHint:
      "This is the name shown in the club. We do not recommend using your real name.",
    nicknamePlaceholder: "2–20 characters",
    gender: "Gender",
    genderLocked: "You chose this when you signed up, so it cannot be changed.",
    ageBand: "Age range",
    vibe: "In conversation I am",
    interests: "Interests (at least one)",
    languages: "Languages you speak",
    region: "Region (optional)",
    regionPlaceholder: "e.g. Seoul",
    bio: "One-line intro (optional)",
    bioPlaceholder: "Say briefly what kind of conversation you enjoy.",
    save: "Save profile and enter",
    savePending: "Saving…",
    errors: {
      nicknameShort: "Your nickname must be at least 2 characters.",
      nicknameLong: "Your nickname must be 20 characters or fewer.",
      interestsEmpty: "Please choose at least one interest.",
      genderMissing: "Please choose your gender.",
      invalid: "Please check what you entered.",
      adultUnchecked: "Please confirm that you are 19 or older.",
      birthYearInvalid: "Please enter your year of birth correctly.",
      tooYoung: "This is an adults-only service for people aged {age} and over.",
      consentMissing: "You must agree to every required item before entering.",
    },
  },
  waiters: {
    fallbackName: "Lounge manager",
    dohyun: {
      name: "Dohyun",
      epithet: "The classic host",
      outfit: "Classic black-tie tuxedo",
      tagline: "Opens your first seat with impeccable form.",
      personality:
        "Calm and courteous, and never loses his composure in any moment.",
      s1: "Eases first-meeting nerves",
      s2: "Gracious service",
      s3: "Formal hosting",
      specialty:
        "Settles the mood with a well-mannered introduction so members new to the lounge feel at ease.",
    },
    ian: {
      name: "Iseo",
      epithet: "The conversation curator",
      outfit: "Three-piece tailored suit",
      tagline: "Reads your taste and picks tonight's topic with elegance.",
      personality:
        "Sharp and attentive, quick to notice what the other person cares about.",
      s1: "Curating topics",
      s2: "Reading taste",
      s3: "Smooth topic changes",
      specialty:
        "Looks at what the table enjoys, suggests fitting topics, and keeps the conversation flowing naturally.",
    },
    jaeha: {
      name: "Jaeha",
      epithet: "The friendly host",
      outfit: "Knitwear and slacks",
      tagline: "Comfort over formality — awkwardness melts away.",
      personality: "Warm and easygoing; you relax just having him nearby.",
      s1: "Dissolving awkwardness",
      s2: "A relaxed mood",
      s3: "Natural ice-breaking",
      specialty:
        "Light questions and a cheerful response make people who just met feel like old friends.",
    },
    taeo: {
      name: "Taeo",
      epithet: "The trendsetter",
      outfit: "Oversized streetwear and chains",
      tagline: "Young and lively — fills the lounge with energy.",
      personality: "Free-spirited, energetic, and always on top of what's new.",
      s1: "A lively mood",
      s2: "Trending topics",
      s3: "Spontaneous fun",
      specialty:
        "Warms the lounge up with what everyone is talking about and a rhythm that keeps moving.",
    },
    sunwoo: {
      name: "Serin",
      epithet: "The chemistry reader",
      outfit: "Velvet smoking jacket",
      tagline: "Catches the moment two people click.",
      personality:
        "Gentle and perceptive, alert to the smallest shifts in the mood.",
      s1: "Sensing chemistry",
      s2: "Timing a mutual video booking",
      s3: "Delicate hosting",
      specialty:
        "Watches the temperature of the conversation and suggests a mutual video booking when both sides are ready.",
    },
    seojun: {
      name: "Seojun",
      epithet: "The traveller",
      outfit: "White dinner jacket",
      tagline: "Finds common ground through taste and travel.",
      personality:
        "Unhurried and romantic, with a gift for painting a scene in a story.",
      s1: "Uncovering shared interests",
      s2: "Matching on travel and taste",
      s3: "An unhurried lead",
      specialty:
        "Uses favourite cities and tastes as a thread, weaving topics the whole table can get excited about.",
    },
    yujin: {
      name: "Yujin",
      epithet: "The measured quiet",
      outfit: "Minimal all-black tailoring",
      tagline: "Respects the pace of those who speak less.",
      personality:
        "Calm and thoughtful, and makes another person's silence comfortable.",
      s1: "Care for quieter members",
      s2: "Comfortable pacing",
      s3: "Listening",
      specialty:
        "Never rushes, so members who speak less can join the conversation at their own pace.",
    },
    haram: {
      name: "Harin",
      epithet: "The culture guide",
      outfit: "British tweed jacket",
      tagline: "Deeper conversation, through art and culture.",
      personality:
        "Well-read and classic, leaving a graceful note at the end of a story.",
      s1: "Deeper conversation",
      s2: "Art and culture topics",
      s3: "Thoughtful questions",
      specialty:
        "Follows the grain of your taste in books, music, and exhibitions to lead conversations you remember.",
    },
    jin: {
      name: "Jin",
      epithet: "The wit",
      outfit: "Rock-chic leather jacket",
      tagline: "Bold and quick-witted — builds chemistry fast.",
      personality: "Witty and daring, and lifts the mood in an instant.",
      s1: "Fast chemistry",
      s2: "Quick-witted hosting",
      s3: "Humour",
      specialty:
        "Light jokes and fast reflexes turn that first awkwardness into laughter.",
    },
    noah: {
      name: "Noah",
      epithet: "The careful guardian",
      outfit: "Stand-collar hospitality white",
      tagline: "Looks after safety and manners first.",
      personality:
        "Kind and considerate, aiming for a seat where everyone is respected.",
      s1: "Safety and manners first",
      s2: "Careful attention",
      s3: "Comfortable hosting",
      specialty:
        "Gently keeps an eye on boundaries and courtesy, making a lounge where anyone can stay comfortably and be respected.",
    },
  },
  waiterGallery: {
    metaTitle: "Choose an AI lounge manager",
    eyebrow: "AI lounge manager",
    titleLine1: "Which manager",
    titleAccent: " should host",
    titleLine1Tail: "",
    titleLine2: "your seat tonight?",
    intro:
      "Ten lounge managers, each pairing the poise of a European great house with a personality of their own. Tap a card to see their strengths, specialities, and character, then pick the one you like.",
    strengths: "Strengths",
    specialty: "Speciality",
    startWith: "Start with {name}",
    avatarAlt: "Lounge manager {name}",
    avatarAltWithOutfit: "Lounge manager {name} — {outfit}",
  },
  lobby: {
    eyebrow: "Club lobby",
    welcome: "Welcome,",
    welcomeSuffix: "",
    openNow: "Open now",
    openUntil: "Open now · until {time}",
    staffOnly:
      "The admin console is only visible to admin and moderator accounts. Pick 'Admin' in the member switcher above to look around without logging in.",
    activeLounge: "Your lounge",
    memberCount: "{count} here",
    backToLounge: "Back to my lounge",
    entryTitle: "Request entry",
    entryBody:
      "Pick your region and an AI lounge manager, tell us who you would like to meet, and your manager finds a seat in the same region that fits.",
    entryCta: "Request and get started",
    joinTitle: "Join with an invite code",
    joinBody: "Use a friend's invite code to join a lounge that already exists.",
    joinCta: "Enter a code",
    waitersTitle: "Meet the AI lounge managers",
    waitersBody: "Choose tonight's host from ten managers",
    groupNote:
      "Every conversation starts as a group of at least two. A shared room opens only when both lounges accept.",
  },
  closed: {
    eyebrow: "Club closed",
    titleLine1: "The club is",
    titleLine2: "closed right now.",
    nextOpen: "Opens next",
    nextOpenUnknown: "To be announced",
    body: "ClubOn is available worldwide, 24 hours a day, every day.",
    toDashboard: "Go to my page",
    toHome: "Home",
  },
  join: {
    eyebrow: "Join with an invite code",
    title: "Into your friend's lounge",
    intro:
      "A lounge holds up to 4 people. A shared room opens once the two lounges have at least 2 people between them.",
    codeHint: "Enter the 6-character code your lounge host gave you.",
    codePlaceholder: "e.g. JAZZ42",
    submit: "Join the lounge",
    pending: "Checking…",
    backToLobby: "Back to the lobby",
  },
  match: {
    metaTitle: "Match proposal",
    eyebrow: "Your lounge manager's proposal",
    title: "Shall the two lounges meet?",
    intro:
      "The seat opens only when both lounges accept. If either passes, both go back to waiting.",
    backToLounge: "Back to my lounge and look again",

    statePending: "Match proposed",
    stateAccepted: "Meeting confirmed",
    stateDeclined: "Did not go ahead",
    stateExpired: "Expired",
    foundByWaiter: "{name} found the lounge that fits you best",

    counterpart: "The other lounge",
    counterpartCount: "{count} here",
    totalAfterJoin: "{count} in total once you meet",
    fit: "Fit score {score}",
    genderOther: "Other",

    commonGround: "What you have in common",
    reasonGender: "Matches the gender you asked for ({gender})",
    reasonInterests: "Shared interests: {values}",
    reasonEnergy: "Same conversation energy",
    reasonAgeBands: "Age range: {values}",

    videoNotice:
      "Once you join, the two lounges share one screen and one sound. You can turn your camera and mic off whenever you like.",
    recordingNotice:
      "Capturing, recording, filming, or sharing another participant's video, audio, or personal information is prohibited. Violations may lead to a permanent ban and legal liability under applicable law.",

    waitingForOther:
      "Your lounge has accepted. We are waiting for the other lounge to respond.",
    accept: "Accept and meet",
    decline: "Pass this time",
    demoNotice:
      "The other lounge is made up of demo participants, so once you accept, the lounge manager answers on their behalf.",
    counterpartResponse: "The other lounge: {response}",
    responseAccepted: "accepted",
    responseDeclined: "declined",
    responsePending: "waiting",
  },
  lounge: {
    metaTitle: "My lounge",
    hostedBy: "{name} is hosting {nickname}'s seat this evening.",
    myLounge: "My lounge",
    leave: "Leave the lounge",
    declined: "That proposal did not go ahead. Try again with other conditions.",
    noMatchYet:
      "We have not found a lounge that fits your conditions yet. Try widening them a little.",
    liveSession: "Already meeting",
    liveSessionBody: "You have a conversation room open right now.",
    enterRoom: "Enter the room",
    proposalArrived: "A match has been proposed",
    proposalBody:
      "Your lounge manager found another lounge. Let us know whether you accept.",
    viewProposal: "See the proposal",
    whoTitle: "Who would you like to meet?",
    whoBody:
      "Tell us the style of person you would like to meet, and {name} finds and books the lounge with the most in common.",
    editingNote:
      "Your previous proposal was cancelled. We will look again with the new conditions.",
    errors: {
      too_small:
        "You need at least one more person in this lounge before meeting another. Share your invite code.",
      invalid: "Please check the conditions you entered.",
    },
    members: "Lounge members {count}/{max}",
    inviteCode: "Invite code",
    noMembers: "No members yet.",
    needMoreToMatch: "Once one more person joins your lounge, you can look for a match.",
    searching: "Looking for a match…",
    shortRule: "A meetup needs at least 2 people across the two lounges.",
    shortCount:
      "You need {count} more in this lounge before you can look for a match. Send the invite code above to a friend.",
    addDemoCompanion: "Add a demo companion",
    demoCompanionHint:
      "Adds a demo member so you can walk through the whole flow on your own.",
    readyToMatch: "Enough members to match",
  },
  pricing: {
    eyebrow: "Pricing",
    metaTitle: "Pricing",
    metaDescription:
      "ClubOn lounge entry fee {price} — includes {matches} room matches. Same price for everyone, and not a subscription.",
    title: "One entry fee, five seats",
    intro:
      "The {price} entry fee includes {matches} room matches. One match is a {minutes}-minute conversation. This is not a subscription — you spend what you use, and men and women pay the same.",
    matchesLabel: "{count} room matches",
    perMatch: "{price} each",
    buy: "Buy",
    buyAria: "Buy {name} — {price}",
    buyPending: "Opening checkout…",
    preparing: "Payments coming soon",
    basic: "Standard",
    note: "All prices are in USD and you are charged the amount shown at checkout. A match is spent when you actually enter the video room, never while you wait for a match. Once inside, one match is spent per participant.",
    extendTitle: "When time runs short",
    extendIntro:
      "If the conversation is going well, you can extend the room. Extensions cost money rather than matches, are bought inside the video room near the end, and apply to everyone in that room at once.",
    extendInRoom: "Bought inside the video room.",
    extendPreparing: "Payments coming soon.",
  },
};
