"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useToast } from "@/components/ui/use-toast";

// Define the Task type
export interface Task {
  _id: string;
  segSce: string;
  pdcaStage: string;
  source: string;
  processes: string;
  action: string;
  pilotes: string;
  delaiRealisation: string;
  avancement: number;
  commentaires?: string;
  status: "completed" | "in-progress" | "overdue" | "pending" | "cancelled";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dueDate: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  history?: {
    status: string;
    timestamp: string;
    user: string;
    comment?: string;
  }[];
}

// Add validation function for Task
export function validateTask(task: Partial<Task>): task is Task {
  return (
    typeof task._id === "string" &&
    typeof task.segSce === "string" &&
    typeof task.pdcaStage === "string" &&
    typeof task.source === "string" &&
    typeof task.processes === "string" &&
    typeof task.action === "string" &&
    typeof task.pilotes === "string" &&
    typeof task.delaiRealisation === "string" &&
    typeof task.avancement === "number" &&
    typeof task.status === "string" &&
    ["completed", "in-progress", "overdue", "pending", "cancelled"].includes(
      task.status
    ) &&
    typeof task.createdAt === "string" &&
    typeof task.updatedAt === "string" &&
    typeof task.dueDate === "string"
  );
}

// Add helper function to calculate task status
export function calculateTaskStatus(task: Partial<Task>): Task["status"] {
  if (task.status === "completed" || task.status === "cancelled") {
    return task.status;
  }

  const now = new Date();
  const dueDate = new Date(task.dueDate || task.delaiRealisation || "");

  if (task.avancement === 100) {
    return "completed";
  }

  if (now > dueDate) {
    return "overdue";
  }

  return task.avancement > 0 ? "in-progress" : "pending";
}

// Define the User type
export interface User {
  _id: string | number;
  id: number | string;
  name: string;
  email: string;
  password?: string;
  role: string;
  status: string;
  tasksAssigned: number;
  tasksCompleted: number;
  profilePicture?: string; // Add profile picture URL field
}

