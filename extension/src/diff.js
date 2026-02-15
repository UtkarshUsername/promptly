function tokenize(value) {
  return value.split(/(\s+)/).filter(Boolean);
}

export function diffWords(original, improved) {
  const a = tokenize(original || "");
  const b = tokenize(improved || "");

  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const segments = [];
  let i = a.length;
  let j = b.length;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      segments.push({ type: "equal", text: a[i - 1] });
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      segments.push({ type: "remove", text: a[i - 1] });
      i -= 1;
    } else {
      segments.push({ type: "add", text: b[j - 1] });
      j -= 1;
    }
  }

  while (i > 0) {
    segments.push({ type: "remove", text: a[i - 1] });
    i -= 1;
  }

  while (j > 0) {
    segments.push({ type: "add", text: b[j - 1] });
    j -= 1;
  }

  return segments.reverse();
}

export function renderDiffHtml(original, improved) {
  const segments = diffWords(original, improved);
  return segments
    .map((segment) => {
      const safe = segment.text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
      if (segment.type === "add") {
        return `<ins>${safe}</ins>`;
      }
      if (segment.type === "remove") {
        return `<del>${safe}</del>`;
      }
      return `<span>${safe}</span>`;
    })
    .join("");
}
