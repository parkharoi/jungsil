import { getDb } from "../src/db";
import { problems } from "../src/db/schema";

const source = {
  verificationStatus: "VERIFIED" as const,
  verificationNote: "개발 검증용 자체 제작 문제",
  redistributionAllowed: true,
  sourceType: "SAMPLE" as const,
  sourceName: "JungSil Sample",
  sourceUrl: null,
  sourceYear: null,
  sourceRound: null,
};
const samples: (typeof problems.$inferInsert)[] = [
  {
    id: "sample-java-loop",
    title: "Java 반복문의 누적 합",
    content: "다음 Java 코드의 출력 결과를 쓰세요.\n\nint total = 0;\nfor (int i = 1; i <= 4; i++) {\n    total += i * 2;\n}\nSystem.out.println(total);",
    answer: "20",
    explanation: "i가 1, 2, 3, 4일 때 각각 2, 4, 6, 8을 더합니다. 누적 합은 2 + 4 + 6 + 8 = 20입니다.",
    questionType: "CODE_OUTPUT", topic: "반복문", difficulty: "EASY", language: "Java", ...source,
  },
  {
    id: "sample-c-array",
    title: "C 배열과 포인터",
    content: "다음 C 코드의 출력 결과를 쓰세요.\n\n#include <stdio.h>\n\nint main(void) {\n    int values[] = {3, 6, 9};\n    int *p = values;\n    printf(\"%d\\n\", *(p + 1) + values[2]);\n    return 0;\n}",
    answer: "15",
    explanation: "p는 배열의 첫 원소를 가리킵니다. *(p + 1)은 두 번째 원소인 6이고 values[2]는 9이므로 15가 출력됩니다.",
    questionType: "CODE_OUTPUT", topic: "배열과 포인터", difficulty: "MEDIUM", language: "C", ...source,
  },
  {
    id: "sample-sql-group",
    title: "SQL 그룹별 합계 조회",
    content: "sales 테이블의 데이터와 SQL이 다음과 같을 때 조회 결과를 쓰세요.\n\ncategory | amount\nA        | 10\nB        | 8\nA        | 15\nB        | 12\n\nSELECT category, SUM(amount) AS total\nFROM sales\nGROUP BY category\nHAVING SUM(amount) >= 22\nORDER BY category;",
    answer: "category | total\nA        | 25",
    explanation: "A의 합계는 25, B의 합계는 20입니다. HAVING 조건은 그룹 합계가 22 이상인 A만 남깁니다.",
    questionType: "SQL_OUTPUT", topic: "집계와 그룹화", difficulty: "MEDIUM", language: "SQL", ...source,
  },
  {
    id: "sample-normalization",
    title: "부분 함수 종속과 제2정규형",
    content: "수강(학생ID, 강좌ID, 학생이름, 성적) 릴레이션의 후보키는 (학생ID, 강좌ID) 하나뿐입니다.\n모든 속성은 원자값이며 함수 종속은 다음과 같습니다.\n\n학생ID → 학생이름\n(학생ID, 강좌ID) → 성적\n\n현재 만족하는 최고 정규형과 제2정규형을 만족하도록 분해한 릴레이션을 쓰세요.",
    answer: "제1정규형\n학생(학생ID, 학생이름)\n수강(학생ID, 강좌ID, 성적)",
    explanation: "모든 속성이 원자값이므로 제1정규형을 만족합니다. 학생이름은 복합 후보키의 일부인 학생ID에만 종속되어 제2정규형을 위반합니다. 학생 정보를 분리하면 부분 함수 종속이 제거됩니다.",
    questionType: "NORMALIZATION", topic: "정규화", difficulty: "MEDIUM", language: null, ...source,
  },
  {
    id: "sample-network-subnet",
    title: "IPv4 서브넷의 사용 가능한 호스트 수",
    content: "192.168.10.64/27 서브넷의 네트워크 주소, 브로드캐스트 주소, 사용 가능한 호스트 주소 범위와 호스트 수를 구하세요.\n일반적인 IPv4 서브넷으로 네트워크 주소와 브로드캐스트 주소는 호스트에 할당하지 않습니다.",
    answer: "네트워크: 192.168.10.64\n브로드캐스트: 192.168.10.95\n호스트 범위: 192.168.10.65 ~ 192.168.10.94\n호스트 수: 30",
    explanation: "/27은 호스트 비트가 5개이므로 주소 블록 크기가 2^5 = 32입니다. 64부터 95까지가 한 블록이며 네트워크·브로드캐스트 주소 2개를 제외하면 호스트는 30개입니다.",
    questionType: "NETWORK_CALCULATION", topic: "서브넷", difficulty: "EASY", language: null, ...source,
  },
];

const db = getDb();
try {
  const inserted = db.insert(problems).values(samples).onConflictDoNothing({ target: problems.id }).run();
  console.log(`Inserted ${inserted.changes} samples; existing problems preserved.`);
} finally {
  db.$client.close();
}
