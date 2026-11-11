# 로컬 JSON 문제 Import

사용자가 검토한 로컬 JSON만 읽습니다. 외부 사이트 요청, 크롤링, 코드 실행은 하지 않습니다.

## 실행

```bash
npm run db:migrate
npm run questions:validate -- --file data/templates/questions.example.json
npm run questions:import -- --file data/templates/questions.example.json
```

실제 자료는 `data/private/`에 보관합니다. 이 경로와 로컬 DB는 Git에서 제외하며, 자체 제작 예제 `data/templates/questions.example.json`만 공유합니다.

```bash
npm run questions:validate -- --file data/private/2026-2.json
npm run questions:import -- --file data/private/2026-2.json
```

DB가 없거나 최신 마이그레이션이 없으면 먼저 `db:migrate`를 실행합니다. validate는 기존 DB를 읽기 전용으로 열며 DB 생성·마이그레이션·변경을 하지 않습니다. import도 마이그레이션을 자동 실행하지 않습니다.

Windows PowerShell에서 `npm.ps1` 또는 `codex.ps1` 실행 정책 오류가 나면 `npm.cmd`, `codex.cmd`로 실행합니다. 실행 정책 변경은 필요하지 않습니다.

```powershell
codex.cmd
npm.cmd run questions:validate -- --file data/templates/questions.example.json
```

`data/private/2026-2.json`은 사용자가 직접 준비하는 파일이며 저장소에 포함되어 있지 않습니다. 먼저 예제 파일로 검증할 수 있습니다.

## JSON 형식

[자체 제작 예제](data/templates/questions.example.json)를 복사해 수정합니다. 예제의 회차와 날짜는 실제 시험 정보가 아닙니다.

- 루트: `exam` 객체와 `problems` 배열.
- `exam` 필수: `certification`, `examYear`, `examRound`, `examDate` (`YYYY-MM-DD`), `title`, `questionCount`, `sourceType`.
- 문제 필수: `questionNumber`, `questionType`, `topic`, `difficulty`, `content`, `answer`, `sourceType`, `sourceName`.
- 문제 선택: `title`, `subTopic`, `language`, `code`, `acceptedAnswers`, `explanation`, `memoryTip`, `examTip`, `sourceUrl`, `secondarySourceUrl`, `verificationStatus`, `verificationNote`, `contentHash`, `redistributionAllowed`.
- `questionCount`는 전체 예정 문항 수입니다. 배열에는 한 문제 이상만 있어도 됩니다. 번호는 1부터 `questionCount` 범위에서 중복 없이 사용하며, `1, 3, 8`처럼 빠진 번호를 허용합니다.
- 제목 생략 시 `회차 제목 N번`을 사용합니다. `code` 등 선택 문자열은 null로 저장하며, 미검수 문제의 해설 생략은 기존 NOT NULL 제약에 맞춰 빈 문자열로 저장합니다.
- 출처: `RESTORED_EXAM`, `JUNGSIL_PREDICTED`, `SAMPLE`, `MANUAL`. 복원 참고 문제는 `sourceUrl`이 필수입니다. 공식 기출이라는 표시는 지원하지 않습니다.
- 검수: `DRAFT`, `REVIEW_REQUIRED` (기본), `CONFLICTED`, `VERIFIED`. `VERIFIED` 문제는 해설과 검수 메모가 필수입니다.
- 언어: `Java`, `C`, `Python`, `SQL`, 또는 null. 문제 유형은 기존 5종과 `SQL_BLANK`, `CODE_BLANK`, 난이도는 `EASY`, `MEDIUM`, `HARD`를 사용합니다.
- `redistributionAllowed` 기본값은 false입니다. 검수 완료가 재배포 허용을 뜻하지 않습니다.
- `contentHash`는 내용과 코드의 줄바꿈을 LF로 통일하고 양 끝 공백을 제거한 뒤 SHA-256으로 계산합니다. 생략을 권장하며 제공한 값은 계산 결과와 일치해야 합니다.
- 알 수 없는 필드와 잘못된 타입은 오류로 처리합니다. 파일은 10 MiB 이하, 문자열은 100,000자 이하, 대표·허용 정답은 10,000자 이하입니다.

## 갱신과 충돌

식별자는 `certification + examYear + examRound + questionNumber`입니다. 같은 파일을 반복 입력하면 기존 ID·생성 시각·수정 시각을 유지하고 `skipped`로 집계합니다. 다른 번호나 회차에 같은 내용이 있으면 전체 입력을 거절합니다. 기존 해시 없는 문제도 비교합니다.

전체 구조·중복 검증을 통과한 후 회차와 문제를 하나의 트랜잭션으로 반영합니다. 실행 도중 DB 오류가 나면 전체 변경을 롤백합니다. 파일에 없는 기존 문제는 삭제하지 않으며 기존 번호보다 작은 문제 수로 회차를 축소할 수 없습니다.

기존 문제의 내용·코드·유형·대표 정답·허용 정답·빈칸 정답 구성이 달라지면 기존 내용을 보존하고 검수 상태만 `CONFLICTED`로 바꿉니다. 충돌이 있는 입력도 다른 정상 문제는 같은 트랜잭션에서 반영됩니다. 충돌은 검증 오류와 구분됩니다. 입력 JSON을 보관하고 출처를 직접 비교하세요.

