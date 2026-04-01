require("dotenv").config();
const { connectDB } = require("../config/db");
const { User, Question, QuestionTestCase } = require("../models");

const TOPICS = [
  "Arrays",
  "Strings",
  "Linked List",
  "Stack & Queue",
  "Recursion",
  "Sorting & Searching",
  "Trees",
  "Graphs",
];

const starterTemplates = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // write your solution
    return 0;
}`,
  python: `# write your solution
def solve():
    pass

if __name__ == "__main__":
    solve()
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // write your solution
    }
}`,
};

const buildQuestion = (topic, index, createdById) => {
  const difficulty = index <= 7 ? "easy" : index <= 14 ? "medium" : "hard";
  return {
    title: `${topic} Challenge ${index}`,
    description: `Solve the ${topic.toLowerCase()} problem #${index}. Read input from stdin and print output exactly as expected.`,
    constraints: "1 <= N <= 10^5",
    inputFormat: "Input is provided via standard input.",
    outputFormat: "Print result to standard output.",
    difficulty,
    tags: [topic, difficulty, "practice"],
    topic,
    type: "coding",
    starterTemplates,
    createdById,
    timeLimitSec: 2,
    memoryLimitKb: 128000,
  };
};

const buildTestCases = () => {
  const cases = [];
  for (let i = 0; i < 10; i += 1) {
    const a = i + 1;
    const b = (i + 1) * 2;
    cases.push({
      input: `${a} ${b}`,
      expectedOutput: `${a + b}`,
      isHidden: i >= 2,
      orderIndex: i,
    });
  }
  return cases;
};

const run = async () => {
  await connectDB();
  const creator = await User.findOne({ where: { role: "admin" } }) || await User.findOne();
  if (!creator) throw new Error("No user found. Create at least one user before seeding.");

  for (const topic of TOPICS) {
    for (let i = 1; i <= 20; i += 1) {
      const existing = await Question.findOne({ where: { title: `${topic} Challenge ${i}` } });
      if (existing) continue;
      const q = await Question.create(buildQuestion(topic, i, creator.id));
      const testCases = buildTestCases().map((t) => ({ ...t, questionId: q.id }));
      await QuestionTestCase.bulkCreate(testCases);
    }
  }
  console.log("Practice questions seeded successfully.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
