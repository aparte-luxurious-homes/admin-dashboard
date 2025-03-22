import { BookingBageProps, BookingStatus } from "../booking-mgt/types";
import { PropertyVerificationStatus, VerificationBageProps } from "../properties-mgt/types";
import useStyles from "./styles";
import classNames from "classnames";

interface BadgeProps {
  status: string | boolean;
}

const Badge: React.FC<BadgeProps> = ({ status }) => {
  const classes = useStyles({ status });

  const statusText =
    status === true ? "Verified" : 
    status === false ? "Rejected" : 
    status === "verified" ? "Verified" :
    status === "successful" ? "Successful" :
    status === "pending" ? "Pending" :
    status === "rejected" ? "Rejected" :
    "";

  return (
    <div className={classNames(classes.badgewrapper, classes.bg)}>
      {statusText}
    </div>
  );
};

export default Badge;


export const BookingBadge: React.FC<BookingBageProps> = ({ status, textColour='text-zinc-600', backgroundColour='bg-zinc-300', classNames }) => {
  const textHue = status === BookingStatus.CANCELLED 
      ? 'text-red-600' 
      : status === BookingStatus.COMPLETED
        ? 'text-zinc-600'
        : status === BookingStatus.PENDING
          ? 'text-[#FFAE00]'
          : status === BookingStatus.CONFIRMED
            ? 'text-[#028090]'
            : textColour;
  
  const bgHue = status === BookingStatus.CANCELLED 
    ? 'bg-red-200' 
    : status === BookingStatus.COMPLETED
      ? 'bg-zinc-300'
      : status === BookingStatus.PENDING
        ? 'bg-[#FFAE0033]'
        : status === BookingStatus.CONFIRMED
          ? 'bg-[#0280901A]'
          : backgroundColour;


  return(
    <p 
      className={`
        text-sm px-4 py-2 rounded-md capitalize ${textHue} ${bgHue}
        ${classNames}
      `}
    >
      {status?.toLowerCase()}
    </p>
  );
}

export const VerificationBadge: React.FC<VerificationBageProps> = ({ status, textColour='text-zinc-600', backgroundColour='bg-zinc-300', classNames }) => {
  const textHue = status === PropertyVerificationStatus.REJECTED 
      ? 'text-red-600'
      : status === PropertyVerificationStatus.PENDING
        ? 'text-[#FFAE00]'
        : status === PropertyVerificationStatus.VERIFIED
          ? 'text-[#028090]'
          : textColour;
  
  const bgHue = status === PropertyVerificationStatus.REJECTED
    ? 'bg-red-200'
      : status === PropertyVerificationStatus.PENDING
        ? 'bg-[#FFAE0033]'
        : status === PropertyVerificationStatus.VERIFIED
          ? 'bg-[#0280901A]'
          : backgroundColour;


  return(
    <p 
      className={`
        text-sm px-4 py-2 rounded-md capitalize ${textHue} ${bgHue}
        ${classNames}
      `}
    >
      {status?.toLowerCase()}
    </p>
  );
}