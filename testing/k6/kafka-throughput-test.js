import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Gauge } from 'k6/metrics';

// Kafka-specific metrics
const kafkaMessagesProduced = new Counter('kafka_messages_produced');
const kafkaMessagesConsumed = new Counter('kafka_messages_consumed');
const kafkaProducerLatency = new Trend('kafka_producer_latency');
const kafkaConsumerLag = new Gauge('kafka_consumer_lag');
const kafkaPartitionCount = new Gauge('kafka_partition_count');

export const options = {
  scenarios: {
    // Test Kafka producer throughput
    producer_throughput: {
      executor: 'constant-arrival-rate',
      rate: 100,           // 100 messages/second
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
    
    // Test high throughput
    high_throughput: {
      executor: 'constant-arrival-rate',
      rate: 500,           // 500 messages/second
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 100,
      maxVUs: 500,
      startTime: '6m',
    },
    
    // Test burst throughput
    burst_throughput: {
      executor: 'constant-arrival-rate',
      rate: 1000,          // 1000 messages/second
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 200,
      maxVUs: 1000,
      startTime: '10m',
    },
  },
  
  thresholds: {
    'kafka_messages_produced': ['count>10000'],
    'kafka_producer_latency': ['p(95)<200', 'p(99)<500'],
    'kafka_consumer_lag': ['value<1000'], // Consumer lag < 1000 messages
    'http_req_duration': ['p(95)<300'],
  },
};

const BASE_URL = __ENV.API_GATEWAY_URL || 'http://localhost:3000';
const KAFKA_METRICS_URL = __ENV.KAFKA_METRICS_URL || 'http://localhost:9308/metrics';

let messageCounter = 0;

export function setup() {
  // Warmup - ensure services are ready
  const warmupRes = http.get(`${BASE_URL}/health`);
  console.log('Warmup response:', warmupRes.status);
  
  return {
    startTime: Date.now(),
  };
}

export default function(data) {
  const startTime = Date.now();
  
  // Produce messages to different topics
  const messageTypes = [
    { endpoint: '/courses', topic: 'course-events' },
    { endpoint: '/progress', topic: 'progress-events' },
    { endpoint: '/notifications', topic: 'notification-events' },
  ];
  
  const selectedType = messageTypes[messageCounter % messageTypes.length];
  messageCounter++;
  
  const payload = generatePayload(selectedType.topic);
  
  const res = http.post(
    `${BASE_URL}${selectedType.endpoint}`,
    JSON.stringify(payload),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Message-Id': `msg-${Date.now()}-${Math.random()}`,
      },
    }
  );
  
  const producerLatency = Date.now() - startTime;
  
  const success = check(res, {
    'Message published successfully': (r) => r.status >= 200 && r.status < 300,
    'Producer latency < 500ms': () => producerLatency < 500,
  });
  
  if (success) {
    kafkaMessagesProduced.add(1);
    kafkaProducerLatency.add(producerLatency);
  }
  
  // Randomly check Kafka metrics (every 10th request)
  if (messageCounter % 10 === 0) {
    checkKafkaMetrics();
  }
}

function generatePayload(topic) {
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 100000);
  
  switch(topic) {
    case 'course-events':
      return {
        title: `Course ${randomId}`,
        description: `Test course for throughput testing ${timestamp}`,
        duration: 60 + Math.floor(Math.random() * 180),
        level: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
        metadata: {
          testId: randomId,
          timestamp: timestamp,
          batchId: Math.floor(timestamp / 1000),
        },
      };
      
    case 'progress-events':
      return {
        userId: `user-${randomId % 1000}`,
        courseId: `course-${randomId % 100}`,
        lessonId: `lesson-${randomId % 500}`,
        completed: Math.random() > 0.5,
        score: Math.floor(Math.random() * 100),
        timeSpent: Math.floor(Math.random() * 3600),
        timestamp: timestamp,
      };
      
    case 'notification-events':
      return {
        userId: `user-${randomId % 1000}`,
        type: ['course_update', 'achievement', 'reminder'][Math.floor(Math.random() * 3)],
        title: `Notification ${randomId}`,
        message: `Test notification message ${timestamp}`,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        timestamp: timestamp,
      };
      
    default:
      return { data: `test-${timestamp}` };
  }
}

function checkKafkaMetrics() {
  // Query Prometheus metrics for Kafka
  const metricsRes = http.get(KAFKA_METRICS_URL);
  
  if (metricsRes.status === 200) {
    const body = metricsRes.body;
    
    // Parse consumer lag
    const lagMatch = body.match(/kafka_consumer_lag{.*?}\s+(\d+)/);
    if (lagMatch) {
      const lag = parseInt(lagMatch[1]);
      kafkaConsumerLag.add(lag);
      kafkaMessagesConsumed.add(1);
    }
    
    // Parse partition count
    const partitionMatch = body.match(/kafka_partition_count{.*?}\s+(\d+)/);
    if (partitionMatch) {
      const partitions = parseInt(partitionMatch[1]);
      kafkaPartitionCount.add(partitions);
    }
  }
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n=== Kafka Throughput Test Summary ===`);
  console.log(`Total Duration: ${duration.toFixed(2)}s`);
  console.log(`Expected messages: ${duration * 100} (at 100 msg/s baseline)`);
}

export function handleSummary(data) {
  const messagesProduced = data.metrics.kafka_messages_produced?.values?.count || 0;
  const avgLatency = data.metrics.kafka_producer_latency?.values?.avg || 0;
  const p95Latency = data.metrics.kafka_producer_latency?.values['p(95)'] || 0;
  const p99Latency = data.metrics.kafka_producer_latency?.values['p(99)'] || 0;
  const consumerLag = data.metrics.kafka_consumer_lag?.values?.value || 0;
  
  const report = {
    summary: {
      total_messages_produced: messagesProduced,
      avg_producer_latency_ms: avgLatency.toFixed(2),
      p95_producer_latency_ms: p95Latency.toFixed(2),
      p99_producer_latency_ms: p99Latency.toFixed(2),
      consumer_lag: consumerLag,
      throughput_msg_per_sec: (messagesProduced / 660).toFixed(2), // 11 minutes total
    },
    raw_metrics: data.metrics,
  };
  
  return {
    'kafka-throughput-report.json': JSON.stringify(report, null, 2),
    stdout: formatConsoleOutput(report),
  };
}

function formatConsoleOutput(report) {
  return `
╔════════════════════════════════════════════════════════════════╗
║           KAFKA THROUGHPUT TEST RESULTS                        ║
╠════════════════════════════════════════════════════════════════╣
║  Total Messages Produced: ${report.summary.total_messages_produced.toString().padEnd(36)}║
║  Throughput:              ${report.summary.throughput_msg_per_sec} msg/s${' '.repeat(23)}║
║  Avg Producer Latency:    ${report.summary.avg_producer_latency_ms} ms${' '.repeat(25)}║
║  P95 Latency:             ${report.summary.p95_producer_latency_ms} ms${' '.repeat(25)}║
║  P99 Latency:             ${report.summary.p99_producer_latency_ms} ms${' '.repeat(25)}║
║  Consumer Lag:            ${report.summary.consumer_lag.toString().padEnd(36)}║
╚════════════════════════════════════════════════════════════════╝
`;
}
