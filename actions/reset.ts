"use server";


import * as z from "zod";

import { ResetSchema } from "@/schemas";

import { getUserByEmail } from "@/data/user";

import { sendPasswordResetEmail } from "@/lib/mail";
import { generatePassowrdResetToken } from "@/lib/tokens";


export const reset = async (values: z.infer<typeof ResetSchema>) =>{

    const validatedFields = ResetSchema.safeParse(values);

    if (!validatedFields.success){
        return {error: "Invalid email !"};

    }

    const {email} = validatedFields.data;

    const existingUser = await getUserByEmail(email);

    if(!existingUser){
        return{error: "Email not found! "};

    }


const passwordResetToken = await generatePassowrdResetToken(email);

await sendPasswordResetEmail(
passwordResetToken.email,
passwordResetToken.token,


);



    return {success: "Reset Email sent!"};

}
