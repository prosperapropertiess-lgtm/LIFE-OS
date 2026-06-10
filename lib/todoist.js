// Creates a task in Todoist via the REST API. No-op if no token is set.
export async function addTodoistTask(content, due) {
  const token = process.env.TODOIST_TOKEN;
  if (!token || !content) return;
  try {
    await fetch("https://api.todoist.com/rest/v2/tasks", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(due ? { content, due_date: due } : { content }),
      cache: "no-store",
    });
  } catch (e) {
    // Never let a Todoist hiccup block the local save.
  }
}
