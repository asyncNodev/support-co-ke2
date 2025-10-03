import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Package, BarChart3, Plus, Trash2, Upload } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const analytics = useQuery(api.analytics.getAnalytics);
  const products = useQuery(api.products.getProducts, {});
  const categories = useQuery(api.categories.getCategories);
  const users = useQuery(api.users.getAllUsers, {});

  const createProduct = useMutation(api.products.createProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const createCategory = useMutation(api.categories.createCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const verifyUser = useMutation(api.users.verifyUser);

  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  
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
    try {
      await createProduct({
        name: newProduct.name,
        categoryId: newProduct.categoryId as Id<"categories">,
        description: newProduct.description,
        image: newProduct.image || undefined,
      });
      toast.success("Product created successfully");
      setShowProductDialog(false);
      setNewProduct({ name: "", categoryId: "", description: "", image: "" });
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

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",");

      // Skip header row and process each line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(",");
        const name = values[0]?.trim();
        const categoryName = values[1]?.trim();
        const description = values[2]?.trim();
        const photoUrl = values[3]?.trim();

        if (!name || !categoryName) continue;

        // Find category ID by name
        const category = categories?.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (!category) {
          toast.error(`Category not found: ${categoryName}`);
          continue;
        }

        try {
          await createProduct({
            name,
            categoryId: category._id,
            description: description || "",
            image: photoUrl || undefined,
          });
        } catch (error) {
          toast.error(`Failed to create product: ${name}`);
        }
      }
      toast.success("Bulk upload completed");
      setShowBulkUploadDialog(false);
    };
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const csvContent = "Name,Category,Description,Photo URL\nHospital Bed,Patient Care Equipment,Electric hospital bed with adjustable height,https://example.com/bed.jpg\nWheelchair,Patient Care Equipment,Standard wheelchair with armrests,https://example.com/wheelchair.jpg";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_upload_template.csv";
    a.click();
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
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Products</h2>
              <div className="flex gap-2">
                <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="mr-2 size-4" />
                      Bulk Upload CSV
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Upload Products (CSV)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Upload a CSV file with columns: Name, Category, Description, Photo URL
                      </p>
                      <Button variant="outline" onClick={downloadCSVTemplate}>
                        Download CSV Template
                      </Button>
                      <Input type="file" accept=".csv" onChange={handleCSVUpload} />
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
                      <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={newProduct.name}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, name: e.target.value })
                          }
                          placeholder="Hospital Bed"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={newProduct.categoryId}
                          onValueChange={(value) =>
                            setNewProduct({ ...newProduct, categoryId: value })
                          }
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
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, description: e.target.value })
                          }
                          placeholder="Product description"
                        />
                      </div>
                      <div>
                        <Label>Photo URL</Label>
                        <Input
                          value={newProduct.image}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, image: e.target.value })
                          }
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <Button onClick={handleCreateProduct}>Create Product</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {products?.map((product) => (
                <Card key={product._id}>
                  <CardContent className="pt-6">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.description}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-4"
                      onClick={() => handleDeleteProduct(product._id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Categories</h2>
              <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 size-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newCategory.name}
                        onChange={(e) =>
                          setNewCategory({ ...newCategory, name: e.target.value })
                        }
                        placeholder="Diagnostic Equipment"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newCategory.description}
                        onChange={(e) =>
                          setNewCategory({ ...newCategory, description: e.target.value })
                        }
                        placeholder="Category description"
                      />
                    </div>
                    <Button onClick={handleCreateCategory}>Create Category</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {categories?.map((category) => (
                <Card key={category._id}>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-4"
                      onClick={() => handleDeleteCategory(category._id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-xl font-semibold">Users</h2>
            <div className="space-y-2">
              {users?.map((user) => (
                <Card key={user._id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                      {user.verified ? (
                        <Badge variant="default">Verified</Badge>
                      ) : (
                        <>
                          <Badge variant="destructive">Unverified</Badge>
                          {user.role === "vendor" && (
                            <Button
                              size="sm"
                              onClick={() => handleVerifyUser(user._id)}
                            >
                              Verify Vendor
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
