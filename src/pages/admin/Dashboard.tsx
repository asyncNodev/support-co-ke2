import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FolderTree, 
  Globe,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Shield,
  TrendingUp,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const analytics = useQuery(api.analytics.getAnalytics);
  const users = useQuery(api.users.getAllUsers, currentUser?.role === "admin" ? {} : "skip");
  const categories = useQuery(api.categories.getCategories);
  const products = useQuery(api.products.getProducts, {});
  const scrapingSources = useQuery(api.analytics.getAnalytics); // We'll need to create this query

  const createCategory = useMutation(api.categories.createCategory);
  const createProduct = useMutation(api.products.createProduct);
  const verifyUser = useMutation(api.users.verifyUser);
  const deleteProduct = useMutation(api.products.deleteProduct);

  const [categoryDialog, setCategoryDialog] = useState(false);
  const [productDialog, setProductDialog] = useState(false);
  const [sourceDialog, setSourceDialog] = useState(false);

  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [newProduct, setNewProduct] = useState({
    name: "",
    categoryId: "",
    description: "",
    sku: "",
  });
  const [newSource, setNewSource] = useState({ name: "", url: "", country: "Kenya" });

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }
  if (!currentUser) {
    navigate("/register");
    return null;
  }
  if (currentUser.role !== "admin") {
    navigate("/");
    return null;
  }

  const handleCreateCategory = async () => {
    try {
      await createCategory(newCategory);
      toast.success("Category created successfully!");
      setNewCategory({ name: "", description: "" });
      setCategoryDialog(false);
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  const handleCreateProduct = async () => {
    try {
      if (!newProduct.categoryId) {
        toast.error("Please select a category");
        return;
      }
      await createProduct({
        ...newProduct,
        categoryId: newProduct.categoryId as Id<"categories">,
      });
      toast.success("Product created successfully!");
      setNewProduct({ name: "", categoryId: "", description: "", sku: "" });
      setProductDialog(false);
    } catch (error) {
      toast.error("Failed to create product");
    }
  };

  const handleVerifyUser = async (userId: Id<"users">) => {
    try {
      await verifyUser({ userId });
      toast.success("User verified successfully!");
    } catch (error) {
      toast.error("Failed to verify user");
    }
  };

  const handleDeleteProduct = async (productId: Id<"products">) => {
    try {
      await deleteProduct({ productId });
      toast.success("Product deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const totalVisitors = analytics?.visitors?.total || 0;
  const totalRFQs = analytics?.rfqs?.total || 0;
  const totalQuotations = analytics?.quotations?.total || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-8 text-primary" />
            <span className="text-2xl font-bold">Admin Dashboard</span>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisitors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RFQs Sent</CardTitle>
              <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRFQs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quotations Sent</CardTitle>
              <LayoutDashboard className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuotations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products"><Package className="size-4 mr-2" />Products</TabsTrigger>
            <TabsTrigger value="categories"><FolderTree className="size-4 mr-2" />Categories</TabsTrigger>
            <TabsTrigger value="users"><Users className="size-4 mr-2" />Users</TabsTrigger>
            <TabsTrigger value="scraping"><Globe className="size-4 mr-2" />Web Scraping</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Products Management</CardTitle>
                    <CardDescription>Add, edit, or remove products from the catalog</CardDescription>
                  </div>
                  <Dialog open={productDialog} onOpenChange={setProductDialog}>
                    <DialogTrigger asChild>
                      <Button><Plus className="size-4 mr-2" />Add Product</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>Create a new product in the catalog</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Product Name</Label>
                          <Input
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            placeholder="e.g. Digital Blood Pressure Monitor"
                          />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Select value={newProduct.categoryId} onValueChange={(value) => setNewProduct({ ...newProduct, categoryId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories?.map((cat) => (
                                <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>SKU</Label>
                          <Input
                            value={newProduct.sku}
                            onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                            placeholder="e.g. BP-100"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                            placeholder="Product description..."
                          />
                        </div>
                        <Button onClick={handleCreateProduct} className="w-full">Create Product</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {products?.map((product) => (
                    <div key={product._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.sku}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm"><Edit className="size-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product._id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Categories Management</CardTitle>
                    <CardDescription>Organize products into categories</CardDescription>
                  </div>
                  <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button><Plus className="size-4 mr-2" />Add Category</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>Create a new product category</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Category Name</Label>
                          <Input
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            placeholder="e.g. Diagnostic Equipment"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newCategory.description}
                            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                            placeholder="Category description..."
                          />
                        </div>
                        <Button onClick={handleCreateCategory} className="w-full">Create Category</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {categories?.map((category) => (
                    <Card key={category._id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>Manage and verify platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users?.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge>{user.role}</Badge>
                          {user.verified ? (
                            <Badge variant="outline" className="text-green-600"><Check className="size-3 mr-1" />Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600"><X className="size-3 mr-1" />Pending</Badge>
                          )}
                        </div>
                      </div>
                      {!user.verified && user.role === "vendor" && (
                        <Button onClick={() => handleVerifyUser(user._id)}>
                          Verify Vendor
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Web Scraping Tab */}
          <TabsContent value="scraping">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Web Scraping Sources</CardTitle>
                    <CardDescription>Manage Kenyan medical supply websites for auto-scraping</CardDescription>
                  </div>
                  <Dialog open={sourceDialog} onOpenChange={setSourceDialog}>
                    <DialogTrigger asChild>
                      <Button><Plus className="size-4 mr-2" />Add Website</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Scraping Source</DialogTitle>
                        <DialogDescription>Add a Kenyan website to scrape products from</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Website Name</Label>
                          <Input
                            value={newSource.name}
                            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                            placeholder="e.g. AlphaMed Kenya"
                          />
                        </div>
                        <div>
                          <Label>Website URL</Label>
                          <Input
                            value={newSource.url}
                            onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                            placeholder="https://example.co.ke/"
                          />
                        </div>
                        <div>
                          <Label>Country</Label>
                          <Input value={newSource.country} disabled />
                        </div>
                        <Button onClick={() => toast.success("Feature coming soon!")} className="w-full">
                          Add Source
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-4 border rounded-lg">
                    <div className="font-semibold">AlphaMed Kenya</div>
                    <div className="text-sm text-muted-foreground">https://alphamed.co.ke/</div>
                    <Badge className="mt-2">Active</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-semibold">Mediplug Equipment</div>
                    <div className="text-sm text-muted-foreground">https://mediplugequipment.co.ke/</div>
                    <Badge className="mt-2">Active</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-semibold">Enza Supplies</div>
                    <div className="text-sm text-muted-foreground">https://enzasupplies.co.ke/</div>
                    <Badge className="mt-2">Active</Badge>
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