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
