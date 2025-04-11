
//

interface ProtectedLayoutProps{

    children:React.ReactNode;
}


const ProtectedLayout = ({children}: ProtectedLayoutProps) =>{

return (

<div className="h-screen w-full flex flex-col gap-y-10 items-center justify-center bg-[radial-gradient(ellipse_at_top,_#38bdf8,_#1e40af)] from-sky-400 to-blue-800">

{children}

</div>
);
}
export default ProtectedLayout;