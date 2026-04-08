
import React, { useMemo } from 'react';
import { Task, TaskStatus, Priority } from '../../types';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface LeadTimeChartProps {
  tasks: Task[];
}

const LeadTimeChart: React.FC<LeadTimeChartProps> = ({ tasks }) => {
  const chartData = useMemo(() => {
    const priorities = [Priority.URGENT, Priority.HIGH, Priority.MEDIUM, Priority.LOW];
    
    const avgLeadTimes = priorities.map(p => {
      const completedTasksWithTimes = tasks.filter(t => 
        t.priority === p && 
        t.status === TaskStatus.DONE && 
        t.completedAt
      );

      if (completedTasksWithTimes.length === 0) return 0;

      const totalDays = completedTasksWithTimes.reduce((acc, t) => {
        const start = new Date(t.createdAt).getTime();
        const end = new Date(t.completedAt!).getTime();
        const diffDays = Math.max(0.1, (end - start) / (1000 * 60 * 60 * 24));
        return acc + diffDays;
      }, 0);

      return parseFloat((totalDays / completedTasksWithTimes.length).toFixed(1));
    });

    return {
      labels: priorities,
      datasets: [
        {
          label: 'Avg. Days to Complete',
          data: avgLeadTimes,
          backgroundColor: priorities.map(p => {
             if (p === Priority.URGENT) return '#ef444499';
             if (p === Priority.HIGH) return '#f9731699';
             if (p === Priority.MEDIUM) return '#eab30899';
             return '#94a3b899';
          }),
          borderColor: priorities.map(p => {
            if (p === Priority.URGENT) return '#ef4444';
            if (p === Priority.HIGH) return '#f97316';
            if (p === Priority.MEDIUM) return '#eab308';
            return '#94a3b8';
          }),
          borderWidth: 2,
          borderRadius: 8,
          barThickness: 30,
        },
      ],
    };
  }, [tasks]);

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => `Average Speed: ${context.formattedValue} days`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10, weight: 'bold' as const },
          callback: (value: any) => `${value}d`,
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 10, weight: 'bold' as const },
        },
      },
    },
  };

  return (
    <div className="w-full h-48 mt-2">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default LeadTimeChart;
