import BreadCrumb from "@/src/components/breadcrumb";

const PaymentPayout = () => {
  return (
    <>
      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <BreadCrumb
          description=""
          active="Payment and Payout"
          link_one="/settings"
          link_one_name="Settings"
        />
        Coming Soon
      </div>
      ;
    </>
  );
};

export default PaymentPayout;
