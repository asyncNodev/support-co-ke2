import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  CheckCircle,
  Search,
  Shield,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppHeader from "@/components/AppHeader";

export default function UsersPage() {
  const { user } = useAuth() as { user: any };
  const users = useQuery(
    api.users.getAllUsers,
    user?._id ? { userId: user._id } : "skip",
  );
  const pendingUsers = useQuery(api.users.getPendingUsers, {
    userId: user?._id,
  });
  const categories = useQuery(api.categories.getCategories, {});
  const approveUser = useMutation(api.users.approveUser);
  const rejectUser = useMutation(api.users.rejectUser);
  const verifyUser = useMutation(api.users.verifyUser);
  const assignCategories = useMutation(api.users.assignCategoriesToVendor);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, Id<"categories">[]>
  >({});

  const handleApprove = async (userId: Id<"users">) => {
    try {
      await approveUser({ userId });
      toast.success("User approved successfully");
    } catch (error) {
      toast.error("Failed to approve user");
    }
  };

  const handleReject = async (userId: Id<"users">) => {
    try {
      await rejectUser({ userId });
      toast.success("User rejected");
    } catch (error) {
      toast.error("Failed to reject user");
    }
  };

  const handleVerify = async (userId: Id<"users">) => {
    try {
      await verifyUser({ userId });
      toast.success("User verified");
    } catch (error) {
      toast.error("Failed to verify user");
    }
  };

  const handleAssignCategories = async (userId: Id<"users">) => {
    const cats = selectedCategories[userId];
    if (!cats || cats.length === 0) {
      toast.error("Please select at least one category");
      return;
    }
    try {
      await assignCategories({
        vendorId: userId,
        categories: cats,
        userId: user?._id,
      });
      toast.success("Categories assigned");
    } catch (error) {
      toast.error("Failed to assign categories");
    }
  };

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 size-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>

        {/* Pending Approvals */}
        {pendingUsers && pendingUsers.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900">
                Pending Approvals ({pendingUsers.length})
              </CardTitle>
              <CardDescription>
                Review and approve new user registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.companyName}
                      </div>
                      <Badge
                        variant={
                          user.role === "vendor" ? "secondary" : "default"
                        }
                      >
                        {user.role}
                      </Badge>
                    </div>

                    {user.role === "vendor" && (
                      <div className="mx-4">
                        <Select
                          value=""
                          onValueChange={(value) => {
                            const current = selectedCategories[user._id] || [];
                            setSelectedCategories({
                              ...selectedCategories,
                              [user._id]: [
                                ...current,
                                value as Id<"categories">,
                              ],
                            });
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Assign Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat._id} value={cat._id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedCategories[user._id] &&
                          selectedCategories[user._id].length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {selectedCategories[user._id].map((catId) => {
                                const cat = categories?.find(
                                  (c) => c._id === catId,
                                );
                                return cat ? (
                                  <Badge key={catId} variant="outline">
                                    {cat.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(user._id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-1 size-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(user._id)}
                      >
                        <XCircle className="mr-1 size-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>All Users ({filteredUsers?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="space-y-2">
              {filteredUsers?.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {user.name}
                      {user.verified && (
                        <Shield className="size-4 text-green-600" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                    {user.companyName && (
                      <div className="text-sm text-muted-foreground">
                        {user.companyName}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        user.role === "admin"
                          ? "destructive"
                          : user.role === "vendor"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {user.role}
                    </Badge>
                    {user.status === "approved" && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        Approved
                      </Badge>
                    )}
                    {!user.verified && user.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerify(user._id)}
                      >
                        <UserCheck className="mr-1 size-4" />
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
