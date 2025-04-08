import {Resend} from "resend"

const resend = new Resend(process.env.RESEND_API_KEY);


export const sendPasswordResetEmail = async (
    email:string,
    token: string,
)=>{

   const resetLink = `https://synchro-kappa.vercel.app/new-password?token=${token}`;
       // const resetLink =`https://synchro-kappa.vercel.app/auth/new-password?token=${token}`;

await resend.emails.send({
    from:"noreply@employeehubs.com",
    to:email,
    subject:"Reset your password",
    html:`<p>Click <a href="${resetLink}">here</a>to reset your password</p>`


});


};

export const sendVerificationEmail = async(
    email:string,
    token:string
    )=>{
        const confirmLink = `https://synchro-kappa.vercel.app/new-verification?token=${token}`;
       //const confirmLink =`https://synchro-kappa.vercel.app/auth/new-verification?token=${token}`;

await resend.emails.send({
    from:"noreply@employeehubs.com",
    to: email,
    subject:"Confirm your email",
    html:`<p>Click <a href="${confirmLink}">here</a>to confirm email</p>`



})

}