import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const kafkaPublishSuccess = new Counter('kafka_publish_success');
const kafkaPublishFail = new Counter('kafka_publish_fail');

// Test configuration
export const options = {
  scenarios: {
    // Scenario 1: Load Test - Tăng dần load
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Tăng lên 50 users trong 2 phút
        { duration: '5m', target: 50 },   // Giữ 50 users trong 5 phút
        { duration: '2m', target: 100 },  // Tăng lên 100 users
        { duration: '5m', target: 100 },  // Giữ 100 users
        { duration: '2m', target: 200 },  // Tăng lên 200 users
        { duration: '5m', target: 200 },  // Giữ 200 users
        { duration: '2m', target: 0 },    // Giảm về 0
      ],
      gracefulRampDown: '30s',
    },
    
    // Scenario 2: Stress Test - Đẩy tới giới hạn
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 300 },
        { duration: '5m', target: 500 },
        { duration: '2m', target: 0 },
      ],
      startTime: '25m', // Chạy sau load_test
    },
    
    // Scenario 3: Spike Test - Test đột biến
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 500 },  // Tăng đột ngột
        { duration: '1m', target: 500 },   // Giữ
        { duration: '10s', target: 0 },    // Giảm đột ngột
      ],
      startTime: '50m', // Chạy sau stress_test
    },
  },
  
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% requests < 500ms
    'http_req_failed': ['rate<0.01'],  // Error rate < 1%
    'errors': ['rate<0.05'],           // Custom error rate < 5%
    'kafka_publish_success': ['count>1000'],
  },
};

const BASE_URL = __ENV.API_GATEWAY_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'user1@test.com', password: 'password123' },
  { email: 'user2@test.com', password: 'password123' },
  { email: 'user3@test.com', password: 'password123' },
];

let authToken = null;

export function setup() {
  // Login để lấy token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'admin@test.com',
    password: 'admin123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    return { token: body.access_token };
  }
  
  return { token: null };
}

export default function(data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };

  // Test 1: GET courses (Read operation)
  const getCoursesRes = http.get(`${BASE_URL}/courses`, { headers });
  check(getCoursesRes, {
    'GET /courses status is 200': (r) => r.status === 200,
    'GET /courses response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  responseTime.add(getCoursesRes.timings.duration);

  sleep(1);

  // Test 2: POST create course (Write operation - Kafka publish)
  const courseData = {
    title: `Test Course ${Date.now()}`,
    description: 'Load test course description',
    duration: 120,
    level: 'beginner',
  };
  
  const createCourseRes = http.post(
    `${BASE_URL}/courses`,
    JSON.stringify(courseData),
    { headers }
  );
  
  const createSuccess = check(createCourseRes, {
    'POST /courses status is 201': (r) => r.status === 201,
    'POST /courses response time < 1000ms': (r) => r.timings.duration < 1000,
    'POST /courses has course ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined;
      } catch(e) {
        return false;
      }
    },
  });
  
  if (createSuccess) {
    kafkaPublishSuccess.add(1);
  } else {
    kafkaPublishFail.add(1);
    errorRate.add(1);
  }
  
  responseTime.add(createCourseRes.timings.duration);

  sleep(1);

  // Test 3: POST learning progress (Write operation - Kafka publish)
  const progressData = {
    userId: 'user-' + Math.floor(Math.random() * 1000),
    courseId: 'course-' + Math.floor(Math.random() * 100),
    lessonId: 'lesson-' + Math.floor(Math.random() * 50),
    completed: Math.random() > 0.5,
    score: Math.floor(Math.random() * 100),
  };
  
  const progressRes = http.post(
    `${BASE_URL}/progress`,
    JSON.stringify(progressData),
    { headers }
  );
  
  const progressSuccess = check(progressRes, {
    'POST /progress status is 201': (r) => r.status === 201,
    'POST /progress response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  if (progressSuccess) {
    kafkaPublishSuccess.add(1);
  } else {
    kafkaPublishFail.add(1);
    errorRate.add(1);
  }
  
  responseTime.add(progressRes.timings.duration);

  sleep(2);

  // Test 4: GET user profile
  const userRes = http.get(`${BASE_URL}/users/me`, { headers });
  check(userRes, {
    'GET /users/me status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  responseTime.add(userRes.timings.duration);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  let summary = '\n' + indent + '✓ Load Test Summary:\n';
  
  summary += indent + '  Scenarios:\n';
  for (const [name, scenario] of Object.entries(data.metrics.scenarios || {})) {
    summary += indent + `    - ${name}\n`;
  }
  
  summary += indent + '  Metrics:\n';
  summary += indent + `    - Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `    - Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%\n`;
  summary += indent + `    - Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += indent + `    - P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += indent + `    - P99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += indent + `    - Kafka Publish Success: ${data.metrics.kafka_publish_success.values.count}\n`;
  summary += indent + `    - Kafka Publish Fail: ${data.metrics.kafka_publish_fail.values.count}\n`;
  
  return summary;
}
