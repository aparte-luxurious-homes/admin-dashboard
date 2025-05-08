import React from "react";

interface ItemCountProps {
  count: number | string;
}

const ItemCount: React.FC<ItemCountProps> = ({ count }) => {
  return (
    <div className="bg-[#124452] text-white text-sm px-3 py-2 rounded-md">
      {count}
    </div>
  );
};

export default ItemCount;
