import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import MobileDrawer from "./MobileDrawer";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminLayout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-[#1E293B]">
      {!isMobile && <AdminSidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
