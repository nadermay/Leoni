"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Permission {
  id: string
  name: string
  description: string
}

interface Role {
  id: string
  name: string
  permissions: string[]
}

const availablePermissions: Permission[] = [
  { id: "create_task", name: "Create Task", description: "Ability to create new tasks" },
  { id: "edit_task", name: "Edit Task", description: "Ability to edit existing tasks" },
  { id: "delete_task", name: "Delete Task", description: "Ability to delete tasks" },
  { id: "view_reports", name: "View Reports", description: "Ability to view performance reports" },
  { id: "manage_users", name: "Manage Users", description: "Ability to manage user accounts" },
]

export function RoleManagement() {
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "admin",
      name: "Admin",
      permissions: ["create_task", "edit_task", "delete_task", "view_reports", "manage_users"],
    },
    { id: "user", name: "User", permissions: ["create_task", "edit_task", "view_reports"] },
  ])
  const [isSaving, setIsSaving] = useState(false)

  const handlePermissionChange = (roleId: string, permissionId: string, isChecked: boolean) => {
    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id === roleId) {
          return {
            ...role,
            permissions: isChecked
              ? [...role.permissions, permissionId]
              : role.permissions.filter((p) => p !== permissionId),
          }
        }
        return role
      }),
    )
  }

  const handleSaveChanges = () => {
    // In a real application, you would make an API call here to save the changes
    console.log("Saving role changes:", roles)

    // Add loading state while saving
    setIsSaving(true)

    // Simulate API call with a delay
    setTimeout(() => {
      setIsSaving(false)

      // Show success message
      toast({
        title: "Roles updated",
        description: "The role permissions have been updated successfully.",
      })

      // Store the roles in localStorage to persist changes
      try {
        localStorage.setItem("pdca-roles", JSON.stringify(roles))
      } catch (error) {
        console.error("Error saving roles to localStorage:", error)
      }
    }, 800)
  }

  useEffect(() => {
    try {
      const savedRoles = localStorage.getItem("pdca-roles")
      if (savedRoles) {
        setRoles(JSON.parse(savedRoles))
      }
    } catch (error) {
      console.error("Error loading roles from localStorage:", error)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Role Management</h2>
        <Button onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
      {roles.map((role) => (
        <Card key={role.id}>
          <CardHeader>
            <CardTitle>{role.name}</CardTitle>
            <CardDescription>Manage permissions for {role.name} role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {availablePermissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${role.id}-${permission.id}`}
                    checked={role.permissions.includes(permission.id)}
                    onCheckedChange={(checked) => handlePermissionChange(role.id, permission.id, checked as boolean)}
                  />
                  <label
                    htmlFor={`${role.id}-${permission.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission.name}
                  </label>
                  <p className="text-sm text-muted-foreground">{permission.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
