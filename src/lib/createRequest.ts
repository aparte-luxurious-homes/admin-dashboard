import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "./api";

const { toast } = useToast();

export async function deleteRequest(
    url: string,
    successMessage: string
) {
    // setLoadedData(false);
    axiosInstance.delete(
        url,
    ).then(res => {
        toast({
            title: "Success",
            description: successMessage,
        })
    }).catch(err => {
        toast({
            variant: "destructive",
            title: "Error",
            description: 'Something went wrong, contact support',
            // action: (
            //   <ToastAction altText="Goto schedule to undo">Undo</ToastAction>
            // ),
        })
    })
    // setLoadedData(true);
}


export async function patchRequest(
    url: string,
    payload: any,
    successMessage?: string,
    doToast?: boolean,
    config?: any,
) {
    const postReq = await axiosInstance.patch(
        url,
        payload,
        config
    ).then(res => {
        if (doToast)
            toast({
                title: "Success",
                description: successMessage,
            })
        return res
    }).catch(err => {
        if (doToast)
            toast({
                variant: "destructive",
                title: "Error",
                description:'Something went wrong, contact support',
                // action: (
                //   <ToastAction altText="Goto schedule to undo">Undo</ToastAction>
                // ),
            })
        return err.response
    })
    return postReq
}


export async function putRequest(
    url: string,
    payload: any,
    successMessage?: string,
    doToast?: boolean,
    config?: any,
) {
    const putReq = axiosInstance.put(
        url,
        payload,
        config
    ).then(res => {
        if (doToast)
            toast({
                title: "Success",
                description: successMessage,
            })
        return res;
    }).catch(err => {
        if (doToast)
            toast({
                variant: "destructive",
                title: "Error",
                description: 'Something went wrong, contact support',
                // action: (
                //   <ToastAction altText="Goto schedule to undo">Undo</ToastAction>
                // ),
            })
        return err.response;
    })

    return putReq;
}


export async function postRequest(
    url: string,
    payload: any,
    successMessage: string,
    doToast: boolean,
    config: any,
) {
    const postReq = await axiosInstance.post(
        url,
        payload,
        config
    ).then(res => {
        if (doToast)
            toast({
                title: "Success",
                description: successMessage,
            })
        return res
    }).catch(err => {
        if (doToast)
            toast({
                variant: "destructive",
                title: "Error",
                description: 'Something went wrong, contact support',
                // action: (
                //   <ToastAction altText="Goto schedule to undo">Undo</ToastAction>
                // ),
            })
        return err.response
    })
    return postReq
}