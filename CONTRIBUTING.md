# 🤝 Contributing to Committed

Welcome to the Committed project! This guide will help you and your team collaborate effectively. Don't worry if you're new to this - we've written this guide specifically for students and junior developers.

## 📚 Table of Contents

1. [Getting Started](#-getting-started)
2. [Understanding Git Workflow](#-understanding-git-workflow)
3. [Branch Naming Convention](#-branch-naming-convention)
4. [Making Changes](#-making-changes)
5. [Commit Messages](#-commit-messages)
6. [Creating Merge Requests](#-creating-merge-requests)
7. [Code Review Process](#-code-review-process)
8. [Team Roles & Responsibilities](#-team-roles--responsibilities)
9. [Communication](#-communication)
10. [Common Issues & Solutions](#-common-issues--solutions)
11. [Learning Resources](#-learning-resources)

---

## 🚀 Getting Started

### First Time Setup

1. **Clone the repository:**
   ```bash
   git clone https://gitlab.com/your-group/commit-ed.git
   cd commit-ed
   ```

2. **Set up your Git identity:**
   ```bash
   git config user.name "Your Name"
   git config user.email "your.email@example.com"
   ```

3. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Start the services:**
   ```bash
   cd docker
   docker compose up -d
   ```

5. **Verify everything works:**
   ```bash
   curl http://localhost/api/test-chain
   ```

### Daily Workflow

Every time you start working:

```bash
# 1. Go to your project folder
cd commit-ed

# 2. Make sure you're on the develop branch
git checkout develop

# 3. Get the latest changes from your teammates
git pull origin develop

# 4. Create a new branch for your work (see naming convention below)
git checkout -b feature/your-feature-name
```

---

## 🌳 Understanding Git Workflow

We use a simplified **GitFlow** workflow. Here's what you need to know:

```
main (production)
  │
  └── develop (integration)
        │
        ├── feature/user-login (your work)
        ├── feature/course-api (teammate's work)
        └── bugfix/fix-login-error (bug fixes)
```

### Branch Types

| Branch | Purpose | Who can merge |
|--------|---------|---------------|
| `main` | Production-ready code | Team lead only |
| `develop` | Integration branch | Anyone (via MR) |
| `feature/*` | New features | You create these |
| `bugfix/*` | Bug fixes | You create these |
| `hotfix/*` | Urgent production fixes | Team lead |

### Visual Flow

```
1. You create: feature/add-login
                    │
2. You work on it   │
                    │
3. Create MR ───────┼──► develop
                    │
4. Team reviews     │
                    │
5. Merge! ──────────┘
```

---

## 📝 Branch Naming Convention

**Format:** `type/short-description`

### Examples

✅ **Good branch names:**
- `feature/user-authentication`
- `feature/course-creation-api`
- `bugfix/fix-login-redirect`
- `docs/update-readme`

❌ **Bad branch names:**
- `my-branch` (not descriptive)
- `fix` (too vague)
- `Feature/UserLogin` (wrong format)
- `feature/add_new_feature_for_user_login_page_with_oauth` (too long)

### Quick Reference

| Type | Use for |
|------|---------|
| `feature/` | New functionality |
| `bugfix/` | Fixing bugs |
| `docs/` | Documentation only |
| `refactor/` | Code improvements (no new features) |
| `test/` | Adding tests |

---

## 💻 Making Changes

### Step-by-Step Guide

```bash
# 1. Make sure you're on your feature branch
git branch  # Shows current branch with *

# 2. Make your changes in your IDE

# 3. Check what files you changed
git status

# 4. Add your changes
git add .  # Adds all changes
# OR
git add specific-file.js  # Add specific file

# 5. Commit your changes (see commit message format below)
git commit -m "feat(gateway): add user login endpoint"

# 6. Push to GitLab
git push origin feature/your-feature-name
```

### Working on Different Services

Each team member can focus on a specific service:

| Service | Folder | Language | IDE |
|---------|--------|----------|-----|
| Gateway | `services/gateway/` | Java | IntelliJ |
| Core | `services/core/` | PHP | PhpStorm |
| Code Analyzer | `services/code-analyzer/` | Python | VS Code |
| Notifications | `services/notifications/` | C# | VS Code |
| Web Frontend | `web/` | React | VS Code |

---

## 📨 Commit Messages

We use **Conventional Commits** format. It looks scary but it's simple!

### Format

```
type(scope): short description

[optional body]
```

### Types

| Type | When to use | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(core): add course creation endpoint` |
| `fix` | Bug fix | `fix(gateway): resolve login timeout issue` |
| `docs` | Documentation | `docs: update API documentation` |
| `style` | Formatting | `style(web): fix indentation in App.jsx` |
| `refactor` | Code restructure | `refactor(core): simplify user service` |
| `test` | Adding tests | `test(gateway): add login unit tests` |
| `chore` | Maintenance | `chore: update dependencies` |

### Examples

✅ **Good commits:**
```bash
git commit -m "feat(gateway): add JWT authentication"
git commit -m "fix(core): resolve database connection timeout"
git commit -m "docs: add API endpoint documentation"
git commit -m "test(notifications): add email service tests"
```

❌ **Bad commits:**
```bash
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "asdfasdf"
git commit -m "changes"
```

---

## 🔀 Creating Merge Requests

### When to Create an MR

Create a Merge Request when:
- ✅ Your feature is complete
- ✅ Your code compiles/runs without errors
- ✅ You've tested it locally

### How to Create an MR

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Go to GitLab** → Your project → Merge Requests → New Merge Request

3. **Fill in the template:**

```markdown
## What does this MR do?
<!-- Describe your changes in simple terms -->
Adds user login functionality to the gateway service.

## How to test
<!-- Step-by-step instructions for reviewers -->
1. Start the services: `docker compose up -d`
2. Send a POST request to `/api/login`
3. Check that you receive a JWT token

## Checklist
- [ ] I tested my changes locally
- [ ] My code follows the project style
- [ ] I updated documentation if needed
- [ ] I added tests (if applicable)

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->
```

4. **Assign reviewers** (at least 1 teammate)

5. **Click "Create Merge Request"**

---

## 👀 Code Review Process

### As a Reviewer

When reviewing a teammate's code:

1. **Be kind and constructive** 🤝
2. **Ask questions** instead of criticizing
3. **Suggest improvements** with examples
4. **Approve** when it looks good

#### Review Checklist

- [ ] Does the code work?
- [ ] Is it easy to understand?
- [ ] Are there any obvious bugs?
- [ ] Does it follow our conventions?

#### Comment Examples

✅ **Good comments:**
- "Could you explain what this function does? Maybe add a comment?"
- "Nice work! Consider using a constant for this value."
- "This looks great! 👍"

❌ **Bad comments:**
- "This is wrong"
- "Why did you do it this way?"
- "..."

### As the Author

When receiving feedback:

1. **Don't take it personally** - we're all learning!
2. **Ask for clarification** if you don't understand
3. **Make requested changes** or explain why not
4. **Thank your reviewers** 🙏

---

## 👥 Team Roles & Responsibilities

### Suggested Role Distribution (4 team members)

| Role | Responsibilities | Services |
|------|-----------------|----------|
| **Team Lead** | Merge to main, architecture decisions | All |
| **Backend Dev 1** | Gateway service, authentication | Gateway (Java) |
| **Backend Dev 2** | Core service, business logic | Core (PHP) |
| **Full-stack Dev** | Frontend + API integration | Web (React) + APIs |

### Everyone Should

- ✅ Review at least 1 MR per week
- ✅ Update the team on progress
- ✅ Ask for help when stuck
- ✅ Document their work

---

## 💬 Communication

### Daily Standup (5-10 minutes)

Answer these 3 questions:
1. What did I do yesterday?
2. What will I do today?
3. Am I blocked on anything?

### When to Ask for Help

Ask immediately if:
- 🔴 You've been stuck for more than 30 minutes
- 🔴 You don't understand the task
- 🔴 You're about to make a big change

### Where to Communicate

| Channel | Use for |
|---------|---------|
| GitLab Issues | Task tracking, bugs |
| GitLab MR comments | Code discussions |
| Team chat (Discord/Slack) | Quick questions |
| Video call | Complex discussions |

---

## 🔧 Common Issues & Solutions

### "I made changes to the wrong branch!"

```bash
# Save your changes
git stash

# Switch to correct branch
git checkout correct-branch

# Apply your changes
git stash pop
```

### "I need to undo my last commit!"

```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Undo commit and discard changes (careful!)
git reset --hard HEAD~1
```

### "My branch is behind develop!"

```bash
# Get latest develop
git checkout develop
git pull origin develop

# Go back to your branch
git checkout your-branch

# Merge develop into your branch
git merge develop

# Resolve any conflicts, then:
git add .
git commit -m "merge: resolve conflicts with develop"
```

### "I have merge conflicts!"

1. Open the conflicting file
2. Look for these markers:
   ```
   <<<<<<< HEAD
   Your changes
   =======
   Their changes
   >>>>>>> develop
   ```
3. Decide which code to keep (or combine both)
4. Remove the markers
5. Save, add, and commit

### "Docker containers won't start!"

```bash
# Stop everything
docker compose down

# Remove old containers and volumes
docker compose down -v

# Rebuild and start
docker compose up -d --build

# Check logs for errors
docker compose logs -f
```

### "I can't push to GitLab!"

```bash
# Check if you're logged in
git remote -v

# If using HTTPS, you might need to re-authenticate
# If using SSH, check your SSH key is added to GitLab
```

---

## 📖 Learning Resources

### Git

- [Git - The Simple Guide](https://rogerdudler.github.io/git-guide/)
- [Learn Git Branching (Interactive)](https://learngitbranching.js.org/)
- [Oh Shit, Git!?!](https://ohshitgit.com/) - Common mistakes and fixes

### Docker

- [Docker Getting Started](https://docs.docker.com/get-started/)
- [Docker Compose Tutorial](https://docs.docker.com/compose/gettingstarted/)

### Languages

| Language | Resource |
|----------|----------|
| Java | [Spring Boot Guides](https://spring.io/guides) |
| PHP | [Symfony Documentation](https://symfony.com/doc/current/index.html) |
| Python | [Flask Tutorial](https://flask.palletsprojects.com/tutorial/) |
| C# | [.NET Tutorial](https://docs.microsoft.com/en-us/dotnet/core/tutorials/) |
| React | [React Tutorial](https://react.dev/learn) |

### General

- [How to Write Good Commit Messages](https://www.freecodecamp.org/news/how-to-write-better-git-commit-messages/)
- [Code Review Best Practices](https://google.github.io/eng-practices/review/)

---

## 🎯 Quick Reference Card

Print this and keep it handy!

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY WORKFLOW                            │
├─────────────────────────────────────────────────────────────┤
│ 1. git checkout develop                                      │
│ 2. git pull origin develop                                   │
│ 3. git checkout -b feature/my-feature                        │
│ 4. [make changes]                                            │
│ 5. git add .                                                 │
│ 6. git commit -m "feat(service): description"                │
│ 7. git push origin feature/my-feature                        │
│ 8. Create Merge Request on GitLab                            │
├─────────────────────────────────────────────────────────────┤
│                    COMMIT TYPES                              │
├─────────────────────────────────────────────────────────────┤
│ feat     = new feature                                       │
│ fix      = bug fix                                           │
│ docs     = documentation                                     │
│ style    = formatting                                        │
│ refactor = code restructure                                  │
│ test     = adding tests                                      │
│ chore    = maintenance                                       │
├─────────────────────────────────────────────────────────────┤
│                    USEFUL COMMANDS                           │
├─────────────────────────────────────────────────────────────┤
│ git status          = see changed files                      │
│ git log --oneline   = see commit history                     │
│ git branch          = see all branches                       │
│ git stash           = temporarily save changes               │
│ git stash pop       = restore saved changes                  │
│ docker compose up -d = start services                        │
│ docker compose logs -f = see logs                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ❓ Still Have Questions?

1. Check this guide again
2. Search in GitLab issues
3. Ask your teammates
4. Ask your instructor/mentor

Remember: **There are no stupid questions!** We're all learning together. 🚀

---

*Last updated: February 2026*
