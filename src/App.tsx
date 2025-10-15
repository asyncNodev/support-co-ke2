import { BrowserRouter, Route, Routes } from "react-router-dom";

import { DefaultProviders } from "./components/providers/default.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProductSearch from "./pages/ProductSearch.tsx";
import BrowseProducts from "./pages/BrowseProducts.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import Register from "./pages/Register.tsx";
import AdminDashboard from "./pages/admin/Dashboard.tsx";
import AdminUsersPage from "./pages/admin/UsersPage.tsx";
import VendorDashboard from "./pages/vendor/Dashboard.tsx";
import BuyerDashboard from "./pages/buyer/Dashboard.tsx";
import RFQDetails from "./pages/buyer/RFQDetails.tsx";
import NotificationSettingsPage from "./pages/NotificationSettingsPage.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/product-search" element={<ProductSearch />} />
          <Route path="/browse" element={<BrowseProducts />} />
          <Route path="/product/:categorySlug/:productSlug" element={<ProductDetail />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/buyer" element={<BuyerDashboard />} />
          <Route path="/buyer/rfq/:id" element={<RFQDetails />} />
          <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}