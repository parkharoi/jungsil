// Presentation only: never use this function for questions, answers or grading.
const endings: Record<string, string> = {
  "합니다": "하오", "됩니다": "되오", "입니다": "이오", "습니다": "소", "하세요": "하시오",
  "아니다": "아니오", "이다": "이라오", "한다": "하오", "된다": "된다오",
  "있다": "있소", "없다": "없소", "같다": "같소", "어렵다": "어렵소",
  "강하다": "강하오", "필요하다": "필요하오", "가리킨다": "가리킨다오",
  "붙인다": "붙인다오", "바꾼다": "바꾼다오", "보인다": "보인다오",
  "만든다": "만든다오", "부른다": "부른다오", "고른다": "고른다오",
  "적는다": "적는다오", "않는다": "않소", "남는다": "남는다오",
  "담는다": "담는다오", "쓴다": "쓴다오", "센다": "센다오",
  "함수다": "함수라오", "결합도다": "결합도라오", "범위다": "범위라오",
};
const endingPattern = new RegExp(`(${Object.keys(endings).join("|")})([.!?])(?=\\s|$)`, "g");

export function scholarVoice(text: string) {
  // ponytail: fixed prose endings only; unfamiliar phrasing stays intact for manual editing.
  // Preserve fenced/inline code and quoted literals, including escaped quotes.
  return text.split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')/g)
    .map((part, index) => index % 2 ? part : part.replace(endingPattern, (_, ending: string, mark: string) => endings[ending] + mark))
    .join("");
}
