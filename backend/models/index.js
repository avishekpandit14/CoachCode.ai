const { sequelize } = require("../config/db");

// Existing models
const User = require("./User");
const Subject = require("./Subject");
const Material = require("./Material");
const Question = require("./Question");
const QuestionAttempt = require("./QuestionAttempt");
const Test = require("./Test");
const TestQuestion = require("./TestQuestion");
const TestAttempt = require("./TestAttempt");
const Roadmap = require("./Roadmap");
const RoadmapProgress = require("./RoadmapProgress");
const Bookmark = require("./Bookmark");
const Announcement = require("./Announcement");
const Contest = require("./Contest");
const ContestSubmission = require("./ContestSubmission");
const Note = require("./Note");
const NoteFolder = require("./NoteFolder");
const FeatureFlag = require("./FeatureFlag");

// 🔥 NEW QUIZ MODELS
const Quiz = require("./Quiz");
const QuizQuestion = require("./QuizQuestion");
const Attempt = require("./Attempt");


// ================= USER ASSOCIATIONS =================
User.hasMany(Material, { foreignKey: "uploadedById" });
User.hasMany(Question, { foreignKey: "createdById" });
User.hasMany(QuestionAttempt, { foreignKey: "userId" });
User.hasMany(Test, { foreignKey: "createdById" });
User.hasMany(TestAttempt, { foreignKey: "userId" });
User.hasMany(RoadmapProgress, { foreignKey: "userId" });
User.hasMany(Bookmark, { foreignKey: "userId" });
User.hasMany(Announcement, { foreignKey: "createdById" });
User.hasMany(Contest, { foreignKey: "createdById" });
User.hasMany(ContestSubmission, { foreignKey: "userId" });
User.hasMany(Note, { foreignKey: "userId" });
User.hasMany(NoteFolder, { foreignKey: "userId" });

// 🔥 Quiz relations with User
User.hasMany(Quiz, { foreignKey: "createdBy" });
User.hasMany(Attempt, { foreignKey: "studentId" });


// ================= BELONGS TO =================
Note.belongsTo(NoteFolder, { foreignKey: "folderId" });
NoteFolder.belongsTo(User, { foreignKey: "userId" });

Material.belongsTo(User, { foreignKey: "uploadedById" });
Material.belongsTo(Subject, { foreignKey: "subjectId" });

Question.belongsTo(User, { foreignKey: "createdById" });
Question.belongsTo(Subject, { foreignKey: "subjectId" });

QuestionAttempt.belongsTo(User, { foreignKey: "userId" });
QuestionAttempt.belongsTo(Question, { foreignKey: "questionId" });

Test.belongsTo(User, { foreignKey: "createdById" });

TestAttempt.belongsTo(User, { foreignKey: "userId" });
TestAttempt.belongsTo(Test, { foreignKey: "testId" });

Roadmap.belongsTo(Subject, { foreignKey: "subjectId" });

RoadmapProgress.belongsTo(User, { foreignKey: "userId" });
RoadmapProgress.belongsTo(Roadmap, { foreignKey: "roadmapId" });

Bookmark.belongsTo(User, { foreignKey: "userId" });

Announcement.belongsTo(User, { foreignKey: "createdById" });

Contest.belongsTo(User, { foreignKey: "createdById" });

ContestSubmission.belongsTo(Contest, { foreignKey: "contestId" });
ContestSubmission.belongsTo(User, { foreignKey: "userId" });
ContestSubmission.belongsTo(Question, { foreignKey: "questionId" });

Note.belongsTo(User, { foreignKey: "userId" });


// ================= TEST RELATION =================
Test.belongsToMany(Question, {
  through: TestQuestion,
  foreignKey: "testId",
});

Question.belongsToMany(Test, {
  through: TestQuestion,
  foreignKey: "questionId",
});

TestQuestion.belongsTo(Test, { foreignKey: "testId" });
TestQuestion.belongsTo(Question, { foreignKey: "questionId" });


// ================= SUBJECT RELATION =================
Subject.hasMany(Material, { foreignKey: "subjectId" });
Subject.hasMany(Question, { foreignKey: "subjectId" });
Subject.hasMany(Roadmap, { foreignKey: "subjectId" });

// 🔥 Quiz Subject relation
Subject.hasMany(Quiz, { foreignKey: "subjectId" });


// ================= QUIZ SYSTEM RELATIONS =================

// Quiz → Questions
Quiz.hasMany(QuizQuestion, { foreignKey: "quizId" });
QuizQuestion.belongsTo(Quiz, { foreignKey: "quizId" });

// Quiz → Attempts
Quiz.hasMany(Attempt, { foreignKey: "quizId" });
Attempt.belongsTo(Quiz, { foreignKey: "quizId" });

// Attempt → User
Attempt.belongsTo(User, { foreignKey: "studentId" });

// Quiz → Subject
Quiz.belongsTo(Subject, { foreignKey: "subjectId" });

// Quiz → Creator
Quiz.belongsTo(User, { foreignKey: "createdBy" });


// ================= EXPORT =================
const models = {
  User,
  Subject,
  Material,
  Question,
  QuestionAttempt,
  Test,
  TestQuestion,
  TestAttempt,
  Roadmap,
  RoadmapProgress,
  Bookmark,
  Announcement,
  Contest,
  ContestSubmission,
  Note,
  NoteFolder,
  FeatureFlag,

  // 🔥 Quiz system
  Quiz,
  QuizQuestion,
  Attempt,
};

module.exports = { sequelize, ...models };