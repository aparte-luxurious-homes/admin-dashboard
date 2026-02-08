import React from "react";
import { Icon } from "@iconify/react";

type CardProps = {
  title: string;
  amount: string | number;
  percentage: number | string;
  isIncrease: boolean;
};

const StatsCard: React.FC<CardProps> = ({ title, amount, percentage, isIncrease }) => {
  return (
    <div
      className="transition-all w-full duration-300 border border-[#D9D9D9] rounded-[15px] 
                 p-4 sm:p-5 bg-white hover:bg-[#028090] hover:text-white"
    >
      <p className="text-sm font-medium">{title}</p>
      <h2 className="text-xl sm:text-2xl mt-4 sm:mt-[27px] font-bold">{amount}</h2>
      <div className="flex items-center gap-1 mt-4 sm:mt-[27px] text-xs sm:text-sm">
        <Icon
          icon={isIncrease ? "mdi:arrow-up" : "mdi:arrow-down"}
          className={isIncrease ? "text-green-500" : "text-red-500"}
        />
        <span>{percentage}% vs Last Month</span>
      </div>
    </div>
  );
};

export default StatsCard;
