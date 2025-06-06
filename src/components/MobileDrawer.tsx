
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import AdminSidebar from "./AdminSidebar";

const MobileDrawer = () => {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" variant="ghost" className="text-slate-600 h-9 w-9 p-0 md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[80vh]">
        <div className="h-full overflow-hidden">
          <AdminSidebar />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileDrawer;
