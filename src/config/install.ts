// Install-guide content for /install — one platform per entry.
//
// Consumed by src/pages/install.astro. Data-driven for the same reason the FAQ
// is: the page renders every platform into the DOM (all of it crawlable, all of
// it linkable) and CSS shows one at a time, so the tab content and any future
// structured data can't drift from each other.
//
// The audience is a yard manager rolling Fleetlix out to drivers who have never
// installed a PWA and do not know what one is. That drives three choices:
//   1. Steps name the BUTTON, not the concept — "tap Share, the square with an
//      arrow pointing up" beats "invoke the share sheet". Icons are drawn on the
//      page next to the step for the same reason.
//   2. The browser that works is stated before the steps, not after. Half of all
//      failed installs are someone using Chrome on an iPhone.
//   3. The device-exclusion lists are honest and specific. A fleet buyer needs to
//      know a driver's iPhone 8 is a dead end BEFORE they buy handsets, and the
//      site would rather say so than have them find out in week three.
//
// Everything here describes fleetlix.app, the operations PWA — a different repo
// and a different deployment from this marketing site. If the app's Settings
// screens are renamed, these instructions go stale silently. Re-check the
// notification paths against the app before a rollout push.

export interface InstallRoute {
  /** Browser or route name, e.g. "Safari" or "Microsoft Edge". */
  name: string;
  /** Shown under the route name when one browser needs a caveat. */
  note?: string;
  steps: string[];
}

export type DeviceStatus = "ok" | "limited" | "no";

export interface DeviceNote {
  status: DeviceStatus;
  /** The device family, as a buyer would recognise it on a purchase order. */
  title: string;
  body: string;
}

export interface Platform {
  /** Slug — also the radio id (`platform-<id>`) and the `data-platform` value. */
  id: string;
  label: string;
  /** Inner markup for a 24×24 stroked icon. */
  icon: string;
  /** The one-line answer to "which browser do I use, and why that one". */
  intro: string;
  routes: InstallRoute[];
  /** How to switch job alerts on, where the platform needs extra steps. */
  alerts?: string;
  minimum: string;
  recommended: string;
  devices: DeviceNote[];
}

