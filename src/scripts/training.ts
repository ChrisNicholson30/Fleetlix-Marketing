import { qs } from "./lib/env";

const room = qs<HTMLElement>("[data-training-room]");

if (room) {
  const enter = qs<HTMLButtonElement>("[data-enter-room]", room);
  const facade = qs<HTMLElement>("[data-room-facade]", room);
  const frame = qs<HTMLIFrameElement>("[data-room-frame]", room);
  const status = qs<HTMLElement>("[data-room-status]", room);
  const loading = qs<HTMLElement>("[data-room-loading]", room);
  const slow = qs<HTMLElement>("[data-room-slow]", room);
  const close = qs<HTMLButtonElement>("[data-close-room]", room);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let active = false;

  function stopLoading() {
    clearTimeout(timeout);
    if (loading) loading.hidden = true;
  }

  // No SDK, preconnect, persistence or automatic retry. Only this explicit
  // action assigns the iframe src and contacts Whereby.
  enter?.addEventListener("click", () => {
    const url = room.dataset.roomUrl;
    if (!url || !frame || !facade || !status || active) return;

    active = true;
    facade.hidden = true;
    frame.hidden = false;
    if (close) close.hidden = false;
    if (loading) loading.hidden = false;
    if (slow) slow.hidden = true;
    status.textContent = "Opening the room…";
    room.dataset.state = "loading";
    frame.src = url;
    frame.focus();

    timeout = setTimeout(() => {
      if (!active) return;
      stopLoading();
      if (slow) slow.hidden = false;
      status.textContent = "Room taking a while? Try the direct link below.";
    }, 15000);
  });

  frame?.addEventListener("load", () => {
    if (!active) return;
    stopLoading();
    if (slow) slow.hidden = true;
    room.dataset.state = "open";
    if (status) status.textContent = "Room opened · join using the controls below";
    // Cross-origin iframe load is not proof the meeting connected. The direct
    // link remains visible, including when Whereby displays its own error.
  });

  frame?.addEventListener("error", () => {
    if (!active) return;
    stopLoading();
    if (slow) slow.hidden = false;
    if (status) status.textContent = "Unable to load the room. Try the direct link below.";
  });

  close?.addEventListener("click", () => {
    active = false;
    stopLoading();
    if (frame) {
      frame.removeAttribute("src");
      frame.hidden = true;
    }
    if (facade) facade.hidden = false;
    if (slow) slow.hidden = true;
    close.hidden = true;
    room.dataset.state = "ready";
    if (status) status.textContent = "Join at your arranged time";
    enter?.focus();
  });

  // Without JavaScript, the direct link still works. Avoid an inert button.
  if (enter) enter.hidden = false;
}
