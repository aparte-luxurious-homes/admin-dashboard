import React, { useState } from "react";

const Filter = () => {
  const [statusFilter, setStatusFilter] = useState("");
  return (
    <div className="w-full sm:w-auto sm:min-w-[180px]">
      <select
        value={statusFilter}
        // onChange={(e) => table.setFilter("status", e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
      >
        <option value="">Filter</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
    </div>
  );
};

export default Filter;
