<div align="center">

# 🌱 JungSil — 정실이

### 정보처리기사 실기, 외우는 공부에서 이해하는 공부로

정실이는 **정보처리기사 실기 1회 합격**을 목표로 만드는
개인 맞춤형 문제 풀이·코드 추적·오답 학습 서비스입니다.

<br />

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square\&logo=nextdotjs\&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square\&logo=typescript\&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square\&logo=tailwindcss\&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square\&logo=sqlite\&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square\&logo=drizzle\&logoColor=black)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=flat-square\&logo=ollama\&logoColor=white)

</div>

---

## 📌 정실이는 어떤 프로젝트인가요?

정보처리기사 실기는 단순 암기만으로 대비하기 어렵습니다.

특히 Java·C·Python 코드 문제나 SQL 실행 결과 문제는
정답만 외우는 것보다 **코드가 어떤 순서로 실행되는지 이해하는 것**이 중요합니다.

정실이는 문제를 풀고 끝내는 서비스가 아니라 다음 과정을 반복하도록 돕습니다.

> 문제 풀이 → 실행 과정 확인 → 해설 이해 → 오답 기록 → 반복 학습

시험까지 남은 **3주~1개월 동안 필요한 핵심 기능만 단계적으로 구현**합니다.

---

## 🎯 프로젝트 목표

* 정보처리기사 실기 **1회 합격**
* 코드 문제의 실행 흐름 이해
* 취약한 유형과 반복되는 오답 확인
* 실제 시험에 필요한 문제만 집중 학습
* AI가 만들어 낸 답이 아닌, 근거가 있는 해설 제공
* 사용자가 직접 설명할 수 있는 개인 프로젝트 완성

---

## ✨ 핵심 기능

### 1. 실기 문제 풀이

정보처리기사 실기 출제 유형별로 문제를 풀 수 있습니다.

* 프로그래밍 코드 실행 결과
* SQL 실행 결과
* 데이터베이스 및 정규화
* 네트워크 계산
* 운영체제
* 소프트웨어 설계 및 테스트
* 보안
* 용어 및 단답형 문제

문제는 다음 조건으로 분류할 예정입니다.

* 문제 유형
* 학습 주제
* 난이도
* 프로그래밍 언어
* 출제 회차

### 2. 코드 실행 및 추적

코드 문제를 눈으로만 해석하지 않고 실제 실행 결과와 흐름을 확인합니다.

* Java 코드 안전 실행
* 변수 값 변화 추적
* 반복문과 조건문 실행 순서 확인
* 메서드 호출 흐름 분석
* 실행 결과와 예상 답안 비교

### 3. AI 해설

로컬 환경에서 실행하는 Ollama를 이용해 문제 해설을 제공합니다.

* 정답이 나온 이유 설명
* 오답을 선택한 원인 분석
* 코드 실행 순서 단계별 설명
* 관련 개념 보충
* 비슷한 유형의 문제 생성

AI 해설은 가능한 한 **문제 데이터와 실제 코드 실행 결과를 근거로 생성**하도록 설계합니다.

### 4. 오답 관리

틀린 문제를 저장하고 반복해서 학습할 수 있습니다.

* 오답 자동 저장
* 취약 주제 분류
* 다시 풀기
* 반복해서 틀린 문제 확인
* 정답률 및 학습 기록 확인

---

## 🧩 지원 예정 문제 유형

| 유형                    | 설명                     |
| --------------------- | ---------------------- |
| `CODE_OUTPUT`         | Java·C·Python 코드 실행 결과 |
| `SQL_OUTPUT`          | SQL 실행 결과 및 쿼리 작성      |
| `NORMALIZATION`       | 함수적 종속성과 정규화           |
| `NETWORK_CALCULATION` | 서브넷, 호스트 수 등 네트워크 계산   |
| `SHORT_ANSWER`        | 용어 및 개념 단답형            |
| `MULTIPLE_CHOICE`     | 개념 확인 객관식              |
| `SECURITY`            | 공격 기법, 암호화, 보안 용어      |
| `DESIGN_PATTERN`      | 디자인 패턴 구분 및 적용         |

---

