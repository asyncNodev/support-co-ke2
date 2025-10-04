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

  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [assignCategoriesOpen, setAssignCategoriesOpen] = useState(false);
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
    const vendor = users?.find((u) => u._id === vendorId);
    setSelectedVendor(vendorId);
    setSelectedCategories(vendor?.categories || []);
    setAssignCategoriesOpen(true);
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
      await assignCategoriesToVendor({
        vendorId: selectedVendor,
        categoryIds: selectedCategories,
      });
      toast.success("Categories assigned successfully");
      setAssignCategoriesOpen(false);
    } catch (error) {
      toast.error("Failed to assign categories");
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
                        {!vendor.verified && (
                          <Button onClick={() => handleVerifyUser(vendor._id)} size="sm">
                            Verify Vendor
                          </Button>
                        )}
                        <Button
                          onClick={() => handleOpenAssignCategories(vendor._id)}
                          variant="outline"
                          size="sm"
                        >
                          <Tag className="size-4 mr-2" />
                          Assign Categories
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
                      <div>
                        <p className="font-medium">{buyer.name}</p>
                        <p className="text-sm text-muted-foreground">{buyer.email}</p>
                      </div>
                      <Badge variant={buyer.verified ? "default" : "secondary"}>
                        {buyer.verified ? "Verified" : "Active"}
                      </Badge>
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

      <Dialog open={assignCategoriesOpen} onOpenChange={setAssignCategoriesOpen}>
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
    </div>
  );
}