export const platforms: Platform[] = [
  {
    id: "iphone",
    label: "iPhone",
    icon: `<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/>`,
    intro:
      "Use Safari. Chrome, Firefox and Edge on iPhone can add Fleetlix to the Home Screen from iOS 17 onwards, but Safari is the only route that reliably enables push notifications for job alerts.",
    routes: [
      {
        name: "Safari",
        steps: [
          "Open Safari and go to fleetlix.app",
          "Sign in and wait for the dashboard to finish loading",
          "Tap the Share button — the square with an arrow pointing up, in the bottom toolbar",
          "Scroll down the share sheet and tap Add to Home Screen",
          "Check the name reads Fleetlix, then tap Add in the top right",
          "Close Safari and open Fleetlix from the new Home Screen icon",
        ],
        note: "The first launch from the icon is what switches it into app mode. Keep opening it from a Safari tab and you keep the address bar.",
      },
    ],
    alerts:
      "Open Fleetlix from the Home Screen icon, go to Settings → Notifications, and tap Enable alerts. iOS will show a permission prompt. This only works when the app is launched from the icon — never from a browser tab.",
    minimum: "iOS 16.4",
    recommended: "iOS 18 or later",
    devices: [
      {
        status: "no",
        title: "iPhone 7, 7 Plus, SE (1st gen), 6s and earlier",
        body: "Capped at iOS 15. No web push, and service worker storage is evicted aggressively, so offline job data won't survive. Not supported.",
      },
      {
        status: "limited",
        title: "iPhone 8, 8 Plus, X",
        body: "Capped at iOS 16.7. Fleetlix installs and runs, but these devices stopped receiving Safari updates and won't get future features. Replace before your next fleet refresh.",
      },
      {
        status: "limited",
        title: "iPhone XR, XS, XS Max",
        body: "Capped at iOS 18, since iOS 26 dropped them. Fully functional today, but on the same countdown.",
      },
      {
        status: "ok",
        title: "iPhone 11, SE (2nd gen) and later",
        body: "Fully supported.",
      },
    ],
  },
  {
    id: "ipad",
    label: "iPad",
    icon: `<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M11 18.5h2"/>`,
    intro:
      "Identical to iPhone, with the Share button in a different place — top-right toolbar rather than the bottom bar.",
    routes: [
      {
        name: "Safari",
        steps: [
          "Open Safari and go to fleetlix.app",
          "Sign in and let the dashboard load",
          "Tap the Share button in the top-right toolbar",
          "Tap Add to Home Screen in the share sheet",
          "Tap Add",
        ],
        note: "On iPadOS 26 and later, Fleetlix opens as a resizable window and can sit side by side with your email or a PDF — useful for the office and weighbridge roles.",
      },
    ],
    minimum: "iPadOS 16.4",
    recommended: "iPadOS 18 or later",
    devices: [
      {
        status: "no",
        title: "iPad Air 2 and earlier, iPad mini 4 and earlier, iPad 4th gen and earlier",
        body: "Capped at iPadOS 15 or below. Not supported.",
      },
      {
        status: "limited",
        title: "iPad 5th–7th gen, iPad Air 3, iPad Pro 1st gen (2015–2016)",
        body: "Capped below iPadOS 26. They work, but won't get the new windowing behaviour.",
      },
      {
        status: "ok",
        title: "iPad 8th gen and later, iPad Air 4 and later, iPad mini 5 and later, iPad Pro 2018 and later",
        body: "Fully supported.",
      },
    ],
  },
  {
    id: "android",
    label: "Android",
    icon: `<path d="M6 10.5a6 6 0 0 1 12 0v7a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 17.5z"/><path d="m8 4.5 1.2 2M16 4.5l-1.2 2"/>`,
    intro:
      "Chrome is the default and the best-tested route. Samsung Internet, Edge, Brave and Opera all install Fleetlix too — they just word the menu item differently.",
    routes: [
      {
        name: "Chrome",
        steps: [
          "Open Chrome and go to fleetlix.app",
          "Sign in and let the dashboard load",
          "An Install app banner usually appears along the bottom — tap it",
          "If no banner appears, open the ⋮ menu and tap Add to Home screen or Install app",
          "Tap Install",
        ],
      },
      {
        name: "Samsung Internet",
        steps: [
          "Go to fleetlix.app and sign in",
          "Tap the download icon in the address bar, or open the ☰ menu and tap Add page to → Home screen",
          "Tap Install",
        ],
      },
      {
        name: "Edge, Brave, Opera",
        steps: [
          "Go to fleetlix.app and sign in",
          "Open the browser's main menu",
          "Tap Install app or Add to Home screen",
        ],
      },
    ],
    alerts:
      "Open Fleetlix from the Home Screen icon, go to Settings → Notifications, tap Enable alerts, and allow the Android permission prompt. On Samsung and Xiaomi handsets, also check Settings → Apps → Fleetlix → Battery and set it to Unrestricted, or the phone will silently kill background alerts overnight.",
    minimum: "Android 10, Chrome 100+",
    recommended: "Android 13 or later",
    devices: [
      {
        status: "no",
        title: "Android 9 and earlier",
        body: "No security updates, unreliable service worker persistence, and outdated TLS on some OEM builds. Not supported.",
      },
      {
        status: "no",
        title: "Android Go edition devices with 2 GB RAM or less",
        body: "The offline cache and map view will not fit. Not supported.",
      },
      {
        status: "limited",
        title: "Huawei handsets from 2019 onward without Google Mobile Services",
        body: "Huawei Browser can add Fleetlix to the home screen, but push notifications and background sync do not work. Use it in the browser only, or issue a different handset.",
      },
      {
        status: "limited",
        title: "Rugged handsets — CAT, Ulefone, Blackview, Doogee",
        body: "Many ship with a heavily modified Android build two or three versions behind the sticker on the box. Check Settings → About phone → Android version against the minimum above before rolling one out to a driver.",
      },
    ],
  },
  {
    id: "windows",
    label: "Windows",
    icon: `<path d="M3 6.5 10.5 5.4v6.1H3z"/><path d="M12 5.2 21 4v7.5h-9z"/><path d="M3 12.5h7.5v6.1L3 17.5z"/><path d="M12 12.5h9V20l-9-1.2z"/>`,
    intro:
      "Use Microsoft Edge or Google Chrome. Firefox on Windows cannot install web apps at all — Mozilla removed that capability, so it isn't a browser bug you can work around.",
    routes: [
      {
        name: "Microsoft Edge",
        steps: [
          "Go to fleetlix.app and sign in",
          "Click the install icon in the address bar, or open the ⋯ menu and choose Apps → Install this site as an app",
          "Click Install",
          "Tick Pin to taskbar and Pin to Start when offered",
        ],
      },
      {
        name: "Google Chrome",
        steps: [
          "Go to fleetlix.app and sign in",
          "Click the install icon in the address bar, or open the ⋮ menu and choose Cast, save and share → Install page as app",
          "Click Install",
        ],
        note: "Installed apps can be managed at edge://apps or chrome://apps.",
      },
    ],
    minimum: "Windows 11, Edge or Chrome 100+",
    recommended: "Windows 11 24H2 or later",
    devices: [
      {
        status: "no",
        title: "Windows 10 and earlier",
        body: "Fleetlix will technically install through Edge or Chrome, but Windows 10 left security support in October 2025 and we don't test against it. Not supported.",
      },
      {
        status: "ok",
        title: "Windows on ARM",
        body: "Supported through Edge.",
      },
    ],
  },
  {
    id: "mac",
    label: "Mac",
    icon: `<rect x="2.5" y="4" width="19" height="12.5" rx="1.5"/><path d="M2 19.5h20"/>`,
    intro:
      "Two routes. Safari gives the cleanest result; Chrome and Edge work fine if that's what your team already uses.",
    routes: [
      {
        name: "Safari (macOS 14 Sonoma or later)",
        steps: [
          "Open Safari and go to fleetlix.app",
          "Sign in",
          "In the menu bar, choose File → Add to Dock",
          "Confirm the name and click Add",
        ],
      },
      {
        name: "Chrome, Edge or Brave",
        steps: [
          "Go to fleetlix.app and sign in",
          "Click the install icon in the address bar — a small monitor with a downward arrow",
          "Click Install",
        ],
        note: "Fleetlix then appears in Launchpad and the Dock like any other Mac app.",
      },
    ],
    minimum: "macOS 12 Monterey (Chrome/Edge)",
    recommended: "macOS 14 Sonoma or later, for Safari's Add to Dock",
    devices: [
      {
        status: "limited",
        title: "Any Intel Mac from 2018 or earlier",
        body: "Including the 2018 Mac mini, 2017 iMac Pro, and 2018–2019 MacBook Pros other than the 16-inch. Capped below macOS 26. Chrome will still install Fleetlix on macOS 12 and 13, but these machines are on borrowed time — macOS 26 Tahoe is the last release to support Intel at all.",
      },
      {
        status: "limited",
        title: "2020 Intel MacBook Air, and the two-port 2020 Intel MacBook Pro 13-inch",
        body: "Also excluded from macOS 26 despite their age. Worth checking before you assume a 2020 Mac is fine.",
      },
      {
        status: "ok",
        title: "Any Apple silicon Mac (M1 or later)",
        body: "Fully supported.",
      },
    ],
  },
];

