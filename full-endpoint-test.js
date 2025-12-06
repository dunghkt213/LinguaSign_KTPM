import http from "k6/http";
import { sleep, check, randomIntBetween } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 200 },
    { duration: "1m", target: 200 },
  ],
};

// ---- SAFE JSON PARSER (fix dứt điểm dòng 120) ----
function safeJson(res) {
  try {
    return res.json();
  } catch (_) {
    return null;
  }
}

// ---------------- SETUP ----------------
export function setup() {
  const BASE_URL = "http://localhost:3000";
  const username = `user${Date.now()}`;
  const email = `${username}@test.com`;

  http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      name: "Load Tester",
      username,
      email,
      password: "123456",
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  const login = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      username,
      password: "123456",
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  const data = safeJson(login);

  return {
    BASE_URL,
    token: data?.accessToken ?? null,
  };
}

// ---------------- LOAD TEST MAIN FLOW ----------------
export default function (data) {
  if (!data?.token) {
    console.warn("⚠️ Missing token → skip iteration");
    sleep(1);
    return;
  }

  const BASE_URL = data.BASE_URL;
  const params = {
    headers: {
      Authorization: `Bearer ${data.token}`,
      "Content-Type": "application/json",
    },
  };

  // -------- COURSES --------
  check(http.get(`${BASE_URL}/courses`, params), {
    "GET /courses OK": (r) => r.status === 200,
  });

  const courseCreate = http.post(
    `${BASE_URL}/courses`,
    JSON.stringify({ title: "Course from k6", description: "load test" }),
    params
  );

  check(courseCreate, { "POST /courses OK": (r) => r.status < 400 });

  let courseId = safeJson(courseCreate)?._id ?? "1";

  check(http.get(`${BASE_URL}/courses/${courseId}`, params), {
    "GET /courses/:id OK": (r) => r.status === 200,
  });

  check(
    http.put(
      `${BASE_URL}/courses/${courseId}`,
      JSON.stringify({ title: "Updated by k6" }),
      params
    ),
    { "PUT /courses/:id OK": (r) => r.status === 200 }
  );

  check(http.del(`${BASE_URL}/courses/${courseId}`, null, params), {
    "DELETE /courses/:id OK": (r) => r.status === 200,
  });

  // -------- PROGRESS --------
const progressCreate = http.post(
  `${BASE_URL}/progress`,
  JSON.stringify({
    userId: "1",
    courseId: "1",
    progress: randomIntBetween(1, 100),
  }),
  params
);

check(progressCreate, { "POST /progress OK": (r) => r.status < 400 });

let progressId = safeJson(progressCreate)?._id ?? "1";


  check(http.get(`${BASE_URL}/progress/${progressId}`, params), {
    "GET /progress/:id OK": (r) => r.status === 200,
  });

  check(http.put(
    `${BASE_URL}/progress/${progressId}`,
    JSON.stringify({ progress: 90 }),
    params
  ), { "PUT /progress/:id OK": (r) => r.status === 200 });

  check(http.del(`${BASE_URL}/progress/${progressId}`, null, params), {
    "DELETE /progress/:id OK": (r) => r.status === 200,
  });

  // -------- NOTIFICATIONS --------
  const notifCreate = http.post(
    `${BASE_URL}/notifications`,
    JSON.stringify({ userId: "1", title: "Hello", message: "from k6" }),
    params
  );

  let notifId = safeJson(notifCreate)?._id ?? "1";

  check(http.get(`${BASE_URL}/notifications?page=1&limit=5`, params), {
    "GET /notifications OK": (r) => r.status === 200,
  });

  check(http.get(`${BASE_URL}/notifications/${notifId}`, params), {
    "GET /notifications/:id OK": (r) => r.status === 200,
  });

  check(http.put(
    `${BASE_URL}/notifications/${notifId}`,
    JSON.stringify({ title: "updated" }),
    params
  ), { "PUT /notifications/:id OK": (r) => r.status === 200 });

  check(http.patch(
    `${BASE_URL}/notifications/${notifId}/read`,
    JSON.stringify({ read: true }),
    params
  ), { "PATCH /notifications/:id/read OK": (r) => r.status === 200 });

  check(http.del(`${BASE_URL}/notifications/${notifId}`, null, params), {
    "DELETE /notifications/:id OK": (r) => r.status === 200,
  });

  // -------- USERS --------
  const userCreate = http.post(
    `${BASE_URL}/users`,
    JSON.stringify({
      name: "k6 user",
      username: `k6user${Date.now()}`,
      email: `k6_${Date.now()}@mail.com`,
      password: "123456",
    }),
    params
  );

  let newUserId = safeJson(userCreate)?._id ?? "1";

  check(http.get(`${BASE_URL}/users/${newUserId}`, params), {
    "GET /users/:id OK": (r) => r.status === 200,
  });

  check(http.del(`${BASE_URL}/users/${newUserId}`, null, params), {
    "DELETE /users/:id OK": (r) => r.status === 200,
  });

  // -------- AUTH --------
  check(http.post(`${BASE_URL}/auth/refresh`, null, params), {
    "POST /auth/refresh OK": (r) => r.status === 200,
  });

  check(http.post(`${BASE_URL}/auth/revoke`, null, params), {
    "POST /auth/revoke OK": (r) => r.status === 200,
  });

  sleep(1);
}
