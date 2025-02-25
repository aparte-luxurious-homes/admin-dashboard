import { Oval } from 'react-loader-spinner'



export default function Spinner({
    width,
    height,
    color,
}: { 
    width?: string
    height?: string 
    color?: string
}) {
    return(
        <Oval
            visible={true}
            height={height??"30"}
            width={width??"40"}
            color={color??"#124452"}
            ariaLabel="tail-spin-loading"
            wrapperStyle={{}}
            wrapperClass=""
        />
    );
}