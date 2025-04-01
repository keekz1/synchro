const AuthLayout = ({
children
}:{
children:React.ReactNode
}) =>{
return(
    <div className="h-full flex items-center justify-center"
          style={{
        background: "radial-gradient(ellipse at top, #38bdf8, #1e40af)",
      }}
      >
        {children}
    </div>
);

}
export default AuthLayout;