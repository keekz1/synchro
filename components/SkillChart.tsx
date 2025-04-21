"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors,TooltipItem 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors
);

export type SkillChartDataType = {
  skill: string;
  count: number;
  type?: 'popular' | 'rare';
};

interface SkillChartProps {
  data: SkillChartDataType[];
}

export default function SkillChart({ data }: SkillChartProps) {
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  const chartData = {
    labels: sortedData.map(item => item.skill),
    datasets: [{
      label: 'Number of Peers with Skill',
      data: sortedData.map(item => item.count),
      backgroundColor: sortedData.map(item => 
        item.type === 'rare' ? 'rgba(16, 185, 129, 0.7)' : 'rgba(59, 130, 246, 0.7)'
      ),
      borderColor: sortedData.map(item => 
        item.type === 'rare' ? 'rgba(16, 185, 129, 1)' : 'rgba(59, 130, 246, 1)'
      ),
      borderWidth: 1,
      barThickness: 20, 
      categoryPercentage: 0.8, 
      barPercentage: 0.9
    }]
  };

  const options = {
    indexAxis: 'x' as const, 
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
        },
        title: {
          display: true,
          text: 'Number of Peers with This Skill'
        }
      },
      x: {
        ticks: {
          autoSkip: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
            label: (context: TooltipItem<'bar'>) => {
                return `${context.label}: ${context.raw} peers`;
              }
              
        }
      }
    }
  };

  return <Bar options={options} data={chartData} />;
}