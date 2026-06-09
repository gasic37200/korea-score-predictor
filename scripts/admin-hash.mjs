import { createHash } from "node:crypto";
import { stdin, stdout, stderr } from "node:process";
import readline from "node:readline/promises";

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

try {
  const password = await rl.question("관리자 비밀번호를 입력하세요: ");

  if (!password || password.length < 8) {
    stderr.write("관리자 비밀번호는 8자 이상을 권장합니다.\n");
    process.exitCode = 1;
  } else {
    const hash = createHash("sha256").update(password).digest("hex");
    stdout.write(`ADMIN_PASSWORD_HASH=${hash}\n`);
  }
} finally {
  rl.close();
}