## 🛠 기술 스택

| 구분          | 기술                  | 사용 목적             |
| ----------- | ------------------- | ----------------- |
| Frontend    | Next.js, TypeScript | 화면 및 서버 기능 구현     |
| Styling     | Tailwind CSS        | 반응형 UI 구성         |
| Database    | SQLite              | 문제와 학습 기록 저장      |
| ORM         | Drizzle ORM         | 데이터베이스 모델 및 쿼리 관리 |
| AI          | Ollama              | 로컬 AI 해설 생성       |
| Code Runner | Docker              | Java 코드 격리 실행     |
| Development | Codex               | 설계, 구현 및 테스트 지원   |

---

## 🗂️ 예상 프로젝트 구조

```text
JungSil/
├─ app/
│  ├─ api/                 # 문제, 답안, 실행 API
│  ├─ problems/            # 문제 목록 및 상세 화면
│  ├─ review/              # 오답 복습 화면
│  └─ dashboard/           # 학습 현황 화면
├─ components/             # 공통 UI 컴포넌트
├─ db/
│  ├─ schema.ts            # 데이터베이스 스키마
│  └─ migrations/          # 마이그레이션
├─ lib/
│  ├─ ai/                  # Ollama 연동
│  ├─ runner/              # 코드 실행 및 추적
│  └─ problems/            # 문제 처리 로직
├─ public/                 # 정적 파일
├─ scripts/                # 데이터 정리 및 개발 스크립트
└─ README.md
```

> 실제 개발 과정에 따라 폴더 구조는 변경될 수 있습니다.

---

## 🚀 실행 방법

### 1. 저장소 이동

