"use server";

import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { getUserByEmail, getUserById } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail , sendTwoFactorTokenEmail} from "@/lib/mail";
import { generateTwoFactorToken } from "@/lib/tokens";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { db } from "@/lib/db";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";


export const login = async (values: z.infer<typeof LoginSchema>) => {
  
  
const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields", success: undefined };
  }

  const { email, password , code} = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Email does not exist or it's linked to Google/Github", success: undefined };
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(existingUser.email);

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return { success: "Confirmation email sent!", error: undefined };
  }

if (existingUser.isTwoFactorEnabled && existingUser.email ){

if(code){

const twoFactorToken = await getTwoFactorTokenByEmail (
  existingUser.email
);
if (!twoFactorToken){

  return {error: "Invalid Code!"};
}


if (twoFactorToken.token !== code) {
  return { error: "Invalid Code!" };
}


const hasExpired = new Date(twoFactorToken.expires)<new Date ();

if (hasExpired){

  return {error: "Code expired!"};
}

await db.twoFactorToken.delete({
  where:{id:twoFactorToken.id}
});

const existingConfirmation = await getTwoFactorConfirmationByUserId(
  
  existingUser.id

);

if (existingConfirmation){

  await db.twoFactorConfirmation.delete({
    where:{id: existingConfirmation.id}
  });
}

await db.twoFactorConfirmation.create({

  data:{

    userId: existingUser.id,
  }
});

}
else{



  const twoFactorToken = await generateTwoFactorToken(existingUser.email)

  await sendTwoFactorTokenEmail(

    twoFactorToken.email,
    twoFactorToken.token,



  );

  return { twoFactor:true};
}
}

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });

    const user = await getUserByEmail(email);
    if (!user) {
      return { error: "User not found", success: undefined };
    }

    const userDetails = await getUserById(user.id);
    if (!userDetails) {
      return { error: "User details not found", success: undefined };
    }

    return {
      success: "Login successful!",
     // error: undefined,
      userId: userDetails.id,
      user: userDetails,
    };

  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid Credentials!", success: undefined };
        default:
          return { error: "Something went wrong", success: undefined };
      }
    }

    throw error;
  }
};
