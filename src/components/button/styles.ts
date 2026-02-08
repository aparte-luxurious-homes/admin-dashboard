import { makeStyles } from "@mui/styles";

export default makeStyles(() => ({
  button: {
    outline: 0,
    borderRadius: 8,
    cursor: "pointer",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 16,
    paddingRight: 16,
    textTransform: "none",
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: -0.1,
    boxSizing: "border-box",
    display: "flex",
    gap: 5,
    alignItems: "center",
    justifyContent: "center"
  },
  buttonsm: {
    width: 142,
    height: 39
  },
  buttonmd: {
    width: 150,
    height: 45
  },
  buttonlg: {
    width: 180,
    height: 54
  },
  buttonfluid: {
    height: 39
  },
  buttonfull: {
    width: "100%",
    height: 54
  },
  primary: {
    backgroundColor: "#028090",
    border: `0px solid #028090`,
    color: "#FFFFFF"
  },
  secondary: {
    backgroundColor: "#028090",
    border: `0px solid #028090`,
    color: "#FFFFFF"
  },
  primaryOutline: {
    backgroundColor: "white",
    border: `1.5px solid #028090`,
    color: "#028090"
  },
  secondaryOutline: {
    backgroundColor: "white",
    border: `1.5px solid #D9D9D9`
  },
  deleteOutline: {
    backgroundColor: "white",
    border: "1.5px solid #CB1A14"
  },
  warning: {
    backgroundColor: "#FF0000",
    border: `0px solid #FF0000`
  },
  warningOutline: {
    backgroundColor: "#FF0000",
    border: `1.5px solid #FF0000`
  },
  successOutline: {
    backgroundColor: "white",
    border: "1.5px solid #036B26"
  },
  dangerOutline: {
    backgroundColor: "white",
    border: "1.5px solid #CB1A14"
  },
  default: {
    backgroundColor: "black",
    border: "1.5px solid black"
  },
  success: {
    backgroundColor: "#036B26",
    border: "1.5px solid #036B26"
  },
  btnsuccess: {
    color: "#036B26"
  },
  danger: {
    backgroundColor: "#CB1A14",
    border: "0px solid #CB1A14",
    color: "#FFFFFF"
  },
  btnwhite: {
    color: "white"
  },
  btnsecondary: {
    color: "#344054"
  },
  btnblack: {
    color: "black"
  },
  btndanger: {
    color: "#CB1A14"
  },
  btnfontprimary: {
    color: "#028090"
  },
  btnfontsecondary: {
    color: "#D9D9D9"
  },
  loader: {
    height: 20
  }
}));
