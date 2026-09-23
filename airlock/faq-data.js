// Plain-language answers for the questions beneath the landing page.
window.FAQ_ITEMS = [
  {
    q: "Who is Airlock for?",
    a: "One person using several computers, often one per job or client. Each computer in your Airlock network is yours. It isn't a team dashboard.",
  },
  {
    q: "How does it know I'm in a call?",
    a: "It looks at signs on each computer, such as which app is using audio, whether the microphone is in use, and whether the camera is on. If it can't tell, it says so instead of guessing.",
  },
  {
    q: "Does it record audio or read messages?",
    a: "No. On a Mac, Airlock measures speaker loudness and immediately discards the audio samples. On Windows, it reads the system's output level meter. It never reads microphone audio, opens the camera, or sends a recording. Message text, senders, subjects, and meeting names stay out of Airlock. If you choose to share unread counts, only the number on a Teams or Slack badge is shared.",
  },
  {
    q: "Can someone on another computer control mine?",
    a: "Another of your computers can ask this one to mute its speakers. That's the only remote action. It can't unmute them, turn on a microphone, change the volume, or control an app.",
  },
  {
    q: "Will this work on a company network?",
    a: "Airlock uses one outgoing connection through your computer's usual network and proxy settings. It doesn't need an incoming port, local network discovery, or a VPN between your computers. Your employer's software policy still applies.",
  },
  {
    q: "Who can see my computers' status?",
    a: "Only computers with your invite code can read the encrypted updates. The server in between passes them along but can't read their contents. It can see connection details, as any server can, and keeps the network's first and last connection dates and license assignment for billing. It doesn't store the status updates.",
  },
  {
    q: "Can I hide the widget during a screen share?",
    a: "Yes. On a Mac, Airlock can hide the widget while your screen is being shared. You can also choose a plain dot or a CPU, memory, battery, or network style that shows a real reading from that computer.",
  },
  {
    q: "What if I no longer use one of my computers?",
    a: "Removing a computer from the list only hides it. Anyone with the invite code can still join. To actually cut off an old computer, make a new code and join your current computers with it.",
  },
  {
    q: "What happens after the free trial?",
    a: "A network gets 14 days free from its first connection. After that, a $49 one-time license covers up to five different computers in any 24 hours. Checkout is coming soon.",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("faq-list");
  if (!list) return;
  list.innerHTML = window.FAQ_ITEMS.map(
    ({ q, a }) => `<details><summary>${q}</summary><p>${a}</p></details>`,
  ).join("\n");
});
