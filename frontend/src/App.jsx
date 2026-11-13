import { useEffect, useState } from "react";
import axios from "axios";
import "./index.css";

const API = "http://localhost:5051";

const api = axios.create({
  baseURL: API
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= LOGIN ================= */

function Login({ onLogin, goRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">📝</div>

        <h1>Online Examination</h1>

        <p className="subtitle">
          Login to your student account
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={login}>
          <label>Email</label>

          <input
            type="email"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="primary-btn" type="submit">
            Login
          </button>
        </form>

        <p className="switch">
          Don't have an account?{" "}
          <span onClick={goRegister}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

/* ================= REGISTER ================= */

function Register({ onRegister, goLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const register = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/api/auth/register", {
        name,
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      onRegister(res.data.user);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Registration failed"
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">📝</div>

        <h1>Create Account</h1>

        <p className="subtitle">
          Register for the examination system
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={register}>
          <label>Full Name</label>

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Email</label>

          <input
            type="email"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="primary-btn" type="submit">
            Create Account
          </button>
        </form>

        <p className="switch">
          Already have an account?{" "}
          <span onClick={goLogin}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

/* ================= DASHBOARD ================= */

function Dashboard({ user, logout }) {
  const [active, setActive] = useState("Dashboard");

  const [selectedExam, setSelectedExam] = useState(null);

  const startExam = (exam) => {
    setSelectedExam(exam);
  };

  const finishExam = () => {
    setSelectedExam(null);
    setActive("Results");
  };

  if (selectedExam) {
    return (
      <ExamPage
        exam={selectedExam}
        onBack={() => setSelectedExam(null)}
        onFinished={finishExam}
      />
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          📝 ExamPro
        </div>

        <div className="menu">

          {["Dashboard", "Exams", "Results", "Profile"].map(
            (item) => (
              <button
                key={item}
                className={
                  active === item
                    ? "menu-item active"
                    : "menu-item"
                }
                onClick={() => setActive(item)}
              >
                {item === "Dashboard" && "🏠"}
                {item === "Exams" && "📚"}
                {item === "Results" && "📊"}
                {item === "Profile" && "👤"}

                <span>{item}</span>
              </button>
            )
          )}

        </div>

        <button
          className="logout"
          onClick={logout}
        >
          🚪 Logout
        </button>
      </aside>

      <main className="main">

        <header className="topbar">
          <div>
            <h2>{active}</h2>

            <p>
              Online Examination System
            </p>
          </div>

          <div className="user">

            <div className="avatar">
              {user.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>{user.name}</strong>

              <small>{user.email}</small>
            </div>

          </div>
        </header>

        {active === "Dashboard" && (
          <DashboardHome
            user={user}
            setActive={setActive}
            startExam={startExam}
          />
        )}

        {active === "Exams" && (
          <Exams startExam={startExam} />
        )}

        {active === "Results" && (
          <Results />
        )}

        {active === "Profile" && (
          <Profile user={user} />
        )}

      </main>
    </div>
  );
}

/* ================= DASHBOARD HOME ================= */

function DashboardHome({
  user,
  setActive,
  startExam
}) {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const res = await api.get("/api/exams");
      setExams(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <section className="welcome">

        <div>
          <h1>
            Welcome back, {user.name}! 👋
          </h1>

          <p>
            Ready to test your knowledge?
          </p>
        </div>

        <button
          className="primary-btn small"
          onClick={() => setActive("Exams")}
        >
          Browse Exams
        </button>

      </section>

      <div className="stats">

        <div className="stat-card">
          <span>📚</span>

          <div>
            <small>Available Exams</small>
            <h2>{exams.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <span>📝</span>

          <div>
            <small>Exams Completed</small>
            <h2>--</h2>
          </div>
        </div>

        <div className="stat-card">
          <span>🏆</span>

          <div>
            <small>Average Score</small>
            <h2>--</h2>
          </div>
        </div>

      </div>

      <section className="section">

        <div className="section-header">
          <h2>Available Exams</h2>

          <button
            onClick={() => setActive("Exams")}
          >
            View All →
          </button>
        </div>

        <div className="exam-grid">

          {exams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              startExam={startExam}
            />
          ))}

        </div>

      </section>
    </>
  );
}

/* ================= EXAMS ================= */

function Exams({ startExam }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const res = await api.get("/api/exams");
      setExams(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        Loading exams...
      </div>
    );
  }

  return (
    <section className="section">

      <div className="exam-grid">

        {exams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            startExam={startExam}
          />
        ))}

      </div>

    </section>
  );
}

/* ================= EXAM CARD ================= */

function ExamCard({ exam, startExam }) {
  return (
    <div className="exam-card">

      <div className="exam-icon">
        📖
      </div>

      <h3>{exam.title}</h3>

      <p>
        Test your knowledge with this
        online examination.
      </p>

      <div className="exam-info">

        <span>
          ⏱ {exam.duration} min
        </span>

        <span>
          📝 MCQ
        </span>

      </div>

      <button
        className="primary-btn"
        onClick={() => startExam(exam)}
      >
        Start Exam
      </button>

    </div>
  );
}

/* ================= EXAM PAGE ================= */

function ExamPage({
  exam,
  onBack,
  onFinished
}) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQuestions();
  }, [exam.id]);

  const loadQuestions = async () => {
    try {
      const res = await api.get(
        `/api/exams/${exam.id}/questions`
      );

      setQuestions(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load questions"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionId, option) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: option
    }));
  };

  useEffect(() => {
    if (!exam || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, timeLeft]);

  useEffect(() => {
    if (exam && timeLeft === 0 && questions.length > 0) {
      submitExam();
    }
  }, [timeLeft]);

  const submitExam = async () => {
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await api.post(
        `/api/exams/${exam.id}/submit`,
        {
          answers
        }
      );

      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to submit exam"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="exam-page">
        <div className="loading">
          Loading questions...
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="exam-page">

        <div className="result-card">

          <div className="result-icon">
            🏆
          </div>

          <h1>Exam Completed!</h1>

          <p>{exam.title}</p>

          <div className="score">
            {result.score} / {result.totalQuestions}
          </div>

          <h2>
            {result.percentage}%
          </h2>

          <p className="result-message">
            Your result has been saved successfully.
          </p>

          <button
            className="primary-btn"
            onClick={onFinished}
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="exam-page">

      <div className="exam-header">

        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back
        </button>

        <div>
          <h1>{exam.title}</h1>

          <p>
            {questions.length} Questions •{" "}
            {exam.duration} Minutes
          </p>
        </div>

      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="questions">

        {questions.map((question, index) => (
          <div
            className="question-card"
            key={question.id}
          >

            <h3>
              {index + 1}. {question.question_text}
            </h3>

            <div className="options">

              {[
                ["A", question.option_a],
                ["B", question.option_b],
                ["C", question.option_c],
                ["D", question.option_d]
              ].map(([letter, text]) => (

                <label
                  key={letter}
                  className={
                    answers[question.id] === letter
                      ? "option selected"
                      : "option"
                  }
                >

                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={
                      answers[question.id] === letter
                    }
                    onChange={() =>
                      selectAnswer(
                        question.id,
                        letter
                      )
                    }
                  />

                  <span>
                    <strong>{letter}.</strong>{" "}
                    {text}
                  </span>

                </label>

              ))}

            </div>

          </div>
        ))}

      </div>

      <div className="submit-section">

        <p>
          Answered {Object.keys(answers).length} of{" "}
          {questions.length} questions
        </p>

        <button
          className="primary-btn submit-btn"
          onClick={submitExam}
          disabled={submitting}
        >
          {submitting
            ? "Submitting..."
            : "Submit Exam"}
        </button>

      </div>

    </div>
  );
}

/* ================= RESULTS ================= */

function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const res = await api.get("/api/results");
      setResults(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        Loading results...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="empty">

        <div>📊</div>

        <h2>No Results Yet</h2>

        <p>
          Complete an examination to see
          your results here.
        </p>

      </div>
    );
  }

  return (
    <div className="results-list">

      {results.map((result) => {

        const percentage =
          result.total_questions > 0
            ? Math.round(
                (result.score /
                  result.total_questions) *
                  100
              )
            : 0;

        return (
          <div
            className="result-row"
            key={result.id}
          >

            <div>
              <h3>{result.title}</h3>

              <p>
                {result.score} /{" "}
                {result.total_questions} correct
              </p>
            </div>

            <div className="result-percentage">
              {percentage}%
            </div>

          </div>
        );
      })}

    </div>
  );
}

/* ================= PROFILE ================= */

function Profile({ user }) {
  return (
    <div className="profile-card">

      <div className="big-avatar">
        {user.name.charAt(0).toUpperCase()}
      </div>

      <h2>{user.name}</h2>

      <p>{user.email}</p>

      <div className="profile-info">

        <div>
          <span>Account ID</span>
          <strong>#{user.id}</strong>
        </div>

        <div>
          <span>Account Type</span>
          <strong>Student</strong>
        </div>

      </div>

    </div>
  );
}

/* ================= APP ================= */

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");

    return saved
      ? JSON.parse(saved)
      : null;
  });

  const [registerPage, setRegisterPage] =
    useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  if (!user) {
    return registerPage ? (
      <Register
        onRegister={setUser}
        goLogin={() => setRegisterPage(false)}
      />
    ) : (
      <Login
        onLogin={setUser}
        goRegister={() => setRegisterPage(true)}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      logout={logout}
    />
  );
}

export default App;
