
import React, { useMemo } from 'react';
import { Task, Employee, TaskStatus } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { TASK_STATUS_CONFIG } from '../../constants/taskStatusConfig';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MemberEfficiencyChartProps {
  tasks: Task[];
  employees: Employee[];
}

const MemberEfficiencyChart: React.FC<MemberEfficiencyChartProps> = ({ tasks, employees }) => {
  const chartData = useMemo(() => {
    // Only show top 8 members by task count to avoid clutter
    const memberStats = employees.map(emp => {
      const memberTasks = tasks.filter(t => t.assigneeId === emp.id || t.assigneeIds?.includes(emp.id));
      const active = memberTasks.filter(t => t.status !== TaskStatus.DONE).length;
      const completed = memberTasks.filter(t => t.status === TaskStatus.DONE).length;
      return {
        name: emp.name.split(' ')[0], // First name only
        active,
        completed,
        total: memberTasks.length,
      };
    }).sort((a, b) => b.total - a.total).slice(0, 8);

    return {
      labels: memberStats.map(m => m.name),
      datasets: [
        {
          label: 'Completed',
          data: memberStats.map(m => m.completed),
          backgroundColor: TASK_STATUS_CONFIG[TaskStatus.DONE].chart,
          borderRadius: 4,
        },
        {
          label: 'Active',
          data: memberStats.map(m => m.active),
          backgroundColor: TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].chart,
          borderRadius: 4,
        },
      ],
    };
  }, [tasks, employees]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          boxWidth: 8,
          boxHeight: 8,
          color: '#94a3b8',
          font: { size: 9, weight: 'bold' as const },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 10, weight: 'bold' as const },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          color: '#94a3b8',
          font: { size: 10 },
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[180px]">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default MemberEfficiencyChart;
