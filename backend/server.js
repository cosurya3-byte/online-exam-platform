const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const authRoutes = require("./auth");
const authenticateToken = require("./middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

/* Basic API */
app.get("/", (req, res) => {
  res.json({
    message: "Online Examination API is running",
    database: "PostgreSQL"
  });
});

/* Database health */
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "OK",
      database: "PostgreSQL",
      time: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
});

/* Get all exams */
app.get("/api/exams", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, duration
      FROM exams
      ORDER BY id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch exams"
    });
  }
});

/* Get questions for an exam */
app.get("/api/exams/:examId/questions", authenticateToken, async (req, res) => {
  try {
    const { examId } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        question,
        option_a,
        option_b,
        option_c,
        option_d
      FROM questions
      WHERE exam_id = $1
      ORDER BY id
      `,
      [examId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch questions"
    });
  }
});

/* Submit exam */
app.post("/api/exams/:examId/submit", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { examId } = req.params;
    const { answers } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({
        message: "Answers are required"
      });
    }

    const questionsResult = await client.query(
      `
      SELECT id, correct_answer
      FROM questions
      WHERE exam_id = $1
      ORDER BY id
      `,
      [examId]
    );

    const questions = questionsResult.rows;

    let score = 0;

    questions.forEach((question) => {
      const selectedAnswer = answers[question.id];

      if (
        selectedAnswer &&
        selectedAnswer.toUpperCase() === question.correct_answer.toUpperCase()
      ) {
        score++;
      }
    });

    const totalQuestions = questions.length;

    await client.query(
      `
      INSERT INTO results
      (user_id, exam_id, score, total_questions)
      VALUES ($1, $2, $3, $4)
      `,
      [
        req.user.userId,
        examId,
        score,
        totalQuestions
      ]
    );

    res.json({
      message: "Exam submitted successfully",
      score,
      totalQuestions,
      percentage:
        totalQuestions > 0
          ? Math.round((score / totalQuestions) * 100)
          : 0
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to submit exam",
      error: error.message
    });
  } finally {
    client.release();
  }
});

/* Get current user's results */
app.get("/api/results", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.score,
        r.total_questions,
        e.title,
        e.duration
      FROM results r
      JOIN exams e ON r.exam_id = e.id
      WHERE r.user_id = $1
      ORDER BY r.id DESC
      `,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch results"
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
