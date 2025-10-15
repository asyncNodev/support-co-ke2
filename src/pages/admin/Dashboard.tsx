import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { Separator } from "@/components/ui/separator";
import CatalogScanner from "@/components/CatalogScanner.tsx";
import { BulkProductUpload } from "@/pages/admin/_components/BulkProductUpload.tsx";
import { EditProductDialog } from "@/pages/admin/_components/EditProductDialog";
import { toast } from "sonner";
import { Plus, Trash2, Users, Package, Tag, Settings, Upload, Edit, Globe, PlayCircle, CheckCircle, AlertCircle, ScanLine, BarChart3, TrendingUp, DollarSign, ShoppingCart, XCircle } from "lucide-react";
import { useAction } from "convex/react";

export default function AdminDashboard() {
  const products = useQuery(api.products.getProducts, {});
  const categories = useQuery(api.categories.getCategories, {});
  const users = useQuery(api.users.getAllUsers, {});
  const allRfqs = useQuery(api.rfqs.getAllRFQsForAdmin, {});
  const allQuotations = useQuery(api.vendorQuotations.getAllQuotationsForAdmin, {});
  const marketIntelligence = useQuery(api.analytics.getMarketIntelligence, {});

  const createProduct = useMutation(api.products.createProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const createCategory = useMutation(api.categories.createCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const verifyUser = useMutation(api.users.verifyUser);
  const findDuplicates = useQuery(api.products.findDuplicateProducts);
  const removeDuplicates = useMutation(api.products.removeDuplicateProducts);
  const generateSlugs = useMutation(api.products.generateAllSlugs);
  const assignCategoriesToVendor = useMutation(api.users.assignCategoriesToVendor);

  const verifyUserMutation = useMutation(api.users.verifyUser);
  const assignCategories = useMutation(api.users.assignCategoriesToVendor);
  const toggleStatus = useMutation(api.users.toggleUserStatus);
  const deleteUserMutation = useMutation(api.users.deleteUser);

  // Site Settings
  const updateSiteSettings = useMutation(api.siteSettings.updateSiteSettings);
  const siteSettings = useQuery(api.siteSettings.getSiteSettings, {});

  const approveUser = useMutation(api.users.approveUser);
  const rejectUser = useMutation(api.users.rejectUser);
  const pendingUsers = useQuery(api.users.getPendingUsers, {});

  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewDetailsUserId, setViewDetailsUserId] = useState<Id<"users"> | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [catalogScannerOpen, setCatalogScannerOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<Id<"products"> | null>(null);
  const [editProductOpen, setEditProductOpen] = useState(false);
  
  // Browse.ai Integration State
  const [browseAiRobotId, setBrowseAiRobotId] = useState("");
  const [browseAiTaskId, setBrowseAiTaskId] = useState("");
  const [browseAiCategoryId, setBrowseAiCategoryId] = useState("");
  const [browseAiVendorId, setBrowseAiVendorId] = useState("");
  const [browseAiProductId, setBrowseAiProductId] = useState("");
  const [browseAiProductListName, setBrowseAiProductListName] = useState("products");
  const [browseAiQuotationListName, setBrowseAiQuotationListName] = useState("quotations");
  const [taskStatus, setTaskStatus] = useState<string | null>(null);

  // Site Settings State
  const [settingsForm, setSettingsForm] = useState({
    logoUrl: "",
    logoSize: "h-28",
    siteName: "",
    tagline: "",
    hospitalStep1: "",
    hospitalStep2: "",
    hospitalStep3: "",
    hospitalStep4: "",
    vendorStep1: "",
    vendorStep2: "",
    vendorStep3: "",
    vendorStep4: "",
    workflowTextSize: "text-sm",
    workflowBgColor: "bg-blue-50",
  });

  // Initialize settings form when siteSettings loads
  if (siteSettings && settingsForm.logoUrl === "") {
    setSettingsForm({
      logoUrl: siteSettings.logoUrl || "",
      logoSize: siteSettings.logoSize || "h-28",
      siteName: siteSettings.siteName || "",
      tagline: siteSettings.tagline || "",
      hospitalStep1: siteSettings.hospitalStep1 || "",
      hospitalStep2: siteSettings.hospitalStep2 || "",
      hospitalStep3: siteSettings.hospitalStep3 || "",
      hospitalStep4: siteSettings.hospitalStep4 || "",
      vendorStep1: siteSettings.vendorStep1 || "",
      vendorStep2: siteSettings.vendorStep2 || "",
      vendorStep3: siteSettings.vendorStep3 || "",
      vendorStep4: siteSettings.vendorStep4 || "",
      workflowTextSize: siteSettings.workflowTextSize || "text-sm",
      workflowBgColor: siteSettings.workflowBgColor || "bg-blue-50",
    });
  }

  const triggerRobot = useAction(api.browseAi.integration.triggerRobot);
  const getTaskStatus = useAction(api.browseAi.integration.getTaskStatus);
  const syncProducts = useAction(api.browseAi.integration.syncProducts);
  const syncVendorQuotations = useAction(api.browseAi.integration.syncVendorQuotations);
  
  const userDetails = useQuery(
    api.users.getUserDetails,
    viewDetailsUserId ? { userId: viewDetailsUserId } : "skip"
  );

  const [selectedVendor, setSelectedVendor] = useState<Id<"users"> | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Id<"categories">[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    categoryId: "",
    description: "",
    image: "",
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createProduct({
        name: newProduct.name,
        categoryId: newProduct.categoryId as Id<"categories">,
        description: newProduct.description,
        image: newProduct.image || undefined,
      });
      toast.success("Product created successfully");
      setAddProductOpen(false);
      setNewProduct({ name: "", categoryId: "", description: "", image: "" });
    } catch (error) {
      toast.error("Failed to create product");
    }
  };

  const handleDeleteProduct = async (productId: Id<"products">) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct({ productId });
        toast.success("Product deleted successfully");
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      toast.error("Please enter a category name");
      return;
    }
    try {
      await createCategory(newCategory);
      toast.success("Category created successfully");
      setAddCategoryOpen(false);
      setNewCategory({ name: "", description: "" });
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  const handleDeleteCategory = async (categoryId: Id<"categories">) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory({ categoryId });
        toast.success("Category deleted successfully");
      } catch (error) {
        toast.error("Failed to delete category");
      }
    }
  };

  const handleVerifyUser = async (userId: Id<"users">) => {
    try {
      await verifyUser({ userId });
      toast.success("User verified successfully");
    } catch (error) {
      toast.error("Failed to verify user");
    }
  };

  const handleOpenAssignCategories = (vendorId: Id<"users">) => {
    console.log("Opening assign categories for vendor:", vendorId);
    const vendor = users?.find((u) => u._id === vendorId);
    console.log("Found vendor:", vendor);
    setSelectedVendor(vendorId);
    setSelectedCategories(vendor?.categories || []);
    setAssignDialogOpen(true);
    console.log("Dialog should be open now");
  };

  const handleToggleCategory = (categoryId: Id<"categories">) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSaveCategories = async () => {
    if (!selectedVendor) return;
    try {
      await assignCategories({
        vendorId: selectedVendor,
        categories: selectedCategories,
      });
      toast.success("Categories assigned successfully");
      setAssignDialogOpen(false);
    } catch (error) {
      toast.error("Failed to assign categories");
    }
  };

  const handleViewDetails = (userId: Id<"users">) => {
    setViewDetailsUserId(userId);
    setViewDetailsOpen(true);
  };

  const handleDeleteUser = async (userId: Id<"users">) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUserMutation({ userId });
        toast.success("User deleted successfully");
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  const handleToggleStatus = async (userId: Id<"users">) => {
    try {
      await toggleStatus({ userId });
      toast.success("User status updated successfully");
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  // Browse.ai Integration Handlers
  const handleTriggerRobot = async () => {
    if (!browseAiRobotId) {
      toast.error("Please enter a robot ID");
      return;
    }
    try {
      const result = await triggerRobot({ robotId: browseAiRobotId });
      setBrowseAiTaskId(result.taskId);
      toast.success(`Robot triggered successfully. Task ID: ${result.taskId}`);
    } catch (error) {
      toast.error("Failed to trigger robot");
    }
  };

  const handleCheckTaskStatus = async () => {
    if (!browseAiRobotId || !browseAiTaskId) {
      toast.error("Please enter robot ID and task ID");
      return;
    }
    try {
      const result = await getTaskStatus({
        robotId: browseAiRobotId,
        taskId: browseAiTaskId,
      });
      setTaskStatus(result.status);
      toast.success(`Task status: ${result.status}`);
    } catch (error) {
      toast.error("Failed to get task status");
    }
  };

  const handleSyncProducts = async () => {
    if (!browseAiRobotId || !browseAiTaskId || !browseAiCategoryId) {
      toast.error("Please enter robot ID, task ID, and category");
      return;
    }
    try {
      const result = await syncProducts({
        robotId: browseAiRobotId,
        taskId: browseAiTaskId,
        categoryId: browseAiCategoryId as Id<"categories">,
        listName: browseAiProductListName,
      });
      toast.success(`Synced ${result.syncedCount} products successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sync products";
      toast.error(errorMessage);
    }
  };

  const handleSyncQuotations = async () => {
    if (!browseAiRobotId || !browseAiTaskId || !browseAiVendorId || !browseAiProductId) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const result = await syncVendorQuotations({
        robotId: browseAiRobotId,
        taskId: browseAiTaskId,
        vendorId: browseAiVendorId as Id<"users">,
        productId: browseAiProductId as Id<"products">,
        listName: browseAiQuotationListName,
      });
      toast.success(`Synced ${result.syncedCount} quotations from Browse.ai`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sync quotations";
      toast.error(errorMessage);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSiteSettings({ settings: settingsForm });
      toast.success("Site settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleApproveUser = async (userId: Id<"users">) => {
    try {
      await approveUser({ userId });
      toast.success("User approved successfully!");
    } catch (error) {
      toast.error("Failed to approve user");
    }
  };

  const handleRejectUser = async (userId: Id<"users">) => {
    try {
      await rejectUser({ userId });
      toast.success("User rejected");
    } catch (error) {
      toast.error("Failed to reject user");
    }
  };

  const handleRemoveDuplicates = async () => {
    try {
      const result = await removeDuplicates({});
      toast.success(`Removed ${result.removedCount} duplicate products`);
    } catch (error) {
      toast.error("Failed to remove duplicates");
    }
  };

  const handleGenerateSlugs = async () => {
    try {
      const result = await generateSlugs({});
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to generate slugs");
    }
  };

  const vendors = users?.filter((u) => u.role === "vendor") || [];
  const buyers = users?.filter((u) => u.role === "buyer") || [];

  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="size-6" />
              Admin Dashboard
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendors.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buyers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Tag className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b">
          <div className="flex overflow-x-auto gap-1 pb-px">
            {["users", "products", "categories", "rfqs", "market-intel", "site-settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {tab.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeTab === "users" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Vendors</CardTitle>
                  <CardDescription>Manage vendor accounts and category assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vendors.map((vendor) => (
                      <div key={vendor._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-sm text-muted-foreground">{vendor.email}</p>
                          {vendor.companyName && (
                            <p className="text-sm text-muted-foreground">{vendor.companyName}</p>
                          )}
                          {vendor.phone && (
                            <p className="text-sm text-muted-foreground">Phone: {vendor.phone}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant={vendor.verified ? "default" : "destructive"}>
                              {vendor.verified ? "Verified" : "Unverified"}
                            </Badge>
                            {vendor.categories && vendor.categories.length > 0 && (
                              <Badge variant="outline">
                                {vendor.categories.length} {vendor.categories.length === 1 ? "Category" : "Categories"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(vendor._id)}
                          >
                            View Details
                          </Button>
                          {!vendor.verified && (
                            <Button
                              size="sm"
                              onClick={() => handleVerifyUser(vendor._id)}
                            >
                              Verify
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAssignCategories(vendor._id)}
                          >
                            Assign Categories
                          </Button>
                          <Button
                            size="sm"
                            variant={vendor.verified ? "outline" : "default"}
                            onClick={() => handleToggleStatus(vendor._id)}
                          >
                            {vendor.verified ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(vendor._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Buyers</CardTitle>
                  <CardDescription>Manage buyer accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {buyers.map((buyer) => (
                      <div key={buyer._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{buyer.name}</p>
                          <p className="text-sm text-muted-foreground">{buyer.email}</p>
                          {buyer.companyName && (
                            <p className="text-sm text-muted-foreground">{buyer.companyName}</p>
                          )}
                          {buyer.phone && (
                            <p className="text-sm text-muted-foreground">Phone: {buyer.phone}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant={buyer.verified ? "default" : "secondary"}>
                              {buyer.verified ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(buyer._id)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant={buyer.verified ? "outline" : "default"}
                            onClick={() => handleToggleStatus(buyer._id)}
                          >
                            {buyer.verified ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(buyer._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "products" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>Manage medical products</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
                      <Upload className="size-4 mr-2" />
                      Bulk Upload
                    </Button>
                    <Button variant="outline" onClick={() => setCatalogScannerOpen(true)}>
                      <ScanLine className="size-4 mr-2" />
                      Scan Catalog
                    </Button>
                    <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="size-4 mr-2" />
                          Add Product
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Product</DialogTitle>
                          <DialogDescription>Enter product details</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                              placeholder="Hospital Bed"
                            />
                          </div>
                          <div>
                            <Label>Category *</Label>
                            <Select
                              value={newProduct.categoryId}
                              onValueChange={(value) => setNewProduct({ ...newProduct, categoryId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.map((cat) => (
                                  <SelectItem key={cat._id} value={cat._id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={newProduct.description}
                              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                              placeholder="Product description"
                            />
                          </div>
                          <PhotoUpload
                            value={newProduct.image}
                            onChange={(url) => setNewProduct({ ...newProduct, image: url })}
                            label="Product Photo"
                            uploadUrlMutation={api.products.generateUploadUrl}
                          />
                          <Button onClick={handleCreateProduct} className="w-full">
                            Create Product
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {products?.map((product) => (
                    <Card key={product._id}>
                      <CardHeader>
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-md mb-2"
                          />
                        )}
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <CardDescription>
                          {categories?.find((c) => c._id === product.categoryId)?.name || "Uncategorized"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditProductId(product._id);
                            setEditProductOpen(true);
                          }}
                        >
                          <Edit className="size-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProduct(product._id)}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {findDuplicates && findDuplicates.totalDuplicates > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div className="p-4 border rounded-lg bg-destructive/10">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <AlertCircle className="size-5 text-destructive" />
                        Duplicate Products Found ({findDuplicates.totalDuplicates})
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        The following products have duplicates. Click below to remove duplicates and keep only the oldest version of each.
                      </p>
                      <div className="max-h-48 overflow-y-auto mb-4 space-y-2">
                        {findDuplicates.duplicates.map((dup, idx) => (
                          <div key={idx} className="text-sm border-l-2 border-destructive pl-3 py-1">
                            <span className="font-medium">{dup.name}</span>
                            <span className="text-muted-foreground"> - {dup.count} copies found</span>
                          </div>
                        ))}
                      </div>
                      <Button variant="destructive" onClick={handleRemoveDuplicates}>
                        <Trash2 className="size-4 mr-2" />
                        Remove All Duplicates
                      </Button>
                    </div>
                  </>
                )}
                
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="text-sm font-semibold mb-2">Generate SEO Slugs</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Generate URL-friendly slugs for all products and categories that don't have them yet.
                  </p>
                  <Button onClick={handleGenerateSlugs} size="sm">
                    Generate Slugs
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "categories" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>Manage product categories</CardDescription>
                  </div>
                  <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="size-4 mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>Enter category details</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            placeholder="Patient Care Equipment"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newCategory.description}
                            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                            placeholder="Category description"
                          />
                        </div>
                        <Button onClick={handleCreateCategory} className="w-full">
                          Create Category
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categories?.map((category) => (
                    <Card key={category._id}>
                      <CardHeader>
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        {category.description && (
                          <CardDescription>{category.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCategory(category._id)}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "rfqs" && (
            <Card>
              <CardHeader>
                <CardTitle>All RFQs</CardTitle>
                <CardDescription>View all Request for Quotations submitted by buyers and guests</CardDescription>
              </CardHeader>
              <CardContent>
                {!allRfqs ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
                    ))}
                  </div>
                ) : allRfqs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No RFQs found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allRfqs.map((rfq) => (
                      <Card key={rfq._id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                RFQ #{rfq._id.slice(-8)}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {new Date(rfq.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                rfq.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                rfq.status === "quoted" ? "bg-blue-100 text-blue-800" :
                                "bg-green-100 text-green-800"
                              }`}>
                                {rfq.status}
                              </span>
                              {rfq.isGuest && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  Guest
                                </span>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                          {/* Buyer Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Submitted By</p>
                              {rfq.isGuest ? (
                                <div>
                                  <p className="text-sm font-medium">{rfq.guestName || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">{rfq.guestCompanyName || "N/A"}</p>
                                </div>
                              ) : rfq.buyer ? (
                                <div>
                                  <p className="text-sm font-medium">{rfq.buyer.name || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">{rfq.buyer.companyName || "N/A"}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Unknown</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Contact</p>
                              {rfq.isGuest ? (
                                <div>
                                  <p className="text-sm">{rfq.guestEmail || "N/A"}</p>
                                  <p className="text-xs text-muted-foreground">{rfq.guestPhone || "N/A"}</p>
                                </div>
                              ) : rfq.buyer ? (
                                <div>
                                  <p className="text-sm">{rfq.buyer.email || "N/A"}</p>
                                  <p className="text-xs text-muted-foreground">{rfq.buyer.phone || "N/A"}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">N/A</p>
                              )}
                            </div>
                          </div>

                          {/* Products Requested */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Products Requested</p>
                            <div className="space-y-2">
                              {rfq.items?.map((item) => (
                                <div key={item._id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                                  {item.product?.image && (
                                    <img
                                      src={item.product.image}
                                      alt={item.product.name || "Product"}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{item.product?.name || "Unknown Product"}</p>
                                    <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Sent Quotations */}
                          {rfq.sentQuotations && rfq.sentQuotations.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Quotations Received ({rfq.sentQuotations.length})
                              </p>
                              <div className="space-y-3">
                                {rfq.sentQuotations.map((quote) => (
                                  <Card key={quote._id} className="bg-muted/30">
                                    <CardContent className="p-3 space-y-2">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">{quote.vendor?.name || "Unknown Vendor"}</p>
                                          <p className="text-xs text-muted-foreground">{quote.vendor?.companyName || "N/A"}</p>
                                          {quote.vendor && quote.vendor.totalRatings > 0 && (
                                            <div className="flex items-center gap-1 mt-1">
                                              <span className="text-xs">⭐ {quote.vendor.averageRating.toFixed(1)}</span>
                                              <span className="text-xs text-muted-foreground">({quote.vendor.totalRatings} ratings)</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            quote.quotationType === "pre-filled" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                                          }`}>
                                            {quote.quotationType}
                                          </span>
                                          {quote.chosen && (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                              Chosen
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-muted-foreground">Price:</span>{" "}
                                          <span className="font-medium">KSh {quote.price?.toLocaleString() || "N/A"}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Quantity:</span>{" "}
                                          <span className="font-medium">{quote.quantity || "N/A"}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Payment:</span>{" "}
                                          <span className="font-medium capitalize">{quote.paymentTerms || "N/A"}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Delivery:</span>{" "}
                                          <span className="font-medium">{quote.deliveryTime || "N/A"}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Warranty:</span>{" "}
                                          <span className="font-medium">{quote.warrantyPeriod || "N/A"}</span>
                                        </div>
                                        {quote.brand && (
                                          <div>
                                            <span className="text-muted-foreground">Brand:</span>{" "}
                                            <span className="font-medium">{quote.brand}</span>
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Contact: {quote.vendor?.email || "N/A"}
                                      </p>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Delivery & Status */}
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Expected Delivery</p>
                              <p className="text-sm">{rfq.expectedDeliveryTime || "Not specified"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Quotations</p>
                              <p className="text-sm font-medium">{rfq.quotationCount || 0} received</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "market-intel" && (
            <Card>
              <CardHeader>
                <CardTitle>Market Intelligence Report</CardTitle>
                <CardDescription>Comprehensive market trends, demand analysis, and pricing insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overview Statistics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Platform Overview</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total RFQs</CardDescription>
                        <CardTitle className="text-3xl">{marketIntelligence?.overview.totalRFQs || 0}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          {marketIntelligence?.overview.recentRFQs || 0} in last 30 days
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Orders</CardDescription>
                        <CardTitle className="text-3xl">{marketIntelligence?.overview.totalOrders || 0}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          {marketIntelligence?.overview.recentOrders || 0} in last 30 days
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Value</CardDescription>
                        <CardTitle className="text-3xl">
                          KES {(marketIntelligence?.overview.totalOrderValue || 0).toLocaleString()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          KES {(marketIntelligence?.overview.recentOrderValue || 0).toLocaleString()} (30d)
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Avg Delivery</CardDescription>
                        <CardTitle className="text-3xl">{marketIntelligence?.overview.avgDeliveryTime || 0} days</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          {marketIntelligence?.overview.activeBuyers || 0} buyers, {marketIntelligence?.overview.activeVendors || 0} vendors
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Top Requested Products */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Top 10 Most Requested Products</h3>
                  <div className="space-y-2">
                    {marketIntelligence?.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{index + 1}</Badge>
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="size-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">{product.count} requests</span>
                        </div>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No data available</p>}
                  </div>
                </div>

                {/* Average Prices by Product */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Average Market Prices (Top 10 Products)</h3>
                  <div className="space-y-2">
                    {marketIntelligence?.avgPricesByProduct.map((product, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{product.name}</span>
                          <Badge variant="outline">{product.quotationCount} quotes</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Min Price</p>
                            <p className="font-semibold">KES {product.minPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Price</p>
                            <p className="font-semibold text-primary">KES {product.avgPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Max Price</p>
                            <p className="font-semibold">KES {product.maxPrice.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No data available</p>}
                  </div>
                </div>

                {/* RFQ Trends */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">RFQ Volume Trends (Last 6 Months)</h3>
                  <div className="space-y-2">
                    {marketIntelligence?.rfqTrends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{trend.month}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-48 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (trend.count / Math.max(...(marketIntelligence?.rfqTrends.map(t => t.count) || [1]))) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-16 text-right">{trend.count} RFQs</span>
                        </div>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No data available</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "site-settings" && (
            <Card>
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
                <CardDescription>
                  Customize the logo, branding, and workflow text displayed on the site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Branding Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Branding</h3>
                  
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input
                        id="logoUrl"
                        placeholder="https://cdn.hercules.app/file_..."
                        value={settingsForm.logoUrl}
                        onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                      />
                      <p className="text-sm text-muted-foreground">
                        Upload your logo to Files & Media and paste the URL here
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logoSize">Logo Size</Label>
                      <Select
                        value={settingsForm.logoSize}
                        onValueChange={(value) => setSettingsForm({ ...settingsForm, logoSize: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select logo size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="h-16">Small (h-16)</SelectItem>
                          <SelectItem value="h-20">Medium Small (h-20)</SelectItem>
                          <SelectItem value="h-24">Medium (h-24)</SelectItem>
                          <SelectItem value="h-28">Medium Large (h-28)</SelectItem>
                          <SelectItem value="h-32">Large (h-32)</SelectItem>
                          <SelectItem value="h-40">Extra Large (h-40)</SelectItem>
                          <SelectItem value="h-48">Huge (h-48)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        placeholder="Medical Supplies Kenya"
                        value={settingsForm.siteName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        placeholder="Find Medical Equipment & Supplies"
                        value={settingsForm.tagline}
                        onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Hospital Workflow Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Hospital Workflow Steps</h3>
                  <div className="grid gap-4">
                    {['hospitalStep1', 'hospitalStep2', 'hospitalStep3', 'hospitalStep4'].map((key, index) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key}>Step {index + 1}</Label>
                        <Input
                          id={key}
                          placeholder={`Step ${index + 1}`}
                          value={settingsForm[key as keyof typeof settingsForm]}
                          onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Vendor Workflow Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Vendor Workflow Steps</h3>
                  <div className="grid gap-4">
                    {['vendorStep1', 'vendorStep2', 'vendorStep3', 'vendorStep4'].map((key, index) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key}>Step {index + 1}</Label>
                        <Input
                          id={key}
                          placeholder={`Step ${index + 1}`}
                          value={settingsForm[key as keyof typeof settingsForm]}
                          onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Workflow Styling Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Workflow Banner Styling</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="workflowTextSize">Text Size</Label>
                      <Select
                        value={settingsForm.workflowTextSize}
                        onValueChange={(value) => setSettingsForm({ ...settingsForm, workflowTextSize: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select text size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text-xs">Extra Small</SelectItem>
                          <SelectItem value="text-sm">Small</SelectItem>
                          <SelectItem value="text-base">Base</SelectItem>
                          <SelectItem value="text-lg">Large</SelectItem>
                          <SelectItem value="text-xl">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workflowBgColor">Background Color</Label>
                      <Select
                        value={settingsForm.workflowBgColor}
                        onValueChange={(value) => setSettingsForm({ ...settingsForm, workflowBgColor: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select background color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bg-blue-50">Light Blue</SelectItem>
                          <SelectItem value="bg-green-50">Light Green</SelectItem>
                          <SelectItem value="bg-orange-50">Light Orange</SelectItem>
                          <SelectItem value="bg-purple-50">Light Purple</SelectItem>
                          <SelectItem value="bg-gray-50">Light Gray</SelectItem>
                          <SelectItem value="bg-muted/30">Muted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Save Button */}
                <div className="flex justify-end gap-4">
                  <Button onClick={handleSaveSettings}>
                    Save Changes
                  </Button>
                </div>

                {/* Live Preview */}
                {siteSettings && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Live Preview</h3>
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center gap-3 mb-4">
                        <img 
                          src={settingsForm.logoUrl || siteSettings.logoUrl} 
                          alt="Logo Preview" 
                          className={`${settingsForm.logoSize} w-auto`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div>
                          <h4 className="font-bold">{settingsForm.siteName || siteSettings.siteName}</h4>
                          <p className="text-sm text-muted-foreground">{settingsForm.tagline || siteSettings.tagline}</p>
                        </div>
                      </div>
                      <div className={`${settingsForm.workflowBgColor} p-4 rounded-lg ${settingsForm.workflowTextSize}`}>
                        <p className="font-semibold mb-2">Hospital Workflow:</p>
                        <div className="flex flex-wrap gap-2">
                          {[settingsForm.hospitalStep1, settingsForm.hospitalStep2, settingsForm.hospitalStep3, settingsForm.hospitalStep4].map((step, i) => (
                            <span key={i} className="bg-background px-2 py-1 rounded border">
                              {step || `Step ${i + 1}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Categories to Vendor</DialogTitle>
            <DialogDescription>
              Select which categories this vendor supplies products for
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {categories?.map((category) => (
              <div key={category._id} className="flex items-center space-x-2">
                <Checkbox
                  id={category._id}
                  checked={selectedCategories.includes(category._id)}
                  onCheckedChange={() => handleToggleCategory(category._id)}
                />
                <label
                  htmlFor={category._id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
          <Button onClick={handleSaveCategories} className="w-full">
            Save Categories
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete user information and activity
            </DialogDescription>
          </DialogHeader>
          {userDetails ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{userDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{userDetails.email}</p>
                  </div>
                  {userDetails.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{userDetails.phone}</p>
                    </div>
                  )}
                  {userDetails.companyName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{userDetails.companyName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge>{userDetails.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={userDetails.verified ? "default" : "secondary"}>
                      {userDetails.verified ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Activity Statistics */}
              <div>
                <h3 className="font-semibold mb-3">Activity</h3>
                <div className="grid grid-cols-2 gap-4">
                  {userDetails.role === "buyer" && (
                    <>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>RFQs Submitted</CardDescription>
                          <CardTitle className="text-3xl">
                            {allRfqs?.filter((r) => r.buyerId === userDetails._id).length || 0}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Quotations Received</CardDescription>
                          <CardTitle className="text-3xl">
                            {allQuotations?.filter((q) => 
                              allRfqs?.find((r) => r._id === q.rfqId && r.buyerId === userDetails._id)
                            ).length || 0}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </>
                  )}
                  {userDetails.role === "vendor" && (
                    <>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Active Products</CardDescription>
                          <CardTitle className="text-3xl">
                            {allQuotations?.filter((q) => q.vendorId === userDetails._id && q.active).length || 0}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Quotations Sent</CardDescription>
                          <CardTitle className="text-3xl">
                            {allQuotations?.filter((q) => q.vendorId === userDetails._id).length || 0}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </>
                  )}
                </div>
              </div>

              {/* Vendor Categories */}
              {userDetails.role === "vendor" && userDetails.categories && (
                <div>
                  <h3 className="font-semibold mb-3">Assigned Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {userDetails.categories.length > 0 ? (
                      userDetails.categories.map((catId: Id<"categories">) => {
                        const category = categories?.find(c => c._id === catId);
                        return category ? (
                          <Badge key={catId} variant="outline">{category.name}</Badge>
                        ) : null;
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No categories assigned</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading user details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CatalogScanner
        open={catalogScannerOpen}
        onOpenChange={setCatalogScannerOpen}
        userRole="admin"
      />

      <BulkProductUpload
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
      />

      <EditProductDialog
        open={editProductOpen}
        onOpenChange={setEditProductOpen}
        productId={editProductId}
      />
    </div>
  );
}