검토를 마친 뒤 해당 문제를 `VERIFIED`로 설정하고 `verificationNote`에 판단 근거를 기록한 파일에 한해 다음 명령으로 충돌을 해결할 수 있습니다.

```bash
npm run questions:import -- --file data/private/2026-2.json --resolve-conflicts
```

이 옵션은 파일 내 검수 완료된 충돌 문제들의 기존 내용·정답을 입력값으로 교체합니다. 다른 파일을 잘못 지정하지 않도록 주의하세요. 일반 import 반복만으로는 충돌이 풀리지 않습니다.

결과는 `inserted`, `updated`, `skipped`, `conflicted` 문제 수로 출력합니다. 검증 실패 시 오류 위치·원인과 종료 코드 1을 반환합니다.

부분 Import 후에는 DB 기준 `등록 3/20, 누락 17문항`과 `expected`, `registered`, `verified`, `reviewRequired`, `conflicted`, `draft`, `missingNumbers`를 출력합니다. validate의 누락 번호는 입력 파일 기준입니다. 파일에 없는 기존 문제는 유지하고, 다음 파일로 나머지 번호만 추가할 수 있습니다. 회차는 누락이 있거나 미검수 문제가 있으면 `DRAFT` 또는 `REVIEW_REQUIRED`로 유지합니다. 모든 번호가 채워지고 모든 문제가 검수된 상태에서 회차의 `verificationStatus: "VERIFIED"`를 요청해야 회차도 검수 완료가 됩니다. 개별 문제는 자동 승인하지 않습니다.

## 빈칸 문제

`SQL_BLANK`, `CODE_BLANK`는 기존 필드와 함께 다음 `answerParts`를 필수로 받습니다. 기존 `answer`는 호환용 대표 정답으로 계속 저장합니다.

```json
{
  "questionType": "SQL_BLANK",
  "content": "빈칸을 채우세요: ( ① ), ( ② )",
  "answer": "① LIKE, ② DESC",
  "answerParts": [
    { "key": "①", "label": "첫 빈칸", "answer": "LIKE", "acceptedAnswers": ["like"] },
    { "key": "②", "answer": "DESC" }
  ]
}
```

이는 문제 객체의 일부 예시이며 출처·문제 번호 등 공통 필수 필드도 필요합니다. 빈칸 표기는 `content`와 `code` 전체에서 검증합니다. 원문자 숫자 `(①)` 또는 `( ① )`를 권장하며, 다른 키는 공백을 포함한 `( key )`를 사용합니다. 키 중복·누락·정의되지 않은 표기·빈 정답을 거절합니다. 빈칸은 1~100개, 각 답안은 10,000자까지입니다. 빈칸이 아닌 유형에는 `answerParts`를 넣지 않습니다.

제출은 `{"userAnswers":{"①":"LIKE","②":"DESC"}}` 형식입니다. 앞뒤 공백과 영문 대소문자를 무시하고 빈칸별 허용 정답을 비교합니다. 모든 빈칸이 맞으면 5점, 아니면 0점이며 빈칸별 결과와 정답 개수를 반환합니다. 입력 SQL이나 코드를 실행하지 않습니다. 기록에는 키 순서를 고정한 JSON 문자열을 저장하며, 정답·허용 정답은 제출 전 공개하지 않습니다.

`0004_question_types`는 기존 `question_type`을 `legacy_question_type`으로 보존한 뒤 새 유형 컬럼과 `answer_parts`를 추가합니다. 기존 유형 값만 새 컬럼에 채우며 테이블 재생성·행 삭제·기존 마이그레이션 수정은 하지 않습니다. 호환 컬럼은 과거 제약 보존용이고 앱은 새 `question_type`을 사용합니다. 적용 전에 SQLite 온라인 백업을 만들고 검증하세요.

## 기존 데이터와 풀이

기존 필드와 `GAMJA_REFERENCE`·`MOONEO_REFERENCE` 출처 값은 보존합니다. 새 입력에서는 이 두 출처 값을 받지 않습니다. 새 필드의 기본 검수 상태는 `REVIEW_REQUIRED`이며 기존 자체 제작 seed 5개만 마이그레이션에서 검수 완료로 표시합니다. 나머지 기존 문제는 삭제하지 않지만 검수 전까지 풀이에서 숨깁니다.

목록·필터 선택지·상세 API·풀이 화면·답안 제출은 문제 자체가 `VERIFIED`인 경우에만 제공합니다. 회차 검수 상태는 별도 메타데이터이며 문제를 일괄 승인하지 않습니다. 정답·해설·암기 팁·시험 팁은 제출 전 공개 데이터에 포함하지 않습니다. 별도 `code` 필드는 문제 화면에 표시합니다.

```bash
npm run test:import
npm run test:question-types
npm run test:learning
npm run lint
npm run build
npm run test:http
# 별도 서버 없이 임시 DB에서 검증:
npm test
```

테스트는 메모리 DB 또는 새 임시 폴더를 사용하며 사용자 DB를 수정하지 않습니다. HTTP 테스트는 빌드 결과를 사용해 임시 DB와 전용 서버를 직접 실행하고 종료합니다. 별도 개발 서버가 필요하지 않습니다.
