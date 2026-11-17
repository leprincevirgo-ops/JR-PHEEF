"use strict";
(function () {
  const API = "/api";
  const h = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  async function request(path, options) {
    const response = await fetch(API + path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options && options.headers || {}) },
      ...(options || {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "Request could not be completed.");
    return data;
  }
  function statusLabel(membership) {
    if (!membership) return "Not a member yet";
    return ({
      applied: "Application awaiting review",
      approved: "Membership approved",
      rejected: "Application not approved — you may reapply",
      suspended: "Membership temporarily suspended",
      revoked: "Membership ended — you may reapply"
    })[membership.status] || membership.status;
  }
  async function renderPanel(host, slug, title) {
    if (!host || host.querySelector('[data-venture-access="' + slug + '"]')) return;
    const panel = h("section", "card");
    panel.dataset.ventureAccess = slug;
    panel.append(h("p", "jp-kicker", "SHARED IDENTITY · SEPARATE MEMBERSHIP"));
    panel.append(h("h2", "", title + " access"));
    panel.append(h("p", "muted", "Your JR PHEEF account is your shared identity. This venture has its own application, approval and permissions."));
    const status = h("p", "listing muted", "Checking your membership…");
    panel.append(status);
    const actionArea = h("div", "");
    panel.append(actionArea);
    host.insertBefore(panel, host.firstChild);
    try {
      const [catalog, registration, mine] = await Promise.all([
        request("/ventures"),
        request("/ventures/" + encodeURIComponent(slug) + "/registration"),
        request("/my-venture-memberships")
      ]);
      const venture = (catalog.ventures || []).find(v => v.slug === slug);
      const membership = (mine.memberships || []).find(m => m.venture_slug === slug) || null;
      status.textContent = statusLabel(membership) + (membership && membership.role_key ? " · " + membership.role_key.replace(/_/g, " ") : "");
      if (membership && membership.status === "approved") {
        actionArea.append(h("p", "muted", "Your venture membership is active. Venture-specific services remain subject to their own permissions and eligibility."));
        return;
      }
      if (membership && ["applied", "suspended"].includes(membership.status)) {
        actionArea.append(h("p", "muted", membership.status === "applied" ? "You do not need to submit another application while this one is being reviewed." : "Contact the venture administrator if you believe this status is incorrect."));
        return;
      }
      if (!venture || !venture.can_apply) {
        actionArea.append(h("p", "muted", "Applications are currently unavailable."));
        return;
      }
      const schema = registration.template || {};
      const form = h("form", "venture-application-form");
      const roleLabel = h("label", "", "Choose how you want to participate");
      const role = h("select", "");
      role.required = true;
      (schema.roles || []).forEach(item => {
        const option = h("option", "", item.label);
        option.value = item.key;
        role.append(option);
      });
      roleLabel.append(role);
      form.append(roleLabel);
      const inputs = {};
      (schema.fields || []).forEach(field => {
        const label = h("label", "", field.label + (field.required ? " *" : ""));
        const input = field.type === "textarea" ? h("textarea", "") : h("input", "");
        input.name = field.key;
        input.required = !!field.required;
        input.maxLength = 2000;
        input.placeholder = field.label;
        label.append(input);
        form.append(label);
        inputs[field.key] = input;
      });
      const notice = h("p", "muted", schema.notice || "Your application will be reviewed separately.");
      form.append(notice);
      const consentLabel = h("label", "venture-consent", "");
      const consent = h("input", "");
      consent.type = "checkbox";
      consent.required = true;
      consentLabel.append(consent, document.createTextNode(" I have read and agree to this venture-specific notice."));
      form.append(consentLabel);
      const message = h("p", "muted", "");
      message.setAttribute("aria-live", "polite");
      form.append(message);
      const submit = h("button", "primary", "SUBMIT APPLICATION");
      submit.type = "submit";
      form.append(submit);
      form.addEventListener("submit", async event => {
        event.preventDefault();
        submit.disabled = true;
        message.textContent = "Submitting…";
        const application_data = {};
        Object.keys(inputs).forEach(key => { application_data[key] = inputs[key].value; });
        try {
          await request("/ventures/" + encodeURIComponent(slug) + "/apply", {
            method: "POST",
            body: JSON.stringify({ role_key: role.value, application_data, consent: consent.checked })
          });
          status.textContent = "Application awaiting review";
          actionArea.replaceChildren(h("p", "muted", "Your application has been received. Access will be available only after an authorised reviewer approves it."));
        } catch (error) {
          message.textContent = error.message;
          submit.disabled = false;
        }
      });
      actionArea.append(form);
    } catch (error) {
      status.textContent = error.message === "LOGIN_REQUIRED" ? "Sign in to view or apply for venture membership." : error.message;
    }
  }
  async function renderFounderQueue(host) {
    if (!host || host.querySelector('[data-founder-venture-queue="true"]')) return;
    try {
      const result = await request("/founder/venture-memberships?status=applied");
      const panel = h("section", "card");
      panel.dataset.founderVentureQueue = "true";
      panel.append(h("p", "jp-kicker", "RESTRICTED · DGBO FOUNDER REVIEW"));
      panel.append(h("h2", "", "Venture applications"));
      panel.append(h("p", "muted", "Only the authorised ecosystem owner can review these applications. Approval grants venture membership only; it does not grant financial, regulated or operational licences."));
      const list = h("div", "");
      if (!result.applications.length) list.append(h("p", "muted", "No applications are waiting for review."));
      result.applications.forEach(item => {
        const card = h("div", "listing");
        const applicant = item.applicant || {};
        card.append(h("strong", "", (item.venture_slug || "").toUpperCase() + " · " + (item.role_key || "").replace(/_/g, " ")));
        card.append(h("p", "muted", (applicant.full_name || "Member") + (applicant.jp_number ? " · " + applicant.jp_number : "") + (applicant.email ? " · " + applicant.email : "")));
        Object.keys(item.application_data || {}).forEach(key => {
          card.append(h("p", "muted", key.replace(/_/g, " ") + ": " + String(item.application_data[key])));
        });
        const note = h("input", "");
        note.placeholder = "Optional review note";
        note.maxLength = 1200;
        card.append(note);
        const actions = h("div", "nav");
        [["approved","APPROVE"],["rejected","REJECT"]].forEach(([status,label]) => {
          const button = h("button", status === "approved" ? "primary" : "dark", label);
          button.type = "button";
          button.addEventListener("click", async () => {
            button.disabled = true;
            try {
              await request("/founder/venture-memberships/" + encodeURIComponent(item.id) + "/review", {
                method: "POST",
                body: JSON.stringify({ status, review_note: note.value })
              });
              card.replaceChildren(h("p", "muted", "Application " + status + "."));
            } catch (error) {
              card.append(h("p", "muted", error.message));
              button.disabled = false;
            }
          });
          actions.append(button);
        });
        card.append(actions);
        list.append(card);
      });
      panel.append(list);
      host.append(panel);
    } catch (_) {
      // Non-owner accounts receive 404 by design; do not expose a founder panel.
    }
  }
  function init() {
    const app = document.getElementById("app");
    if (!app || app.classList.contains("hidden")) return;
    renderPanel(document.getElementById("dgbo"), "dgbo", "DGBO");
    renderPanel(document.getElementById("family"), "family", "FAMILY");
    renderPanel(document.getElementById("ecosystem"), "turbex", "TURBEX");
    renderFounderQueue(document.getElementById("dgbo"));
  }
  function start() {
    init();
    const app = document.getElementById("app");
    if (app && typeof MutationObserver !== "undefined") {
      new MutationObserver(init).observe(app, { attributes: true, attributeFilter: ["class"] });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
