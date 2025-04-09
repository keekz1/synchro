import {Resend} from "resend"

const resend = new Resend(process.env.RESEND_API_KEY);



export const sendTwoFactorTokenEmail =async (
email:string,
token:string,


)=>{




await resend.emails.send({

    from:"noreply@wesynchro.com",
    to :email,
    subject:"2FA Code",
    html:`<p> Your 2FA code:${token} </p>`


});

//    const confirmLink=`https://www.wesynchro.com/auth/new-password?token=${token}`

}



export const sendPasswordResetEmail = async (
    email:string,
    token: string,
)=>{

   const resetLink = `https://www.wesynchro.com/auth/new-password?token=${token}`;
       // const resetLink =`https://synchro-kappa.vercel.app/auth/new-password?token=${token}`;

await resend.emails.send({
    from:"noreply@wesynchro.com",
    to:email,
    subject:"Reset your password",
    html:`<p>Click <a href="${resetLink}">here</a>to reset your password</p>`


});


};

export const sendVerificationEmail = async(
    email:string,
    token:string
    )=>{
        const confirmLink = `https://www.wesynchro.com/auth/new-verification?token=${token}`;
       //const confirmLink =`https://synchro-kappa.vercel.app/auth/new-verification?token=${token}`;

await resend.emails.send({
    from:"noreply@wesynchro.com",
    to: email,
    subject:"Confirm your email",
    html:`<p>Click <a href="${confirmLink}">here</a>to confirm email</p>`



})

}