import "./table.css";
import { Icon } from "@iconify/react";

interface TableSearchProps {
  searchTableFunc: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  value: string;
}

const TableSearch: React.FC<TableSearchProps> = ({ searchTableFunc, placeholder, value }) => (
  <div className="flex items-center gap-2 p-3 border border-[#D9D9D9] rounded-[15px] bg-white 
                  w-full sm:max-w-[250px] md:max-w-[300px] min-h-[48px]">
    <Icon icon="line-md:search" className="text-gray-500 text-lg flex-shrink-0" />
    <input
      type="search"
      placeholder={placeholder}
      onChange={searchTableFunc}
      className="outline-none w-full text-sm text-gray-700 placeholder-gray-400"
      value={value}
    />
  </div>
);

interface FilterSelectProps {
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  selectIcon?: string;
  selectName: string;
  selectValue: string;
  optionsDefaultValue?: string;
  optionsDefaultName?: string;
  optionsArray: { name: string; value: string }[];
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  onChange,
  selectIcon,
  selectName,
  selectValue,
  optionsDefaultValue,
  optionsDefaultName,
  optionsArray,
}) => (
  <div className="table_select_container">
    {selectIcon && <Icon icon={selectIcon} />}
    <select className="table_select" onChange={onChange} value={selectValue} name={selectName}>
      {optionsDefaultName && <option value={optionsDefaultValue}>{optionsDefaultName}</option>}
      {optionsArray?.map((option, i) => (
        <option key={i} value={option.value}>
          {option.name}
        </option>
      ))}
    </select>
  </div>
);

export { TableSearch, FilterSelect };
