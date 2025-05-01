"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { Task } from "@/contexts/task-context";
import { useTaskContext } from "@/contexts/task-context";

interface TaskFormProps {
  isAdmin: boolean;
  task?: Task;
  onTaskSubmit?: (task: any) => void;
}

// Update the form schema to include the PDCA field
const formSchema = z.object({
  segSce: z.string().min(1, { message: "Department is required" }),
  pdcaStage: z.string().min(1, { message: "PDCA stage is required" }),
  source: z.string().min(1, { message: "Source is required" }),
  processes: z.string().min(1, { message: "Processes are required" }),
  action: z.string().min(1, { message: "Action is required" }),
  pilotes: z.string().min(1, { message: "Pilotes are required" }),
  delaiRealisation: z.string().min(1, { message: "Deadline is required" }),
  avancement: z.coerce.number().min(0).max(100),
  commentaires: z.string().optional(),
});

export function TaskForm({ isAdmin, task, onTaskSubmit }: TaskFormProps) {
  const { toast } = useToast();
  const { users, currentUser, addTask } = useTaskContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departmentInfo, setDepartmentInfo] = useState<{
    description: string;
    suggestedProcesses: string[];
  } | null>(null);

  // Filter active users for the pilotes dropdown
  const activeUsers = users.filter((user) => user.status === "active");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      segSce: task?.segSce || "",
      pdcaStage: task?.pdcaStage || "",
      source: task?.source || "",
      processes: task?.processes || "",
      action: task?.action || "",
      pilotes: task?.pilotes || (isAdmin ? "" : currentUser?.name || ""),
      delaiRealisation: task?.delaiRealisation || "",
      avancement: task?.avancement || 0,
      commentaires: task?.commentaires || "",
    },
  });

  // Reset form when task prop changes
  useEffect(() => {
    if (task) {
      form.reset({
        ...task,
        segSce: task.segSce || "",
        pdcaStage: task.pdcaStage || "",
        source: task.source || "",
        processes: task.processes || "",
        action: task.action || "",
        pilotes: task.pilotes || (isAdmin ? "" : "You"),
        delaiRealisation: task.delaiRealisation || "",
        avancement: task.avancement || 0,
        commentaires: task.commentaires || "",
      });
    }
  }, [task, form, isAdmin]);

  // Department information mapping
  const departmentInfoMap = {
    Planning: {
      description: "Strategic planning and requirement gathering",
      suggestedProcesses: [
        "Requirements Analysis",
        "Project Planning",
        "Resource Allocation",
        "Risk Assessment",
      ],
    },
    Execution: {
      description: "Implementation and development activities",
      suggestedProcesses: [
        "Development",
        "Testing",
        "Documentation",
        "Training",
      ],
    },
    Checking: {
      description: "Quality assurance and verification",
      suggestedProcesses: [
        "Quality Assurance",
        "Verification",
        "Validation",
        "Performance Testing",
      ],
    },
    Acting: {
      description: "Process improvement and deployment",
      suggestedProcesses: [
        "Deployment",
        "Maintenance",
        "Feedback Collection",
        "Continuous Improvement",
      ],
    },
  };

  // Watch for changes in the segSce field
  const selectedDepartment = form.watch("segSce");

  // Update department info when segSce changes
  useEffect(() => {
    if (selectedDepartment && departmentInfoMap[selectedDepartment]) {
      setDepartmentInfo(departmentInfoMap[selectedDepartment]);
    } else {
      setDepartmentInfo(null);
    }
  }, [selectedDepartment]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // For non-admin users, always set pilotes to their name
      if (!isAdmin && currentUser) {
        values.pilotes = currentUser.name;
      }

      if (onTaskSubmit) {
        await onTaskSubmit(values);
      } else {
        await addTask(values);
      }
      form.reset();
    } catch (error) {
      console.error("Error submitting task:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="segSce"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department (Seg/Sce)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Planning" {...field} />
                </FormControl>
                {departmentInfo && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {departmentInfo.description}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pdcaStage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PDCA Stage</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PDCA stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" className="w-full">
                    <SelectItem value="Plan">Plan</SelectItem>
                    <SelectItem value="Do">Do</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Act">Act</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Project Manager" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="processes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processes</FormLabel>
                {departmentInfo &&
                departmentInfo.suggestedProcesses.length > 0 ? (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select process" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="w-full">
                      {departmentInfo.suggestedProcesses.map((process) => (
                        <SelectItem key={process} value={process}>
                          {process}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other (Custom)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input
                      placeholder="e.g., Requirements Analysis"
                      {...field}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Document user stories" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="pilotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilotes</FormLabel>
                {isAdmin ? (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="w-full">
                      {activeUsers.map((user) => (
                        <SelectItem key={user.id || user._id} value={user.name}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input value="You" disabled {...field} />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="delaiRealisation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Délai réalisation</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="avancement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avancement ({field.value}%)</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseInt(e.target.value))
                    }
                    className="flex-1"
                  />
                </FormControl>
                <span className="w-12 text-center">{field.value}%</span>
              </div>
              <FormDescription>Task completion percentage</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="commentaires"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commentaires</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes or comments"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {task ? "Updating..." : "Creating..."}
              </>
            ) : task ? (
              "Update Task"
            ) : (
              "Create Task"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
