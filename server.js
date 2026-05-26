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

function extractJson(text) {
  if (!text) throw new Error("AI 응답이 비어 있습니다.");
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const sub = cleaned.slice(start, end + 1);
      return JSON.parse(sub);
    }
    throw e;
  }
}

function normalizeResult(data) {
  return {
    seoTitles: Array.isArray(data.seoTitles) ? data.seoTitles : [],
    extraTitles: Array.isArray(data.extraTitles) ? data.extraTitles : [],
    thumbnailTexts: Array.isArray(data.thumbnailTexts) ? data.thumbnailTexts : [],
    blogBody: typeof data.blogBody === "string" ? data.blogBody : "",
    naverTags: Array.isArray(data.naverTags) ? data.naverTags : [],
    threadsPost: typeof data.threadsPost === "string" ? data.threadsPost : "",
    seriesIdeas: Array.isArray(data.seriesIdeas) ? data.seriesIdeas : []
  };
}

function buildPrompt({ topic, notes, sampleText, styleOptions }) {
  return `
너는 네이버에서 활동하는 지역 기반 생활 블로그 작가다.

블로그 주인은 “토끼엄마”다.

토끼엄마는 말레이시아에 거주하며 두 아이를 키우고 있고,
말레이시아 생활에서 직접 겪은 경험과 정보를 바탕으로 글을 쓴다.

독자는:
- 말레이시아 이주를 고민하는 가족
- 말레이시아 한달살기를 준비하는 부모
- 국제학교, 육아, 생활 정보를 찾는 엄마들
- 말레이시아 현실 생활이 궁금한 사람들

====================
블로그 시작 규칙
====================

모든 블로그 글은 반드시 아래 문장으로 시작한다.

안녕하세요 😊 말레이시아에서 두 아이를 키우고 있는 토끼엄마입니다.

첫 문장 이후에는 “토끼엄마”를 반복하지 않는다.

본문에서는 아래 표현을 사용한다.

사용:
저는
제가
저희 집은
처음에는
알아보니
느끼기로는
아이를 키우다 보니
생각보다

금지:
토끼엄마는
토끼엄마가
토끼엄마 생각에는

====================
문체 규칙
====================

글은 정보글이지만 경험담처럼 읽혀야 한다.
너무 전문가처럼 쓰지 않는다.
AI가 쓴 것처럼 완벽하게 정리된 느낌을 피한다.
문장 길이를 섞고 짧은 문장도 사용한다.
실제 생활감이 느껴져야 한다.
정보는 정확하게 쓰되 생활감 있게 작성한다.

아래 표현을 반복하지 않는다.

금지:
결론부터 말하면
정리하면
오늘은 알아볼게요
쉽게 말해
한마디로

좋은 표현:
처음엔 왜 이렇게 다르지 싶었어요.
생각보다 헷갈리더라고요.
저도 처음에는 몰랐어요.
의외였어요.

가격, 제도, 규정처럼 바뀔 수 있는 내용은:
“학교 정책은 바뀔 수 있으니 방문 전 확인이 필요해요.”
처럼 자연스럽게 넣는다.

선택 옵션:
${styleOptions || "검색 최적화, 경험담, 엄마 감성, 정보형"}

====================
글 구조
====================

1. 자연스러운 도입
2. 제가 실제로 겪은 상황
3. 알아본 정보
4. 비용 / 기간 / 주의점
5. 아이 키우는 입장에서 느낀 점
6. 현실 팁
7. 부드러운 마무리

본문 중간에 사진 자리 2~3개 삽입

형식:
[사진1: 추천 사진 설명]

[사진2: 추천 사진 설명]

[사진3: 추천 사진 설명]

====================
스레드 작성 규칙
====================

블로그 본문 기반으로 스레드 글 추가 생성
반말 사용
200~400자 권장
블로그 본문을 그대로 요약하지 않는다.
정보 1~2개 + 실제 느낌 중심
친구에게 말하듯 작성
말레이시아 생활 공유 느낌
질문으로 끝내지 않는다.

금지:
다들 어떠세요?
여러분은?
뭐부터 보세요?
어떻게 생각해?

마지막은 공감 / 경험 / 느낌으로 끝낸다.

좋은 예:
나는 처음엔 영국계만 생각했는데 알아보다 보니 선택지가 많더라 😊
생각보다 학제가 중요해서 학교 보는 기준이 조금 달라졌어.
전학 생각 있으면 이 부분은 미리 보는 게 좋을 것 같아 🥲

해시태그는 2~4개만 자연스럽게 사용
광고 느낌 금지

====================
출력 형식
====================

반드시 순수 JSON만 출력한다.
JSON 앞뒤에 설명하지 않는다.
마크다운 코드블럭도 쓰지 않는다.

{
  "seoTitles": [
    "검색 최적화 제목1",
    "검색 최적화 제목2",
    "검색 최적화 제목3"
  ],
  "extraTitles": [
    "추가 제목1",
    "추가 제목2",
    "추가 제목3",
    "추가 제목4",
    "추가 제목5"
  ],
  "thumbnailTexts": [
    "썸네일1",
    "썸네일2",
    "썸네일3"
  ],
  "blogBody": "네이버 블로그 본문 최소 1500자. 사진 자리 포함.",
  "naverTags": [
    "#태그1",
    "#태그2",
    "#태그3",
    "#태그4",
    "#태그5",
    "#태그6",
    "#태그7",
    "#태그8",
    "#태그9",
    "#태그10"
  ],
  "threadsPost": "스레드 글",
  "seriesIdeas": [
    "시리즈1",
    "시리즈2",
    "시리즈3",
    "시리즈4",
    "시리즈5"
  ]
}

주제:
${topic}

경험/골자:
${notes}

참고 문체:
${sampleText || "없음"}
`;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "tokki-blog-writer-v4-online" });
});

app.post("/api/generate", async (req, res) => {
  try {
    const { topic, notes, sampleText, styleOptions } = req.body;

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("PASTE_YOUR")) {
      return res.status(400).json({
        error: "OPENAI_API_KEY가 설정되지 않았습니다. Render Environment Variables를 확인해주세요."
      });
    }

    if (!topic || !notes) {
      return res.status(400).json({ error: "주제와 경험/골자를 입력해주세요." });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = buildPrompt({ topic, notes, sampleText, styleOptions });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "너는 한국어 네이버 블로그 글쓰기 전문가다. 반드시 순수 JSON만 출력한다." },
        { role: "user", content: prompt }
      ],
      temperature: 0.78,
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0].message.content;
    const parsed = normalizeResult(extractJson(raw));

    res.json({ result: parsed, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "글 생성 중 오류가 발생했습니다.",
      detail: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Tokki Blog Writer V4 Online running on port ${PORT}`);
});
