"use client";

import { useState, useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { UserForm } from "@/components/user-form";
import { RoleManagement } from "@/components/role-management";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTaskContext } from "@/contexts/task-context";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/contexts/task-context";

export function UserManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [deleteOption, setDeleteOption] = useState<
    "reassign" | "delete" | null
  >(null);
  const [reassignTo, setReassignTo] = useState<string>("");

  const {
    users,
    tasks,
    addUser,
    updateUser,
    deleteUser,
    updateTask,
    deleteTask,
    registerUserListener,
    unregisterUserListener,
    refreshTasks,
  } = useTaskContext();

  // Generate unique ID for listener
  const userListenerId = useId();

  // Register listener for real-time updates
  useEffect(() => {
    // Register listener
    registerUserListener(userListenerId, () => {
      console.log("User update detected in UserManagement");
      refreshTasks();
    });

    // Initial data load
    refreshTasks();

    // Clean up listener on unmount
    return () => {
      unregisterUserListener(userListenerId);
    };
  }, [
    registerUserListener,
    unregisterUserListener,
    userListenerId,
    refreshTasks,
  ]);

  // Filter users based on search query
  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const handleEditUser = (user: User) => {
    console.log("Editing user:", user);
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    console.log("Deleting user:", user);
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "Invalid user data",
        variant: "destructive",
      });
      return;
    }

    setUserToDelete(user);
    const assignedTasks = tasks.filter((task) => task.pilotes === user.name);
    setUserTasks(assignedTasks);
    setDeleteOption(null);
    setReassignTo("");
    setShowDeleteDialog(true);
  };

  const handleUserSubmit = async (userData: User) => {
    try {
      setIsProcessing(true);
      console.log("Submitting user data:", userData);

      if (userData.id) {
        // Updating existing user
        console.log("Updating user with ID:", userData.id);
        const response = await fetch(`/api/users/${userData.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Update error response:", errorData);
          throw new Error(errorData.error || "Failed to update user");
        }

        const updatedUser = await response.json();
        console.log("User updated successfully:", updatedUser);

        // Update local state
        await updateUser(userData.id, userData);
      } else {
        // Adding new user
        console.log("Creating new user");
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Create error response:", errorData);
          throw new Error(errorData.error || "Failed to create user");
        }

        const newUser = await response.json();
        console.log("User created successfully:", newUser);

        // Update local state
        await addUser(userData);
      }

      // Close dialogs and reset state
      setIsEditDialogOpen(false);
      setIsAddUserDialogOpen(false);
      setSelectedUser(null);

      // Show success toast
      toast({
        title: userData.id ? "User updated" : "User created",
        description: userData.id
          ? `${userData.name} has been updated successfully`
          : `${userData.name} has been created successfully`,
      });

      // Force refresh
      await refreshTasks();
      router.refresh();
    } catch (error) {
      console.error("Error submitting user:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !userToDelete.id) {
      toast({
        title: "Error",
        description: "Invalid user data",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDeleting(true);
      setIsProcessing(true);
      console.log("Starting delete process for user:", userToDelete);

      // If user has tasks and we need to handle them
      if (userTasks.length > 0) {
        console.log("User has tasks to handle:", userTasks.length);
        if (deleteOption === "reassign") {
          if (!reassignTo) {
            throw new Error("Please select a user to reassign tasks to");
          }

          console.log("Reassigning tasks to:", reassignTo);
          for (const task of userTasks) {
            try {
              console.log("Reassigning task:", task._id);
              await updateTask(task._id, { pilotes: reassignTo });
            } catch (error) {
              console.error(`Error reassigning task ${task._id}:`, error);
              throw new Error(`Failed to reassign task ${task._id}`);
            }
          }
        } else if (deleteOption === "delete") {
          console.log("Deleting user's tasks");
          for (const task of userTasks) {
            try {
              console.log("Deleting task:", task._id);
              await deleteTask(task._id);
            } catch (error) {
              console.error(`Error deleting task ${task._id}:`, error);
              throw new Error(`Failed to delete task ${task._id}`);
            }
          }
        } else {
          throw new Error("Please select how to handle the user's tasks");
        }

        await refreshTasks();
      }

      // Delete the user
      console.log("Deleting user with ID:", userToDelete.id);
      await deleteUser(userToDelete.id);

      // Close dialog and reset state
      setShowDeleteDialog(false);
      setUserToDelete(null);
      setUserTasks([]);
      setDeleteOption(null);
      setReassignTo("");

      toast({
        title: "User deleted",
        description: `User ${userToDelete.name} has been deleted successfully`,
      });

      // Force refresh
      await refreshTasks();
      router.refresh();
    } catch (error) {
      console.error("Error in delete process:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsProcessing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: "Data refreshed",
        description: "User data has been refreshed",
      });

      router.refresh();
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Tabs defaultValue="users">
      <TabsList>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="roles">Roles</TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                User Management
              </h1>
              <p className="text-muted-foreground">
                Add, edit, and manage user accounts
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing || isProcessing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="sr-only">Refresh</span>
              </Button>
              <Button
                onClick={() => setIsAddUserDialogOpen(true)}
                disabled={isProcessing}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New User
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id || user._id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "active" ? "default" : "secondary"
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "outline"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.tasksCompleted}/{user.tasksAssigned}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          {isEditDialogOpen && (
            <Dialog
              open={isEditDialogOpen}
              onOpenChange={(open) => {
                if (!open && !isProcessing) {
                  setIsEditDialogOpen(false);
                  setSelectedUser(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  {selectedUser && (
                    <UserForm
                      user={selectedUser}
                      onUserSubmit={handleUserSubmit}
                      onCancel={() => {
                        if (!isProcessing) {
                          setIsEditDialogOpen(false);
                          setSelectedUser(null);
                        }
                      }}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Add User Dialog */}
          {isAddUserDialogOpen && (
            <Dialog
              open={isAddUserDialogOpen}
              onOpenChange={(open) => {
                if (!open && !isProcessing) {
                  setIsAddUserDialogOpen(false);
                }
              }}
            >
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <UserForm
                    onUserSubmit={handleUserSubmit}
                    onCancel={() => {
                      if (!isProcessing) {
                        setIsAddUserDialogOpen(false);
                      }
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  user
                  {userToDelete && <strong> {userToDelete.name}</strong>}.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {userTasks.length > 0 && (
                <div className="py-4">
                  <p className="text-sm font-medium text-destructive mb-2">
                    This user has {userTasks.length} assigned tasks that need to
                    be handled.
                  </p>

                  <RadioGroup
                    value={deleteOption || ""}
                    onValueChange={(value) => setDeleteOption(value as any)}
                  >
                    <div className="flex items-start space-x-2 mb-3">
                      <RadioGroupItem value="reassign" id="reassign" />
                      <div className="grid gap-1.5">
                        <Label htmlFor="reassign" className="font-medium">
                          Reassign tasks to another user
                        </Label>
                        {deleteOption === "reassign" && (
                          <Select
                            value={reassignTo}
                            onValueChange={setReassignTo}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                .filter(
                                  (u) =>
                                    u.id !== userToDelete?.id &&
                                    u.status === "active"
                                )
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.name}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="delete" id="delete" />
                      <div className="grid gap-1.5">
                        <Label htmlFor="delete" className="font-medium">
                          Delete all tasks assigned to this user
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          This will permanently delete all {userTasks.length}{" "}
                          tasks.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setUserToDelete(null);
                    setUserTasks([]);
                    setDeleteOption(null);
                    setReassignTo("");
                  }}
                  disabled={isDeleting || isProcessing}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    confirmDeleteUser();
                  }}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={
                    isDeleting ||
                    isProcessing ||
                    (userTasks.length > 0 && !deleteOption) ||
                    (deleteOption === "reassign" && !reassignTo)
                  }
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TabsContent>
      <TabsContent value="roles">
        <RoleManagement />
      </TabsContent>
    </Tabs>
  );
}
