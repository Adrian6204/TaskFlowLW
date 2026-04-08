
import React from 'react';
import { Task, Employee } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
);

interface TasksPerEmployeeBarChartProps {
  tasks: Task[];
  employees: Employee[];
}

const TasksPerEmployeeBarChart: React.FC<TasksPerEmployeeBarChartProps> = ({ tasks, employees }) => {
  const employeeTaskCounts = employees.map(employee => ({
    name: employee.name,
    avatarUrl: employee.avatarUrl,
    taskCount: tasks.filter(task => task.assigneeId === employee.id).length,
  }));

  const data = {
    labels: employeeTaskCounts.map(e => e.name),
    datasets: [
      {
        label: 'Tasks',
        data: employeeTaskCounts.map(e => e.taskCount),
        backgroundColor: '#6366f1',
        borderRadius: 8,
        barThickness: 20,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        cornerRadius: 8,
        padding: 10,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: 'bold' as const },
        },
      },
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart' as const,
    },
  };

  return (
    <div className="w-full h-64">
      <Bar data={data} options={options} />
    </div>
  );
};

export default TasksPerEmployeeBarChart;

