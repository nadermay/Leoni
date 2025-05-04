"use client";

import { useState } from "react";
import { Order } from "@/types/order";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface OrderDetailsProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export function OrderDetails({
  order,
  open,
  onClose,
  onOrderUpdated,
}: OrderDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Partial<Order> | null>(null);
  const { toast } = useToast();

  const handleInputChange = (field: keyof Order, value: any) => {
    if (editedOrder) {
      setEditedOrder({ ...editedOrder, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!order || !editedOrder) return;

    try {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedOrder),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      toast({
        title: "Success",
        description: "Order updated successfully",
      });

      setIsEditing(false);
      onOrderUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow || !order) return;

    // Generate the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order ${order.orderNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .order-number {
              font-size: 24px;
              font-weight: bold;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 10px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .field {
              margin-bottom: 10px;
            }
            .label {
              font-weight: bold;
            }
            @media print {
              body {
                margin: 0;
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="order-number">Order: ${order.orderNumber}</div>
            <div>Created: ${new Date(
              order.orderCreationDate
            ).toLocaleDateString()}</div>
          </div>
          
          <div class="grid">
            <div class="section">
              <div class="section-title">Order Information</div>
              <div class="field">
                <div class="label">Project:</div>
                <div>${order.project}</div>
              </div>
              <div class="field">
                <div class="label">Requester:</div>
                <div>${order.requester}</div>
              </div>
              <div class="field">
                <div class="label">Category:</div>
                <div>${order.category}</div>
              </div>
              <div class="field">
                <div class="label">Process:</div>
                <div>${order.process}</div>
              </div>
              <div class="field">
                <div class="label">Status:</div>
                <div>${order.status}</div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Details</div>
              <div class="field">
                <div class="label">Description:</div>
                <div>${order.description}</div>
              </div>
              <div class="field">
                <div class="label">PAM:</div>
                <div>${order.pam}</div>
              </div>
              <div class="field">
                <div class="label">Supplier:</div>
                <div>${order.supplier}</div>
              </div>
              <div class="field">
                <div class="label">Total Price:</div>
                <div>${order.totalPrice}</div>
              </div>
              <div class="field">
                <div class="label">Deadline:</div>
                <div>${new Date(order.deadline).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Write the content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function () {
      printWindow.print();
      printWindow.onafterprint = function () {
        printWindow.close();
      };
    };
  };

  const handleDoneChange = async (checked: boolean) => {
    if (!order) return;

    try {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: checked }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      toast({
        title: "Success",
        description: `Order marked as ${checked ? "done" : "not done"}`,
      });

      onOrderUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Order" : "Order Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Order Number</Label>
              {isEditing ? (
                <Input
                  value={editedOrder?.orderNumber || ""}
                  onChange={(e) =>
                    handleInputChange("orderNumber", e.target.value)
                  }
                />
              ) : (
                <div className="text-sm">{order?.orderNumber}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              {isEditing ? (
                <Input
                  value={editedOrder?.project || ""}
                  onChange={(e) => handleInputChange("project", e.target.value)}
                />
              ) : (
                <div className="text-sm">{order?.project}</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            {isEditing ? (
              <Textarea
                value={editedOrder?.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
            ) : (
              <div className="text-sm">{order?.description}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Requester</Label>
              {isEditing ? (
                <Input
                  value={editedOrder?.requester || ""}
                  onChange={(e) =>
                    handleInputChange("requester", e.target.value)
                  }
                />
              ) : (
                <div className="text-sm">{order?.requester}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={
                    editedOrder?.deadline
                      ? format(new Date(editedOrder.deadline), "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) =>
                    handleInputChange("deadline", new Date(e.target.value))
                  }
                />
              ) : (
                <div className="text-sm">
                  {order?.deadline
                    ? format(new Date(order.deadline), "MMM dd, yyyy")
                    : ""}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="done"
              checked={order?.done}
              onCheckedChange={handleDoneChange}
            />
            <Label htmlFor="done">Mark as Done</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            Print Order
          </Button>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </>
          ) : (
            <Button
              onClick={() => {
                setIsEditing(true);
                setEditedOrder(order);
              }}
            >
              Edit
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
