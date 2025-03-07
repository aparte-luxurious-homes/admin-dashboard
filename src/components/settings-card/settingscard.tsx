import Link from "next/link";
import { ReactNode } from "react";

interface SettingCardProps {
  title: string;
  description: string;
  route: string;
  icon: ReactNode; 
}

const SettingCard: React.FC<SettingCardProps> = ({ title, description, route, icon }) => {
  return (
    <Link href={route} passHref>
      <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition">
        <div className="text-3xl">{icon}</div>
        <h2 className="text-lg font-semibold mt-6">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
};

export default SettingCard;
