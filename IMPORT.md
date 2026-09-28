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
- `questionCount`는 필수이며 배열 길이와 같아야 합니다. 번호는 1부터 `questionCount`까지 중복 없이 사용합니다. 부분 회차 파일은 지원하지 않습니다.
- 제목 생략 시 `회차 제목 N번`을 사용합니다. `code` 등 선택 문자열은 null로 저장하며, 미검수 문제의 해설 생략은 기존 NOT NULL 제약에 맞춰 빈 문자열로 저장합니다.
- 출처: `RESTORED_EXAM`, `JUNGSIL_PREDICTED`, `SAMPLE`, `MANUAL`. 복원 참고 문제는 `sourceUrl`이 필수입니다. 공식 기출이라는 표시는 지원하지 않습니다.
- 검수: `DRAFT`, `REVIEW_REQUIRED` (기본), `CONFLICTED`, `VERIFIED`. `VERIFIED` 문제는 해설과 검수 메모가 필수입니다.
- 언어: `Java`, `C`, `Python`, `SQL`, 또는 null. 문제 유형은 기존 5종, 난이도는 `EASY`, `MEDIUM`, `HARD`를 사용합니다.
- `redistributionAllowed` 기본값은 false입니다. 검수 완료가 재배포 허용을 뜻하지 않습니다.
- `contentHash`는 내용과 코드의 줄바꿈을 LF로 통일하고 양 끝 공백을 제거한 뒤 SHA-256으로 계산합니다. 생략을 권장하며 제공한 값은 계산 결과와 일치해야 합니다.
- 알 수 없는 필드와 잘못된 타입은 오류로 처리합니다. 파일은 10 MiB 이하, 문자열은 100,000자 이하, 대표·허용 정답은 10,000자 이하입니다.

## 갱신과 충돌

식별자는 `certification + examYear + examRound + questionNumber`입니다. 같은 파일을 반복 입력하면 기존 ID·생성 시각·수정 시각을 유지하고 `skipped`로 집계합니다. 다른 번호나 회차에 같은 내용이 있으면 전체 입력을 거절합니다. 기존 해시 없는 문제도 비교합니다.

전체 구조·중복 검증을 통과한 후 회차와 문제를 하나의 트랜잭션으로 반영합니다. 실행 도중 DB 오류가 나면 전체 변경을 롤백합니다. 파일에 없는 기존 문제는 삭제하지 않으며 기존 번호보다 작은 문제 수로 회차를 축소할 수 없습니다.

기존 문제의 내용·코드·대표 정답·허용 정답이 달라지면 기존 내용을 보존하고 검수 상태만 `CONFLICTED`로 바꿉니다. 충돌이 있는 입력도 다른 정상 문제는 같은 트랜잭션에서 반영됩니다. 충돌은 검증 오류와 구분됩니다. 입력 JSON을 보관하고 출처를 직접 비교하세요.

검토를 마친 뒤 해당 문제를 `VERIFIED`로 설정하고 `verificationNote`에 판단 근거를 기록한 파일에 한해 다음 명령으로 충돌을 해결할 수 있습니다.

```bash
npm run questions:import -- --file data/private/2026-2.json --resolve-conflicts
```

이 옵션은 파일 내 검수 완료된 충돌 문제들의 기존 내용·정답을 입력값으로 교체합니다. 다른 파일을 잘못 지정하지 않도록 주의하세요. 일반 import 반복만으로는 충돌이 풀리지 않습니다.

결과는 `inserted`, `updated`, `skipped`, `conflicted` 문제 수로 출력합니다. 검증 실패 시 오류 위치·원인과 종료 코드 1을 반환합니다.

## 기존 데이터와 풀이

기존 필드와 `GAMJA_REFERENCE`·`MOONEO_REFERENCE` 출처 값은 보존합니다. 새 입력에서는 이 두 출처 값을 받지 않습니다. 새 필드의 기본 검수 상태는 `REVIEW_REQUIRED`이며 기존 자체 제작 seed 5개만 마이그레이션에서 검수 완료로 표시합니다. 나머지 기존 문제는 삭제하지 않지만 검수 전까지 풀이에서 숨깁니다.

목록·필터 선택지·상세 API·풀이 화면·답안 제출은 문제 자체가 `VERIFIED`인 경우에만 제공합니다. 회차 검수 상태는 별도 메타데이터이며 문제를 일괄 승인하지 않습니다. 정답·해설·암기 팁·시험 팁은 제출 전 공개 데이터에 포함하지 않습니다. 별도 `code` 필드는 문제 화면에 표시합니다.

```bash
npm run test:import
npm run lint
npm run build
# 별도 서버 없이 임시 DB에서 검증:
npm test
```

Import 테스트는 메모리 DB와 새 임시 폴더를 사용하며 사용자 DB를 수정하지 않습니다.
