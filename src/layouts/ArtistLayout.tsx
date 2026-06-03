import { Outlet } from "react-router-dom";
import AdminSidebar from "../artist/ArtistSidebar";
import AdminTopbar from "../artist/ArtistTopbar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex flex-col flex-1">
        <AdminTopbar />
        <main className="p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
