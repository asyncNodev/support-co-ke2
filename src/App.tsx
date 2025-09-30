import { BrowserRouter, Route, Routes } from "react-router-dom";

import { DefaultProviders } from "./components/providers/default.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import BrowseProducts from "./pages/BrowseProducts.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import AdminDashboard from "./pages/admin/Dashboard.tsx";
import VendorDashboard from "./pages/vendor/Dashboard.tsx";
import BuyerDashboard from "./pages/buyer/Dashboard.tsx";
import RFQDetails from "./pages/buyer/RFQDetails.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/browse" element={<BrowseProducts />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/buyer" element={<BuyerDashboard />} />
          <Route path="/buyer/rfq/:id" element={<RFQDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}