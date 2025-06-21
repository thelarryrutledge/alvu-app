# General Development Rules

You should do task-based development. For every task, when it makes sense, you should write appropriate tests and make sure the code works as expected. You should also document your code and tests.

You should only implement a single sub task from the todo list at a time, unless multiple tasks require each other to exist or function in a certain way. Do not implement multiple tasks at once. We are implementing tasks, not whole sections of the project at a time. This allows for testing and validation of each step, and making course corrections when necessary.

When the tests pass:
* Update the todo list to reflect the task being completed
* Update the memory file to reflect the current state of the project
* Fix any warnings or errors in the code
* **CRITICAL STEP**: Commit the changes to the repository with a descriptive commit message by executing the git commands yourself:
  ```
  git add <changed-files>
  git commit -m "Descriptive message about the completed task"
  ```
  Do not just suggest the commit message - actually perform the commit using the execute_command tool.
* Update the development guidelines to reflect anything that you've learned while working on the project
* When appropriate create, or modify, documentation in the section of code being worked on. This doesn't need to be elaboriate, just a README to explain anything of importance to future developers.
* Stop and we will open a new chat for the next task

## Retain memory

There will be a memory file for each project. THis file should focus on essential context, architectural decisions, and critical implementation details that will impact future work, and any notes or relevant details you need to remember between chats.

Keep it up to date based on the project's current state.

Do not annotate task completion in the memory file. It will be tracked in the to-do list.

## Update development guidelines

If necessary, update the development guidelines to reflect anything you've learned while working on the project.

