/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, Star, Trophy, Target, 
  Zap, Clock, Calendar, Medal, Crown,
  LucideIcon
} from 'lucide-react';
import { getAvailableRewards, getUserBalance } from '@/utils/database/actions';

interface StatBoxProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color: string;
  subValue?: string;
}

interface Milestone {
  points: number;
  label: string;
  achieved: boolean;
}

interface CircleCounterProps {
  points?: number;
  maxPoints?: number;
  label?: string;
  level?: number;
  streakDays?: number;
  achievements?: number;
  previousPoints?: number;
  rank?: string;
  dailyGoal?: number;
  dailyPoints?: number;
  weeklyPoints?: number;
  totalTime?: string;
  nextReward?: number;
  milestones?: Milestone[];
}

const RewardCount: React.FC<CircleCounterProps> = ({ 
  points = getUserBalance,
  maxPoints = 1000,
  label = "Points Earned",
  level = 1,
  streakDays = 0,
  achievements = 0,
  previousPoints = 0,
  rank = "Bronze",
  dailyGoal = 100,
  dailyPoints = 75,
  weeklyPoints = 450,
  totalTime = "24h 35m",
  nextReward = 100,
  milestones = [
    { points: 250, label: "Bronze", achieved: true },
    { points: 500, label: "Silver", achieved: true },
    { points: 750, label: "Gold", achieved: false },
    { points: 1000, label: "Platinum", achieved: false }
  ]
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showStats, setShowStats] = useState<"main" | "daily" | "weekly">("main");
  
  const percentage = (points as number / maxPoints as number) * 100;

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const pointsGained = (points as number) - (previousPoints as number);
  const levelProgress = ((points as number) % (maxPoints / 5)) / (maxPoints / 5) * 100;
  const dailyProgress = (dailyPoints / dailyGoal) * 100;
  const pointsToNextReward = nextReward - (points as number % nextReward);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [points]);

  const getTimeGradient = (): string => {
    const hour = new Date().getHours();
    if (hour < 6) return "from-indigo-500 to-purple-500";
    if (hour < 12) return "from-orange-400 to-pink-500";
    if (hour < 18) return "from-blue-400 to-emerald-500";
    return "from-purple-500 to-pink-500";
  };

  const StatBox: React.FC<StatBoxProps> = ({ icon: Icon, value, label, color, subValue }) => (
    <div className={`flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer relative overflow-hidden ${isAnimating ? 'scale-105' : ''}`}>
      <div className={`absolute top-0 left-0 h-1 w-full ${color}`} />
      <Icon className={`w-6 h-6 ${color} mb-2`} />
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {subValue && (
        <div className="text-xs text-gray-400 mt-1">{subValue}</div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl">
      {/* Rest of the component remains the same */}
      <div className="flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Crown className="w-6 h-6 text-yellow-500 mr-2" />
            <span className="text-lg font-semibold">{rank} Level {level}</span>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => setShowStats("daily")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${showStats === "daily" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Daily
            </button>
            <button 
              onClick={() => setShowStats("weekly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${showStats === "weekly" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4 mt-8 w-full">
          <StatBox 
            icon={Trophy} 
            value={level} 
            label="Level" 
            color="text-yellow-500"
            subValue={`${Math.round(levelProgress)}% to next`}
          />
          <StatBox 
            icon={Star} 
            value={streakDays} 
            label="Day Streak" 
            color="text-blue-500"
            subValue="Best: 30 days"
          />
          <StatBox 
            icon={Award} 
            value={achievements} 
            label="Achievements" 
            color="text-purple-500"
            subValue="2 pending"
          />
          <StatBox 
            icon={Target} 
            value={`${Math.round(dailyProgress)}%`} 
            label="Daily Goal" 
            color="text-green-500"
            subValue={`${dailyPoints}/${dailyGoal}`}
          />
        </div>

        {/* Additional stats row */}
        <div className="grid grid-cols-3 gap-4 mt-4 w-full">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-400 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-800">Total Time</div>
              <div className="text-xs text-gray-500">{totalTime}</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-800">Weekly Points</div>
              <div className="text-xs text-gray-500">{weeklyPoints} earned</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Zap className="w-5 h-5 text-gray-400 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-800">Next Milestone</div>
              <div className="text-xs text-gray-500">{milestones.find(m => !m.achieved)?.label}</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full mt-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Progress to next level</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{typeof points === 'number' ? `${points} points` : 'Loading...'}</span>
            <span>{maxPoints} points</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardCount;