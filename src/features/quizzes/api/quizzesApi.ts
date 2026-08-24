import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type {
  AttemptInProgress,
  AttemptResult,
  QuizAuthoring,
  QuizInput,
  QuizResults,
  QuizSummary,
  SaveQuestionInput,
  AuthoringQuestion,
} from "./types";

export const quizzesApi = {
  async list(courseId: string): Promise<QuizSummary[]> {
    const q = query(collection(db, "quizzes"), where("courseId", "==", courseId));
    const snap = await getDocs(q);
    const results: QuizSummary[] = [];
    snap.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as QuizSummary);
    });
    return results;
  },

  async create(courseId: string, input: QuizInput): Promise<QuizSummary> {
    const docRef = doc(collection(db, "quizzes"));
    const data: QuizSummary = {
      id: docRef.id,
      courseId,
      ...input,
      questionCount: 0,
      totalPoints: 0,
      isReadyToPublish: false,
      hasManuallyMarkedQuestions: false,
      attemptsUsed: 0,
      bestScorePercent: null,
      hasPassed: false,
      canAttempt: true,
    };
    await setDoc(docRef, data);
    return data;
  },

  async update(quizId: string, input: QuizInput): Promise<QuizSummary> {
    const docRef = doc(db, "quizzes", quizId);
    await updateDoc(docRef, { ...input });
    const snap = await getDoc(docRef);
    return { id: snap.id, ...snap.data() } as QuizSummary;
  },

  async remove(quizId: string): Promise<void> {
    await deleteDoc(doc(db, "quizzes", quizId));
  },

  async authoring(quizId: string): Promise<QuizAuthoring> {
    const quizSnap = await getDoc(doc(db, "quizzes", quizId));
    const quiz = { id: quizSnap.id, ...quizSnap.data() } as QuizSummary;
    
    const questionsQ = query(collection(db, `quizzes/${quizId}/questions`));
    const qSnap = await getDocs(questionsQ);
    const questions: AuthoringQuestion[] = [];
    qSnap.forEach(d => {
      questions.push({ id: d.id, ...d.data() } as AuthoringQuestion);
    });
    
    return { quiz, questions };
  },

  async saveQuestion(quizId: string, input: SaveQuestionInput): Promise<void> {
    const docRef = input.questionId 
      ? doc(db, `quizzes/${quizId}/questions`, input.questionId)
      : doc(collection(db, `quizzes/${quizId}/questions`));
      
    await setDoc(docRef, {
      ...input,
      sortOrder: Date.now(),
      isAnswerable: true,
      requiresManualMarking: input.type === "Essay" || input.type === "ShortAnswer",
      allowsMultipleSelections: input.type === "MultipleResponse"
    }, { merge: true });
    
    // Update quiz question count
    const qSnap = await getDocs(collection(db, `quizzes/${quizId}/questions`));
    let totalPoints = 0;
    qSnap.forEach(d => totalPoints += (d.data().points || 0));
    
    await updateDoc(doc(db, "quizzes", quizId), {
      questionCount: qSnap.size,
      totalPoints,
      isReadyToPublish: qSnap.size > 0
    });
  },

  async deleteQuestion(questionId: string): Promise<void> {
    void questionId;
    console.warn("Delete question not fully implemented in mock without quizId");
  },

  async results(quizId: string): Promise<QuizResults> {
    const quizSnap = await getDoc(doc(db, "quizzes", quizId));
    return {
      quizId,
      quizTitle: quizSnap.data()?.title || "Quiz",
      totalPoints: quizSnap.data()?.totalPoints || 0,
      passingScorePercent: quizSnap.data()?.passingScorePercent || null,
      attemptCount: 0,
      distinctLearners: 0,
      averageScorePercent: null,
      passedCount: 0,
      awaitingReviewCount: 0,
      attempts: []
    };
  },

  async startAttempt(quizId: string): Promise<AttemptInProgress> {
    void quizId;
    throw new Error("Start attempt not implemented in mock");
  },

  async saveAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionIds: string[],
    textAnswer: string | null,
  ): Promise<void> {
    void attemptId;
    void questionId;
    void selectedOptionIds;
    void textAnswer;
  },

  async reorderQuestions(quizId: string, questionIds: string[]): Promise<QuizAuthoring> {
    void quizId;
    void questionIds;
    throw new Error("Not implemented");
  },

  async duplicateQuestion(questionId: string): Promise<void> {
    void questionId;
    throw new Error("Not implemented");
  },

  async markEssay(
    attemptId: string,
    answerId: string,
    pointsAwarded: number,
    feedback: string | null,
  ): Promise<AttemptResult> {
    void attemptId;
    void answerId;
    void pointsAwarded;
    void feedback;
    throw new Error("Not implemented");
  },

  async submitAttempt(attemptId: string): Promise<AttemptResult> {
    void attemptId;
    throw new Error("Not implemented");
  },

  async attemptResult(attemptId: string): Promise<AttemptResult> {
    void attemptId;
    throw new Error("Not implemented");
  }
};
