"use strict";
(function () {
  const byId = function (id) { return document.getElementById(id); };
  const hub = byId("liveHub");
  const member = byId("memberCommand");
  if (!hub || !member) return;

  const intro = document.createElement("div");
  intro.className = "member-command-intro";
  intro.innerHTML = "<p class='eyebrow'>YOUR COMMAND CENTER</p><h2>Your profile. Your people. Your conversations.</h2><p class='view-copy'>Your identity, messages and daily connections, organised in one place.</p>";
  member.insertBefore(intro, member.firstChild);

  const shortcuts = document.createElement("nav");
  shortcuts.className = "command-shortcuts";
  shortcuts.setAttribute("aria-label", "Command Center shortcuts");
  const targets = [
    ["Profile", "memberProfileCard"],
    ["Chats", "memberChatsCard"],
    ["Contacts", "memberContactsCard"],
    ["Status", "memberStatusCard"],
    ["Updates", "memberUpdatesCard"],
    ["Talk to JR", "memberTalkCard"]
  ];
  targets.forEach(function (entry) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = entry[0];
    button.addEventListener("click", function () {
      if (entry[1] === "memberTalkCard") {
        const jrTab = document.querySelector('[data-view="jr"]');
        if (jrTab) jrTab.click();
        return;
      }
      const target = byId(entry[1]);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    shortcuts.appendChild(button);
  });
  member.insertBefore(shortcuts, hub);

  const grid = hub.querySelector(".hub-grid");
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll(".hub-card"));
  function moveCard(selector, id, title) {
    const card = cards.find(function (item) { return item.querySelector(selector); });
    if (!card) return;
    card.id = id;
    card.style.order = String(arguments.length);
    const heading = card.querySelector("h3");
    if (heading && title) heading.textContent = title;
  }
  moveCard('[data-hub-action="update_profile"]', "memberProfileCard", "Profile & privacy");
  moveCard("#memberSearchForm", "memberChatsCard", "Chats & conversations");
  moveCard('[data-hub-action="create_status"]', "memberStatusCard", "Status");
  moveCard("#myNotifications", "memberUpdatesCard", "Updates & notifications");

  const people = byId("memberChatsCard");
  if (people) {
    const search = people.querySelector("#memberSearchForm");
    if (search) {
      const heading = document.createElement("p");
      heading.className = "hub-muted";
      heading.textContent = "Find people by name or JP number, then start a private conversation.";
      search.parentNode.insertBefore(heading, search);
    }
  }

  const profile = byId("memberProfileCard");
  if (profile) {
    const account = document.createElement("div");
    account.className = "member-profile-summary";
    const avatar = document.createElement("div");
    avatar.className = "profile-photo-button";
    avatar.id = "memberProfileInitials";
    avatar.textContent = "JR";
    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.id = "memberProfileName";
    name.textContent = byId("accountName") ? byId("accountName").textContent : "JR PHEEF member";
    const email = document.createElement("small");
    email.id = "memberProfileEmail";
    email.textContent = byId("accountEmail") ? byId("accountEmail").textContent : "";
    const status = document.createElement("small");
    status.id = "memberProfileStatus";
    status.textContent = "Email-confirmed account · Identity verification status shown by the system";
    details.append(name, email, status);
    account.append(avatar, details);
    profile.insertBefore(account, profile.querySelector("form"));
  }

  const commandHeading = document.createElement("div");
  commandHeading.className = "command-panel-heading";
  commandHeading.innerHTML = "<p class='eyebrow'>YOUR CONNECTED WORKSPACE</p><span class='command-panel-note'>Profile · Chats · Status · Updates</span>";
  hub.insertBefore(commandHeading, hub.firstChild);

  window.addEventListener("jr:member-signed-in", function (event) {
    const user = event.detail || {};
    const name = user.fullName || user.full_name || user.email || "JR PHEEF member";
    if (byId("memberProfileName")) byId("memberProfileName").textContent = name;
    if (byId("memberProfileEmail")) byId("memberProfileEmail").textContent = user.email || "";
    if (byId("memberProfileInitials")) {
      byId("memberProfileInitials").textContent = name.split(/\\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join("").toUpperCase();
    }
    if (byId("memberProfileStatus")) byId("memberProfileStatus").textContent = user.verified ? "Identity verified" : "Email confirmed · Identity verification pending";
  });
})();