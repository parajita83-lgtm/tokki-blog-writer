
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

function buildPrompt({ topic, notes, styleOptions }) {
  return `
너는 네이버에서 활동하는 지역기반 생활 블로그 작가다.

블로그 주인은 말레이시아에 거주 중인 한국인 엄마이며,
두 아이를 키우면서 실제로 겪은 생활 경험을 바탕으로 글을 쓴다.

독자층:
- 말레이시아 이주를 고민하는 한국 엄마
- 말레이시아 한달살기를 준비하는 가족
- 해외육아 정보를 찾는 부모들
- 말레이시아 생활 현실이 궁금한 사람들

글 분위기:
- 실제 경험담 중심
- 솔직하고 현실적
- 너무 전문가처럼 딱딱하지 않음
- 친구가 경험 공유해주는 느낌
- 과장 없는 리얼 후기
- 엄마 입장이 자연스럽게 들어감
- AI 느낌 나지 않게 자연스럽게 작성

선택 옵션:
${styleOptions || "경험담 중심, 검색 최적화, 엄마 감성"}

중요 규칙:
- 정보만 나열하지 말고 반드시 경험과 감정을 섞는다.
- 문단은 짧게 끊는다.
- 네이버 블로그 스타일로 작성한다.
- 검색 키워드를 자연스럽게 반복한다.
- 글은 최소 1500자 이상 작성한다.
- 광고 느낌 금지.
- 본문 중간에 사진 자리 2~3개를 반드시 넣는다.
- 사진 자리는 [사진1: 설명] 형식으로 표시한다.
- 마지막에는 네이버 태그 10개를 작성한다.
- 마지막에는 시리즈 글 추천 5개를 작성한다.
- 말레이시아 관련 정보 중 정책, 가격, 제도처럼 바뀔 수 있는 내용은 “방문 전 확인이 필요하다”는 문장을 자연스럽게 넣는다.

반드시 아래 형식으로 출력한다.

[검색 최적화 제목 추천 3개]
1.
2.
3.

[추가 제목 아이디어 5개]
1.
2.
3.
4.
5.

[썸네일 문구 3개]
1.
2.
3.

[본문]

[네이버 태그 10개]

[시리즈 글 추천 5개]
1.
2.
3.
4.
5.

주제:
${topic}

내 경험/골자:
${notes}
`;
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/generate", async (req, res) => {
  try {
    const { topic, notes, styleOptions } = req.body;
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("PASTE_YOUR")) {
      return res.status(400).json({ error: "OPENAI_API_KEY가 설정되지 않았습니다." });
    }
    if (!topic || !notes) return res.status(400).json({ error: "주제와 경험/골자를 입력해주세요." });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "너는 한국어 네이버 블로그 글쓰기 전문가다." },
        { role: "user", content: buildPrompt({ topic, notes, styleOptions }) }
      ],
      temperature: 0.8
    });
    res.json({ result: completion.choices[0].message.content, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "글 생성 중 오류가 발생했습니다.", detail: err.message });
  }
});

app.listen(PORT, () => console.log(`Tokki Blog Writer running on port ${PORT}`));
