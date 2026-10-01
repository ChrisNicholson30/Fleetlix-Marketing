// Keep the Whereby origin aligned with frame-src and Permissions-Policy in
// public/_headers. This URL is never requested before the visitor opts in.
export const TRAINING_ROOM_URL = "https://whereby.com/fleetlixtraining";
export const WHEREBY_PRIVACY_URL = "https://whereby.com/information/tos/privacy-policy/";
export const WHEREBY_COOKIES_URL = "https://whereby.com/information/tos/cookie-policy/";

export const joiningSteps = [
  {
    title: "Make yourself comfortable",
    description: "Find a quiet spot and use headphones if you have them. A phone, tablet or computer is all you need.",
  },
  {
    title: "Allow your camera and microphone",
    description: "Your browser will ask for permission. Check your sound and video in the room before joining.",
  },
  {
    title: "Say hello to your trainer",
    description: "Enter your name so we know who’s joining. If the room is locked, knock and your trainer will let you in.",
  },
];

export const trainingFaqs = [
  {
    question: "Can I join from my phone?",
    answer: "Yes. Use an up-to-date Safari browser on iPhone or iPad, or Chrome on Android. Open this page in your browser rather than inside an email or social app. If the embedded room has trouble accessing your camera or microphone, use “Open room directly” to join in a separate tab.",
  },
  {
    question: "My camera or microphone isn’t working. What should I do?",
    answer: "Check that your browser has permission to use your camera and microphone in your device settings. Close other apps using them, then try again. Headphones can help with echo. You can also use “Open room directly” to try the session outside this page.",
  },
  {
    question: "The room is locked, or my trainer hasn’t arrived yet.",
    answer: "Join at the time agreed with your trainer. If you see a locked room, enter your name and knock to request entry. If you need help with your booking, contact the person who arranged your session or visit Fleetlix support.",
  },
  {
    question: "Do I need to download anything?",
    answer: "You can join through a supported browser without installing an app or creating a Whereby account. A stable internet connection helps. You can watch your trainer’s shared screen on mobile; sharing your own screen requires a computer.",
  },
];
