토끼엄마 블로그 글쓰기 도우미 V4 온라인(Render 배포용)

[이 버전의 목적]
- PC 오프라인 실행용이 아니라 Render에 올려서 핸드폰/노트북에서 접속하는 온라인 웹서비스 버전입니다.
- run.bat은 포함하지 않습니다.
- Render에서는 서버 파일 저장이 영구적이지 않을 수 있으므로 최근 기록은 브라우저 localStorage에 저장됩니다.

[GitHub 업로드 파일]
아래 파일/폴더 전체를 GitHub 저장소에 업로드하세요.

package.json
server.js
.env.example
.gitignore
README.txt
public 폴더 전체

주의:
.env 파일은 절대 GitHub에 올리지 마세요.

[Render 설정]
New + → Web Service
GitHub 저장소 연결

Build Command:
npm install

Start Command:
npm start

Instance Type:
Free 가능

Environment Variables:
Key: OPENAI_API_KEY
Value: 본인의 OpenAI API 키

[접속]
배포 후 Render가 만들어준 주소로 접속합니다.
예:
https://tokki-blog-writer-v4.onrender.com

[기능]
- 블로그 시작문 고정
  안녕하세요 😊 말레이시아에서 두 아이를 키우고 있는 토끼엄마입니다.
- 결과창 6개 카드 분리
- 본문 + 네이버태그 복사
- 스레드 글 복사
- 스레드 질문 마무리 금지
- 참고 문체 샘플 입력창
- 최근 기록은 현재 브라우저에 저장
