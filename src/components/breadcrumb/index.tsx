import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "next/link";
import Stack from "@mui/material/Stack";
import React from "react";

interface BreadCrumbProps {
  description: string;
  active: string;
  link_one: string;
  link_one_name: string;
  link_two?: string;
  link_two_name?: string;
}

const BreadCrumb: React.FC<BreadCrumbProps> = ({
  description,
  active,
  link_one,
  link_one_name,
  link_two,
  link_two_name,
}) => {
  const breadcrumbs = [
    <Link key="1" href={link_one} className="text-[#667185] no-underline tracking-[-0.4px] font-ttfirs">
      {link_one_name}
    </Link>,
    link_two && link_two_name && (
      <Link key="2" href={link_two} className="text-[#667185] no-underline tracking-[-0.4px] font-ttfirs">
        {link_two_name}
      </Link>
    ),
    <div key="3" className="text-primary no-underline tracking-[-0.2px] font-bold">
      {active}
    </div>,
  ];

  return (
    <>
      <Stack spacing={2}>
        <Breadcrumbs separator="›" aria-label="breadcrumb" className="text-sm text-[#1C1B1F] mt-[1px] mb-1 font-ttfirs">
          {breadcrumbs}
        </Breadcrumbs>
      </Stack>
      <div className="text-left text-[#667185] text-sm font-ttfirs">{description}</div>
    </>
  );
};

export default BreadCrumb;
