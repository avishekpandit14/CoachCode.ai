import { useLocation } from "react-router-dom";

export default function QuizResult() {
  const { state } = useLocation();

  if (!state) return <p>No data</p>;

  return (
    <div className="container">
      <h1>Result 🎯</h1>

      <h2>{state.score} / {state.total}</h2>
      <p style={{ color: "var(--text-muted)" }}>
        Accuracy: {state.accuracy}% | Time Taken: {Math.floor((state.timeTakenSeconds || 0) / 60)}m {(state.timeTakenSeconds || 0) % 60}s
      </p>

      {state.result.map((r, i) => (
        <div key={i} className="card">
          <p>Q{i + 1}</p>
          <p>{r.questionText}</p>

          <p>Your Answer: {r.selected != null ? r.options?.[r.selected] || `Option ${r.selected + 1}` : "Not attempted"}</p>
          <p>Correct Answer: {r.options?.[r.correctAnswer] || `Option ${r.correctAnswer + 1}`}</p>

          <p style={{ color: r.isCorrect ? "green" : "red" }}>
            {r.isCorrect ? "Correct ✅" : "Wrong ❌"}
          </p>
        </div>
      ))}
    </div>
  );
}