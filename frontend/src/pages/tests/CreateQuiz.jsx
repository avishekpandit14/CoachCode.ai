import { useState } from "react";
import api from "../../api/axios";

export default function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [quizId, setQuizId] = useState(null);

  const createQuiz = async () => {
    const res = await api.post("/quizzes", {
      title,
      description,
      subjectId
    });

    setQuizId(res.data.data.id);
    alert("Quiz Created ✅");
  };

  return (
    <div className="container">
      <h2>Create Quiz</h2>

      <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
      <input placeholder="Subject ID" onChange={(e) => setSubjectId(e.target.value)} />

      <button onClick={createQuiz}>Create Quiz</button>

      {quizId && <AddQuestions quizId={quizId} />}
    </div>
  );
}