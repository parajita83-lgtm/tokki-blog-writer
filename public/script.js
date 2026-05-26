const topicSelect = document.getElementById("topicSelect");
const customTopic = document.getElementById("customTopic");
const notes = document.getElementById("notes");
const sampleText = document.getElementById("sampleText");
const generateBtn = document.getElementById("generateBtn");
const historyBtn = document.getElementById("historyBtn");
const historyBox = document.getElementById("historyBox");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const seoTitles = document.getElementById("seoTitles");
const extraTitles = document.getElementById("extraTitles");
const thumbnailTexts = document.getElementById("thumbnailTexts");
const blogBody = document.getElementById("blogBody");
const threadsPost = document.getElementById("threadsPost");
const seriesIdeas = document.getElementById("seriesIdeas");

const copyBodyBtn = document.getElementById("copyBodyBtn");
const copyThreadsBtn = document.getElementById("copyThreadsBtn");

const HISTORY_KEY = "tokki_v4_online_history";
const LAST_KEY = "tokki_v4_online_last";

topicSelect.addEventListener("change", () => {
  customTopic.classList.toggle("hidden", topicSelect.value !== "custom");
});

function getTopic() {
  return topicSelect.value === "custom" ? customTopic.value.trim() : topicSelect.value;
}

function getStyleOptions() {
  return Array.from(document.querySelectorAll(".checks input:checked"))
    .map(el => el.value)
    .join(", ");
}

function renderList(el, arr) {
  el.innerHTML = "";
  el.classList.remove("empty");
  if (!arr || arr.length === 0) {
    el.classList.add("empty");
    el.innerHTML = "<li>결과가 없습니다.</li>";
    return;
  }
  arr.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  });
}

function renderResult(data) {
  renderList(seoTitles, data.seoTitles);
  renderList(extraTitles, data.extraTitles);
  renderList(thumbnailTexts, data.thumbnailTexts);

  const tags = (data.naverTags || []).join(" ");
  blogBody.textContent = `${data.blogBody || ""}\n\n${tags}`.trim();

  threadsPost.textContent = data.threadsPost || "";
  renderList(seriesIdeas, data.seriesIdeas);
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(topic, data) {
  const history = getHistory();
  history.unshift({
    topic,
    data,
    createdAt: new Date().toLocaleString("ko-KR")
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML = "저장된 기록이 없습니다.";
    return;
  }

  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "historyItem";
    const preview = (item.data.blogBody || "").slice(0, 140);
    div.innerHTML = `<div class="historyTitle">${item.topic} · ${item.createdAt}</div><div class="historyPreview">${preview}...</div>`;
    div.addEventListener("click", () => {
      renderResult(item.data);
      localStorage.setItem(LAST_KEY, JSON.stringify(item.data));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    historyList.appendChild(div);
  });
}

async function copyText(text, label) {
  if (!text || !text.trim() || text.includes("아직 생성")) {
    alert("복사할 내용이 없습니다.");
    return;
  }
  await navigator.clipboard.writeText(text);
  alert(`${label} 복사 완료!`);
}

copyBodyBtn.addEventListener("click", () => copyText(blogBody.textContent, "본문"));
copyThreadsBtn.addEventListener("click", () => copyText(threadsPost.textContent, "스레드"));

generateBtn.addEventListener("click", async () => {
  const topic = getTopic();
  const userNotes = notes.value.trim();

  if (!topic) {
    alert("주제를 입력해주세요.");
    return;
  }
  if (!userNotes) {
    alert("경험/골자를 3~4줄 입력해주세요.");
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "생성 중...";
  blogBody.textContent = "글을 생성하고 있어요. 모바일에서는 20~60초 정도 걸릴 수 있어요.";
  threadsPost.textContent = "스레드 글도 함께 생성 중입니다.";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        notes: userNotes,
        sampleText: sampleText.value.trim(),
        styleOptions: getStyleOptions()
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.detail || "오류가 발생했습니다.");

    renderResult(data.result);
    localStorage.setItem(LAST_KEY, JSON.stringify(data.result));
    saveHistory(topic, data.result);
    renderHistory();
  } catch (err) {
    blogBody.textContent = "오류: " + err.message;
    threadsPost.textContent = "";
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "글 생성하기";
  }
});

historyBtn.addEventListener("click", () => {
  historyBox.classList.toggle("hidden");
  renderHistory();
});

clearHistoryBtn.addEventListener("click", () => {
  if (!confirm("최근 기록을 모두 삭제할까요?")) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

try {
  const last = localStorage.getItem(LAST_KEY);
  if (last) renderResult(JSON.parse(last));
} catch (e) {}
