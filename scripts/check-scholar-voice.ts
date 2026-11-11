import assert from "node:assert/strict";
import { scholarVoice } from "../src/lib/scholar-voice";

assert.equal(scholarVoice("정답이다. 확인합니다. 계산한다. 할 수 있다. 틀린 답은 아니다."), "정답이라오. 확인하오. 계산하오. 할 수 있소. 틀린 답은 아니오.");
const literals = '```python\nprint("계산한다. 정답이다.")\n```\n`SELECT 1;` "정답이다. 그대로 둔다." \'아니다.\'';
assert.equal(scholarVoice(literals), literals);
assert.equal(scholarVoice('"문자열 \\"정답이다.\\" 그대로"'), '"문자열 \\"정답이다.\\" 그대로"');
assert.equal(scholarVoice("255.255.254.0은 /23이다. 32 - 4 = 28이다."), "255.255.254.0은 /23이라오. 32 - 4 = 28이라오.");
assert.equal(scholarVoice("```python\n정답이다."), "```python\n정답이다.");
assert.equal(scholarVoice("그렇소! 잘하였소! 천재 아니오?"), "그렇소! 잘하였소! 천재 아니오?");
assert.equal(scholarVoice(""), "");
assert.equal(scholarVoice(scholarVoice("정답이다. 할 수 있다.")), scholarVoice("정답이다. 할 수 있다."));
console.log("통과: 해설 말투, 코드·인용문·수치 보존, 빈 해설 및 중복 변환.");