```bash
cd D:\Projects\JungSil
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 브라우저 접속

```text
http://localhost:3000
```

---

## 🌱 Phase 1 — Problem Core 실행 및 검증

현재 구현 범위는 SQLite 문제 조회·필터와 `Problem → Solve → Submit → Result` 학습 흐름입니다.
답안을 직접 입력해 서버에 제출한 뒤에만 정답 여부·내 답·정답·해설을 확인합니다.
외부 문제 수집, AI, 코드·SQL 실행, 사용자 기록 저장은 포함하지 않습니다.

### 처음 실행할 때

Node.js 22 LTS 이상을 사용합니다. 프로젝트 루트에서 실행하세요.

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

문제 목록: [http://localhost:3000/problems](http://localhost:3000/problems)

- DB 위치: `data/jungsil.db`. 데이터 파일과 SQLite 저널은 Git에서 제외합니다.
- 별도 환경변수나 `.env` 파일은 필요하지 않습니다. 실제 `.env*` 파일은 기존 규칙으로 제외합니다.
- `db:migrate`는 생성된 `drizzle/` 마이그레이션을 적용하며 재실행해도 기존 데이터를 유지합니다.
- `db:seed`는 자체 제작 샘플 5개를 추가합니다. 고정 ID가 이미 있으면 건너뛰며 기존 문제를 수정하지 않습니다.
- 샘플은 `SAMPLE` / `JungSil Sample`로 저장하며 외부 사이트나 실제 기출문제에서 복사하지 않았습니다.
- 스키마 변경 시 `npm run db:generate`로 SQL을 생성하고 내용을 검토한 뒤 `npm run db:migrate`를 실행합니다.

### 내부 API

| 경로 | 응답 |
| --- | --- |
| `GET /api/problems` | 정답 정보를 제외한 문제 배열 |
| `GET /api/problems/[id]` | 정답 정보를 제외한 문제 객체, 없으면 404 |
| `POST /api/problems/[id]/submit` | 서버 채점 결과, 없으면 404 |

예: `/api/problems?questionType=CODE_OUTPUT&difficulty=EASY&language=Java`

- `questionType`: `CODE_OUTPUT`, `SQL_OUTPUT`, `NORMALIZATION`, `NETWORK_CALCULATION`, `SHORT_ANSWER`
- `difficulty`: `EASY`, `MEDIUM`, `HARD`
- `topic`, `language`: 현재 DB에 저장된 값과 대소문자까지 정확히 일치해야 합니다. 화면 선택 목록에서 확인할 수 있습니다.
- 필터 조합은 AND 조건입니다. 필터가 없거나 빈 문자열이면 해당 조건을 적용하지 않습니다. 정상 조건으로 결과가 없으면 `[]`를 반환합니다.
- 잘못된 값, 중복 필터, 지원하지 않는 필터 이름은 400을 반환합니다.
- 예상하지 못한 오류는 내부 경로나 SQL 없이 일반 오류 메시지와 500을 반환합니다.
- ID는 문자열입니다. 샘플 상세 예: `/problems/sample-java-loop`
- API와 서버 화면은 같은 조회 함수를 사용합니다. 날짜는 DB에 Unix 초 단위로 저장하고 API에서는 ISO 날짜 문자열로 반환합니다.
- `updatedAt`은 Drizzle의 update 호출 시 갱신됩니다. 직접 SQL로 수정할 때는 호출자가 갱신해야 합니다.

### 답안 제출 및 채점

목록·상세 조회에서는 `answer`, `acceptedAnswers`, `explanation`을 조회하지 않습니다.
상세 화면의 클라이언트 입력 폼에는 문제 ID와 유형만 전달하며, 정답 정보는 제출 응답으로만 받습니다.

```json
{ "userAnswer": "20" }
```

`POST /api/problems/sample-java-loop/submit` 응답 예:

```json
{
  "correct": true,
  "userAnswer": "20",
  "correctAnswer": "20",
  "explanation": "i가 1, 2, 3, 4일 때 각각 2, 4, 6, 8을 더합니다. 누적 합은 2 + 4 + 6 + 8 = 20입니다."
}
```

- 빈 답안·공백뿐인 답안·문자열이 아닌 답안·잘못된 JSON은 400입니다. 답안은 최대 10,000자입니다.
- DB 오류 등 예상하지 못한 오류는 내부 정보를 제외한 메시지와 500을 반환합니다.
- `acceptedAnswers`는 nullable JSON 문자열 배열입니다. 기존 문제를 보존하는 컬럼 추가 마이그레이션을 적용합니다.
- 대표 정답 `answer` 또는 추가 정답 `acceptedAnswers` 중 하나와 일치하면 정답입니다. null·빈 목록이면 대표 정답만 사용합니다.
- 공통: 앞뒤 공백 제거, 대소문자 무시, CRLF/CR 줄바꿈을 LF로 통일, 연속된 일반 공백을 하나로 정리합니다.
- `CODE_OUTPUT`: 각 줄 끝 공백을 추가로 제거하며 출력 내용과 줄 순서·내부 빈 줄을 비교합니다.
- `SQL_OUTPUT`: 줄바꿈·공백·탭과 표 구분자 `|` 주변 공백 차이를 무시하고 값의 순서를 비교합니다. SQL을 실행하지 않습니다.
- 나머지 유형: 공통 정규화 후 문자열을 비교합니다. 동의어나 다른 풀이 표현은 `acceptedAnswers`에 명시적으로 등록해야 합니다.
- `SHORT_ANSWER`는 한 줄 input, 나머지는 기존 복합 답안을 입력할 수 있도록 textarea를 사용합니다.
- 제출 중 입력과 버튼을 잠그고, 결과가 나오면 내 답·정답·해설을 표시합니다. 다시 풀기는 입력과 결과를 모두 초기화합니다.
- 채점 결과나 제출 기록은 DB·브라우저 저장소에 저장하지 않습니다.

### 검증

앱이 실행 중인 상태에서 다른 터미널로 실행합니다. 별도 테스트 프레임워크 없이 Node.js assert를 사용합니다.

```bash
npm run lint
npm run build
npm test
```

테스트는 샘플이 입력된 로컬 앱을 대상으로 API·필터·채점·400/404·제출 전 HTML/RSC 정답 비노출을 검사합니다.
DB 제약조건과 기존 데이터 마이그레이션은 메모리 DB에서 검사합니다. 허용 답안 테스트용 행은 트랜잭션으로 격리한 뒤 항상 롤백합니다.
500 응답은 테스트 프로세스의 연결만 닫아서 검사하며, 학습 데이터와 서버 연결은 유지합니다.
브라우저에서 빈 답안 안내, 정답·오답 표시, 다시 풀기의 입력·결과 초기화도 확인하세요.
기본 테스트 주소는 `http://127.0.0.1:3000`이며 다른 포트는 PowerShell에서 다음처럼 지정합니다.

