import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    ramp_200_in_60s: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '60s', target: 200 }, // sobe até 200 usuários em 60s
      ],
      gracefulRampDown: '0s',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.1'],   // exemplo: <10% de falhas aceitável
    'http_req_duration': ['p(95)<2000'] // exemplo: 95% das requisições < 2s
  },
};

const URL = 'https://amei.homolog.kubernetes.sebrae.com.br/auth/realms/externo/protocol/openid-connect/token';

export default function () {
  const payload = `grant_type=client_credentials&client_id=portal-backend&client_secret=f1265b1f-6d7b-427a-9266-87d3c353e264`;
  const params = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

  const res = http.post(URL, payload, params);

  check(res, {
    'status 200': (r) => r.status === 200,
    'has token': (r) => {
      try { return r.json().access_token !== undefined; } catch (e) { return false; }
    },
  });

  sleep(1); // evita loop tight; cadência simples
}
