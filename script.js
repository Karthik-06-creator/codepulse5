// Wait for DOM to be fully loaded
let sendBtn, userInput, messagesEl, resourcesList, clearBtn, copingBtn, journalBtn;

function initElements() {
  sendBtn = document.getElementById("send-btn");
  userInput = document.getElementById("user-input");
  messagesEl = document.getElementById("messages");
  resourcesList = document.getElementById("resources-list");
  clearBtn = document.getElementById("clear-btn");
  copingBtn = document.getElementById("coping-btn");
  journalBtn = document.getElementById("journal-btn");
}

function createMsgEl(who, text, moodTag) {
  const template = document.getElementById("msg-template");
  if (!template) {
    console.error("Message template not found");
    return null;
  }
  const node = template.content.cloneNode(true);
  const wrapper = node.querySelector(".msg");
  if (!wrapper) return null;
  
  wrapper.classList.add(who === "user" ? "user" : "bot");
  const whoEl = node.querySelector(".who");
  if (whoEl) {
    whoEl.textContent = who === "user" ? "You" : "MindEase";
  }
  const contentEl = node.querySelector(".content");
  if (contentEl) {
    contentEl.textContent = text || "";
  }
  const moodEl = node.querySelector(".mood-tag");
  if (moodEl) {
    if (moodTag) {
      moodEl.textContent = moodTag.toUpperCase();
      const colors = {
        calm: "#10b981",
        sad: "#3b82f6",
        anxious: "#f59e0b",
        angry: "#ef4444",
        neutral: "#6b7280",
        confused: "#7c3aed",
        urgent: "#f43f5e"
      };
      moodEl.style.background = colors[moodTag] || "#6b7280";
    } else {
      moodEl.remove();
    }
  }
  return node;
}

function scrollBottom() {
  if (messagesEl) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

// Prevent multiple simultaneous requests
let isSending = false;

async function sendMessage(message) {
  if (!message || !message.trim()) return;
  if (isSending) {
    console.log("Request already in progress, please wait...");
    return;
  }
  if (!messagesEl) {
    console.error("Messages container not found");
    return;
  }
  
  isSending = true;
  
  // render user message
  const userNode = createMsgEl("user", message);
  if (userNode && messagesEl) {
    messagesEl.appendChild(userNode);
    scrollBottom();
  }

  // render typing placeholder
  let hintNode = null;
  try {
    hintNode = createMsgEl("bot", "Thinking...");
    const hintContent = hintNode.querySelector(".content");
    if (hintContent) {
      // add typing animation
      const t = document.createElement("span");
      t.className = "typing";
      t.innerHTML = `<span></span><span></span><span></span>`;
      hintContent.innerHTML = "";
      hintContent.appendChild(t);
    }
    messagesEl.appendChild(hintNode);
    scrollBottom();
  } catch (err) {
    console.error("Error creating typing indicator:", err);
  }

  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: "Network error" }));
      throw new Error(errorData?.error || errorData?.message || `HTTP ${resp.status}: ${resp.statusText}`);
    }

    const data = await resp.json().catch(() => {
      throw new Error("Invalid JSON response from server");
    });
    
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format from server");
    }

    // replace hint with real response
    if (hintNode && hintNode.parentNode === messagesEl) {
      messagesEl.removeChild(hintNode);
    }
    const botNode = createMsgEl("bot", data.reply || "Sorry, I couldn't compose a reply.", data.mood);
    if (botNode && messagesEl) {
      messagesEl.appendChild(botNode);
      scrollBottom();
    }

    // show resources if present
    showResources(data.resources || []);
    // if action present, show quick action bubble
    if (data.action) showQuickAction(data.action);
  } catch (err) {
    console.error("Error sending message:", err);
    // safely remove hint node if it exists
    if (hintNode && hintNode.parentNode === messagesEl) {
      messagesEl.removeChild(hintNode);
    }
    const errNode = createMsgEl("bot", "⚠️ Error: " + (err.message || err.toString()), "neutral");
    if (errNode && messagesEl) {
      messagesEl.appendChild(errNode);
      scrollBottom();
    }
  } finally {
    isSending = false;
  }
}

function showResources(list) {
  if (!resourcesList) return;
  resourcesList.innerHTML = "";
  if (!list || !Array.isArray(list) || !list.length) return;
  for (const r of list) {
    if (!r || typeof r !== "object") continue;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = r.url || "#";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = r.title || r.url || "Resource";
    li.appendChild(a);
    resourcesList.appendChild(li);
  }
}

// quick action handlers
function showQuickAction(action) {
  if (action === "breathing_exercise") {
    appendBotAction("Try this: 4-4-4 breathing for 3 minutes. Breathe in 4s - hold 4s - out 4s. Repeat slowly.");
  } else if (action === "call_hotline") {
    appendBotAction("It sounds urgent. If you are in immediate danger call your local emergency number now.");
  } else if (action === "journal_prompt") {
    appendBotAction("Try writing 3 things you are grateful for right now. Keep it simple.");
  }
}

function appendBotAction(txt) {
  if (!messagesEl || !txt) return;
  const node = createMsgEl("bot", txt, "calm");
  if (node) {
    messagesEl.appendChild(node);
    scrollBottom();
  }
}

// Initialize when DOM is ready
function initApp() {
  initElements();
  
  const composer = document.getElementById("composer");
  if (composer && userInput) {
    composer.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = userInput.value?.trim();
      if (!val) return;
      userInput.value = "";
      sendMessage(val);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (messagesEl) messagesEl.innerHTML = "";
      if (resourcesList) resourcesList.innerHTML = "";
    });
  }

  if (copingBtn) {
    copingBtn.addEventListener("click", () => {
      sendMessage("I need a short guided breathing exercise.");
    });
  }

  if (journalBtn) {
    journalBtn.addEventListener("click", () => {
      sendMessage("Give me a quick journaling prompt to reflect on my day.");
    });
  }

  // small UX: grow textarea
  if (userInput) {
    userInput.addEventListener("input", () => {
      if (userInput) {
        userInput.style.height = "auto";
        userInput.style.height = Math.min(180, userInput.scrollHeight) + "px";
      }
    });
  }

  // welcome message - only if DOM is ready
  if (messagesEl) {
    appendBotAction("Hi — I'm MindEase. I'm here to listen and offer calming tips. Tell me how you are feeling.");
  }
}

// Initialize when DOM content is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
