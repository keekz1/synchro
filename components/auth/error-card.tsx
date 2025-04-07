
import { CardWrapper } from "./card-wrapper";

import { FaExclamationTriangle } from "react-icons/fa";





export const ErrorCard = () =>{
    return(
        <CardWrapper
        headerLabel="Oops! Something went wrong"
        backButtonHref="/auth/login"
        backButtonLabel="Back to login"
        
        >
            <div className="w-full justify-center items-center">
            <FaExclamationTriangle className="text-destructive" />
            </div>

        </CardWrapper>
      
    )
}