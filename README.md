- Node.js v18+
- npm v9+ or yarn 1.22+
 
  prisma
   datasource db {
     provider = "mongodb"
     url      = env("DATABASE_URL")   " 
   }
  

## Tools  
 
- Language: TypeScript
- Framework: Next.js  
-NextAuth
- Runtime Environment: Node.js
- Package Manager: npm


    ## Installation
   Clone repository:
    
  - git clone  
   -cd synchro

      check requirements.txt to see the   libraries needed to run this project 


   Environment Variables
  AUTH_SECRET important as the web wont authenticate you without it, since im using session: { strategy: "jwt" }  ,
   NextAuth will look for AUTH_SECRET in the environment variables to use for signing and verifying JWT tokens
   
   to run and be able to register and login users through linked Social accounts;
   you will need to add  :
