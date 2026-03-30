import { TaskFlowStatusResponse } from '../types';

const STATUS_URL = 'https://fuubnbfhaommfooifecz.supabase.co/functions/v1/taskflow-status';
const STATUS_TOKEN = import.meta.env.VITE_TASKFLOW_STATUS_TOKEN as string;

export async function fetchTaskFlowStatus(): Promise<TaskFlowStatusResponse> {
  const res = await fetch(STATUS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STATUS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error(`TaskFlow status fetch failed: ${res.status}`);
  }

  return res.json() as Promise<TaskFlowStatusResponse>;
}
