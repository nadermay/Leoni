const handleToggleComplete = async () => {
  try {
    const newAvancement = task.avancement === 100 ? 0 : 100;
    const response = await fetch(`/api/tasks/${task._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avancement: newAvancement,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    // Update local state through context
    if (onTaskUpdate) {
      const updatedTask = await response.json();
      onTaskUpdate(updatedTask);
    }
  } catch (error) {
    console.error("Error toggling task completion:", error);
  }
};