// Define the context type
interface TaskContextType {
  tasks: Task[];
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  setCurrentUser: (user: User | null) => void;
  addTask: (task: Omit<Task, "id" | "status" | "createdAt">) => Promise<void>;
  updateTask: (taskId: string, updatedTask: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addUser: (
    user: Omit<User, "id" | "tasksAssigned" | "tasksCompleted">
  ) => Promise<void>;
  updateUser: (
    userId: number | string,
    updatedUser: Partial<User>
  ) => Promise<void>;
  deleteUser: (userId: number | string) => Promise<void>;
  getTasksByUser: (username: string) => Task[];
  getTaskStats: (
    isAdmin: boolean,
    username?: string
  ) => {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  refreshTasks: () => void;
  authenticateUser: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  registerTaskListener: (listenerId: string, callback: () => void) => void;
  unregisterTaskListener: (listenerId: string) => void;
  registerUserListener: (listenerId: string, callback: () => void) => void;
  unregisterUserListener: (listenerId: string) => void;
}

// Create the context
const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Add these constants at the top of the file
const SESSION_KEY = "pdca-session";

// Add polling interval constant
const POLLING_INTERVAL = 30000; // 30 seconds

// Sample initial tasks
const initialAdminTasks: Task[] = [
  {
    _id: "TASK-1001",
    segSce: "Planning",
    pdcaStage: "Plan",
    source: "Project Manager",
    processes: "Requirements Analysis",
    action: "Document user stories",
    pilotes: "John Doe",
    delaiRealisation: "2025-03-15",
    avancement: 100,
    commentaires: "Completed on time",
    status: "completed",
    createdAt: "2025-03-10T10:00:00",
    updatedAt: "2025-03-10T10:00:00",
    completedAt: "2025-03-10T10:00:00",
    dueDate: "2025-03-15T10:00:00",
  },
  {
    _id: "TASK-1002",
    segSce: "Execution",
    pdcaStage: "Do",
    source: "Team Lead",
    processes: "Development",
    action: "Implement user authentication",
    pilotes: "Jane Smith",
    delaiRealisation: "2025-03-20",
    avancement: 75,
    commentaires: "In progress, on track",
    status: "in-progress",
    createdAt: "2025-03-12T10:00:00",
    updatedAt: "2025-03-12T10:00:00",
    dueDate: "2025-03-20T10:00:00",
  },
  {
    _id: "TASK-1003",
    segSce: "Checking",
    pdcaStage: "Check",
    source: "QA Team",
    processes: "Testing",
    action: "Perform integration tests",
    pilotes: "Bob Johnson",
    delaiRealisation: "2025-03-10",
    avancement: 0,
    commentaires: "Delayed due to dependencies",
    status: "overdue",
    createdAt: "2025-03-05T10:00:00",
    updatedAt: "2025-03-05T10:00:00",
    dueDate: "2025-03-10T10:00:00",
  },
  {
    _id: "TASK-1004",
    segSce: "Acting",
    pdcaStage: "Act",
    source: "Product Owner",
    processes: "Deployment",
    action: "Release to production",
    pilotes: "Jane Smith",
    delaiRealisation: "2025-03-25",
    avancement: 30,
    commentaires: "Preparing deployment scripts",
    status: "in-progress",
    createdAt: "2025-03-15T10:00:00",
    updatedAt: "2025-03-15T10:00:00",
    dueDate: "2025-03-25T10:00:00",
  },
  {
    _id: "TASK-1005",
    segSce: "Planning",
    pdcaStage: "Plan",
    source: "Stakeholders",
    processes: "Requirements Analysis",
    action: "Gather feedback on prototype",
    pilotes: "John Doe",
    delaiRealisation: "2025-03-12",
    avancement: 0,
    commentaires: "Waiting for stakeholder availability",
    status: "overdue",
    createdAt: "2025-03-08T10:00:00",
    updatedAt: "2025-03-08T10:00:00",
    dueDate: "2025-03-12T10:00:00",
  },
];

const initialUserTasks: Task[] = [
  {
    _id: "TASK-2001",
    segSce: "Planning",
    pdcaStage: "Plan",
    source: "Project Manager",
    processes: "Requirements Analysis",
    action: "Create user stories for new features",
    pilotes: "You",
    delaiRealisation: "2025-03-18",
    avancement: 60,
    commentaires: "Working on final details",
    status: "in-progress",
    createdAt: "2025-03-14T10:00:00",
    updatedAt: "2025-03-14T10:00:00",
    dueDate: "2025-03-18T10:00:00",
  },
  {
    _id: "TASK-2002",
    segSce: "Execution",
    pdcaStage: "Do",
    source: "Team Lead",
    processes: "Development",
    action: "Implement dashboard widgets",
    pilotes: "You",
    delaiRealisation: "2025-03-22",
    avancement: 100,
    commentaires: "Completed ahead of schedule",
    status: "completed",
    createdAt: "2025-03-16T10:00:00",
    updatedAt: "2025-03-16T10:00:00",
    completedAt: "2025-03-16T10:00:00",
    dueDate: "2025-03-22T10:00:00",
  },
  {
    _id: "TASK-2003",
    segSce: "Checking",
    pdcaStage: "Check",
    source: "QA Team",
    processes: "Testing",
    action: "Test API endpoints",
    pilotes: "You",
    delaiRealisation: "2025-03-08",
    avancement: 0,
    commentaires: "Blocked by API availability",
    status: "overdue",
    createdAt: "2025-03-04T10:00:00",
    updatedAt: "2025-03-04T10:00:00",
    dueDate: "2025-03-08T10:00:00",
  },
];

// Initial users
const initialUsers: User[] = [
  {
    id: 1,
    name: "Nader May",
    email: "nader@gmail.com",
    password: "admin123",
    role: "admin",
    status: "active",
    tasksAssigned: 15,
    tasksCompleted: 10,
    profilePicture: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    password: "password123",
    role: "user",
    status: "active",
    tasksAssigned: 12,
    tasksCompleted: 8,
    profilePicture: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "user@example.com",
    password: "user123",
    role: "user",
    status: "active",
    tasksAssigned: 8,
    tasksCompleted: 5,
    profilePicture: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 4,
    name: "Alice Williams",
    email: "alice@example.com",
    password: "password123",
    role: "user",
    status: "inactive",
    tasksAssigned: 0,
    tasksCompleted: 0,
    profilePicture: "/placeholder.svg?height=200&width=200",
  },
];

// Local storage keys
const TASKS_STORAGE_KEY = "pdca-tasks";
const USERS_STORAGE_KEY = "pdca-users";
const CURRENT_USER_KEY = "pdca-current-user";

// Create the provider component
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Add a state to track task updates
  const [taskUpdateCount, setTaskUpdateCount] = useState(0);
  // Track operations in progress by ID to allow concurrent operations on different tasks
  const [operationsInProgress, setOperationsInProgress] = useState<
    Record<string, boolean>
  >({});

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setCurrentUser(session);
      } catch (error) {
        console.error("Error loading session:", error);
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // Save session to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  // Enhanced fetchData function with better error handling
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching tasks from API...");
      // Fetch tasks with retry mechanism
      const tasksResponse = await fetch("/api/tasks");
      if (!tasksResponse.ok) {
        throw new Error(`Failed to fetch tasks: ${tasksResponse.statusText}`);
      }
      const tasksData = await tasksResponse.json();
      console.log("Fetched tasks data:", tasksData);
      setTasks(tasksData);

      // Fetch users with retry mechanism
      const usersResponse = await fetch("/api/users");
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.statusText}`);
      }
      const usersData = await usersResponse.json();
      setUsers(usersData);

      // Notify listeners about the update
      notifyTaskListeners();
      notifyUserListeners();
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up polling for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up polling interval
    const interval = setInterval(fetchData, POLLING_INTERVAL);
    setPollingInterval(interval);

    // Clean up interval on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  // Listeners for real-time updates
  const [taskListeners, setTaskListeners] = useState<
    Record<string, () => void>
  >({});
  const [userListeners, setUserListeners] = useState<
    Record<string, () => void>
  >({});

  // Register a task listener
  const registerTaskListener = useCallback(
    (listenerId: string, callback: () => void) => {
      setTaskListeners((prev) => ({ ...prev, [listenerId]: callback }));
    },
    []
  );

  // Unregister a task listener
  const unregisterTaskListener = useCallback((listenerId: string) => {
    setTaskListeners((prev) => {
      const newListeners = { ...prev };
      delete newListeners[listenerId];
      return newListeners;
    });
  }, []);

  // Register a user listener
  const registerUserListener = useCallback(
    (listenerId: string, callback: () => void) => {
      setUserListeners((prev) => ({ ...prev, [listenerId]: callback }));
    },
    []
  );

  // Unregister a user listener
  const unregisterUserListener = useCallback((listenerId: string) => {
    setUserListeners((prev) => {
      const newListeners = { ...prev };
      delete newListeners[listenerId];
      return newListeners;
    });
  }, []);

  // Notify task listeners
  const notifyTaskListeners = useCallback(() => {
    Object.values(taskListeners).forEach((callback) => callback());
  }, [taskListeners]);

  // Notify user listeners
  const notifyUserListeners = useCallback(() => {
    Object.values(userListeners).forEach((callback) => callback());
  }, [userListeners]);

  // Enhanced refreshTasks function
  const refreshTasks = useCallback(async () => {
    await fetchData();
  }, []);

  // Function to authenticate a user
  const authenticateUser = useCallback(
    async (email: string, password: string): Promise<User | null> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Login failed");
        }

        const user = await response.json();
        setCurrentUser(user);
        return user;
      } catch (error) {
        console.error("Authentication error:", error);
        return null;
      }
    },
    []
  );

  // Function to logout
  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  // Function to add a new task
  const addTask = useCallback(
    async (newTask: Omit<Task, "id" | "status" | "createdAt">) => {
      if (operationsInProgress[newTask._id]) {
        throw new Error(
          "Another operation is in progress for this task. Please try again later."
        );
      }

      setOperationsInProgress((prev) => ({ ...prev, [newTask._id]: true }));
      setIsLoading(true);
      setError(null);

      try {
        console.log("Sending task data:", newTask);

        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTask),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Task creation failed:", data);
          throw new Error(
            data.error || data.details || "Failed to create task"
          );
        }

        // Update local state
        setTasks((prevTasks) => [data, ...prevTasks]);

        // Update user task counts if task is assigned to a specific user
        if (newTask.pilotes !== "You") {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.name === newTask.pilotes
                ? { ...user, tasksAssigned: user.tasksAssigned + 1 }
                : user
            )
          );
        }

        // Notify listeners about the change
        notifyTaskListeners();

        toast({
          title: "Task added",
          description: "The task has been added successfully",
        });

        // Add a small delay to ensure state is properly updated
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error("Error adding task:", error);
        setError(error instanceof Error ? error.message : "Failed to add task");
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to add task. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setOperationsInProgress((prev) => {
          const newState = { ...prev };
          delete newState[newTask._id];
          return newState;
        });
        setIsLoading(false);
      }
    },
    [toast, operationsInProgress, notifyTaskListeners]
  );

  // Function to update an existing task
  const updateTask = useCallback(
    async (taskId: string, updatedTask: Partial<Task>) => {
      // Check if this specific task operation is already in progress
      if (operationsInProgress[taskId]) {
        throw new Error(
          "This task is already being updated. Please try again."
        );
      }

      // Mark this task operation as in progress
      setOperationsInProgress((prev) => ({ ...prev, [taskId]: true }));
      setIsLoading(true);

      try {
        // Determine the new status based on avancement
        const newStatus =
          updatedTask.avancement === 100 ? "completed" : "in-progress";

        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...updatedTask,
            status: newStatus,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update task");
        }

        const updatedTaskData = await response.json();

        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === taskId ? { ...task, ...updatedTaskData } : task
          )
        );

        // Notify listeners about the change
        notifyTaskListeners();

        toast({
          title: "Task updated",
          description: "The task has been updated successfully",
        });

        return updatedTaskData;
      } catch (error) {
        console.error("Error updating task:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to update task. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        // Mark this task operation as complete
        setOperationsInProgress((prev) => {
          const newState = { ...prev };
          delete newState[taskId];
          return newState;
        });
        setIsLoading(false);
      }
    },
    [toast, operationsInProgress, notifyTaskListeners]
  );

  // Function to delete a task
  const deleteTask = useCallback(
    async (taskId: string) => {
      // Check if this specific task operation is already in progress
      if (operationsInProgress[taskId]) {
        throw new Error(
          "This task is already being deleted. Please try again."
        );
      }

      // Mark this task operation as in progress
      setOperationsInProgress((prev) => ({ ...prev, [taskId]: true }));
      setIsLoading(true);

      try {
        // Check if the task exists before attempting to delete
        const taskToDelete = tasks.find((task) => task._id === taskId);

        if (!taskToDelete) {
          throw new Error(`Task with ID ${taskId} not found`);
        }

        // Make API call to delete the task
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete task");
        }

        // Update local state
        setTasks((prevTasks) => {
          const updatedTasks = prevTasks.filter((task) => task._id !== taskId);

          // Update user task counts
          if (taskToDelete.pilotes !== "You") {
            setUsers((prevUsers) =>
              prevUsers.map((user) => {
                if (user.name === taskToDelete.pilotes) {
                  return {
                    ...user,
                    tasksAssigned: Math.max(0, user.tasksAssigned - 1),
                    tasksCompleted:
                      taskToDelete.status === "completed"
                        ? Math.max(0, user.tasksCompleted - 1)
                        : user.tasksCompleted,
                  };
                }
                return user;
              })
            );
          }

          return updatedTasks;
        });

        // Notify listeners about the change
        notifyTaskListeners();
        notifyUserListeners();

        toast({
          title: "Task deleted",
          description: `Task has been deleted successfully`,
        });
      } catch (error) {
        console.error("Error deleting task:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to delete task. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        // Mark this task operation as complete
        setOperationsInProgress((prev) => {
          const newState = { ...prev };
          delete newState[taskId];
          return newState;
        });
        setIsLoading(false);
      }
    },
    [
      tasks,
      toast,
      operationsInProgress,
      notifyTaskListeners,
      notifyUserListeners,
    ]
  );

  // Function to add a new user
  const addUser = useCallback(
    async (userData: Omit<User, "id" | "tasksAssigned" | "tasksCompleted">) => {
      if (operationsInProgress[userData.name]) {
        throw new Error(
          "Another operation is in progress for this user. Please try again later."
        );
      }

      setOperationsInProgress((prev) => ({ ...prev, [userData.name]: true }));
      setIsLoading(true);

      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create user");
        }

        const newUser = await response.json();

        // Update local state
        setUsers((prevUsers) => [newUser, ...prevUsers]);

        // Notify listeners about the change
        notifyUserListeners();

        toast({
          title: "User added",
          description: `${userData.name} has been added successfully`,
        });
      } catch (error) {
        console.error("Error adding user:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to add user. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setOperationsInProgress((prev) => {
          const newState = { ...prev };
          delete newState[userData.name];
          return newState;
        });
        setIsLoading(false);
      }
    },
    [toast, operationsInProgress, notifyUserListeners]
  );

  // Function to update an existing user
  const updateUser = useCallback(
    async (userId: number | string, updatedUser: Partial<User>) => {
      if (operationsInProgress[userId.toString()]) {
        throw new Error(
          "Another operation is in progress for this user. Please try again later."
        );
      }

      setOperationsInProgress((prev) => ({
        ...prev,
        [userId.toString()]: true,
      }));
      setIsLoading(true);

      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedUser),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update user");
        }

        const updatedUserData = await response.json();

        // Update local state
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, ...updatedUserData } : user
          )
        );

        // If current user is being updated, update currentUser state
        if (currentUser && currentUser.id === userId) {
          setCurrentUser({ ...currentUser, ...updatedUserData });
        }

        // Notify listeners about the change
        notifyUserListeners();
        notifyTaskListeners();

        toast({
          title: "User updated",
          description: "The user has been updated successfully",
        });
      } catch (error) {
        console.error("Error updating user:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to update user. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setOperationsInProgress((prev) => {
          const newState = { ...prev };
          delete newState[userId.toString()];
          return newState;
        });
        setIsLoading(false);
      }
    },
    [
      toast,
      operationsInProgress,
      notifyUserListeners,
      notifyTaskListeners,
      currentUser,
    ]
  );

  // Function to delete a user
  const deleteUser = useCallback(
    async (userId: number | string) => {
      if (operationsInProgress[userId.toString()]) {
        throw new Error(
          "Another operation is in progress for this user. Please try again later."
        );
      }

      setOperationsInProgress((prev) => ({
        ...prev,
        [userId.toString()]: true,
      }));
      setIsLoading(true);

      try {
        // Find the user first to get their name
        const user = users.find((u) => u.id === userId);
        if (!user) {
          throw new Error("User not found");
        }

        // Find tasks assigned to this user
        const userTasks = tasks.filter((task) => task.pilotes === user.name);
        if (userTasks.length > 0) {
          throw new Error(
            "User has assigned tasks. Please handle the tasks first."
          );
        }

        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete user");
        }

        // Update local state
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));

        // If current user is being deleted, log out
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(null);
        }

        // Notify listeners about the change
        notifyUserListeners();
        notifyTaskListeners();

        toast({
          title: "User deleted",
          description: "User has been deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to delete user. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setOperationsInProgress((prev) => {
          const newState = { ...prev };
          delete newState[userId.toString()];
          return newState;
        });
        setIsLoading(false);
      }
    },
    [
      toast,
      operationsInProgress,
      notifyUserListeners,
      notifyTaskListeners,
      currentUser,
      users,
      tasks,
    ]
  );

  // Function to get tasks by user
  const getTasksByUser = useCallback(
    (username: string) => {
      return tasks.filter((task) => task.pilotes === username);
    },
    [tasks]
  );

  // Function to get task statistics
  const getTaskStats = useCallback(
    (isAdmin: boolean, username?: string) => {
      const filteredTasks = isAdmin
        ? tasks
        : tasks.filter((task) => task.pilotes === username);

      const total = filteredTasks.length;
      const completed = filteredTasks.filter(
        (task) => task.status === "completed"
      ).length;
      const pending = filteredTasks.filter(
        (task) => task.status === "in-progress"
      ).length;
      const overdue = filteredTasks.filter(
        (task) => task.status === "overdue"
      ).length;

      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        completed,
        pending,
        overdue,
        completionRate,
      };
    },
    [tasks]
  );

  // Create the context value
  const contextValue: TaskContextType = {
    tasks,
    users,
    currentUser,
    isLoading,
    error,
    setCurrentUser,
    addTask,
    updateTask,
    deleteTask,
    addUser,
    updateUser,
    deleteUser,
    getTasksByUser,
    getTaskStats,
    refreshTasks,
    authenticateUser,
    logout,
    registerTaskListener,
    unregisterTaskListener,
    registerUserListener,
    unregisterUserListener,
  };

  return (
    <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
  );
}

// Custom hook to use the task context
export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
}
