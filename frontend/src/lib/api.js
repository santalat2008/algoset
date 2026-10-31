const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }

    if (!res.ok) {
      let errData = {};
      try {
        errData = await res.json();
      } catch {
        errData = { detail: res.statusText };
      }

      let errorMsg = "";
      if (typeof errData === "string") {
        errorMsg = errData;
      } else if (errData && typeof errData === "object") {
        if (errData.detail) {
          errorMsg = errData.detail;
        } else if (errData.message) {
          errorMsg = errData.message;
        } else if (errData.non_field_errors) {
          errorMsg = Array.isArray(errData.non_field_errors)
            ? errData.non_field_errors.join(", ")
            : String(errData.non_field_errors);
        } else {
          const fieldErrors = [];
          for (const [field, val] of Object.entries(errData)) {
            const fieldText = Array.isArray(val) ? val.join(", ") : String(val);
            fieldErrors.push(fieldText);
          }
          if (fieldErrors.length > 0) {
            errorMsg = fieldErrors.join(" ");
          }
        }
      }

      throw new Error(errorMsg || `So'rov bajarilmadi (status: ${res.status})`);
    }

    return await res.json();
  } catch (error) {
    throw error;
  }
}

export const api = {
  async getStats() {
    try {
      return await request("/stats/");
    } catch {
      return {
        tutorials_count: 100,
        problems_count: 500,
        contests_count: 50,
        active_learners_count: 1000,
      };
    }
  },

  async getCategories() {
    try {
      return await request("/categories/");
    } catch {
      return [];
    }
  },

  async getTopics() {
    try {
      return await request("/topics/");
    } catch {
      return [];
    }
  },

  async toggleTopicComplete(slug) {
    return await request(`/topics/${slug}/complete/`, { method: "POST" });
  },

  async getProblemTags() {
    try {
      return await request("/problems/tags/");
    } catch {
      return [];
    }
  },

  async getProblems(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      return await request(`/problems/${query ? `?${query}` : ""}`);
    } catch {
      return { count: 0, results: [] };
    }
  },

  async getProblem(slug) {
    return await request(`/problems/${slug}/`);
  },

  async runCode(slug, code, customInput, language = "python3") {
    return await request(`/problems/${slug}/run/`, {
      method: "POST",
      body: JSON.stringify({ code, custom_input: customInput, language }),
    });
  },

  async submitCode(slug, code, contestId = null, language = "python3") {
    return await request(`/problems/${slug}/submit/`, {
      method: "POST",
      body: JSON.stringify({ code, contest_id: contestId, language }),
    });
  },

  async getProblemSubmissions(slug) {
    try {
      return await request(`/problems/${slug}/submissions/`);
    } catch {
      return [];
    }
  },

  async getProblemDiscussions(slug) {
    try {
      return await request(`/problems/${slug}/discussions/`);
    } catch {
      return [];
    }
  },

  async createDiscussion(slug, title, content) {
    return await request(`/problems/${slug}/discussions/`, {
      method: "POST",
      body: JSON.stringify({ title, content }),
    });
  },

  async addDiscussionComment(slug, discId, content) {
    return await request(`/problems/${slug}/discussions/${discId}/comments/`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  async getContests(status = "all") {
    try {
      const sp = new URLSearchParams();
      if (status && status !== "all") {
        sp.set("status", status);
      } else if (status === "all") {
        sp.set("status", "all");
      }
      sp.set("page_size", "250");
      const qs = sp.toString();
      const res = await request(`/contests/${qs ? `?${qs}` : ""}`);
      return Array.isArray(res) ? res : (res?.results || []);
    } catch {
      return [];
    }
  },

  async getContestStudioStats() {
    try {
      return await request("/contests/studio_stats/");
    } catch {
      return { total: 0, public: 0, private: 0, draft: 0, pending: 0, rejected: 0, upcoming: 0, ongoing: 0, past: 0 };
    }
  },

  async getContest(slug) {
    return await request(`/contests/${slug}/`);
  },

  async joinContest(slug) {
    return await request(`/contests/${slug}/join/`, { method: "POST" });
  },

  async getMe() {
    return await request("/auth/me/");
  },

  async login(username, password) {
    const data = await request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (typeof window !== "undefined" && data.access) {
      localStorage.setItem("access_token", data.access);
    }
    return data;
  },

  async getSubmission(id) {
    return await request(`/submissions/${id}/`);
  },

  async getUsers() {
    try {
      const res = await request("/users/");
      return Array.isArray(res) ? res : (res.results || []);
    } catch {
      return [];
    }
  },

  async setUserRole(userId, role) {
    return await request(`/users/${userId}/set_role/`, {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  },

  async verifyUserEmailAdmin(userId) {
    return await request(`/users/${userId}/verify_email/`, {
      method: "POST",
    });
  },

  async verifyEmail(token) {
    return await request("/auth/verify-email/", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  async resendVerification(email) {
    return await request("/auth/resend-verification/", {
      method: "POST",
      body: JSON.stringify(email ? { email } : {}),
    });
  },

  async createProblem(data) {
    return await request("/problems/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async requestProblemPublic(slug) {
    return await request(`/problems/${slug}/request_public/`, {
      method: "POST",
    });
  },

  async reviewProblem(slug, decision, feedback = "") {
    return await request(`/problems/${slug}/review_request/`, {
      method: "POST",
      body: JSON.stringify({ decision, feedback }),
    });
  },

  async getPendingProblems() {
    try {
      return await request("/problems/pending/");
    } catch {
      return [];
    }
  },

  async getPublicationRequests(status = "", type = "") {
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (type) params.append("type", type);
      const query = params.toString() ? `?${params.toString()}` : "";
      return await request(`/publication-requests/${query}`);
    } catch {
      return [];
    }
  },

  async createContest(data) {
    return await request("/contests/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async requestContestPublic(slug) {
    return await request(`/contests/${slug}/request_public/`, {
      method: "POST",
    });
  },

  async reviewContest(slug, decision, feedback = "") {
    return await request(`/contests/${slug}/review_request/`, {
      method: "POST",
      body: JSON.stringify({ decision, feedback }),
    });
  },

  async getPendingContests() {
    try {
      return await request("/contests/pending/");
    } catch {
      return [];
    }
  },

  async finalizeContestRatings(slug) {
    return await request(`/contests/${slug}/finalize_ratings/`, {
      method: "POST",
      body: JSON.stringify({ force: true }),
    });
  },

  async createCategory(data) {
    return await request("/categories/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateCategory(slug, data) {
    return await request(`/categories/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(slug) {
    return await request(`/categories/${slug}/`, {
      method: "DELETE",
    });
  },

  async createTopic(data) {
    return await request("/topics/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateTopic(slug, data) {
    return await request(`/topics/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteTopic(slug) {
    return await request(`/topics/${slug}/`, {
      method: "DELETE",
    });
  },

  async completeTopic(slug) {
    return await request(`/topics/${slug}/complete/`, {
      method: "POST",
    });
  },

  async getLearningStudioStats() {
    try {
      return await request("/categories/studio_stats/");
    } catch {
      return {
        categories_count: 0,
        active_categories_count: 0,
        topics_count: 0,
        lessons_count: 0,
        published_lessons_count: 0,
        private_lessons_count: 0,
        pending_lessons_count: 0,
      };
    }
  },

  async getLessons(params = {}) {
    try {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") {
          searchParams.append(k, v);
        }
      }
      const qs = searchParams.toString();
      const res = await request(`/lessons/${qs ? `?${qs}` : ""}`);
      return Array.isArray(res) ? res : (res.results || []);
    } catch {
      return [];
    }
  },

  async getLesson(slug) {
    return await request(`/lessons/${slug}/`);
  },

  async createLesson(data) {
    return await request("/lessons/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateLesson(slug, data) {
    return await request(`/lessons/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteLesson(slug) {
    return await request(`/lessons/${slug}/`, {
      method: "DELETE",
    });
  },

  async requestLessonPublic(slug) {
    return await request(`/lessons/${slug}/request_public/`, {
      method: "POST",
    });
  },

  async reviewLesson(slug, decision, feedback = "") {
    return await request(`/lessons/${slug}/review_request/`, {
      method: "POST",
      body: JSON.stringify({ decision, feedback }),
    });
  },

  async completeLesson(slug) {
    return await request(`/lessons/${slug}/complete/`, {
      method: "POST",
    });
  },

  async updateProblem(slug, data) {
    return await request(`/problems/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteProblem(slug) {
    return await request(`/problems/${slug}/`, {
      method: "DELETE",
    });
  },

  async updateContest(slug, data) {
    return await request(`/contests/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteContest(slug) {
    return await request(`/contests/${slug}/`, {
      method: "DELETE",
    });
  },

  async updateMe(data) {
    return await request("/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async register(username, email, password) {
    return await request("/auth/register/", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  },

  async getProblemAuthoring(slug) {
    return await request(`/problems/${slug}/authoring/`);
  },

  async updateProblemAuthoring(slug, data) {
    return await request(`/problems/${slug}/authoring/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async generateCodeTemplates(mode, signature) {
    return await request("/problems/generate_templates/", {
      method: "POST",
      body: JSON.stringify({ execution_mode: mode, function_signature: signature }),
    });
  },

  async createProblemVersion(slug) {
    return await request(`/problems/${slug}/create_version/`, {
      method: "POST",
    });
  },

  async updateProblemVersion(slug, versionNum, data) {
    return await request(`/problems/${slug}/versions/${versionNum}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async getVersionTestcases(slug, versionNum) {
    return await request(`/problems/${slug}/versions/${versionNum}/testcases/`);
  },

  async addVersionTestcase(slug, versionNum, data) {
    return await request(`/problems/${slug}/versions/${versionNum}/testcases/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateVersionTestcase(slug, versionNum, caseId, data) {
    return await request(`/problems/${slug}/versions/${versionNum}/testcases/${caseId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteVersionTestcase(slug, versionNum, caseId) {
    return await request(`/problems/${slug}/versions/${versionNum}/testcases/${caseId}/`, {
      method: "DELETE",
    });
  },

  async uploadTestcasesZip(slug, versionNum, file, isSample = false, groupName = "") {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("is_sample", isSample);
    if (groupName) formData.append("group_name", groupName);

    const res = await fetch(`${API_BASE}/problems/${slug}/versions/${versionNum}/upload_zip/`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      let errorMsg = "";
      try {
        const err = await res.json();
        errorMsg = err.detail || err.message;
      } catch {}
      throw new Error(errorMsg || `ZIP fayl yuklashda xatolik (status: ${res.status})`);
    }
    return await res.json();
  },

  async generateExpectedOutputs(slug, versionNum, referenceSolution = "") {
    return await request(`/problems/${slug}/versions/${versionNum}/generate_outputs/`, {
      method: "POST",
      body: JSON.stringify({ reference_solution: referenceSolution }),
    });
  },

  async validateProblemVersion(slug, versionNum, referenceSolution = "", wrongSolution = "") {
    return await request(`/problems/${slug}/versions/${versionNum}/validate/`, {
      method: "POST",
      body: JSON.stringify({ reference_solution: referenceSolution, wrong_solution: wrongSolution }),
    });
  },

  async getValidationStatus(slug, versionNum) {
    return await request(`/problems/${slug}/versions/${versionNum}/validation_status/`);
  },

  async publishProblemVersion(slug, versionNum) {
    return await request(`/problems/${slug}/versions/${versionNum}/publish/`, {
      method: "POST",
    });
  },
};

