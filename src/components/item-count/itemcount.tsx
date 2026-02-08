import React from "react";

interface ItemCountProps {
  count: number | string;
}

const ItemCount: React.FC<ItemCountProps> = ({ count }) => {
  return (
    <div className="inline-flex items-center gap-1 text-sm text-gray-600">
      <span className="font-medium text-gray-900">{count}</span>
      <span>results</span>
    </div>
  );
};

export default ItemCount;
