import CreatePropertyWizard from "@/src/components/properties-mgt/create-wizard/CreatePropertyWizard";
import RequireCompleteOwnerProfile from "@/src/components/shared/RequireCompleteOwnerProfile";

export default function CreateProperty(){
    return (
        <RequireCompleteOwnerProfile>
            <CreatePropertyWizard />
        </RequireCompleteOwnerProfile>
    );
};
