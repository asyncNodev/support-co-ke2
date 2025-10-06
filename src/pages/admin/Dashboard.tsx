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
import { toast } from "sonner";
import { Plus, Trash2, Users, Package, Tag, Globe, BarChart3, Settings } from "lucide-react";

export default function AdminDashboard() {
  const products = useQuery(api.products.getProducts, {});
  const categories = useQuery(api.categories.getCategories, {});
  const users = useQuery(api.users.getAllUsers, {});
  const analytics = useQuery(api.analytics.getAnalytics, {});

  const createProduct = useMutation(api.products.createProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const createCategory = useMutation(api.categories.createCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const verifyUser = useMutation(api.users.verifyUser);
  const assignCategoriesToVendor = useMutation(api.users.assignCategoriesToVendor);

  const verifyUserMutation = useMutation(api.users.verifyUser);
  const assignCategories = useMutation(api.users.assignCategoriesToVendor);
  const toggleStatus = useMutation(api.users.toggleUserStatus);
  const deleteUserMutation = useMutation(api.users.deleteUser);

  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewDetailsUserId, setViewDetailsUserId] = useState<Id<"users"> | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  
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
        categoryIds: selectedCategories,
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

  const vendors = users?.filter((u) => u.role === "vendor") || [];
  const buyers = users?.filter((u) => u.role === "buyer") || [];

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

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>Manage medical products</CardDescription>
                  </div>
                  <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="size-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                        <div>
                          <Label>Photo URL</Label>
                          <Input
                            value={newProduct.image}
                            onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <Button onClick={handleCreateProduct} className="w-full">
                          Create Product
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {products?.map((product) => (
                    <Card key={product._id}>
                      <CardHeader>
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <CardDescription>{product.categoryName}</CardDescription>
                      </CardHeader>
                      <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>Overview of platform activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Visitors</p>
                    <p className="text-2xl font-bold">
                      {typeof analytics?.visitors === 'number' ? analytics.visitors : 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total RFQs</p>
                    <p className="text-2xl font-bold">
                      {typeof analytics?.rfqs === 'number' ? analytics.rfqs : analytics?.rfqs?.total || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Quotations</p>
                    <p className="text-2xl font-bold">
                      {typeof analytics?.quotations === 'number' ? analytics.quotations : analytics?.quotations?.total || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
                    <p className="font-medium">{userDetails.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{userDetails.user.email}</p>
                  </div>
                  {userDetails.user.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{userDetails.user.phone}</p>
                    </div>
                  )}
                  {userDetails.user.companyName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{userDetails.user.companyName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge>{userDetails.user.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={userDetails.user.verified ? "default" : "secondary"}>
                      {userDetails.user.verified ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Activity Statistics */}
              <div>
                <h3 className="font-semibold mb-3">Activity</h3>
                <div className="grid grid-cols-2 gap-4">
                  {userDetails.user.role === "buyer" && (
                    <>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>RFQs Submitted</CardDescription>
                          <CardTitle className="text-3xl">{userDetails.rfqsCount}</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Quotations Received</CardDescription>
                          <CardTitle className="text-3xl">{userDetails.receivedQuotationsCount}</CardTitle>
                        </CardHeader>
                      </Card>
                    </>
                  )}
                  {userDetails.user.role === "vendor" && (
                    <>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Active Products</CardDescription>
                          <CardTitle className="text-3xl">{userDetails.activeQuotationsCount}</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Quotations Sent</CardDescription>
                          <CardTitle className="text-3xl">{userDetails.sentQuotationsCount}</CardTitle>
                        </CardHeader>
                      </Card>
                    </>
                  )}
                </div>
              </div>

              {/* Vendor Categories */}
              {userDetails.user.role === "vendor" && userDetails.user.categories && (
                <div>
                  <h3 className="font-semibold mb-3">Assigned Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {userDetails.user.categories.length > 0 ? (
                      userDetails.user.categories.map((catId) => {
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
    </div>
  );
}