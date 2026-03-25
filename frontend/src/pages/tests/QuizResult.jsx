import { useLocation } from "react-router-dom";

export default function QuizResult() {
  const { state } = useLocation();

  if (!state) return <p>No data</p>;

  return (
    <div className="container">
      <h1>Result 🎯</h1>

      <h2>{state.score} / {state.total}</h2>

      {state.result.map((r, i) => (
        <div key={i} className="card">
          <p>Q{i + 1}</p>

          <p>Your Answer: {r.selected}</p>
          <p>Correct Answer: {r.correctAnswer}</p>

          <p style={{ color: r.isCorrect ? "green" : "red" }}>
            {r.isCorrect ? "Correct ✅" : "Wrong ❌"}
          </p>
        </div>
      ))}
    </div>
  );
}