```powershell
$env:TEST_BASE_URL = 'http://127.0.0.1:3100'
npm test
```

SQLite 파일을 유지할 수 있는 Node.js 실행 환경이 필요합니다. 정적 내보내기나 임시 파일시스템 기반 배포는 이번 Phase 범위에 포함하지 않습니다.

---

## 🗺️ 개발 로드맵

### Phase 1 — 기본 환경

* [x] 프로젝트 생성
* [x] 프로젝트명 `JungSil` 결정
* [ ] 기본 레이아웃 구성
* [x] 데이터베이스 연결
* [x] 문제 데이터 모델 설계

### Phase 2 — 문제 풀이

* [x] 문제 목록 화면
* [x] 문제 상세 화면
* [x] 답안 입력 및 채점
* [x] 유형·주제·난이도 필터
* [x] 해설 확인

### Phase 3 — 코드 문제

* [ ] Java 코드 실행 환경
* [ ] 실행 결과 비교
* [ ] 변수 값 변화 추적
* [ ] 코드 구조 분석
* [ ] 안전한 실행 제한 적용

### Phase 4 — AI 해설

* [ ] Ollama 연동
* [ ] 문제별 해설 생성
* [ ] 오답 원인 분석
* [ ] 관련 개념 검색
* [ ] 근거 기반 답변 검증

### Phase 5 — 오답 학습

* [ ] 오답 저장
* [ ] 취약 유형 분석
* [ ] 다시 풀기
* [ ] 학습 통계
* [ ] 시험 직전 복습 모드

---

## 📚 문제 데이터 원칙

정실이는 정보처리기사 실기 시험 대비에 필요한 문제만 다룹니다.

문제 유형과 학습 범위를 분석할 때 다음 자료를 참고합니다.

* 정처기 감자
* 문어CBT

공개된 문제를 그대로 복제하기보다 다음 정보를 중심으로 정리합니다.

* 출제 유형
* 핵심 개념
* 풀이 방식
* 코드 실행 원리
* 유사 문제 제작에 필요한 구조

문제와 해설을 사용할 때는 각 자료의 이용 조건과 저작권을 확인합니다.

---

## 🚫 이번 프로젝트에서 하지 않는 것

짧은 학습 기간 안에 실제로 사용할 수 있는 서비스를 완성하기 위해
다음 기능은 초기 범위에서 제외합니다.

* 여러 자격증을 동시에 지원하는 기능
* 공기업 전공시험 전체 범위 제공
* 불필요한 회원가입 및 소셜 로그인
* 커뮤니티와 게시판
* 복잡한 관리자 페이지
* 근거 없이 답변하는 범용 AI 챗봇
* 학습 목표와 관련 없는 기능 확장

---

## 💡 이름의 의미

**JungSil(정실이)**은 `정보처리기사 실기`에서 가져온 이름입니다.

딱딱한 시험 준비 프로그램보다
매일 함께 공부하고 오답을 챙겨주는 친근한 학습 도우미를 지향합니다.

> “정처기 실기는 정실이와 함께.”

---

## 👤 개발 목적

이 프로젝트는 단순한 포트폴리오 전시용 프로젝트가 아닙니다.

직접 정보처리기사 실기를 준비하면서 겪는 문제를 해결하고,
실제로 매일 사용해 **합격 가능성을 높이는 것**이 가장 중요한 목적입니다.

개발 과정에서는 다음 내용을 기록합니다.

* 왜 이 기능이 필요한가?
* 왜 이 기술을 선택했는가?
* 개발 중 어떤 문제가 발생했는가?
* 문제를 어떻게 해결했는가?
* 실제 학습에 어떤 도움이 되었는가?

---

<div align="center">

### 🌱 정실이와 함께 정보처리기사 실기 1회 합격하기

**JungSil is growing with every solved problem.**

</div>
