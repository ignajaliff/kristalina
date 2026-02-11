import { Outlet } from "react-router-dom";
import SellerSidebar from "./SellerSidebar";

const SellerLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default SellerLayout;
