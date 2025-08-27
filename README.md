# 🎵 AI Music Studio - 프론트엔드

> AI 기반 배경음악 생성 및 변환 시스템의 프론트엔드 애플리케이션

[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.0-blue)](https://mui.com/)
[![React Router](https://img.shields.io/badge/React%20Router-6.0-red)](https://reactrouter.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 📋 프로젝트 소개

AI Music Studio는 사용자가 원하는 분위기와 장르의 배경음악을 AI를 통해 손쉽게 생성하고, 기존 음악을 새로운 스타일로 변환할 수 있는 웹 애플리케이션입니다.

### ✨ 주요 기능

- 🎼 **음악 생성**: 장르와 분위기를 선택하여 새로운 음악 생성
- 🔄 **음악 변환**: 기존 음악을 다른 스타일로 변환
- 📚 **라이브러리**: 생성한 음악들을 체계적으로 관리
- 🎵 **실시간 재생**: 생성된 음악을 즉시 미리듣기
- 💾 **다운로드**: 고품질 음악 파일 다운로드

### 🎯 대상 사용자

- 콘텐츠 크리에이터 (유튜버, 팟캐스터 등)
- 영상 편집자
- 게임 개발자
- 음악 애호가
- 저작권 걱정 없는 배경음악이 필요한 모든 사용자

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 16.0 이상
- npm 또는 yarn
- 모던 브라우저 (Chrome, Firefox, Safari, Edge)

### 설치 방법

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-username/ai-music-frontend.git
   cd ai-music-frontend
   ```

2. **의존성 설치**
   ```bash
   npm install
   # 또는
   yarn install
   ```

3. **환경 변수 설정** (선택사항)
   ```bash
   # .env 파일 생성
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   ```

4. **개발 서버 실행**
   ```bash
   npm start
   # 또는
   yarn start
   ```

5. **브라우저에서 접속**
   
   [http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 🏗️ 프로젝트 구조

```
src/
├── components/           # 재사용 가능한 컴포넌트
│   ├── common/          # 공통 UI 컴포넌트
│   │   ├── GenreSelector.js
│   │   └── MoodSelector.js
│   └── layout/          # 레이아웃 컴포넌트
│       └── Navbar.js
├── pages/               # 페이지 컴포넌트
│   ├── MusicGeneration.js
│   ├── MusicConversion.js
│   ├── ResultPage.js
│   └── Library.js
├── context/             # 전역 상태 관리
│   └── MusicContext.js
├── services/            # API 통신 서비스
│   └── musicApi.js
└── App.js              # 메인 앱 컴포넌트
```

## 🎨 UI/UX 특징

### 디자인 시스템
- **Modern Material Design**: Material-UI 기반의 일관된 디자인
- **반응형 레이아웃**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- **다크/라이트 모드**: 사용자 선호에 따른 테마 지원 (추후 구현)
- **접근성**: WCAG 2.1 가이드라인 준수

### 사용자 경험
- **직관적인 인터페이스**: 누구나 쉽게 사용할 수 있는 UI
- **실시간 피드백**: 작업 진행률과 상태를 실시간으로 표시
- **빠른 미리보기**: 생성된 음악을 즉시 확인 가능
- **효율적인 워크플로우**: 최소한의 클릭으로 음악 생성

## 📱 페이지별 기능

### 🎼 음악 생성 페이지
- 장르 선택 (최대 3개)
- 분위기 키워드 선택 (최대 5개)
- 상세 설명 입력
- 음악 길이 설정 (30초 ~ 10분)
- 실시간 생성 진행률 표시

### 🔄 음악 변환 페이지
- 드래그 앤 드롭 파일 업로드
- 원본 음악 미리듣기
- 변환할 장르 선택
- 변환 강도 조절 (1-5 스케일)

### ✅ 결과 페이지
- 고품질 음악 플레이어
- 음악 정보 및 메타데이터 표시
- 다운로드, 즐겨찾기, 공유 기능
- 라이브러리 추가 및 재생성 옵션

### 📚 라이브러리 페이지
- 생성한 모든 음악 관리
- 검색 및 필터링 기능
- 정렬 옵션 (날짜, 제목, 길이, 즐겨찾기)
- 카드 형식의 시각적 표시

## 🔧 기술 스택

### 프론트엔드
- **React 18**: 최신 React 기능 활용
- **React Router DOM**: 클라이언트 사이드 라우팅
- **Material-UI (MUI)**: 디자인 시스템 및 컴포넌트
- **React Dropzone**: 파일 드래그 앤 드롭

### 상태 관리
- **React Context API**: 전역 상태 관리
- **useReducer**: 복잡한 상태 로직 처리

### 스타일링
- **Material-UI Theme**: 일관된 디자인 토큰
- **CSS-in-JS**: Emotion 기반 동적 스타일링
- **반응형 디자인**: Breakpoint 기반 적응형 레이아웃

## 🔌 API 연동

### 백엔드 연동 구조
```javascript
// 음악 생성 예시
const generateMusic = async (params, onProgress) => {
  // 1. 생성 요청
  const { taskId } = await apiRequest('/music/generate', {
    method: 'POST',
    body: JSON.stringify(params)
  });
  
  // 2. 진행률 폴링
  return await pollTaskProgress(taskId, onProgress);
};
```

### 지원하는 API 엔드포인트
- `POST /music/generate` - 음악 생성
- `POST /music/convert` - 음악 변환
- `GET /music/library` - 라이브러리 조회
- `GET /music/download/:id` - 음악 다운로드

## 📦 빌드 및 배포

### 개발 빌드
```bash
npm start
```

### 프로덕션 빌드
```bash
npm run build
```

### 배포 준비
```bash
npm install -g serve
serve -s build
```

### 권장 배포 플랫폼
- **Vercel**: 자동 배포 및 CDN
- **Netlify**: 정적 사이트 호스팅
- **AWS S3 + CloudFront**: 확장 가능한 배포
- **GitHub Pages**: 오픈소스 프로젝트용

## 🧪 테스트

### 테스트 실행
```bash
# 단위 테스트
npm test

# 커버리지 포함 테스트
npm test -- --coverage

# E2E 테스트 (추후 구현)
npm run test:e2e
```

### 테스트 전략
- **단위 테스트**: 컴포넌트 및 유틸리티 함수
- **통합 테스트**: 페이지 플로우 및 API 연동
- **E2E 테스트**: 전체 사용자 시나리오

## 🔍 브라우저 지원

| 브라우저 | 버전 |
|----------|------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## 🎯 성능 최적화

### 현재 구현된 최적화
- **코드 분할**: React.lazy를 통한 컴포넌트 지연 로딩
- **메모이제이션**: useCallback, useMemo 활용
- **번들 최적화**: Tree shaking 및 압축

### 계획된 최적화
- **이미지 최적화**: WebP 포맷 지원
- **캐싱**: Service Worker 활용
- **Progressive Web App**: PWA 기능 추가

## 🛠️ 개발 도구

### 권장 VS Code 확장
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer

### 개발 스크립트
```bash
# 개발 서버 실행
npm start

# 빌드
npm run build

# 테스트
npm test

# 의존성 분석
npm run analyze
```

## 🤝 기여하기

### 기여 방법
1. 이 저장소를 Fork합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

### 코딩 컨벤션
- **ESLint**: 코드 품질 및 스타일 검사
- **Prettier**: 일관된 코드 포맷팅
- **Conventional Commits**: 커밋 메시지 규칙

## 📚 추가 문서

- [UI/UX 설계 문서](UI_UX_DESIGN.md)
- [프로젝트 상세 문서](PROJECT_DOCUMENTATION.md)
- [API 문서](API_DOCUMENTATION.md) (별도 저장소)
- [배포 가이드](DEPLOYMENT.md) (추후 작성)

## 🐛 알려진 이슈

현재 알려진 주요 이슈가 없습니다. 문제 발견 시 [Issues](https://github.com/your-username/ai-music-frontend/issues)에서 보고해 주세요.

## 🗺️ 로드맵

### v1.0 (현재)
- ✅ 기본 음악 생성 기능
- ✅ 음악 변환 기능
- ✅ 라이브러리 관리
- ✅ 반응형 UI

### v1.1 (계획)
- 🔄 실시간 음악 미리보기
- 🔄 고급 설정 옵션
- 🔄 사용자 계정 시스템
- 🔄 음악 공유 기능

### v2.0 (미래)
- 📋 협업 기능
- 📋 AI 모델 선택 옵션
- 📋 모바일 앱 (React Native)
- 📋 플러그인 시스템

## 📄 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE) 하에 배포됩니다.

## 👨‍💻 개발팀

- **Frontend Developer**: [Your Name](https://github.com/your-username)
- **UI/UX Designer**: [Designer Name](https://github.com/designer-username)
- **Backend Developer**: [Backend Dev](https://github.com/backend-username)

## 💬 문의 및 지원

- **이메일**: support@aimusic.studio
- **Discord**: [AI Music Studio Community](https://discord.gg/your-server)
- **GitHub Issues**: [Report a Bug](https://github.com/your-username/ai-music-frontend/issues)

---

**Made with ❤️ for music creators worldwide**
