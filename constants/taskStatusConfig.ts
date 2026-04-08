import { TaskStatus } from '../types';

export const TASK_STATUS_CONFIG = {
  [TaskStatus.TODO]: {
    color: '#FFB347', // Lifewood Saffaron
    bg: 'bg-[#FFB347]',
    faint: 'bg-[#FFB347]/10',
    text: 'text-[#FFB347]',
    glow: 'bg-[#FFB347] shadow-[#FFB347]/50',
    label: 'In Queue',
    chart: '#FFB347'
  },
  [TaskStatus.IN_PROGRESS]: {
    color: '#046241', // Lifewood Castleton Green
    bg: 'bg-[#046241]',
    faint: 'bg-[#046241]/10',
    text: 'text-[#046241]',
    glow: 'bg-[#046241] shadow-[#046241]/50',
    label: 'Active Tasks',
    chart: '#046241'
  },
  [TaskStatus.DONE]: {
    color: '#10b981', // Emerald 500 (Success)
    bg: 'bg-emerald-500',
    faint: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    glow: 'bg-emerald-500 shadow-emerald-500/50',
    label: 'Completed',
    chart: '#10b981'
  },
};
