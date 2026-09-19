import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  FileText,
  Upload,
  BarChart3,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Target,
  BriefcaseBusiness,
  AlertCircle,
  Lightbulb,
  Trash2,
  LogIn,
  UserPlus,
  LogOut,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  // =========================================
  // RESTORE LOGIN SESSION
  // =========================================

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("resumeAnalyzerUser");
      const savedToken = localStorage.getItem("resumeAnalyzerToken");

      if (savedUser && savedToken) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Could not restore login session:", error);
      localStorage.removeItem("resumeAnalyzerUser");
      localStorage.removeItem("resumeAnalyzerToken");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // =========================================
  // AUTHENTICATION
  // =========================================

  const handleAuthChange = (event) => {
    const { name, value } = event.target;

    setAuthForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (authError) {
      setAuthError("");
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");

    if (!authForm.email.trim() || !authForm.password) {
      setAuthError("Please enter your email and password.");
      return;
    }

    if (authMode === "signup" && !authForm.name.trim()) {
      setAuthError("Please enter your name.");
      return;
    }

    if (authMode === "signup" && authForm.password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setAuthSubmitting(true);

    try {
      if (authMode === "signup") {
        await axios.post(`${API_URL}/signup`, {
          name: authForm.name.trim(),
          email: authForm.email.trim(),
          password: authForm.password,
        });
      }

      const loginResponse = await axios.post(`${API_URL}/login`, {
        email: authForm.email.trim(),
        password: authForm.password,
      });

      const { access_token, user } = loginResponse.data;

      localStorage.setItem("resumeAnalyzerToken", access_token);
      localStorage.setItem("resumeAnalyzerUser", JSON.stringify(user));

      setCurrentUser(user);
      setAuthForm({
        name: "",
        email: "",
        password: "",
      });
      setAuthError("");
    } catch (error) {
      console.error("Authentication error:", error);

      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Authentication failed. Please try again.";

      setAuthError(Array.isArray(message) ? "Please enter valid details." : message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("resumeAnalyzerToken");
    localStorage.removeItem("resumeAnalyzerUser");
    setCurrentUser(null);
    setAuthMode("login");
    setAuthForm({
      name: "",
      email: "",
      password: "",
    });
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("resumeAnalyzerToken");

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeText, setResumeText] = useState("");

  const [atsScore, setAtsScore] = useState(null);
  const [atsBreakdown, setAtsBreakdown] = useState({});

  const [skills, setSkills] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [aiAnalysis, setAiAnalysis] = useState(null);

  const [jobDescription, setJobDescription] = useState("");
  const [jobMatch, setJobMatch] = useState(null);

  const [history, setHistory] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);

  // =========================================
  // LOAD HISTORY FROM LOCAL STORAGE
  // =========================================

  useEffect(() => {
  if (!currentUser?.id) {
    setHistory([]);
    return;
  }

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem("resumeAnalyzerToken");

      if (!token) {
        setHistory([]);
        return;
      }

      const response = await axios.get(
        "http://127.0.0.1:8000/history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const backendHistory = response.data.history.map((item) => ({
          id: item.id,
          fileName: item.file_name,
          atsScore: item.ats_score,
          date: new Date(item.created_at).toLocaleString(),
        }));

        setHistory(backendHistory);
      }
    } catch (error) {
      console.error("Could not load resume history:", error);
    }
  };

  loadHistory();
}, [currentUser]);
  // =========================================
  // SAVE HISTORY
  // =========================================

  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    if (currentUser?.id) {
      localStorage.setItem(
        `resumeHistory_${currentUser.id}`,
        JSON.stringify(newHistory)
      );
    }
  };

  // =========================================
  // ADD HISTORY ITEM
  // =========================================
