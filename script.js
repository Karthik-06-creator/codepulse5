document.getElementById("send-btn").addEventListener("click", sendMessage);

async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  appendMessage("You", message, "user");
  input.value = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    appendMessage("MindEase", data.reply || "Error: No response", "bot");
  } catch (err) {
    appendMessage("Error", "OpenAI API error. Please check setup.", "bot");
  }
}

function appendMessage(sender, text, cls) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", cls);
  msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
  document.getElementById("messages").appendChild(msgDiv);
  msgDiv.scrollIntoView({ behavior: "smooth" });
}
