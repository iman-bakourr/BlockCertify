const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // University
  universityLogin: (email, password) =>
    request("/university/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  getDashboard: () => request("/university/dashboard"),
  issueCertificate: (payload) =>
    request("/university/certificates", { method: "POST", body: JSON.stringify(payload) }),
  recordMetaMaskCertificate: (payload) =>
    request("/university/certificates/record", { method: "POST", body: JSON.stringify(payload) }),
  getAllCertificates: () => request("/university/certificates"),

  // Student
  studentLogin: (email, password) =>
    request("/student/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  getStudentCertificates: (studentId) =>
    request(`/student/certificates?studentId=${encodeURIComponent(studentId)}`),

  // Employer
  verifyCertificate: (payload) =>
    request("/employer/verify", { method: "POST", body: JSON.stringify(payload) }),

  // General
  getStatus: () => request("/status"),
};