const addHistory = async (item) => {
  try {
    const token = localStorage.getItem("resumeAnalyzerToken");

    const response = await axios.post(
      "http://127.0.0.1:8000/history",
      {
        file_name: item.fileName,
        ats_score: item.atsScore ?? 0,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      const savedItem = response.data.history;

      setHistory((previousHistory) => [
        {
          id: savedItem.id,
          fileName: savedItem.file_name,
          atsScore: savedItem.ats_score,
          date: new Date(savedItem.created_at).toLocaleString(),
        },
        ...previousHistory,
      ]);
    }
  } catch (error) {
    console.error("Could not save resume history:", error);
  }
};
  // =========================================
  // CLEAR HISTORY
  // =========================================
const clearHistory = async () => {
  if (history.length === 0) {
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to clear all resume history?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const token = localStorage.getItem("resumeAnalyzerToken");

    await axios.delete(
      "http://127.0.0.1:8000/history",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setHistory([]);
  } catch (error) {
    console.error(
      "Could not clear history:",
      error
    );
  }
};
  // =========================================
  // DELETE ONE HISTORY ITEM
  // =========================================

  const deleteHistoryItem = async (historyId) => {
  try {
    const token = localStorage.getItem("resumeAnalyzerToken");

    await axios.delete(
      `http://127.0.0.1:8000/history/${historyId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setHistory((previousHistory) =>
      previousHistory.filter(
        (item) => item.id !== historyId
      )
    );
  } catch (error) {
    console.error(
      "Could not delete history item:",
      error
    );
  }
};
  // =========================================
  // SMOOTH SCROLL
  // =========================================

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // =========================================
  // CHOOSE RESUME
  // =========================================

  const handleChooseResume = () => {
    fileInputRef.current?.click();
  };

  // =========================================
  // SELECT RESUME
  // =========================================

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const isValidType = allowedTypes.includes(file.type);

    const isValidExtension =
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".docx");

    if (!isValidType && !isValidExtension) {
      alert("Please upload a PDF or DOCX file.");

      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    // Reset previous results
    setResumeText("");
    setAtsScore(null);
    setAtsBreakdown({});
    setSkills([]);
    setSuggestions([]);
    setAiAnalysis(null);
    setJobMatch(null);

    uploadResume(file);

    // Allow same file to be selected again
    event.target.value = "";
  };

  // =========================================
  // UPLOAD RESUME
  // =========================================

  const uploadResume = async (file) => {
    console.log("UPLOAD FUNCTION CALLED:", file.name);

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const response = await axios.post(
        `${API_URL}/upload-resume`,
        formData,
        {
          headers: getAuthHeaders(),
        }
      );

      console.log("Backend response:", response.data);

      if (!response.data.success) {
        alert(
          response.data.message ||
            "Resume analysis failed."
        );
        return;
      }

      // -----------------------------------------
      // Store extracted resume data
      // -----------------------------------------

      setResumeText(response.data.text || "");

      setAtsScore(
        response.data.ats_score ?? null
      );

      setAtsBreakdown(
        response.data.ats_breakdown || {}
      );

      setSkills(
        response.data.skills || []
      );

      setSuggestions(
        response.data.suggestions || []
      );

      // -----------------------------------------
      // Add to permanent history
      // -----------------------------------------

     await addHistory({
     fileName: file.name,
     atsScore: response.data.ats_score ?? 0,
      });
      alert(
        "Resume uploaded and analyzed successfully!"
      );

      // -----------------------------------------
      // Scroll to ATS dashboard
      // -----------------------------------------

      setTimeout(() => {
        document
          .getElementById("resume-checker")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);
    } catch (error) {
      console.error("Upload error:", error);

      if (error.response) {
        console.error(
          "Backend error:",
          error.response.data
        );

        alert(
          `Resume upload failed: ${
            error.response.data?.message ||
            "Backend returned an error."
          }`
        );
      } else if (error.request) {
        alert(
          "Backend is not responding. Please start FastAPI server."
        );
      } else {
        alert(
          "Resume upload failed. Please check the browser console."
        );
      }
    } finally {
      setUploading(false);
    }
  };

  // =========================================
  // SMART RESUME ANALYSIS
  // =========================================

  const analyzeWithAI = async () => {
    if (!resumeText) {
      alert("Please upload your resume first.");
      return;
    }

    setAiLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/ai-analysis`,
        {
          resume_text: resumeText,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      console.log(
        "AI Analysis response:",
        response.data
      );

      if (!response.data.success) {
        alert(
          response.data.message ||
            "AI analysis failed."
        );
        return;
      }

      setAiAnalysis(
        response.data.analysis
      );

      setTimeout(() => {
        document
          .getElementById("ai-analysis")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);
    } catch (error) {
      console.error(
        "AI Analysis error:",
        error
      );

      alert(
        "Resume analysis failed. Please check the backend."
      );
    } finally {
      setAiLoading(false);
    }
  };

  // =========================================
  // JOB MATCHING
  // =========================================

  const matchJob = async () => {
    if (!resumeText) {
      alert("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      alert("Please enter a job description.");
      return;
    }

    setJobLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/match-job`,
        {
          resume_text: resumeText,
          job_description: jobDescription,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      console.log(
        "Job match response:",
        response.data
      );

      if (!response.data.success) {
        alert(
          response.data.message ||
            "Job matching failed."
        );
        return;
      }

      setJobMatch(response.data);

      setTimeout(() => {
        document
          .getElementById("job-result")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);
    } catch (error) {
      console.error(
        "Job matching error:",
        error
      );

      if (error.response) {
        alert(
          `Job matching failed: ${
            error.response.data?.message ||
            "Backend error."
          }`
        );
      } else {
        alert(
          "Job matching failed. Please check the backend."
        );
      }
    } finally {
      setJobLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-300">
            Loading AI Resume Analyzer...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        form={authForm}
        onChange={handleAuthChange}
        onSubmit={handleAuthSubmit}
        loading={authSubmitting}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =========================================
          NAVBAR
      ========================================= */}

      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <button
            onClick={() =>
              scrollToSection("dashboard")
            }
            className="flex items-center gap-3 text-left"
          >

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200">

              <FileText className="h-6 w-6 text-white" />

            </div>

            <div>

              <h1 className="text-lg font-bold text-slate-900">
                AI Resume Analyzer
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Smart Resume Intelligence
              </p>

            </div>

          </button>


          <div className="hidden items-center gap-8 md:flex">

            <button
              onClick={() =>
                scrollToSection("dashboard")
              }
              className="text-sm font-semibold text-indigo-600"
            >
              Dashboard
            </button>

            <button
              onClick={() =>
                scrollToSection("resume-checker")
              }
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Resume Checker
            </button>

            <button
              onClick={() =>
                scrollToSection("history")
              }
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              History
            </button>

            <button
              onClick={handleChooseResume}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
            >
              Get Started
            </button>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-5">
              <div className="hidden lg:block text-right">
                <p className="max-w-32 truncate text-sm font-semibold text-slate-800">
                  {currentUser.name}
                </p>
                <p className="max-w-32 truncate text-xs text-slate-500">
                  {currentUser.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

        </div>

      </nav>


      <main>

        {/* =========================================
            HERO
        ========================================= */}

        <section
          id="dashboard"
          className="relative scroll-mt-24 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950"
        >

          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-20">

            <div className="mx-auto max-w-4xl text-center">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-indigo-200 backdrop-blur">

                <Sparkles className="h-4 w-4" />

                AI-Powered Resume Analysis

              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">

                Make Your Resume

                <span className="block bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  Job-Ready
                </span>

              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">

                Get an ATS score, discover your strengths and
                weaknesses, identify missing skills, and match
                your resume with job descriptions.

              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">

                <Pill text="✓ ATS Score" />

                <Pill text="✓ Resume Analysis" />

                <Pill text="✓ Skill Analysis" />

                <Pill text="✓ Job Matching" />

              </div>

            </div>


            {/* Upload Card */}

            <div className="mx-auto mt-12 max-w-3xl">

              <div className="rounded-3xl border border-white/20 bg-white p-2 shadow-2xl">

                <div className="rounded-[1.35rem] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30 sm:px-10">

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">

                    <Upload className="h-9 w-9 text-white" />

                  </div>

                  <h2 className="mt-6 text-2xl font-bold text-slate-900">
                    Upload your resume
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

                    Upload your resume and let our analyzer
                    check its ATS compatibility, skills,
                    content and job readiness.

                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    onClick={handleChooseResume}
                    disabled={uploading}
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <Upload className="h-5 w-5" />

                    {uploading
                      ? "Analyzing..."
                      : "Choose Resume"}

                  </button>

                  {selectedFile && (

                    <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

                      <CheckCircle2 className="h-5 w-5 shrink-0" />

                      <div className="min-w-0 text-left">

                        <p className="font-semibold">
                          Resume uploaded
                        </p>

                        <p className="truncate text-xs text-green-600">
                          {selectedFile.name}
                        </p>

                      </div>

                    </div>

                  )}

                  <p className="mt-5 text-xs text-slate-400">
                    Supported formats: PDF and DOCX • Secure resume analysis
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =========================================
            ATS DASHBOARD
        ========================================= */}

        {atsScore !== null && (

          <section
            id="resume-checker"
            className="mx-auto mt-10 scroll-mt-24 max-w-6xl px-6"
          >

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

              <div className="p-6 sm:p-8">

                <div className="mb-8">

                  <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                    Resume Analysis
                  </p>

                  <h2 className="mt-1 text-3xl font-bold text-slate-900">
                    Your Resume Health
                  </h2>

                  <p className="mt-2 text-slate-500">
                    See how your resume performs across important ATS categories.
                  </p>

                </div>


                <div className="grid gap-8 lg:grid-cols-3">

                  {/* ATS SCORE */}

                  <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-8">

                    <p className="text-sm font-semibold text-slate-500">
                      OVERALL ATS SCORE
                    </p>

                    <div className="relative mt-5 flex h-48 w-48 items-center justify-center">

                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(#6366f1 ${
                            atsScore * 3.6
                          }deg, #e2e8f0 0deg)`,
                        }}
                      />

                      <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white">

                        <span className="text-5xl font-extrabold text-slate-900">
                          {atsScore}
                        </span>

                        <span className="text-sm text-slate-400">
                          / 100
                        </span>

                      </div>

                    </div>

                    <div className="mt-5 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">

                      {atsScore >= 80
                        ? "Excellent Resume"
                        : atsScore >= 60
                        ? "Good Resume"
                        : "Needs Improvement"}

                    </div>

                  </div>


                  {/* STAT CARDS */}

                  <div className="grid grid-cols-2 gap-4 lg:col-span-2">

                    <StatCard
                      title="ATS Score"
                      value={`${atsScore}%`}
                      icon={
                        <BarChart3 className="h-6 w-6 text-indigo-600" />
                      }
                      iconBg="bg-indigo-50"
                    />

                    <StatCard
                      title="Skills Found"
                      value={skills.length}
                      icon={
                        <Sparkles className="h-6 w-6 text-purple-600" />
                      }
                      iconBg="bg-purple-50"
                    />

                    <StatCard
                      title="Projects"
                      value={
                        atsBreakdown["Projects"] > 0
                          ? "✓"
                          : "—"
                      }
                      icon={
                        <BriefcaseBusiness className="h-6 w-6 text-green-600" />
                      }
                      iconBg="bg-green-50"
                    />

                    <StatCard
                      title="Job Match"
                      value={
                        jobMatch
                          ? `${jobMatch.match_score}%`
                          : "—"
                      }
                      icon={
                        <Target className="h-6 w-6 text-orange-600" />
                      }
                      iconBg="bg-orange-50"
                    />

                  </div>

                </div>


                {/* HEALTH */}

                <div className="mt-10 border-t border-slate-200 pt-8">

                  <div className="mb-6">

                    <h3 className="text-xl font-bold text-slate-900">
                      Resume Health
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Category-wise performance of your resume.
                    </p>

                  </div>

                  <div className="grid gap-5 md:grid-cols-2">

                    {Object.entries(atsBreakdown).map(
                      ([category, score]) => {

                        const maxScore =
                          getMaxScore(category);

                        const percentage =
                          Math.round(
                            (score / maxScore) * 100
                          );

                        return (
                          <div
                            key={category}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                          >

                            <div className="mb-3 flex items-center justify-between">

                              <span className="font-semibold text-slate-700">
                                {category}
                              </span>

                              <span className="text-sm font-bold text-indigo-600">
                                {score}/{maxScore}
                              </span>

                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">

                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />

                            </div>

                            <p className="mt-2 text-right text-xs text-slate-400">
                              {percentage}% complete
                            </p>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

              </div>

            </div>

          </section>

        )}


        {/* =========================================
            SMART REVIEW
        ========================================= */}

        {resumeText && (

          <section className="mx-auto mt-8 max-w-6xl px-6">

            <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 sm:p-8">

              <div className="flex flex-col items-center justify-between gap-5 md:flex-row">

                <div>

                  <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                    Smart Resume Review
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    Get deeper insights from your resume
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Analyze your resume to discover strengths,
                    weaknesses and improvement recommendations.
                  </p>

                </div>

                <button
                  onClick={analyzeWithAI}
                  disabled={aiLoading}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <Sparkles className="h-5 w-5" />

                  {aiLoading
                    ? "Analyzing..."
                    : "Analyze Resume"}

                </button>

              </div>

            </div>

          </section>

        )}


        {/* =========================================
            ANALYSIS RESULT
        ========================================= */}

        {aiAnalysis && (

          <section
            id="ai-analysis"
            className="mx-auto mt-8 scroll-mt-24 max-w-6xl px-6"
          >

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white sm:p-8">

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">

                    <Sparkles className="h-6 w-6" />

                  </div>

                  <div>

                    <p className="text-sm font-medium text-indigo-100">
                      SMART ANALYSIS
                    </p>

                    <h2 className="text-2xl font-bold">
                      Resume Insights
                    </h2>

                  </div>

                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">
                  Personalized insights based on the content of your resume.
                </p>

              </div>


              <div className="grid gap-6 p-6 md:grid-cols-3 sm:p-8">

                <AnalysisCard
                  title="Strengths"
                  icon={
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  }
                  iconBg="bg-green-100"
                  cardBg="bg-green-50/60"
                  border="border-green-100"
                  titleColor="text-green-800"
                  items={aiAnalysis.strengths}
                  bullet="✓"
                  bulletColor="text-green-600"
                />

                <AnalysisCard
                  title="Areas to Improve"
                  icon={
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  }
                  iconBg="bg-red-100"
                  cardBg="bg-red-50/60"
                  border="border-red-100"
                  titleColor="text-red-800"
                  items={aiAnalysis.weaknesses}
                  bullet="!"
                  bulletColor="text-red-600"
                />

                <AnalysisCard
                  title="Recommendations"
                  icon={
                    <Lightbulb className="h-5 w-5 text-indigo-600" />
                  }
                  iconBg="bg-indigo-100"
                  cardBg="bg-indigo-50/60"
                  border="border-indigo-100"
                  titleColor="text-indigo-800"
                  items={aiAnalysis.recommendations}
                  bullet="→"
                  bulletColor="text-indigo-600"
                />

              </div>

            </div>

          </section>

        )}


        {/* =========================================
            SKILLS
        ========================================= */}

        {skills.length > 0 && (

          <section className="mx-auto mt-8 max-w-6xl px-6">

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                    Technical Profile
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    Detected Skills
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Skills identified from your resume.
                  </p>

                </div>

                <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 sm:flex">

                  <Sparkles className="h-6 w-6 text-indigo-600" />

                </div>

              </div>

              <div className="mt-6 flex flex-wrap gap-3">

                {skills.map((skill) => (

                  <span
                    key={skill}
                    className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-semibold capitalize text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-100"
                  >
                    ✓ {skill}
                  </span>

                ))}

              </div>

            </div>

          </section>

        )}


        {/* =========================================
            SUGGESTIONS
        ========================================= */}

        {suggestions.length > 0 && (

          <section className="mx-auto mt-8 max-w-6xl px-6">

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">

              <div>

                <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
                  Resume Optimization
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Improvements to Make
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Follow these recommendations to improve your resume.
                </p>

              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">

                {suggestions.map(
                  (suggestion, index) => (

                    <div
                      key={index}
                      className="flex gap-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
                    >

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">

                        <Lightbulb className="h-5 w-5" />

                      </div>

                      <div>

                        <p className="text-sm font-semibold text-slate-800">
                          Recommendation {index + 1}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {suggestion}
                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          </section>

        )}


        {/* =========================================
            HISTORY
        ========================================= */}

        <section
          id="history"
          className="mx-auto mt-12 scroll-mt-24 max-w-6xl px-6"
        >

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                  Resume Activity
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Resume History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your analyzed resumes are saved in this browser.
                </p>

              </div>

              {history.length > 0 && (

                <button
                  onClick={clearHistory}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >

                  <Trash2 className="h-4 w-4" />

                  Clear History

                </button>

              )}

            </div>


            {history.length === 0 ? (

              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

                <FileText className="mx-auto h-10 w-10 text-slate-400" />

                <p className="mt-3 font-semibold text-slate-700">
                  No resume history yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Upload a resume to create your first analysis record.
                </p>

              </div>

            ) : (

              <div className="mt-6 space-y-3">

                {history.map(
                  (item, index) => (

                    <div
                      key={`${item.fileName}-${index}`}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">

                          <FileText className="h-5 w-5 text-indigo-600" />

                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-slate-800">
                            {item.fileName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.date}
                          </p>

                        </div>

                      </div>


                      <div className="flex items-center justify-between gap-6 sm:justify-end">

                        <div className="text-left sm:text-right">

                          <p className="text-2xl font-bold text-indigo-600">
                            {item.atsScore}
                          </p>

                          <p className="text-xs font-medium text-slate-500">
                            ATS Score
                          </p>

                        </div>

                        <button
                          onClick={() =>
                            deleteHistoryItem(item.id)
                          }
                          title="Delete this history item"
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        >

                          <Trash2 className="h-5 w-5" />

                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </section>


        {/* =========================================
            JOB DESCRIPTION MATCHING
        ========================================= */}

        <section className="mx-auto mt-10 max-w-6xl px-6">

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">

            <div className="border-b border-slate-200 bg-slate-50 p-6 sm:p-8">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">

                  <Target className="h-6 w-6 text-indigo-600" />

                </div>

                <div>

                  <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                    Career Match
                  </p>

                  <h2 className="text-2xl font-bold text-slate-900">
                    Job Description Matching
                  </h2>

                </div>

              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Paste a job description and compare its required
                skills with your resume.
              </p>

            </div>


            <div className="p-6 sm:p-8">

              <textarea
                value={jobDescription}
                onChange={(event) =>
                  setJobDescription(event.target.value)
                }
                placeholder="Paste the job description here..."
                rows={9}
                className="w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-sm leading-6 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />

              <div className="mt-5 flex justify-end">

                <button
                  onClick={matchJob}
                  disabled={jobLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <Sparkles className="h-5 w-5" />

                  {jobLoading
                    ? "Matching..."
                    : "Analyze Job Match"}

                  {!jobLoading && (
                    <ArrowRight className="h-4 w-4" />
                  )}

                </button>

              </div>

            </div>

          </div>

        </section>


        {/* =========================================
            JOB MATCH RESULT
        ========================================= */}

        {jobMatch && (

          <section
            id="job-result"
            className="mx-auto mt-8 scroll-mt-24 max-w-6xl px-6"
          >

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

              <div className="p-6 sm:p-8">

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">

                    <Target className="h-6 w-6 text-indigo-600" />

                  </div>

                  <div>

                    <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                      Match Results
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900">
                      Job Compatibility
                    </h2>

                  </div>

                </div>


                <div className="mt-8 rounded-2xl bg-slate-50 p-8 text-center">

                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    JOB MATCH SCORE
                  </p>

                  <div className="mt-3">

                    <span className="text-6xl font-extrabold text-indigo-600">
                      {jobMatch.match_score}%
                    </span>

                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Based on skills found in the job description.
                  </p>

                </div>


                <div className="mt-8 grid gap-6 md:grid-cols-2">

                  {/* MATCHED */}

                  <div className="rounded-2xl border border-green-100 bg-green-50/60 p-6">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">

                        <CheckCircle2 className="h-5 w-5 text-green-600" />

                      </div>

                      <h3 className="font-bold text-green-800">
                        Matched Skills
                      </h3>

                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">

                      {jobMatch.matched_skills?.length > 0 ? (

                        jobMatch.matched_skills.map(
                          (skill) => (

                            <span
                              key={skill}
                              className="rounded-full bg-white px-3 py-2 text-sm font-medium text-green-700 shadow-sm"
                            >
                              ✓ {skill}
                            </span>

                          )
                        )

                      ) : (

                        <p className="text-sm text-slate-500">
                          No matched skills found.
                        </p>

                      )}

                    </div>

                  </div>


                  {/* MISSING */}

                  <div className="rounded-2xl border border-red-100 bg-red-50/60 p-6">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">

                        <AlertCircle className="h-5 w-5 text-red-600" />

                      </div>

                      <h3 className="font-bold text-red-800">
                        Missing Skills
                      </h3>

                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">

                      {jobMatch.missing_skills?.length > 0 ? (

                        jobMatch.missing_skills.map(
                          (skill) => (

                            <span
                              key={skill}
                              className="rounded-full bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm"
                            >
                              + {skill}
                            </span>

                          )
                        )

                      ) : (

                        <p className="text-sm text-slate-500">
                          No missing skills found.
                        </p>

                      )}

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </section>

        )}


        {/* =========================================
            EXTRACTED TEXT
        ========================================= */}

        {resumeText && (

          <section className="mx-auto mt-8 max-w-6xl px-6">

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">

                  <FileText className="h-6 w-6 text-slate-600" />

                </div>

                <div>

                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Resume Content
                  </p>

                  <h2 className="text-2xl font-bold text-slate-900">
                    Extracted Resume Text
                  </h2>

                </div>

              </div>

              <div className="mt-6 max-h-96 overflow-y-auto rounded-2xl bg-slate-50 p-5">

                <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {resumeText}
                </pre>

              </div>

            </div>

          </section>

        )}


        {/* =========================================
            FEATURES
        ========================================= */}

        <section className="mt-20 border-t bg-white py-20">

          <div className="mx-auto max-w-7xl px-6">

            <div className="mx-auto max-w-2xl text-center">

              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                Powerful Resume Tools
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                Everything you need to improve your resume
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Get detailed insights into your resume and understand
                how ATS systems may evaluate it.
              </p>

            </div>


            <div className="mt-12 grid gap-6 md:grid-cols-3">

              <FeatureCard
                icon={
                  <BarChart3 className="h-6 w-6" />
                }
                title="ATS Score"
                description="See how well your resume performs across important ATS categories."
              />

              <FeatureCard
                icon={
                  <Sparkles className="h-6 w-6" />
                }
                title="Resume Analysis"
                description="Discover strengths, weaknesses and personalized improvement opportunities."
              />

              <FeatureCard
                icon={
                  <Target className="h-6 w-6" />
                }
                title="Job Matching"
                description="Compare your resume with a job description and find missing skills."
              />

            </div>

          </div>

        </section>


        {/* =========================================
            CTA
        ========================================= */}

        <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700 py-20">

          <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-6 text-center text-white">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">

              <FileText className="h-8 w-8" />

            </div>

            <h2 className="mt-6 text-3xl font-bold sm:text-4xl">
              Ready to analyze your resume?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-indigo-100">
              Upload your resume and discover what you can improve
              before applying for your next job.
            </p>

            <button
              onClick={handleChooseResume}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-indigo-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-xl"
            >

              Analyze My Resume

              <ArrowRight className="h-5 w-5" />

            </button>

          </div>

        </section>

      </main>


      {/* =========================================
          FOOTER
      ========================================= */}

      <footer className="border-t bg-white py-8">

        <div className="mx-auto max-w-7xl px-6">

          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">

                <FileText className="h-5 w-5 text-white" />

              </div>

              <span className="font-bold text-slate-900">
                AI Resume Analyzer
              </span>

            </div>

            <p className="text-center text-sm text-slate-500">
              © 2026 AI Resume Analyzer. Built with React.
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}


/* =========================================
   AUTH SCREEN
========================================= */

function AuthScreen({
  mode,
  setMode,
  form,
  onChange,
  onSubmit,
  loading,
  error,
}) {
  const isSignup = mode === "signup";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-900/40">
            <FileText className="h-8 w-8 text-white" />
          </div>

          <h1 className="mt-5 text-3xl font-extrabold text-white">
            AI Resume Analyzer
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            {isSignup
              ? "Create your account to start analyzing your resume."
              : "Sign in to access your resume analysis dashboard."}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                !isSignup
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                isSignup
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Enter your name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="Enter your password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSignup ? (
                <UserPlus className="h-5 w-5" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}

              {loading
                ? isSignup
                  ? "Creating account..."
                  : "Signing in..."
                : isSignup
                  ? "Create Account"
                  : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Your account is securely handled by the AI Resume Analyzer backend.
          </p>
        </div>
      </div>
    </div>
  );
}


/* =========================================
   PILL
========================================= */

function Pill({ text }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200 backdrop-blur">
      {text}
    </div>
  );
}


/* =========================================
   STAT CARD
========================================= */

function StatCard({
  title,
  value,
  icon,
  iconBg,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>

        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}


/* =========================================
   ANALYSIS CARD
========================================= */

function AnalysisCard({
  title,
  icon,
  iconBg,
  cardBg,
  border,
  titleColor,
  items,
  bullet,
  bulletColor,
}) {
  return (
    <div
      className={`rounded-2xl border ${border} ${cardBg} p-6`}
    >

      <div className="flex items-center gap-3">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>

        <h3 className={`font-bold ${titleColor}`}>
          {title}
        </h3>

      </div>

      <ul className="mt-5 space-y-3">

        {items?.length > 0 ? (

          items.map((item, index) => (

            <li
              key={index}
              className="flex gap-2 text-sm leading-6 text-slate-700"
            >

              <span
                className={`font-bold ${bulletColor}`}
              >
                {bullet}
              </span>

              <span>
                {item}
              </span>

            </li>

          ))

        ) : (

          <li className="text-sm text-slate-500">
            No information available.
          </li>

        )}

      </ul>

    </div>
  );
}


/* =========================================
   FEATURE CARD
========================================= */

function FeatureCard({
  icon,
  title,
  description,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">

        {icon}

      </div>

      <h3 className="text-lg font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 leading-7 text-slate-600">
        {description}
      </p>

    </div>
  );
}


/* =========================================
   ATS MAXIMUM SCORE
========================================= */

function getMaxScore(category) {
  const maxScores = {
    "Contact Information": 10,
    Education: 15,
    Skills: 25,
    Experience: 15,
    Projects: 15,
    "Resume Content": 10,
  };

  return maxScores[category] || 100;
}


export default App;