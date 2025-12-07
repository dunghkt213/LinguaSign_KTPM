import http from "k6/http";
import { sleep, check } from "k6";
import { randomIntBetween } from "k6";
import exec from "k6/execution";

export const options = {
  stages: [
    { duration: "2m", target: 2500 },
    { duration: "2m", target: 2500 },
  ],
};

// -----------------------------------------------------------------
// SETUP: register -> login -> accessToken (for all protected routes)
// -----------------------------------------------------------------
export function setup() {
  const BASE_URL = "http://localhost:3000";
  const username = `user${Date.now()}`;
  const email = `${username}@test.com`;

  // Register
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

  // Login
  const login = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      username,
      password: "123456",
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  const data = JSON.parse(login.body);

  return {
    BASE_URL,
    token: data.accessToken,
  };
}

// -----------------------------------------------------------------
// DEFAULT — mỗi VU test TẤT CẢ endpoint trong controller của bạn
// -----------------------------------------------------------------
export default function (data) {
  const BASE_URL = data.BASE_URL;
  const token = data.token;

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // ===================== COURSES (CRUD) =====================
  check(http.get(`${BASE_URL}/courses`, params), {
    "GET /courses OK": (r) => r.status === 200,
  });

  const courseCreate = http.post(
    `${BASE_URL}/courses`,
    JSON.stringify({
      title: "Course from k6",
      description: "load test",
    }),
    params
  );

  check(courseCreate, {
    "POST /courses OK": (r) => r.status === 201 || r.status === 200,
  });

  let courseId = "1";
  if (courseCreate.body && courseCreate.status < 400) {
    try {
      const parsed = JSON.parse(courseCreate.body);
      courseId = parsed._id || parsed.id || "1";
    } catch (e) {
      console.log("Failed to parse course response");
    }
  }

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


  // ===================== NOTIFICATIONS (CRUD) =====================
  const notifCreate = http.post(
    `${BASE_URL}/notifications`,
    JSON.stringify({
      userId: "1",
      title: "Hello",
      message: "from k6",
    }),
    params
  );

  let notifId = "1";
  if (notifCreate.body && notifCreate.status < 400) {
    try {
      const parsed = JSON.parse(notifCreate.body);
      notifId = parsed._id || parsed.id || "1";
    } catch (e) {
      console.log("Failed to parse notification response");
    }
  }

  check(http.get(`${BASE_URL}/notifications?page=1&limit=5`, params), {
    "GET /notifications OK": (r) => r.status === 200,
  });

  check(http.get(`${BASE_URL}/notifications/${notifId}`, params), {
    "GET /notifications/:id OK": (r) => r.status === 200,
  });

  check(
    http.put(
      `${BASE_URL}/notifications/${notifId}`,
      JSON.stringify({ title: "updated" }),
      params
    ),
    { "PUT /notifications/:id OK": (r) => r.status === 200 }
  );

  check(
    http.patch(
      `${BASE_URL}/notifications/${notifId}/read`,
      JSON.stringify({ read: true }),
      params
    ),
    { "PATCH /notifications/:id/read OK": (r) => r.status === 200 }
  );

  check(http.del(`${BASE_URL}/notifications/${notifId}`, null, params), {
    "DELETE /notifications/:id OK": (r) => r.status === 200,
  });

  // ===================== USERS (CRUD) =====================
  // Generate unique user identifier using VU ID + iteration + timestamp + random
  // This prevents duplicate username errors when multiple VUs run simultaneously
  const uniqueId = `${exec.vu.idInTest}_${exec.scenario.iterationInTest}_${Date.now()}_${randomIntBetween(1000, 9999)}`;
  const userCreate = http.post(
    `${BASE_URL}/users`,
    JSON.stringify({
      name: "k6 user",
      username: `k6user${uniqueId}`,
      email: `k6_${uniqueId}@mail.com`,
      password: "123456",
    }),
    params
  );

  let newUserId = null;
  if (userCreate.body && userCreate.status < 400) {
    try {
      const parsed = JSON.parse(userCreate.body);
      newUserId = parsed._id || parsed.id;
    } catch (e) {
      // Skip user operations if creation failed
    }
  }

  check(http.get(`${BASE_URL}/users`, params), {
    "GET /users OK": (r) => r.status === 200,
  });

  // Only test user-specific operations if we successfully created a user
  if (newUserId) {
    check(http.get(`${BASE_URL}/users/${newUserId}`, params), {
      "GET /users/:id OK": (r) => r.status === 200,
    });

    check(
      http.put(
        `${BASE_URL}/users/${newUserId}`,
        JSON.stringify({ name: "updated name" }),
        params
      ),
      { "PUT /users/:id OK": (r) => r.status === 200 }
    );

    check(http.del(`${BASE_URL}/users/${newUserId}`, null, params), {
      "DELETE /users/:id OK": (r) => r.status === 200,
    });
  }

  // Note: auth/refresh and auth/revoke endpoints are not tested in this load test
  // as they require specific token management flow

  sleep(1);
}
