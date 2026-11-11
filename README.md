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

## ⚡ 안정적으로 실행하기 — Windows PowerShell

일상적인 문제 풀이는 개발 모드 대신 빌드한 서버로 실행합니다. 프로젝트 폴더의 `Start-JungSil.cmd`를 더블클릭해도 됩니다. 실행 창을 닫으면 서버도 종료되므로 켜 두세요. PC를 재부팅했다면 다시 실행해야 합니다.

```powershell
Set-Location -LiteralPath 'D:\Projects\jungsil'
npm.cmd start
```

접속 주소: [http://localhost:3000](http://localhost:3000). 최초 실행 또는 소스 변경 후에는 실행 중인 서버를 `Ctrl+C`로 종료하고 아래 순서로 실행하세요. 빌드가 실패하면 서버를 시작하지 않습니다.

```powershell
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw '빌드 실패: 위 오류를 확인하세요.' }
npm.cmd start
```

`Failed to Load Page`는 서버가 실행되지 않거나 종료된 경우에도 표시됩니다. 시작 시 `EADDRINUSE`가 나오면 3000번 포트를 사용하는 기존 서버 창을 확인하세요. 다른 프로그램을 임의로 종료하지 마세요. 개발 모드의 Turbopack 연결 충돌을 피하도록 `dev`와 `build`는 Webpack을 사용합니다. 메모리 할당 실패가 발생하면 실행 중인 앱을 줄이고 Windows 가상 메모리 설정에서 페이징 파일이 비활성화되어 있는지 확인하세요.

### 코드 수정용 개발 서버

VS Code에서 **터미널 → 새 터미널**을 열고 실행하세요. 이미 설치와 DB 준비가 끝난 이 PC에서는 아래 두 줄이면 됩니다.

```powershell
Set-Location -LiteralPath 'D:\Projects\jungsil'
npm.cmd run dev
```

터미널에 `Ready`가 표시되면 [http://localhost:3000](http://localhost:3000)을 여세요.
메인에서 정실이 D-day와 **2026년 1회·2회** 회차 카드를 볼 수 있습니다. 문제 데이터는 이 PC의 로컬 DB에 저장되어 있으며 새로 내려받은 저장소에 자동으로 포함되지는 않습니다.

- 실행 중에는 터미널을 켜 두세요. 종료는 `Ctrl+C`입니다.
- 다른 포트로 실행됐으면 터미널의 `Local` 주소로 접속하세요.
- 직접 포트를 정하려면 `npm.cmd run dev -- --port 3001`을 실행하고 `http://localhost:3001`로 접속하세요.
- PowerShell에서는 `npm.ps1` 실행 정책 오류를 피하도록 `npm.cmd`를 사용합니다.
- 처음 설치하는 PC의 준비 과정은 아래 [실행 방법](#-실행-방법)을 참고하세요.
- 새 PDF를 추가하려면 [PDF 기출문제 직접 추가하기](#-pdf-기출문제-직접-추가하기)를 따라 하세요.

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

### 처음 설치하는 PC

Node.js 22 이상과 npm이 필요합니다. Windows PowerShell에서 아래 명령을 **한 단계씩**, 성공 여부를 확인하며 실행하세요.

```powershell
Set-Location -LiteralPath 'D:\Projects\jungsil'
npm.cmd install
npm.cmd run db:migrate
npm.cmd run dev
```

이미 DB가 있는 PC에서 스키마를 업데이트할 때는 먼저 `node node_modules/tsx/dist/cli.mjs scripts/backup-database.ts`로 백업하고, 성공한 뒤 `npm.cmd run db:migrate`를 실행하세요. 새 PC에 DB가 아직 없으면 백업 단계는 필요하지 않습니다.

[메인](http://localhost:3000) · [기출문제 모음](http://localhost:3000/problems) · [오답노트](http://localhost:3000/wrong-answers) · [취약점 분석](http://localhost:3000/stats)

서버 실행 명령과 포트 옵션: [Next.js 공식 CLI 문서](https://nextjs.org/docs/app/api-reference/cli/next).

---

## 📥 PDF 기출문제 직접 추가하기

**현재는 PDF 업로드·자동 변환 기능이 없습니다.** PDF를 폴더에 넣는 것만으로 문제는 등록되지 않습니다. **PDF → 검토한 JSON → 검증 → 백업 → Import** 순서로 추가합니다.

### 1. PDF와 새 JSON 파일 준비

PDF 원본은 `data/private/`에 보관하고, [JSON 예제](data/templates/questions.example.json)를 편집기에서 열어 **다른 이름으로 저장**하세요. 예를 들어 `data/private/2025-3.json`처럼 실제 PDF의 연도·회차로 이름을 붙입니다. 아래 명령의 `2025-3.json`도 본인이 만든 파일명으로 바꾸세요.

이 PC의 `data/private/2026-1.json`, `data/private/2026-2.json`은 기존 등록 자료입니다. 구조를 참고할 수 있지만 새 회차를 만들 때 덮어쓰지는 마세요. `data/private/`는 Git에서 제외되므로 원본 PDF와 JSON은 별도로 보관하세요.

### 2. PDF 내용을 JSON에 옮기기

예제의 `exam`은 회차 정보, `problems` 배열은 개별 문제입니다. 예제는 자체 제작 샘플이므로 문제뿐 아니라 출처와 회차 정보도 실제 자료에 맞게 바꿔야 합니다.

| 위치 | 작성할 내용 |
| --- | --- |
| `exam.certification` | `정보처리기사` |
| `exam.examYear`, `exam.examRound` | 실제 연도·회차. 파일명만 바꿔서는 새 회차가 되지 않습니다. |
| `exam.examDate`, `exam.title` | 확인한 시험 날짜(`YYYY-MM-DD`)와 회차 제목 |
| `exam.questionCount` | 전체 예정 문항 수. 20문항이면 `20` |
| `exam.sourceType` 및 각 문제의 `sourceType` | 복원 기출은 `RESTORED_EXAM` |
| 각 문제의 `questionNumber` | 회차 안에서 중복되지 않는 번호 |
| `content`, `code` | 문제 본문·보기·표·그림의 필요한 정보, 별도 코드 |
| `questionType`, `topic`, `difficulty`, `language` | 문제 유형·주제·난이도·언어. 허용 값은 [Import 안내](IMPORT.md) 참고 |
| `answer`, `acceptedAnswers` | 대표 정답과 허용할 다른 정답 표현 |
| `sourceName`, `sourceUrl` | 출처 이름과 원문 HTTP(S) 주소. `RESTORED_EXAM`에는 URL 필수 |
| `explanation`, `verificationNote` | 대조한 해설과 검수 근거 |
| `redistributionAllowed` | 제공 자료의 재배포 허용 여부. 허용받지 않았다면 `false` |

PDF에서 텍스트를 복사하되 코드의 들여쓰기·연산자·표의 행/열을 원본과 대조하세요. 스캔 PDF라 복사가 안 되면 OCR 또는 직접 입력이 필요하며, 추출 결과를 그대로 정답으로 믿으면 안 됩니다. JSON 문자열 안의 줄바꿈은 `\n`, 큰따옴표는 `\"`로 적습니다.

번호가 무작위로 표시된 PDF라면 **PDF 표시 순서**로 관리하고 제목·검수 메모에도 그렇게 적으세요. 실제 출제 순서로 표시하지 않습니다. 정답이 없거나 불확실한 문항은 임의로 채우지 말고, 정답을 확인한 문항부터 부분 등록할 수 있습니다.

### 3. 검수 상태 정하기

- 작성 중에는 예제의 `VERIFIED` 값을 그대로 두지 말고 회차와 문제를 `REVIEW_REQUIRED`로 바꾸세요.
- 본문·보기·코드·정답을 대조한 문제만 `verificationStatus: "VERIFIED"`로 바꿉니다. 이때 `explanation`과 `verificationNote`가 필수입니다.
- **개별 문제가 `VERIFIED`여야 풀이 화면에 표시됩니다.** 회차만 `VERIFIED`로 바꿔도 문제들이 일괄 승인되지는 않습니다.
- SQL·코드 빈칸은 `SQL_BLANK`·`CODE_BLANK`와 `answerParts`를 사용합니다. 작성 예시는 [빈칸 문제 안내](IMPORT.md#빈칸-문제)를 참고하세요.

### 4. 검증 → 백업 → 등록

JSON을 UTF-8로 저장한 후 아래 명령을 실행하세요. **실제 DB에 문제를 추가하는 명령**이며, 검증 또는 백업이 실패하면 Import를 중단합니다. 백업 중에는 답안 제출 등 DB를 변경하는 작업을 잠시 멈추세요.

```powershell
Set-Location -LiteralPath 'D:\Projects\jungsil'
$questionFile = 'data/private/2025-3.json'

npm.cmd run questions:validate -- --file $questionFile
if ($LASTEXITCODE -ne 0) {
  throw 'JSON 검증 실패: 오류를 수정한 뒤 다시 실행하세요.'
}

node node_modules/tsx/dist/cli.mjs scripts/backup-database.ts
if ($LASTEXITCODE -ne 0) {
  throw '백업 실패: 문제를 등록하지 않습니다.'
}

npm.cmd run questions:import -- --file $questionFile
if ($LASTEXITCODE -ne 0) {
  throw 'Import 오류: 출력 내용을 확인하세요.'
}
```

`validate`는 실제 DB를 읽기 전용으로 확인하며 형식·중복 등을 검사합니다. **문제 정답의 정확성을 판정하거나 Import의 모든 변경을 미리 보여주는 dry-run은 아닙니다.** 백업 파일은 `data/backups/`에 생성되고 `VERIFIED BACKUP:` 뒤에 정확한 경로가 출력됩니다.

등록 결과의 `inserted`는 추가, `updated`는 수정, `skipped`는 동일해서 건너뜀, `conflicted`는 충돌 문항 수입니다. `등록 20/20, 누락 0문항`처럼 등록 수·누락 번호와 검수 상태를 확인하세요.

현재 로컬의 `audit-2026-2.ts`, `backup-2026-2.cjs` 등은 **2026년 2회 추가 당시의 일회성 스크립트**입니다. 다른 PDF를 추가할 때 재사용하지 말고 위의 공용 명령을 사용하세요.

### 5. 화면에서 확인 및 충돌 처리

서버가 꺼져 있으면 `npm.cmd run dev`로 실행하고 메인 또는 `/problems`를 새로고침하세요. 새 회차 카드를 열어 등록 문항 수와 실제 문제를 확인합니다. 회차는 있는데 풀이 가능한 문제가 없다면 각 문제의 `verificationStatus`를 확인하세요.

같은 파일을 다시 등록해도 내용이 같으면 중복 생성하지 않습니다. 파일에 없는 기존 문제와 학습 기록은 삭제하지 않습니다. 다만 같은 회차·번호의 메타데이터는 갱신될 수 있고, 본문·정답 등이 달라지면 기존 내용을 보존하면서 `CONFLICTED`로 바뀌어 풀이에서 숨겨질 수 있습니다. 충돌은 오류 종료와 다르므로 결과의 `conflicted` 값을 반드시 확인하세요.

`--resolve-conflicts`는 기존 내용·정답을 교체할 수 있으므로 일반 추가 명령에는 넣지 않습니다. 충돌을 발견하면 원본을 비교한 뒤 [갱신과 충돌 안내](IMPORT.md#갱신과-충돌)에 따라 처리하세요. Import 트랜잭션 내부 오류는 롤백되지만 커밋 후 결과 출력 오류까지 자동으로 되돌리는 것은 아닙니다.

---

## 🌱 Phase 1 — Problem Core 실행 및 검증

현재 구현 범위는 SQLite 문제 조회·필터와 `Problem → Solve → Submit → Result` 학습 흐름입니다.
답안을 직접 입력해 서버에 제출한 뒤에만 정답 여부·내 답·정답·해설을 확인합니다.
풀이 기록과 오답 조회 API를 제공합니다. 외부 문제 수집, AI, 코드·SQL 실행은 포함하지 않습니다.

### 처음 실행할 때

Node.js 22 LTS 이상을 사용합니다. 프로젝트 루트에서 실행하세요.

```bash
npm install
npm run db:migrate
npm run dev
```

문제 목록: [http://localhost:3000/problems](http://localhost:3000/problems)

- DB 위치: `data/jungsil.db`. 데이터 파일과 SQLite 저널은 Git에서 제외합니다.
- 별도 환경변수나 `.env` 파일은 필요하지 않습니다. 실제 `.env*` 파일은 기존 규칙으로 제외합니다.
- `db:migrate`는 생성된 `drizzle/` 마이그레이션을 적용하며 재실행해도 기존 데이터를 유지합니다.
- 자동 seed는 없습니다. 학습 문제는 검토한 로컬 JSON을 Import하여 등록합니다.
- 변경 전 백업: `npx tsx scripts/backup-database.ts`. SQLite 온라인 백업을 만들고 무결성·스키마·전체 행을 대조합니다. 백업은 `data/backups/`에 저장되며 Git에서 제외됩니다.
- 스키마 변경 시 `npm run db:generate`로 SQL을 생성하고 내용을 검토한 뒤 `npm run db:migrate`를 실행합니다.

### 내부 API

| 경로 | 응답 |
| --- | --- |
| `GET /api/problems` | 정답 정보를 제외한 문제 배열 |
| `GET /api/problems/[id]` | 정답 정보를 제외한 문제 객체, 없으면 404 |
| `POST /api/problems/[id]/submit` | 기록 저장 후 attemptId·점수·채점 결과, 없으면 404 |
| `GET /api/attempts` | 최근 풀이 기록과 문제 기본 정보 |
| `GET /api/wrong-answers` | 문제별 오답 횟수와 가장 최근 오답 |

예: `/api/problems?questionType=CODE_OUTPUT&difficulty=EASY&language=Java`

- `questionType`: `CODE_OUTPUT`, `SQL_OUTPUT`, `NORMALIZATION`, `NETWORK_CALCULATION`, `SHORT_ANSWER`
- `difficulty`: `EASY`, `MEDIUM`, `HARD`
- `topic`, `language`: 현재 DB에 저장된 값과 대소문자까지 정확히 일치해야 합니다. 화면 선택 목록에서 확인할 수 있습니다.
- 필터 조합은 AND 조건입니다. 필터가 없거나 빈 문자열이면 해당 조건을 적용하지 않습니다. 정상 조건으로 결과가 없으면 `[]`를 반환합니다.
- 잘못된 값, 중복 필터, 지원하지 않는 필터 이름은 400을 반환합니다.
- 예상하지 못한 오류는 내부 경로나 SQL 없이 일반 오류 메시지와 500을 반환합니다.
- ID는 문자열입니다. 상세 경로: `/problems/[id]`
- API와 서버 화면은 같은 조회 함수를 사용합니다. 날짜는 DB에 Unix 초 단위로 저장하고 API에서는 ISO 날짜 문자열로 반환합니다.
- `updatedAt`은 Drizzle의 update 호출 시 갱신됩니다. 직접 SQL로 수정할 때는 호출자가 갱신해야 합니다.

### 답안 제출 및 채점

목록·상세 조회에서는 `answer`, `acceptedAnswers`, `explanation`을 조회하지 않습니다.
상세 화면의 클라이언트 입력 폼에는 문제 ID와 유형만 전달하며, 정답 정보는 제출 응답으로만 받습니다.

```json
{ "userAnswer": "20" }
```

`POST /api/problems/[id]/submit` 응답 예:

```json
{
  "attemptId": "생성된 UUID",
  "correct": true,
  "score": 5,
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
- 정답·오답 모두 `problem_attempts`에 원본 답안과 함께 저장합니다. 저장 실패는 500이며 성공 응답을 반환하지 않습니다.
- 정답은 5점, 오답은 0점입니다. ID는 UUID이며 기록이 있는 문제는 외래키 RESTRICT로 삭제를 막습니다.
- 제출 본문의 선택 필드: `startedAt` (UTC ISO 문자열, 예: `2026-09-23T06:00:00.000Z`), `attemptContext` (기본 `PRACTICE`).
- `attemptContext`는 `PRACTICE`, `PAST_EXAM_SESSION`, `MOCK_EXAM`, `WRONG_ANSWER_RETRY`를 지원합니다. 세션 관리 기능은 아직 없습니다.
- 시작 시각이 없으면 `startedAt`·`durationSeconds`는 null입니다. 화면은 첫 답안 입력부터 제출까지 측정하며 다시 풀기 시 초기화합니다. 클라이언트 시각 기반 참고값입니다.
- `GET /api/attempts?correct=false&problemId=ID&limit=50`: `correct=true|false`, `problemId` 필터를 AND로 적용합니다.
- 두 조회 API 모두 기본 50개·최대 200개이며 `limit`은 양의 정수입니다. 잘못된 값·중복·알 수 없는 필터는 400입니다.
- 풀이 기록은 제출 시각 내림차순이며 같은 초에는 삽입 순서 역순입니다.
- 오답 응답: `{ problem: { id, title, topic, subTopic, language, questionType, difficulty }, wrongCount, latestWrongAttempt: { attemptId, userAnswer, submittedAt } }`.
- 나중에 맞혀도 과거 오답 횟수는 유지합니다. 풀이 기록 API는 정답·해설을 반환하지 않습니다. 오답노트는 이미 틀린 문제의 정답·해설을 반환합니다. 문제 메타데이터·정답·해설은 현재 문제 내용을 사용합니다.


### 오답노트와 취약점 분석

- `/wrong-answers`: 전체 오답 요약, 출처·연도·회차·유형·주제·세부 주제·언어·복습 상태 필터와 다시 풀기.
- `GET /api/wrong-answers`: 기본 50개·최대 200개, `offset` 페이지 이동. 미복습 → 복습 중 → 복습 완료, 오답 횟수 내림차순, 최근 오답 순으로 정렬합니다.
- 추가 필터: `sourceType`, `examYear`, `examRound`, `questionType`, `topic`, `subTopic`, `language`, `reviewStatus`. 빈 값은 전체이며 `language=NONE`·`subTopic=NONE`은 null을 뜻합니다.
- 응답에는 `problemId, title, content, questionType, topic, subTopic, language, difficulty, sourceType, examYear, examRound, questionNumber, wrongCount, totalAttemptCount, latestWrongAnswer, correctAnswer, explanation, latestWrongAt, latestAttemptCorrect, consecutiveCorrectCount, reviewStatus`를 포함합니다. 기존 `problem`·`latestWrongAttempt`도 유지합니다.
- 연도·회차는 연결된 `exam_sets`를 우선 사용하고, 없으면 문제의 `source_year`·`source_round`를 사용합니다.
- 가장 최근 오답 이후 `WRONG_ANSWER_RETRY` 정답이 0회면 `NOT_REVIEWED`, 1회면 `REVIEWING`, 2회 이상이면 `MASTERED`입니다. 일반 정답은 포함하지 않으며 어떤 모드든 다시 틀리면 초기화합니다. 같은 초의 제출은 기존 삽입 순서로 구분합니다.
- `/problems/[id]?mode=retry`는 새 입력 폼으로 시작하고, 제출 후 연속 정답 횟수·복습 상태를 보여줍니다. 저장과 상태 조회는 같은 트랜잭션에서 수행합니다.
- `/stats`, `GET /api/stats/weaknesses`: 전체 제출·정오답·정답률·고유 문제 수·미해결 오답과 `groups.topic/subTopic/language/questionType/sourceType`, `recommendations`를 반환합니다. 각 그룹은 기본 50개·최대 200개(`limit`)이며 취약도 순으로 제한합니다. 전체 합계는 제한과 무관합니다.
- 정답률은 제출 기준이고 판정 최소 표본은 고유 문제 3개입니다. 3개 미만은 데이터 부족, 60% 미만은 취약, 60% 이상 75% 미만은 주의, 75% 이상은 양호입니다. 고유 3개 이상에서 반복 오답 2회 이상·정답률 60% 미만이면 집중 복습을 우선합니다.
- `repeatedWrongCount`는 문제별 `max(오답 횟수 - 1, 0)`의 합입니다. 미해결 오답은 오답 이력이 있고 MASTERED가 아닌 고유 문제 수입니다.
- 추천은 반복 미복습 문제 → 집중 복습 주제 → 취약 언어 → 복습 중 문제 → 7일간 풀지 않은 취약 주제 순으로 최대 5개입니다. 동일 링크를 중복 추천하지 않습니다.
- 문제 목록·상세 API와 재풀이 전 HTML/RSC는 정답을 노출하지 않습니다. 오답노트에서만 이미 틀린 문제의 정답·해설을 보여줍니다.
- 통계·상태 테이블과 마이그레이션을 추가하지 않습니다. SQL 집계 후 제한된 결과만 읽으며 문제 수에 비례하는 개별 조회를 하지 않습니다. 화면의 요약은 전체 기록 기준입니다.

### 검증

별도 테스트 프레임워크 없이 Node.js assert를 사용합니다.

```bash
npm test
npm run test:import
npm run test:learning
npm run lint
npm run build
```

`npm test`는 임시 DB에서 마이그레이션·스키마·제약조건·기존 채점 규칙·목록/상세/필터·풀이 저장·오답 집계·400/404/500을 검사하고 임시 폴더를 정리합니다. 학습 DB나 실행 중인 앱이 필요하지 않습니다.

실제 HTTP·HTML/RSC 검증은 프로젝트 루트의 DB를 사용하는 앱을 실행한 뒤 별도로 수행합니다.

```powershell
$env:TEST_BASE_URL = 'http://127.0.0.1:3000'
npm run test:http
```

HTTP 검증은 `test-http-UUID` 문제 한 개와 제출 기록을 생성한 뒤, 성공·실패 모두 해당 ID의 데이터만 정리합니다. 강제 종료 시에는 출력된 테스트 ID를 확인해야 합니다.
브라우저에서 첫 입력 이후 시간 측정, 정답·오답 표시, 다시 풀기도 확인할 수 있습니다.

SQLite 파일을 유지할 수 있는 Node.js 실행 환경이 필요합니다. 정적 내보내기나 임시 파일시스템 기반 배포는 이번 Phase 범위에 포함하지 않습니다.

로컬 문제 JSON 검증·가져오기: [Import 사용 안내](IMPORT.md).

---

## 🗺️ 개발 로드맵

[GitHub Issues](https://github.com/parkharoi/jungsil/issues)에서 개발 작업을 관리할 예정입니다.
기존 체크리스트는 [이슈 이전용 로드맵](ROADMAP.md)에 보관했습니다.

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
