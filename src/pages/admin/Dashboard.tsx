import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth.ts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Plus, Package, Users, BarChart3, Globe, CheckCircle, XCircle, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function AdminDashboard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const analytics = useQuery(api.analytics.getAnalytics, {});
  const categories = useQuery(api.categories.getCategories, {});
  const products = useQuery(api.products.getProducts, {});
  const users = useQuery(api.users.getAllUsers, {});
  
  const createProduct = useMutation(api.products.createProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const createCategory = useMutation(api.categories.createCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const verifyUser = useMutation(api.users.verifyUser);

  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", categoryId: "", description: "", sku: "" });
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the admin dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleCreateProduct = async () => {
    try {
      await createProduct({
        name: newProduct.name,
        categoryId: newProduct.categoryId as Id<"categories">,
        description: newProduct.description,
        sku: newProduct.sku,
      });
      toast.success("Product created successfully");
      setShowProductDialog(false);
      setNewProduct({ name: "", categoryId: "", description: "", sku: "" });
    } catch (error) {
      toast.error("Failed to create product");
    }
  };

  const handleDeleteProduct = async (productId: Id<"products">) => {
    try {
      await deleteProduct({ productId });
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleCreateCategory = async () => {
    try {
      await createCategory({
        name: newCategory.name,
        description: newCategory.description,
      });
      toast.success("Category created successfully");
      setShowCategoryDialog(false);
      setNewCategory({ name: "", description: "" });
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  const handleDeleteCategory = async (categoryId: Id<"categories">) => {
    try {
      await deleteCategory({ categoryId });
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error("Failed to delete category");
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.visitors?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RFQs Sent</CardTitle>
              <BarChart3 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.rfqs?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quotations Sent</CardTitle>
              <Package className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.quotations?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Category</CardTitle>
              <BarChart3 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{analytics?.categories?.[0]?.categoryName || "N/A"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="scraping">Web Scraping</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Products Management</h2>
              <div className="flex gap-2">
                <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="mr-2 size-4" />
                      Bulk Upload CSV
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Bulk Upload Products from CSV</DialogTitle>
                      <DialogDescription>
                        Upload a CSV file with your products. Download the template below for the correct format.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted p-4">
                        <h3 className="font-semibold mb-2">CSV Format Required:</h3>
                        <code className="text-sm block bg-background p-2 rounded">
                          Name,Category,SKU,Description,Price,Specifications,Country of Origin,Warranty
                        </code>
                        <p className="text-sm text-muted-foreground mt-2">
                          Example:<br/>
                          <code className="text-xs bg-background p-1 rounded">
                            Digital Blood Pressure Monitor,Diagnostic Equipment,DBP-001,Automatic digital BP monitor,4500,LCD Display; Memory 90 readings,China,12 months
                          </code>
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="csv-file">Upload CSV File</Label>
                        <Input
                          id="csv-file"
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              toast.info("CSV parsing feature coming soon!");
                              // TODO: Parse CSV and create products in bulk
                            }
                          }}
                        />
                      </div>
                      <Button className="w-full" variant="outline" onClick={() => {
                        // Create sample CSV
                        const csv = `Name,Category,SKU,Description,Price,Specifications,Country of Origin,Warranty
Digital Blood Pressure Monitor,Diagnostic Equipment,DBP-001,Automatic digital BP monitor,4500,LCD Display; Memory 90 readings,China,12 months
Pulse Oximeter,Diagnostic Equipment,POX-001,Fingertip pulse oximeter,3200,SpO2 and pulse rate,China,6 months`;
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'product_template.csv';
                        a.click();
                        toast.success("Template downloaded");
                      }}>
                        Download CSV Template
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 size-4" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Product Name</Label>
                        <Input
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
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
                        <Label>SKU</Label>
                        <Input
                          value={newProduct.sku}
                          onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleCreateProduct} className="w-full">
                        Create Product
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products?.map((product) => (
                <Card key={product._id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.sku}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProduct(product._id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Categories Management</h2>
              <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 size-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Category Name</Label>
                      <Input
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleCreateCategory} className="w-full">
                      Create Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories?.map((category) => (
                <Card key={category._id}>
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
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
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-xl font-bold">Users Management</h2>
            <div className="grid gap-4">
              {users?.map((user) => (
                <Card key={user._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={user.role === "admin" ? "default" : user.role === "vendor" ? "secondary" : "outline"}>
                          {user.role}
                        </Badge>
                        {user.verified ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="mr-1 size-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 size-3" />
                            Unverified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {!user.verified && user.role === "vendor" && (
                    <CardContent>
                      <Button
                        size="sm"
                        onClick={() => handleVerifyUser(user._id)}
                      >
                        <CheckCircle className="mr-2 size-4" />
                        Verify Vendor
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Web Scraping Tab */}
          <TabsContent value="scraping" className="space-y-4">
            <h2 className="text-xl font-bold">Web Scraping Sources</h2>
            <Card>
              <CardHeader>
                <CardTitle>Kenyan Medical Supply Websites</CardTitle>
                <CardDescription>
                  These websites are configured for automatic product scraping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Globe className="size-4" />
                      <span className="text-sm">alphamed.co.ke</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Globe className="size-4" />
                      <span className="text-sm">mediplugequipment.co.ke</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Globe className="size-4" />
                      <span className="text-sm">enzasupplies.co.ke</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Globe className="size-4" />
                      <span className="text-sm">apicalmed.com</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Globe className="size-4" />
                      <span className="text-sm">medipalmedicalsupplies.co.ke</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Globe className="size-4" />
                      <span className="text-sm">medicalequipmentsupplieskenya.com</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Globe className="size-4" />
                      <span className="text-sm">crownkenya.com</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}