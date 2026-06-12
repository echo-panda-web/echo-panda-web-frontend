import { Outlet } from "react-router-dom";
import AdminSidebar from "../artist/ArtistSidebar";
import AdminTopbar from "../artist/ArtistTopbar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-[#0a0a0c]">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-[#0a0a0c]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