export interface Troubleshoot {
  symptom: string;
  fix: string;
}

export const troubleshooting: Troubleshoot[] = [
  {
    symptom: "The install option isn't showing",
    fix: "You're probably on a browser that doesn't support it — Firefox on desktop, or any non-Safari browser on an older iPhone. Check your platform above. On Android, make sure the page has fully loaded first; the install prompt fires after the service worker registers.",
  },
  {
    symptom: "It opens with an address bar",
    fix: "You launched it from a browser tab rather than the icon. Close the tab and tap the Fleetlix icon on your Home Screen or Dock.",
  },
  {
    symptom: "Notifications aren't arriving",
    fix: "Confirm you opened Fleetlix from the icon, not a tab. Then check the OS-level permission at Settings → Notifications → Fleetlix. On Android, also set the battery mode to unrestricted.",
  },
  {
    symptom: "Jobs look out of date",
    fix: "Pull down on the job list to force a sync. If that fails, you're offline — Fleetlix is showing the last data it cached, and will catch up when signal returns.",
  },
  {
    symptom: "The app is stuck on an old version",
    fix: "Close it fully (swipe it out of the app switcher) and reopen. Fleetlix updates itself in the background; it applies the update on the next cold start.",
  },
];

/** The floor that applies whatever the device — stated once, not per platform. */
export const hardwareFloor = [
  "3 GB RAM",
  "1 GB free storage for the offline job cache",
  "A screen at least 360 px wide",
  "A live HTTPS connection for the first sign-in on each device",
];
