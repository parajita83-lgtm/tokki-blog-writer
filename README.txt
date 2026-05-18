토끼엄마 블로그 글쓰기 도우미 - Render 모바일 웹서비스 버전

[로컬 테스트]
1. .env.example 파일을 복사해서 .env 파일로 이름 변경
2. .env에 OPENAI_API_KEY 입력
3. npm install
4. npm start
5. http://localhost:3000 접속

[Render 배포]
1. 이 폴더 전체를 GitHub 저장소에 업로드
2. Render.com → New + → Web Service
3. GitHub 저장소 연결
4. Build Command: npm install
5. Start Command: npm start
6. Environment Variables:
   Key: OPENAI_API_KEY
   Value: 본인의 OpenAI API Key
7. Deploy 클릭

[기능]
모바일 반응형, 제목 추천, 본문 생성, 사진 자리, 태그, 시리즈 추천, 복사, 최근 기록(localStorage)
